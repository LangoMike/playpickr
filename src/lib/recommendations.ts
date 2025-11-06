/**
 * Recommendation System Utilities
 * 
 * Handles loading the trained TensorFlow model and generating recommendations
 * 
 * Note: For Vercel deployment, we use @tensorflow/tfjs (browser version) instead of
 * @tensorflow/tfjs-node to avoid serverless function size limits.
 * Models should be stored in Supabase Storage or a CDN and loaded via URL.
 */

// Use @tensorflow/tfjs (browser version) which is much smaller than tfjs-node
// This can load models from URLs (Supabase Storage, CDN, etc.)
import type * as tfjsType from '@tensorflow/tfjs';

type TensorFlowModule = typeof tfjsType;
type TensorFlowModel = tfjsType.LayersModel;

let tf: TensorFlowModule | null = null;
let model: TensorFlowModel | null = null;
let metadata: ModelMetadata | null = null;

// Initialize TensorFlow.js
async function initTensorFlow() {
  if (typeof window === 'undefined') {
    // Server-side: use regular tfjs (browser version) - works in Node.js and is much smaller
    try {
      tf = await import('@tensorflow/tfjs');
      // Use CPU backend for serverless (no GPU needed)
      await tf.setBackend('cpu');
      await tf.ready();
    } catch (error) {
      console.warn('Failed to load TensorFlow.js:', error);
      throw new Error('TensorFlow.js is not available. Falling back to popularity-based recommendations.');
    }
  }
}

interface ModelMetadata {
  gameIdToIndex: Record<string, number>;
  userIdToIndex: Record<string, number>;
  indexToGameId: Record<number, string>;
  indexToUserId: Record<number, string>;
  featureSize: number;
  numUsers: number;
  numGames: number;
  genreList: string[];
  tagList: string[];
  platformList: string[];
  config: {
    topNRecommendations?: number;
    [key: string]: unknown;
  };
  trainedAt: string;
}

/**
 * Load the trained model and metadata
 * 
 * For production (Vercel), models should be stored in Supabase Storage or a CDN.
 * Set MODEL_BASE_URL environment variable to the URL where models are hosted.
 * For local development, models can be loaded from the filesystem using a local server.
 */
export async function loadModel(): Promise<void> {
  if (model && metadata) {
    return; // Already loaded
  }

  // Initialize TensorFlow if needed
  if (!tf) {
    try {
      await initTensorFlow();
    } catch {
      console.warn('TensorFlow.js not available, will use popularity-based recommendations');
      return;
    }
  }

  if (!tf) {
    throw new Error('TensorFlow not initialized');
  }

  try {
    // Try to load from URL (for production/Vercel)
    // Check for MODEL_BASE_URL environment variable (e.g., Supabase Storage URL)
    const modelBaseUrl = process.env.MODEL_BASE_URL;
    
    if (modelBaseUrl) {
      // Load from remote URL (Supabase Storage, CDN, etc.)
      const modelUrl = `${modelBaseUrl}/model.json`;
      const metadataUrl = `${modelBaseUrl}/metadata.json`;
      
      // Load metadata
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error(`Failed to load metadata from ${metadataUrl}`);
      }
      metadata = await metadataResponse.json() as ModelMetadata;
      
      // Load model
      model = await tf.loadLayersModel(modelUrl);
      console.log('✅ Recommendation model loaded from URL successfully');
      return;
    }

    // Fallback: Try to load from filesystem (for local development)
    // This requires a local file server or the model to be in public/ directory
    // Note: This won't work in Vercel serverless functions
    throw new Error(
      'Model loading not configured. ' +
      'For production, set MODEL_BASE_URL environment variable pointing to your model files. ' +
      'For local development, use a local file server or store models in public/ directory.'
    );
  } catch (error) {
    console.error('❌ Failed to load recommendation model:', error);
    // Don't throw - allow fallback to popularity-based recommendations
    console.warn('Will use popularity-based recommendations as fallback');
  }
}

interface GameFeatureInput {
  genres?: Array<{ name: string } | string> | null;
  tags?: Array<{ name: string } | string> | null;
  rating?: number | null;
  metacritic?: number | null;
  playtime?: number | null;
  released?: string | null;
}

/**
 * Extract game features (same as training script)
 */
function extractGameFeatures(game: GameFeatureInput): number[] {
  if (!metadata) {
    throw new Error('Model metadata not loaded');
  }

  const features: number[] = [];

  // One-hot encode genres
  const genreVec = new Array(metadata.genreList.length).fill(0);
  if (game.genres && Array.isArray(game.genres)) {
    game.genres.forEach((g) => {
      const genreName = typeof g === 'string' ? g : (g.name || '');
      const idx = metadata!.genreList.indexOf(genreName);
      if (idx >= 0) genreVec[idx] = 1;
    });
  }
  features.push(...genreVec);

  // One-hot encode tags
  const tagVec = new Array(metadata.tagList.length).fill(0);
  if (game.tags && Array.isArray(game.tags)) {
    game.tags.forEach((t) => {
      const tagName = typeof t === 'string' ? t : (t.name || '');
      const idx = metadata!.tagList.indexOf(tagName);
      if (idx >= 0) tagVec[idx] = 1;
    });
  }
  features.push(...tagVec);

  // Normalize ratings
  const rating = game.rating ? game.rating / 5.0 : 0.5;
  features.push(rating);

  // Normalize metacritic
  const metacritic = game.metacritic ? game.metacritic / 100.0 : 0.5;
  features.push(metacritic);

  // Normalize playtime
  const playtime = game.playtime 
    ? Math.min(Math.log10(game.playtime + 1) / Math.log10(101), 1.0)
    : 0.5;
  features.push(playtime);

  // Release year
  let releaseYear = 0.5;
  if (game.released) {
    const year = new Date(game.released).getFullYear();
    const currentYear = new Date().getFullYear();
    releaseYear = Math.min((year - 1990) / (currentYear - 1990), 1.0);
  }
  features.push(releaseYear);

  return features;
}

/**
 * Generate recommendations for a user
 */
interface GameWithId extends GameFeatureInput {
  id: string;
}

interface UserInteraction {
  game_id: string;
  action: string;
}

export async function generateRecommendations(
  userId: string,
  games: GameWithId[],
  userInteractions: UserInteraction[]
): Promise<Array<{ gameId: string; score: number; reason: string }>> {
  // Try to load model if not already loaded
  if (!model || !metadata) {
    await loadModel();
  }
  
  // If model failed to load, fall back to popularity-based recommendations
  if (!model || !metadata) {
    console.warn('ML model not available, using popularity-based recommendations');
    return getPopularityRecommendations(games, 20);
  }

  const userIndex = metadata.userIdToIndex[userId];
  if (userIndex === undefined) {
    // New user - return popularity-based recommendations
    return [];
  }

  // Get games user has already interacted with
  const interactedGameIds = new Set(
    userInteractions.map(i => i.game_id)
  );

  // Filter out games user has already interacted with
  const candidateGames = games.filter(
    game => !interactedGameIds.has(game.id)
  );

  if (candidateGames.length === 0) {
    return [];
  }

  // Generate predictions for all candidate games
  const predictions: Array<{ gameId: string; score: number; features: number[] }> = [];

  for (const game of candidateGames) {
    const gameIndex = metadata.gameIdToIndex[game.id];
    if (gameIndex === undefined) continue;

    const features = extractGameFeatures(game);

    if (!tf) {
      throw new Error('TensorFlow not initialized');
    }

    // Create input tensors
    const userTensor = tf.tensor2d([[userIndex]]);
    const gameTensor = tf.tensor2d([[gameIndex]]);
    const featureTensor = tf.tensor2d([features]);

    // Predict
    const prediction = model.predict([userTensor, gameTensor, featureTensor]);
    
    // Handle prediction result (can be Tensor or Tensor[])
    const predictionTensor = Array.isArray(prediction) ? prediction[0] : prediction;
    const score = await predictionTensor.data();

    // Clean up tensors
    userTensor.dispose();
    gameTensor.dispose();
    featureTensor.dispose();
    predictionTensor.dispose();

    predictions.push({
      gameId: game.id,
      score: score[0],
      features
    });
  }

  // Sort by score and get top N
  predictions.sort((a, b) => b.score - a.score);
  const topN = predictions.slice(0, metadata.config?.topNRecommendations || 20);

  // Generate reasons for recommendations
  const recommendations = topN.map(({ gameId, score }) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return null;

    // Generate reason based on features
    let reason = 'Based on your preferences';
    if (game.genres && Array.isArray(game.genres) && game.genres.length > 0) {
      const topGenres = game.genres.slice(0, 2).map((g) => {
        return typeof g === 'string' ? g : (g.name || '');
      }).join(', ');
      reason = `Similar genres: ${topGenres}`;
    }

    return {
      gameId,
      score,
      reason
    };
  }).filter(r => r !== null) as Array<{ gameId: string; score: number; reason: string }>;

  return recommendations;
}

/**
 * Get popularity-based recommendations (for cold start)
 */
export async function getPopularityRecommendations(
  games: GameWithId[],
  limit: number = 20
): Promise<Array<{ gameId: string; score: number; reason: string }>> {
  // Sort by rating and playtime
  const sorted = [...games].sort((a, b) => {
    const scoreA = (a.rating || 0) * (a.playtime || 0);
    const scoreB = (b.rating || 0) * (b.playtime || 0);
    return scoreB - scoreA;
  });

  return sorted.slice(0, limit).map(game => ({
    gameId: game.id,
    score: (game.rating || 0) / 5.0,
    reason: 'Popular game with high ratings'
  }));
}

