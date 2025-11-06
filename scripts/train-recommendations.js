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
const tf = require('@tensorflow/tfjs-node');
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  const { data: interactions, error: interactionsError } = await supabase
    .from('user_interactions')
    .select('*');

  if (interactionsError) {
    throw new Error(`Failed to load interactions: ${interactionsError.message}`);
  }

  console.log(`✓ Found ${interactions.length} user interactions`);

  // Get unique users
  const users = [...new Set(interactions.map(i => i.user_id))];
  console.log(`✓ Found ${users.length} users\n`);

  // Validate data
  if (games.length < CONFIG.minGames) {
    throw new Error(
      `Insufficient games: ${games.length} < ${CONFIG.minGames}. ` +
      `Please add more games to the database.`
    );
  }

  if (interactions.length < CONFIG.minInteractions) {
    throw new Error(
      `Insufficient interactions: ${interactions.length} < ${CONFIG.minInteractions}. ` +
      `Please add more user interactions (like, favorite, or played on games).`
    );
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
    const topTags = tagList.slice(0, 20);
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
  const gameIdToIndex = new Map();
  const userIdToIndex = new Map();

  games.forEach((game, idx) => gameIdToIndex.set(game.id, idx));
  users.forEach((userId, idx) => userIdToIndex.set(userId, idx));

  // Create game feature lookup
  const gameFeatureMap = new Map();
  gameFeatures.gameFeatures.forEach(({ gameId, features }) => {
    gameFeatureMap.set(gameId, features);
  });

  // Build positive examples (user interacted with game)
  const positiveExamples = [];
  interactions.forEach(interaction => {
    const userIdx = userIdToIndex.get(interaction.user_id);
    const gameIdx = gameIdToIndex.get(interaction.game_id);
    const features = gameFeatureMap.get(interaction.game_id) || [];

    if (userIdx !== undefined && gameIdx !== undefined && features.length > 0) {
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

  console.log(`✓ Created ${positiveExamples.length} positive examples`);

  // Build negative examples (random games user hasn't interacted with)
  const userInteractedGames = new Map();
  interactions.forEach(interaction => {
    if (!userInteractedGames.has(interaction.user_id)) {
      userInteractedGames.set(interaction.user_id, new Set());
    }
    userInteractedGames.get(interaction.user_id).add(interaction.game_id);
  });

  const negativeExamples = [];
  const numNegative = Math.min(positiveExamples.length * 2, games.length * users.length);

  for (let i = 0; i < numNegative; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const userInteracted = userInteractedGames.get(randomUser) || new Set();

    if (!userInteracted.has(randomGame.id)) {
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

  console.log(`✓ Created ${negativeExamples.length} negative examples\n`);

  // Combine and shuffle
  const allExamples = [...positiveExamples, ...negativeExamples];
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
  const weights = trainingData.examples.map(e => e.weight);

  const userTensor = tf.tensor2d(userIndices, [userIndices.length, 1]);
  const gameTensor = tf.tensor2d(gameIndices, [gameIndices.length, 1]);
  const featureTensor = tf.tensor2d(features);
  const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
  const weightTensor = tf.tensor1d(weights);

  // Split into train/validation
  const splitIdx = Math.floor(userIndices.length * (1 - CONFIG.validationSplit));
  
  const trainUsers = userTensor.slice([0, 0], [splitIdx, 1]);
  const trainGames = gameTensor.slice([0, 0], [splitIdx, 1]);
  const trainFeatures = featureTensor.slice([0, 0], [splitIdx, -1]);
  const trainLabels = labelTensor.slice([0, 0], [splitIdx, 1]);
  const trainWeights = weightTensor.slice([0], [splitIdx]);

  const valUsers = userTensor.slice([splitIdx, 0], [-1, 1]);
  const valGames = gameTensor.slice([splitIdx, 0], [-1, 1]);
  const valFeatures = featureTensor.slice([splitIdx, 0], [-1, -1]);
  const valLabels = labelTensor.slice([splitIdx, 0], [-1, 1]);

  // Train
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
      },
      sampleWeight: trainWeights
    }
  );

  // Clean up tensors
  userTensor.dispose();
  gameTensor.dispose();
  featureTensor.dispose();
  labelTensor.dispose();
  weightTensor.dispose();
  trainUsers.dispose();
  trainGames.dispose();
  trainFeatures.dispose();
  trainLabels.dispose();
  trainWeights.dispose();
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

  // Save model
  await model.save(`file://${CONFIG.modelDir}`);

  // Save metadata
  const metadataPath = path.join(CONFIG.modelDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`✓ Model saved to ${CONFIG.modelDir}/`);
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
    await trainModel(model, trainingData);

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
    console.log('\nNext steps:');
    console.log('1. Test the model by generating recommendations via the API');
    console.log('2. Check the recommendations page in your app');
    console.log('3. Monitor recommendation quality and retrain if needed\n');

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

