/**
 * Add Games from User Interactions Script
 * 
 * Fetches games from RAWG API based on game_ids in user_interactions table
 * and adds them to the games table if they don't already exist.
 * 
 * Usage: node scripts/add-interaction-games.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawgApiKey = process.env.RAWG_API_KEY;

// Use service role key to bypass RLS
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   Get it from Supabase Dashboard > Project Settings > API');
  process.exit(1);
}

if (!rawgApiKey) {
  console.error('❌ Missing RAWG_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
console.log('✓ Using service role key (bypasses RLS)\n');

/**
 * Transform RAWG game data to match database schema
 */
function transformRAWGGame(rawgGame) {
  return {
    rawg_id: rawgGame.id,
    name: rawgGame.name,
    slug: rawgGame.slug,
    description: rawgGame.description || null,
    released: rawgGame.released || null,
    background_image: rawgGame.background_image || null,
    website: rawgGame.website || null,
    rating: rawgGame.rating || null,
    rating_top: rawgGame.rating_top || null,
    metacritic: rawgGame.metacritic || null,
    playtime: rawgGame.playtime || null,
    platforms: rawgGame.platforms ? rawgGame.platforms.map(p => p.platform) : null,
    genres: rawgGame.genres || null,
    tags: rawgGame.tags || null,
    developers: rawgGame.developers || null,
    publishers: rawgGame.publishers || null,
    stores: rawgGame.stores ? rawgGame.stores.map(s => s.store) : null,
  };
}

/**
 * Fetch game by slug from RAWG API
 */
async function fetchGameBySlug(slug) {
  const response = await fetch(
    `https://api.rawg.io/api/games/${slug}?key=${rawgApiKey}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Game not found');
    }
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if game exists in database (by slug or rawg_id)
 */
async function gameExists(gameIdentifier) {
  // Try to find by slug first (most common case)
  const { data: bySlug } = await supabase
    .from('games')
    .select('id')
    .eq('slug', gameIdentifier)
    .limit(1)
    .single();

  if (bySlug) return true;

  // Also check if it's a UUID (database id)
  const { data: byId } = await supabase
    .from('games')
    .select('id')
    .eq('id', gameIdentifier)
    .limit(1)
    .single();

  return !!byId;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Add Games from User Interactions');
  console.log('='.repeat(60));
  console.log();

  // Get all unique game_ids from user_interactions
  const { data: interactions, error: interactionsError } = await supabase
    .from('user_interactions')
    .select('game_id')
    .limit(10000); // Get all interactions

  if (interactionsError) {
    console.error('❌ Error fetching interactions:', interactionsError.message);
    process.exit(1);
  }

  if (!interactions || interactions.length === 0) {
    console.log('ℹ️  No interactions found in database.');
    return;
  }

  // Get unique game identifiers
  const uniqueGameIds = [...new Set(interactions.map(i => i.game_id))];
  console.log(`Found ${uniqueGameIds.length} unique games in user_interactions\n`);

  // Check which games already exist
  console.log('Checking which games already exist in database...');
  const gamesToFetch = [];
  
  for (const gameId of uniqueGameIds) {
    const exists = await gameExists(gameId);
    if (!exists) {
      gamesToFetch.push(gameId);
    }
  }

  console.log(`✓ ${uniqueGameIds.length - gamesToFetch.length} games already exist`);
  console.log(`✓ ${gamesToFetch.length} games need to be fetched\n`);

  if (gamesToFetch.length === 0) {
    console.log('✅ All games from interactions are already in the database!');
    return;
  }

  // Fetch and add games
  let added = 0;
  let failed = 0;

  console.log('Fetching games from RAWG API...\n');

  for (let i = 0; i < gamesToFetch.length; i++) {
    const gameIdentifier = gamesToFetch[i];
    console.log(`[${i + 1}/${gamesToFetch.length}] Fetching: ${gameIdentifier}...`);

    try {
      // Fetch from RAWG API (assume it's a slug)
      const rawgGame = await fetchGameBySlug(gameIdentifier);
      
      // Transform and insert
      const gameData = transformRAWGGame(rawgGame);

      // Check again if it exists (might have been added by another process)
      const exists = await gameExists(gameData.slug);
      if (exists) {
        console.log(`  ⚠️  Game already exists (by slug: ${gameData.slug}), skipping...`);
        continue;
      }

      // Insert game
      const { error: insertError } = await supabase
        .from('games')
        .insert(gameData);

      if (insertError) {
        console.error(`  ❌ Error inserting: ${insertError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Added: ${gameData.name}`);
        added++;
      }

      // Rate limiting - wait between requests
      await sleep(200);

    } catch (error) {
      if (error.message === 'Game not found') {
        console.log(`  ⚠️  Game not found in RAWG API (slug: ${gameIdentifier})`);
        failed++;
      } else {
        console.error(`  ❌ Error: ${error.message}`);
        failed++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Complete!');
  console.log('='.repeat(60));
  console.log(`Games added: ${added}`);
  console.log(`Games failed: ${failed}`);
  console.log(`Total games in interactions: ${uniqueGameIds.length}`);
  console.log(`\nNext step: Run 'npm run train:recommendations' to train the model`);
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };

