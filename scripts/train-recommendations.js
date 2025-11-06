/**
 * TensorFlow Recommendation Model Training Script
 * 
 * This script trains a hybrid recommendation model using:
 * - Collaborative filtering (user-game interactions)
 * - Content-based filtering (game features: genres, tags, platforms, ratings)
 * 
 * Run with: node scripts/train-recommendations.js
 * or: npm run train:recommendations
 */

require('dotenv').config({ path: '.env.local' });

// Always load tfjs-node first to register file system handler (even if native bindings fail)
// This ensures model.save() with file:// protocol works
let tfjsNode;
try {
  tfjsNode = require('@tensorflow/tfjs-node');
  // File system handler is now registered
} catch (nodeError) {
  // If tfjs-node fails to load entirely, we'll handle it below
  console.warn('⚠️  Could not load @tensorflow/tfjs-node module at all.');
}

// Try to use tfjs-node with native bindings, fallback to CPU-only if needed
let tf;
let usingCPUOnly = false;

try {
  // Use tfjs-node if available
  if (tfjsNode) {
    tf = tfjsNode;
    
    // Verify backend is loaded
    const backend = tf.getBackend();
    console.log('✓ Using TensorFlow.js Node.js backend (with native acceleration)');
    console.log(`✓ Backend: ${backend}\n`);
    
    // Test that native bindings work
    try {
      const testTensor = tf.tensor2d([[1, 2], [3, 4]]);
      const testResult = testTensor.mean().dataSync();
      testTensor.dispose();
      console.log('✓ Native bindings verified and working\n');
    } catch (nativeError) {
      // Native bindings failed but module loaded - use CPU mode
      throw nativeError;
    }
  } else {
    throw new Error('tfjs-node module not available');
  }
  
} catch (error) {
  console.warn('⚠️  Warning: Could not load @tensorflow/tfjs-node native bindings.');
  console.warn('   Falling back to CPU-only mode (will be slower but will work).\n');
  console.warn('   To fix and get faster training:');
  console.warn('   1. Install Universal C Runtime: https://support.microsoft.com/en-us/topic/update-for-universal-c-runtime-in-windows-c0514201-7fe6-95a3-b0a5-287930f3560c');
  console.warn('   2. Or install both Visual C++ Redistributable versions:');
  console.warn('      - x64: https://aka.ms/vs/17/release/vc_redist.x64.exe');
  console.warn('      - x86: https://aka.ms/vs/17/release/vc_redist.x86.exe');
  console.warn('   3. Restart your computer and try again\n');
  
  // Fallback to CPU-only TensorFlow.js
  try {
    tf = require('@tensorflow/tfjs');
    
    // File system handler should already be registered from tfjs-node load attempt above
    // If tfjs-node loaded even partially, the handler should be available
    if (tfjsNode) {
      console.log('✓ File system handler available for model saving');
    }
    
    usingCPUOnly = true;
    console.log('✓ Using CPU-only TensorFlow.js (slower but functional)');
    console.log('   Backend: CPU\n');
  } catch (fallbackError) {
    console.error('❌ Failed to load TensorFlow.js.');
    console.error('   Please check your installation.');
    console.error('   Original error:', error.message);
    console.error('   Fallback error:', fallbackError.message);
    console.error('\n   Try reinstalling: npm install @tensorflow/tfjs @tensorflow/tfjs-node');
    process.exit(1);
  }
}

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  minGames: 50,
  minInteractions: 10, // Reduced for single-user scenarios
  minUsers: 1, // Allow single-user training (content-based only)
  topNRecommendations: 20,
  modelDir: path.join(__dirname, '../models/recommendation-model'),
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS (for admin scripts)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL');
  console.error('And either: SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✓ Using service role key (bypasses RLS)\n');
} else {
  console.warn('⚠️  Warning: Using anonymous key. RLS policies must allow reading user_interactions.\n');
}

/**
 * Load data from Supabase
 */
async function loadData() {
  console.log('Loading data from Supabase...\n');

  // Load games
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .not('genres', 'is', null);

  if (gamesError) {
    throw new Error(`Failed to load games: ${gamesError.message}`);
  }

  console.log(`✓ Found ${games.length} games`);

  // Load user interactions
  const { data: interactions, error: interactionsError, count: interactionsCount } = await supabase
    .from('user_interactions')
    .select('*', { count: 'exact' });

  if (interactionsError) {
    throw new Error(`Failed to load interactions: ${interactionsError.message}`);
  }

  const actualCount = interactions?.length || interactionsCount || 0;
  console.log(`✓ Found ${actualCount} user interactions`);

  // Get unique users (handle empty interactions array)
  const users = interactions && interactions.length > 0 
    ? [...new Set(interactions.map(i => i.user_id))]
    : [];
  console.log(`✓ Found ${users.length} users\n`);

  // Validate data
  if (games.length < CONFIG.minGames) {
    throw new Error(
      `Insufficient games: ${games.length} < ${CONFIG.minGames}. ` +
      `Please add more games to the database.`
    );
  }

  const interactionCount = interactions?.length || 0;
  if (interactionCount < CONFIG.minInteractions) {
    console.error(`\n❌ Insufficient interactions: ${interactionCount} < ${CONFIG.minInteractions}`);
    console.error(`   Please add more user interactions (like, favorite, or played on games).`);
    console.error(`\n   If you have interactions in the database but they're not showing up:`);
    console.error(`   1. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local`);
    console.error(`   2. Check RLS policies on user_interactions table`);
    console.error(`   3. Verify interactions exist in Supabase Dashboard`);
    throw new Error(`Insufficient interactions: ${interactionCount} < ${CONFIG.minInteractions}`);
  }

  if (users.length < CONFIG.minUsers) {
    throw new Error(
      `Insufficient users: ${users.length} < ${CONFIG.minUsers}. ` +
      `Need at least one user with interactions.`
    );
  }

  // Warn about single-user training
  if (users.length === 1) {
    console.log('⚠️  WARNING: Training with single user detected.');
    console.log('   - Model will be primarily content-based (game features)');
    console.log('   - Collaborative filtering will be limited');
    console.log('   - Recommendations will be based on your preferences and game similarity');
    console.log('   - For better results, aim for at least 10+ interactions across different games\n');
  }

  return { games, interactions, users };
}

/**
 * Extract and normalize game features
 */
function extractGameFeatures(games) {
  // Collect all unique genres, tags, and platforms
  const allGenres = new Set();
  const allTags = new Set();
  const allPlatforms = new Set();

  games.forEach(game => {
    if (game.genres && Array.isArray(game.genres)) {
      game.genres.forEach(g => allGenres.add(g.name || g));
    }
    if (game.tags && Array.isArray(game.tags)) {
      game.tags.forEach(t => allTags.add(t.name || t));
    }
    if (game.platforms && Array.isArray(game.platforms)) {
      game.platforms.forEach(p => {
        const platformName = p.name || p.platform?.name || p;
        if (platformName) allPlatforms.add(platformName);
      });
    }
  });

  const genreList = Array.from(allGenres);
  const tagList = Array.from(allTags);
  const platformList = Array.from(allPlatforms);
  
  // Get top 20 most common tags (used for feature encoding)
  const topTags = tagList.slice(0, 20);

  // Create feature vectors for each game
  const gameFeatures = games.map(game => {
    const features = [];

    // One-hot encode genres
    const genreVec = new Array(genreList.length).fill(0);
    if (game.genres && Array.isArray(game.genres)) {
      game.genres.forEach(g => {
        const genreName = g.name || g;
        const idx = genreList.indexOf(genreName);
        if (idx >= 0) genreVec[idx] = 1;
      });
    }
    features.push(...genreVec);

    // One-hot encode tags (top 20 most common)
    const tagVec = new Array(topTags.length).fill(0);
    if (game.tags && Array.isArray(game.tags)) {
      game.tags.forEach(t => {
        const tagName = t.name || t;
        const idx = topTags.indexOf(tagName);
        if (idx >= 0) tagVec[idx] = 1;
      });
    }
    features.push(...tagVec);

    // Normalize ratings (0-1 scale)
    const rating = game.rating ? game.rating / 5.0 : 0.5;
    features.push(rating);

    // Normalize metacritic (0-1 scale)
    const metacritic = game.metacritic ? game.metacritic / 100.0 : 0.5;
    features.push(metacritic);

    // Normalize playtime (log scale, capped at 100 hours)
    const playtime = game.playtime 
      ? Math.min(Math.log10(game.playtime + 1) / Math.log10(101), 1.0)
      : 0.5;
    features.push(playtime);

    // Release year (normalized, recent games get higher score)
    let releaseYear = 0.5;
    if (game.released) {
      const year = new Date(game.released).getFullYear();
      const currentYear = new Date().getFullYear();
      releaseYear = Math.min((year - 1990) / (currentYear - 1990), 1.0);
    }
    features.push(releaseYear);

    return {
      gameId: game.id,
      features: features
    };
  });

  return {
    gameFeatures,
    genreList,
    tagList: topTags,
    platformList
  };
}

/**
 * Prepare training data
 */
function prepareTrainingData(games, interactions, users, gameFeatures) {
  console.log('Preparing training data...\n');

  // Create mappings
  const gameIdToIndex = new Map();  // Maps database UUID -> index
  const gameSlugToIndex = new Map(); // Maps slug -> index
  const userIdToIndex = new Map();

  games.forEach((game, idx) => {
    gameIdToIndex.set(game.id, idx);      // Map by database UUID
    if (game.slug) {
      gameSlugToIndex.set(game.slug, idx); // Map by slug
    }
  });
  users.forEach((userId, idx) => userIdToIndex.set(userId, idx));

  // Create game feature lookup
  const gameFeatureMap = new Map();
  gameFeatures.gameFeatures.forEach(({ gameId, features }) => {
    gameFeatureMap.set(gameId, features);
  });

  // Build positive examples (user interacted with game)
  const positiveExamples = [];
  let skippedInteractions = 0;
  
  interactions.forEach(interaction => {
    const userIdx = userIdToIndex.get(interaction.user_id);
    
    // Try to find game by database ID first, then by slug
    let gameIdx = gameIdToIndex.get(interaction.game_id);
    let gameId = interaction.game_id;
    
    if (gameIdx === undefined) {
      // Try looking up by slug
      gameIdx = gameSlugToIndex.get(interaction.game_id);
      if (gameIdx !== undefined) {
        // Found by slug, get the actual database ID
        gameId = games[gameIdx].id;
      }
    }
    
    const features = gameFeatureMap.get(gameId) || [];

    if (userIdx === undefined) {
      skippedInteractions++;
      console.warn(`  ⚠️  User ${interaction.user_id} not found in user index`);
    } else if (gameIdx === undefined) {
      skippedInteractions++;
      console.warn(`  ⚠️  Game ${interaction.game_id} not found in game index (tried both ID and slug)`);
    } else if (features.length === 0) {
      skippedInteractions++;
      console.warn(`  ⚠️  Game ${gameId} has no features`);
    } else {
      // Weight different interaction types
      let weight = 1.0;
      if (interaction.action === 'favorite') weight = 1.5;
      else if (interaction.action === 'played') weight = 1.2;
      else if (interaction.action === 'like') weight = 1.0;

      positiveExamples.push({
        userIdx,
        gameIdx,
        features,
        label: 1.0,
        weight
      });
    }
  });

  if (skippedInteractions > 0) {
    console.log(`  ⚠️  Skipped ${skippedInteractions} interactions (user/game not found or missing features)`);
  }
  console.log(`✓ Created ${positiveExamples.length} positive examples (before weighting)`);

  // Build negative examples (random games user hasn't interacted with)
  const userInteractedGames = new Map(); // Maps user_id -> Set of game IDs/slugs
  interactions.forEach(interaction => {
    if (!userInteractedGames.has(interaction.user_id)) {
      userInteractedGames.set(interaction.user_id, new Set());
    }
    // Add both the interaction game_id (could be slug or UUID) and the actual game.id
    userInteractedGames.get(interaction.user_id).add(interaction.game_id);
    // Also add the slug if we found the game
    const gameIdx = gameIdToIndex.get(interaction.game_id) !== undefined 
      ? gameIdToIndex.get(interaction.game_id)
      : gameSlugToIndex.get(interaction.game_id);
    if (gameIdx !== undefined) {
      userInteractedGames.get(interaction.user_id).add(games[gameIdx].id);
      if (games[gameIdx].slug) {
        userInteractedGames.get(interaction.user_id).add(games[gameIdx].slug);
      }
    }
  });

  const negativeExamples = [];
  const numNegative = Math.min(positiveExamples.length * 2, games.length * users.length);

  for (let i = 0; i < numNegative; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const userInteracted = userInteractedGames.get(randomUser) || new Set();

    // Check if user has interacted with this game (by ID or slug)
    const hasInteracted = userInteracted.has(randomGame.id) || 
                         (randomGame.slug && userInteracted.has(randomGame.slug));

    if (!hasInteracted) {
      const userIdx = userIdToIndex.get(randomUser);
      const gameIdx = gameIdToIndex.get(randomGame.id);
      const features = gameFeatureMap.get(randomGame.id) || [];

      if (userIdx !== undefined && gameIdx !== undefined && features.length > 0) {
        negativeExamples.push({
          userIdx,
          gameIdx,
          features,
          label: 0.0,
          weight: 0.5
        });
      }
    }
  }

  console.log(`✓ Created ${negativeExamples.length} negative examples (before weighting)\n`);

  // Validate we have examples
  if (positiveExamples.length === 0) {
    throw new Error(
      'No valid training examples created. ' +
      'This usually means the game_ids in user_interactions don\'t match any games in the database. ' +
      'Make sure the interactions reference games that exist in the games table.'
    );
  }

  // Apply weights by duplicating examples (TensorFlow.js doesn't support sample weights)
  // This gives more importance to favorites and played games
  const weightedExamples = [];
  
  positiveExamples.forEach(example => {
    // Round weight to get number of duplicates (favorite=1.5→2, played=1.2→1, like=1.0→1)
    const duplicates = Math.round(example.weight);
    for (let i = 0; i < duplicates; i++) {
      weightedExamples.push({
        ...example,
        weight: 1.0 // Remove weight since we're duplicating instead
      });
    }
  });
  
  negativeExamples.forEach(example => {
    // Negative examples get less weight (0.5 weight = sometimes include, sometimes not)
    const duplicates = Math.round(example.weight);
    for (let i = 0; i < duplicates; i++) {
      weightedExamples.push({
        ...example,
        weight: 1.0
      });
    }
  });

  console.log(`✓ Created ${weightedExamples.length} weighted training examples (after duplication)`);
  console.log(`  - Positive examples: ${positiveExamples.length} → ${weightedExamples.filter(e => e.label === 1.0).length} (weighted)`);
  console.log(`  - Negative examples: ${negativeExamples.length} → ${weightedExamples.filter(e => e.label === 0.0).length} (weighted)\n`);

  // Shuffle
  const allExamples = weightedExamples;
  for (let i = allExamples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allExamples[i], allExamples[j]] = [allExamples[j], allExamples[i]];
  }

  return {
    examples: allExamples,
    gameIdToIndex,
    userIdToIndex,
    numUsers: users.length,
    numGames: games.length,
    featureSize: gameFeatures.gameFeatures[0]?.features.length || 0
  };
}

/**
 * Build and compile the model
 */
function buildModel(numUsers, numGames, featureSize) {
  console.log('Building model...\n');

  const userInput = tf.input({ shape: [1], name: 'user_input' });
  const gameInput = tf.input({ shape: [1], name: 'game_input' });
  const featureInput = tf.input({ shape: [featureSize], name: 'feature_input' });

  // User embedding
  const userEmbedding = tf.layers
    .embedding({
      inputDim: numUsers,
      outputDim: 32,
      inputLength: 1,
      name: 'user_embedding'
    })
    .apply(userInput);

  // Game embedding
  const gameEmbedding = tf.layers
    .embedding({
      inputDim: numGames,
      outputDim: 32,
      inputLength: 1,
      name: 'game_embedding'
    })
    .apply(gameInput);

  // Flatten embeddings
  const userFlat = tf.layers.flatten().apply(userEmbedding);
  const gameFlat = tf.layers.flatten().apply(gameEmbedding);

  // Feature normalization
  const featureNorm = tf.layers.dense({
    units: 64,
    activation: 'relu',
    name: 'feature_norm'
  }).apply(featureInput);

  // Concatenate all features
  const concat = tf.layers.concatenate().apply([userFlat, gameFlat, featureNorm]);

  // Dense layers
  const dense1 = tf.layers.dense({
    units: 128,
    activation: 'relu',
    name: 'dense1'
  }).apply(concat);

  const dropout1 = tf.layers.dropout({ rate: 0.3 }).apply(dense1);

  const dense2 = tf.layers.dense({
    units: 64,
    activation: 'relu',
    name: 'dense2'
  }).apply(dropout1);

  const dropout2 = tf.layers.dropout({ rate: 0.3 }).apply(dense2);

  const dense3 = tf.layers.dense({
    units: 32,
    activation: 'relu',
    name: 'dense3'
  }).apply(dropout2);

  // Output layer
  const output = tf.layers.dense({
    units: 1,
    activation: 'sigmoid',
    name: 'output'
  }).apply(dense3);

  const model = tf.model({
    inputs: [userInput, gameInput, featureInput],
    outputs: output
  });

  model.compile({
    optimizer: tf.train.adam(CONFIG.learningRate),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}

/**
 * Train the model
 */
async function trainModel(model, trainingData) {
  console.log('Training model...\n');

  // Convert to tensors
  const userIndices = trainingData.examples.map(e => e.userIdx);
  const gameIndices = trainingData.examples.map(e => e.gameIdx);
  const features = trainingData.examples.map(e => e.features);
  const labels = trainingData.examples.map(e => e.label);

  const numExamples = userIndices.length;
  const featureSize = features[0]?.length || trainingData.featureSize;

  if (numExamples === 0) {
    throw new Error('No training examples available');
  }

  const userTensor = tf.tensor2d(userIndices, [numExamples, 1]);
  const gameTensor = tf.tensor2d(gameIndices, [numExamples, 1]);
  const featureTensor = tf.tensor2d(features, [numExamples, featureSize]);
  const labelTensor = tf.tensor2d(labels, [numExamples, 1]);

  // Split into train/validation
  const splitIdx = Math.floor(userIndices.length * (1 - CONFIG.validationSplit));
  
  const trainUsers = userTensor.slice([0, 0], [splitIdx, 1]);
  const trainGames = gameTensor.slice([0, 0], [splitIdx, 1]);
  const trainFeatures = featureTensor.slice([0, 0], [splitIdx, -1]);
  const trainLabels = labelTensor.slice([0, 0], [splitIdx, 1]);

  const valUsers = userTensor.slice([splitIdx, 0], [-1, 1]);
  const valGames = gameTensor.slice([splitIdx, 0], [-1, 1]);
  const valFeatures = featureTensor.slice([splitIdx, 0], [-1, -1]);
  const valLabels = labelTensor.slice([splitIdx, 0], [-1, 1]);

  // Train (weights are handled by duplicating examples, not sample weights)
  const history = await model.fit(
    [trainUsers, trainGames, trainFeatures],
    trainLabels,
    {
      epochs: CONFIG.epochs,
      batchSize: CONFIG.batchSize,
      validationData: [[valUsers, valGames, valFeatures], valLabels],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch + 1}/${CONFIG.epochs} - ` +
            `loss: ${logs.loss.toFixed(4)} - ` +
            `accuracy: ${logs.acc.toFixed(4)} - ` +
            `val_loss: ${logs.val_loss.toFixed(4)} - ` +
            `val_acc: ${logs.val_acc.toFixed(4)}`
          );
        }
      }
    }
  );

  // Clean up tensors
  userTensor.dispose();
  gameTensor.dispose();
  featureTensor.dispose();
  labelTensor.dispose();
  trainUsers.dispose();
  trainGames.dispose();
  trainFeatures.dispose();
  trainLabels.dispose();
  valUsers.dispose();
  valGames.dispose();
  valFeatures.dispose();
  valLabels.dispose();

  return history;
}

/**
 * Save model and metadata
 */
async function saveModel(model, metadata) {
  console.log('\nSaving model...\n');

  // Ensure directory exists
  await fs.mkdir(CONFIG.modelDir, { recursive: true });

  try {
    // Try to save model using file:// protocol
    await model.save(`file://${CONFIG.modelDir}`);
    console.log(`✓ Model saved to ${CONFIG.modelDir}/`);
  } catch (saveError) {
    // If file:// fails, try saving model weights manually
    console.warn('⚠️  File system handler not available, saving model weights manually...');
    
    try {
      // Save model topology
      const modelTopology = model.toJSON();
      const topologyPath = path.join(CONFIG.modelDir, 'model.json');
      await fs.writeFile(topologyPath, JSON.stringify(modelTopology, null, 2));
      
      // Save weights
      const weights = await model.getWeights();
      const weightsData = await Promise.all(weights.map(async (weight, i) => {
        const weightData = await weight.data();
        const weightShape = weight.shape;
        return {
          name: `weight_${i}`,
          data: Array.from(weightData),
          shape: weightShape
        };
      }));
      
      const weightsPath = path.join(CONFIG.modelDir, 'weights.json');
      await fs.writeFile(weightsPath, JSON.stringify(weightsData, null, 2));
      
      console.log(`✓ Model topology saved to ${topologyPath}`);
      console.log(`✓ Model weights saved to ${weightsPath}`);
      console.warn('⚠️  Note: Manual weight saving format. Model loading may need adjustment.');
    } catch (manualSaveError) {
      console.error('❌ Failed to save model:', manualSaveError.message);
      throw new Error(`Model saving failed: ${saveError.message}. Manual save also failed: ${manualSaveError.message}`);
    }
  }

  // Save metadata
  const metadataPath = path.join(CONFIG.modelDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`✓ Metadata saved to ${metadataPath}`);
}

/**
 * Main training function
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('PlayPickr Recommendation Model Training');
    console.log('='.repeat(60));
    console.log();

    // Load data
    const { games, interactions, users } = await loadData();

    // Extract features
    const gameFeatures = extractGameFeatures(games);
    console.log(`✓ Feature vector size: ${gameFeatures.gameFeatures[0]?.features.length || 0}\n`);

    // Prepare training data
    const trainingData = prepareTrainingData(games, interactions, users, gameFeatures);

    // Build model
    const model = buildModel(
      trainingData.numUsers,
      trainingData.numGames,
      trainingData.featureSize
    );

    // Print model summary
    console.log('Model Architecture:');
    model.summary();
    console.log();

    // Train model
    const history = await trainModel(model, trainingData);
    
    // Note about overfitting with small datasets
    if (trainingData.numUsers < 5 || trainingData.examples.length < 200) {
      console.log('\n⚠️  Note: Small dataset detected.');
      console.log('   With limited data, the model may overfit (memorize training data).');
      console.log('   This is expected and will improve as you add more users and interactions.');
      console.log('   The model will still provide useful recommendations, especially for content-based features.\n');
    }

    // Save model
    const metadata = {
      gameIdToIndex: Object.fromEntries(trainingData.gameIdToIndex),
      userIdToIndex: Object.fromEntries(trainingData.userIdToIndex),
      indexToGameId: Object.fromEntries(
        Array.from(trainingData.gameIdToIndex.entries()).map(([id, idx]) => [idx, id])
      ),
      indexToUserId: Object.fromEntries(
        Array.from(trainingData.userIdToIndex.entries()).map(([id, idx]) => [idx, id])
      ),
      featureSize: trainingData.featureSize,
      numUsers: trainingData.numUsers,
      numGames: trainingData.numGames,
      genreList: gameFeatures.genreList,
      tagList: gameFeatures.tagList,
      platformList: gameFeatures.platformList,
      config: CONFIG,
      trainedAt: new Date().toISOString()
    };

    await saveModel(model, metadata);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Training completed successfully!');
    console.log('='.repeat(60));
    if (usingCPUOnly) {
      console.log('\n⚠️  Note: Training used CPU-only mode (slower).');
      console.log('   For faster training, install Universal C Runtime or Visual C++ Redistributable.');
    }

  } catch (error) {
    console.error('\n❌ Training failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run training
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };

