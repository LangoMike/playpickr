/**
 * Recommendation System Utilities
 * 
 * Handles loading the trained TensorFlow model and generating recommendations
 */

// Use dynamic import for tfjs-node to avoid SSR issues
import type * as tfjs from '@tensorflow/tfjs-node';
import type * as pathModule from 'path';
import type * as fsModule from 'fs/promises';

let tf: typeof tfjs | null = null;
let path: typeof pathModule | null = null;
let fs: typeof fsModule | null = null;

// Initialize TensorFlow.js Node backend
async function initTensorFlow() {
  if (typeof window === 'undefined') {
    // Server-side: use tfjs-node
    tf = await import('@tensorflow/tfjs-node') as typeof tfjs;
    path = await import('path') as typeof pathModule;
    fs = await import('fs/promises') as typeof fsModule;
  }
}

type TensorFlowModel = Awaited<ReturnType<typeof tfjs.loadLayersModel>>;
let model: TensorFlowModel | null = null;
let metadata: ModelMetadata | null = null;

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
 */
export async function loadModel(): Promise<void> {
  if (model && metadata) {
    return; // Already loaded
  }

  // Initialize TensorFlow if needed
  if (!tf) {
    await initTensorFlow();
  }

  try {
    if (!path || !fs) {
      throw new Error('Path or fs module not initialized');
    }
    
    const modelDir = path.join(process.cwd(), 'models', 'recommendation-model');
    
    // Check if model exists
    try {
      await fs.access(modelDir);
    } catch {
      throw new Error(
        `Model not found at ${modelDir}. Please run 'npm run train:recommendations' first.`
      );
    }

    // Load metadata
    const metadataPath = path.join(modelDir, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    metadata = JSON.parse(metadataContent) as ModelMetadata;

    if (!tf) {
      throw new Error('TensorFlow not initialized');
    }
    // Load model
    model = await tf.loadLayersModel(`file://${path.join(modelDir, 'model.json')}`);
    
    console.log('✅ Recommendation model loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load recommendation model:', error);
    throw error;
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
  if (!model || !metadata) {
    await loadModel();
    if (!model || !metadata) {
      throw new Error('Failed to load recommendation model');
    }
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
    const prediction = model.predict([userTensor, gameTensor, featureTensor]) as tfjs.Tensor;
    const score = await prediction.data();

    // Clean up tensors
    userTensor.dispose();
    gameTensor.dispose();
    featureTensor.dispose();
    prediction.dispose();

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

