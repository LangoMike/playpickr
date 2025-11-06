# TensorFlow Recommendation Model Training Guide

This guide walks you through the complete process of training and deploying the PlayPickr recommendation system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Understanding the Model Architecture](#understanding-the-model-architecture)
3. [Data Preparation](#data-preparation)
4. [Training the Model](#training-the-model)
5. [Validating the Model](#validating-the-model)
6. [Deploying the Model](#deploying-the-model)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Required Dependencies

First, ensure you have the necessary packages installed:

```bash
cd playpickr
npm install @tensorflow/tfjs-node @tensorflow/tfjs
```

### 2. Environment Variables

Make sure your `.env.local` file contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RAWG_API_KEY`

### 3. Database Setup

Ensure your Supabase database has:
- `games` table populated with game data
- `user_interactions` table with user interaction data (like, favorite, played)
- `recommendations` table ready to store results

---

## Understanding the Model Architecture

### Hybrid Recommendation System

Our model combines two approaches:

1. **Collaborative Filtering**: Learns from user behavior patterns
   - Finds users with similar preferences
   - Recommends games liked by similar users
   - Uses matrix factorization (embedding layers)

2. **Content-Based Filtering**: Uses game features
   - Analyzes genres, tags, platforms, ratings
   - Finds games similar to ones the user has interacted with
   - Uses feature embeddings

### Model Components

```
Input Features:
├── User Embedding (user_id → vector)
├── Game Embedding (game_id → vector)
├── Game Features (genres, tags, platforms, ratings)
└── Interaction Features (like, favorite, played)

Model Architecture:
├── Embedding Layers (user & game IDs)
├── Feature Normalization
├── Dense Layers (128, 64, 32 neurons)
├── Dropout (0.3) for regularization
└── Output Layer (sigmoid for score 0-1)
```

### Training Data

The model trains on:
- **Positive examples**: Games users have liked/favorited/played
- **Negative examples**: Random games users haven't interacted with
- **Feature vectors**: Genres, tags, platforms, ratings normalized

---

## Data Preparation

### Step 1: Verify Data Quality

Before training, ensure you have sufficient data:

```bash
# Minimum data requirements
- At least 50+ games in database
- At least 1 user with interactions (single-user training supported)
- At least 10+ total interactions (for single user)
- At least 100+ total interactions (for multi-user, recommended)
```

### Step 2: Data Quality Checks

Run these checks in your database:

```sql
-- Check game data
SELECT COUNT(*) FROM games WHERE genres IS NOT NULL;

-- Check user interactions
SELECT COUNT(*) FROM user_interactions;

-- Check users with interactions
SELECT COUNT(DISTINCT user_id) FROM user_interactions;

-- Check interaction distribution
SELECT action, COUNT(*) FROM user_interactions GROUP BY action;
```

### Step 3: Expected Data Distribution

**Minimum Requirements:**
- **Games**: 50+ games with complete metadata
- **Users**: 1+ user (single-user training is supported)
- **Interactions**: 10+ interactions (for single user)

**Recommended for Best Results:**
- **Games**: 100+ games with complete metadata
- **Users**: 10+ users with at least 3 interactions each
- **Interactions**: 100+ total interactions
- **Interaction types**: Mix of like, favorite, and played

**Single-User Training:**
- ✅ Works fine for personal use and testing
- ✅ Model becomes primarily content-based (uses game features)
- ⚠️ Collaborative filtering will be limited (no user similarity)
- ✅ Recommendations based on your preferences and game similarity
- 💡 Aim for 10+ interactions across different games for better results

---

## Training the Model

### Step 1: Run the Training Script

Navigate to the project directory and run:

```bash
cd playpickr
npm run train:recommendations
```

Or directly:

```bash
node scripts/train-recommendations.js
```

### Step 2: Monitor Training Progress

The script will output:

```
Loading data from Supabase...
✓ Found 1234 games
✓ Found 567 user interactions
✓ Found 45 users

Preparing training data...
✓ Creating user-game interaction matrix
✓ Extracting game features
✓ Normalizing features

Training model...
Epoch 1/50 - loss: 0.5234 - accuracy: 0.7123
Epoch 2/50 - loss: 0.4891 - accuracy: 0.7456
...
Epoch 50/50 - loss: 0.2345 - accuracy: 0.9123

Evaluating model...
✓ Validation accuracy: 0.8945
✓ Validation loss: 0.2456

Saving model...
✓ Model saved to models/recommendation-model/
```

### Step 3: Understanding Training Output

**Loss**: Should decrease over epochs (lower is better)
- Good: < 0.3
- Warning: 0.3 - 0.5
- Bad: > 0.5

**Accuracy**: Should increase over epochs (higher is better)
- Good: > 0.85
- Warning: 0.70 - 0.85
- Bad: < 0.70

**What to watch for:**
- Loss should decrease steadily
- Accuracy should increase steadily
- If loss increases, model may be overfitting (reduce learning rate or add more dropout)

### Step 4: Model Artifacts

After training, check that these files exist:

```
playpickr/models/recommendation-model/
├── model.json          (model architecture)
├── weights.bin          (trained weights)
├── metadata.json       (feature encodings, user/game mappings)
└── scaler.json         (feature normalization parameters)
```

---

## Validating the Model

### Step 1: Visual Inspection

After training, manually verify:

1. **Check saved model files exist**
   ```bash
   ls -la playpickr/models/recommendation-model/
   ```

2. **Verify model loads correctly**
   - The API endpoint should load without errors
   - Check server logs for "Model loaded successfully"

### Step 2: Test Recommendations

1. **Generate recommendations for a test user**
   - Use the API endpoint: `POST /api/recommendations/generate`
   - Check the recommendations table in Supabase

2. **Verify recommendation quality**
   ```sql
   SELECT 
     r.user_id,
     r.game_id,
     r.score,
     r.reason,
     g.name as game_name
   FROM recommendations r
   JOIN games g ON r.game_id = g.id
   WHERE r.user_id = 'test-user-id'
   ORDER BY r.score DESC
   LIMIT 10;
   ```

3. **Check for reasonable scores**
   - Scores should be between 0.0 and 1.0
   - Top recommendations should have scores > 0.6
   - Recommendations should make sense (e.g., action games for action game lovers)

### Step 3: Common Validation Checks

✅ **Passes if:**
- Model files exist and are readable
- Recommendations generated without errors
- Scores are in valid range (0-1)
- Recommendations are diverse (not all same game)
- Games exist in database

❌ **Fails if:**
- Model files missing or corrupted
- API errors when generating recommendations
- All scores are 0 or 1 (model not learning)
- Recommendations are all the same game
- Games don't exist in database

---

## Deploying the Model

### Step 1: Verify Model Files in Repository

Ensure model files are committed (or add to `.gitignore` if too large):

```bash
# Check if model directory exists
ls -la playpickr/models/

# If using git, check if tracked
git status playpickr/models/
```

**Note**: If model files are large (> 50MB), consider:
- Using Git LFS
- Storing in cloud storage (S3, Supabase Storage)
- Generating on first deployment

### Step 2: Test API Endpoint

Test the recommendation generation:

```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl -X POST http://localhost:3000/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

### Step 3: Verify in Production

After deployment:

1. **Check model loads on server startup**
   - Check Vercel/deployment logs
   - Look for "Model loaded successfully"

2. **Test recommendation generation**
   - Click "Generate Recommendations" button
   - Verify recommendations appear
   - Check database for new entries

---

## Troubleshooting

### Problem: Training Fails with "Insufficient Data"

**Symptoms:**
```
Error: Insufficient training data. Need at least 50 games and 10 interactions.
```

**Solutions:**
1. **Add more game data**: Use RAWG API to populate games table
2. **Add more interactions**: Like, favorite, or mark games as played
3. **For single-user scenarios**: You need at least 10 interactions across different games

**Quick Fix for Testing (Single User):**
```sql
-- Create test interactions for your user
-- Replace 'your-user-id' with your actual user ID
INSERT INTO user_interactions (user_id, game_id, action)
SELECT 
  'your-user-id',  -- Get this from auth.users table
  id,
  'like'
FROM games
WHERE genres IS NOT NULL
LIMIT 15;  -- Create 15 interactions for better training
```

**Note**: With single-user training, the model will be content-based and learn your preferences from the games you interact with.

### Problem: Model Accuracy is Low (< 0.70)

**Symptoms:**
- Training accuracy stays below 0.70
- Loss doesn't decrease significantly

**Solutions:**
1. **More training data**: Add more user interactions
2. **Adjust hyperparameters**: Increase epochs, adjust learning rate
3. **Feature engineering**: Add more game features (developers, publishers)
4. **Check data quality**: Ensure genres/tags are populated

**Hyperparameter Tuning:**
Edit `scripts/train-recommendations.js`:
```javascript
const model = tf.sequential({
  layers: [
    // Increase neurons in dense layers
    tf.layers.dense({ units: 256, activation: 'relu' }), // was 128
    tf.layers.dense({ units: 128, activation: 'relu' }), // was 64
    // ...
  ]
});

// Adjust learning rate
model.compile({
  optimizer: tf.train.adam(0.001), // try 0.0005 or 0.002
  loss: 'binaryCrossentropy',
  metrics: ['accuracy']
});
```

### Problem: Model Files Not Found

**Symptoms:**
```
Error: Model file not found: models/recommendation-model/model.json
```

**Solutions:**
1. **Run training first**: Ensure training script completed successfully
2. **Check file paths**: Verify model directory exists
3. **Check permissions**: Ensure read permissions on model files

**Verify:**
```bash
ls -la playpickr/models/recommendation-model/
```

### Problem: Recommendations Are All Same Games

**Symptoms:**
- All users get same recommendations
- No personalization

**Solutions:**
1. **Retrain model**: Model may not have learned user preferences
2. **Check user interactions**: Ensure users have different interaction patterns
3. **Increase model complexity**: Add more layers or neurons

### Problem: Cold Start (New Users with No Interactions)

**Expected Behavior:**
- New users should see popularity-based recommendations
- API should handle gracefully

**Verification:**
```sql
-- Check if user has interactions
SELECT COUNT(*) FROM user_interactions WHERE user_id = 'new-user-id';

-- If 0, should fall back to popularity
```

### Problem: Training Takes Too Long

**Symptoms:**
- Training runs for hours
- System becomes unresponsive

**Solutions:**
1. **Reduce data size**: Limit to subset of games/users
2. **Reduce epochs**: Train for fewer epochs (try 20 instead of 50)
3. **Use GPU**: If available, TensorFlow.js can use GPU acceleration
4. **Train in batches**: Process data in smaller chunks

**Quick Fix:**
Edit training script to limit data:
```javascript
// Limit to 1000 games for faster training
const games = await fetchGames();
const limitedGames = games.slice(0, 1000);
```

### Problem: Model Performance Degrades Over Time

**Symptoms:**
- Recommendations become less relevant
- User feedback indicates poor recommendations

**Solutions:**
1. **Retrain regularly**: Retrain monthly or when new data is available
2. **Update model**: Incorporate new user interactions
3. **Monitor metrics**: Track recommendation click-through rates

**Retraining Schedule:**
- **Weekly**: If you have high user activity
- **Monthly**: For moderate activity
- **Quarterly**: For low activity

---

## Next Steps After Training

1. **Monitor Performance**
   - Track recommendation scores
   - Monitor user engagement with recommendations
   - Collect user feedback

2. **Iterate and Improve**
   - Add more features (developers, publishers, release year)
   - Experiment with different model architectures
   - A/B test different recommendation strategies

3. **Scale Up**
   - Consider cloud-based training for larger datasets
   - Implement model versioning
   - Set up automated retraining pipelines

---

## Quick Reference

### Training Commands

```bash
# Train model
npm run train:recommendations

# Check model files
ls -la playpickr/models/recommendation-model/

# Test API endpoint
curl -X POST http://localhost:3000/api/recommendations/generate
```

### Key Files

- `scripts/train-recommendations.js` - Training script
- `models/recommendation-model/` - Saved model files
- `src/app/api/recommendations/generate/route.ts` - API endpoint
- `src/app/recommendations/page.tsx` - UI page

### Database Queries

```sql
-- Check training data
SELECT COUNT(*) FROM games;
SELECT COUNT(*) FROM user_interactions;
SELECT COUNT(DISTINCT user_id) FROM user_interactions;

-- Check recommendations
SELECT COUNT(*) FROM recommendations WHERE user_id = 'user-id';
SELECT * FROM recommendations WHERE user_id = 'user-id' ORDER BY score DESC;
```

---

## Support

If you encounter issues not covered here:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Ensure database has sufficient data
4. Review model training output for warnings

For persistent issues, check:
- TensorFlow.js documentation: https://www.tensorflow.org/js
- Supabase documentation: https://supabase.com/docs

