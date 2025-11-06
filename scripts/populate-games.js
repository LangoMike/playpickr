/**
 * Populate Games Database Script
 * 
 * Fetches games from RAWG API and stores them in Supabase database
 * 
 * Usage: node scripts/populate-games.js [count]
 * 
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawgApiKey = process.env.RAWG_API_KEY;

// Check for service role key first (required to bypass RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('');
  console.error('To fix this:');
  console.error('1. Go to Supabase Dashboard > Project Settings > API');
  console.error('2. Copy the "service_role" key (keep it secret!)');
  console.error('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.error('');
  console.error('The service role key is required to bypass RLS for admin scripts.');
  process.exit(1);
}

if (!rawgApiKey) {
  console.error('❌ Missing RAWG_API_KEY in .env.local');
  process.exit(1);
}

// Always use service role key for this script (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);
console.log('✓ Using service role key (bypasses RLS)\n');

// Configuration
const TARGET_COUNT = parseInt(process.argv[2]) || 3000;
const BATCH_SIZE = 40; // RAWG API max page size
const DELAY_BETWEEN_REQUESTS = 200; // ms - to respect rate limits

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
 * Fetch games from RAWG API
 */
async function fetchGamesFromRAWG(page = 1, pageSize = BATCH_SIZE) {
  const params = new URLSearchParams({
    key: rawgApiKey,
    page: page.toString(),
    page_size: pageSize.toString(),
    ordering: '-rating', // Get highly rated games first
  });

  const response = await fetch(
    `https://api.rawg.io/api/games?${params}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if game already exists in database
 */
async function gameExists(rawgId) {
  const { data, error } = await supabase
    .from('games')
    .select('id')
    .eq('rawg_id', rawgId)
    .limit(1)
    .single();

  return !error && data !== null;
}

/**
 * Insert games into database (batch insert)
 */
async function insertGames(games) {
  // Filter out games that already exist
  const gamesToInsert = [];
  
  for (const game of games) {
    const exists = await gameExists(game.rawg_id);
    if (!exists) {
      gamesToInsert.push(game);
    }
  }

  if (gamesToInsert.length === 0) {
    return { inserted: 0, skipped: games.length };
  }

  // Insert in batches (Supabase has limits)
  const insertBatchSize = 50;
  let inserted = 0;
  let skipped = games.length - gamesToInsert.length;

  for (let i = 0; i < gamesToInsert.length; i += insertBatchSize) {
    const batch = gamesToInsert.slice(i, i + insertBatchSize);
    
    const { error } = await supabase
      .from('games')
      .insert(batch, { onConflict: 'rawg_id' });

    if (error) {
      console.error(`  ⚠️  Error inserting batch: ${error.message}`);
      console.error(`  Error code: ${error.code}, Details: ${error.details || 'N/A'}`);
      if (error.message.includes('row-level security')) {
        console.error('  ❌ RLS error detected! Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly.');
        console.error('  The service role key should bypass RLS. Check your .env.local file.');
      }
      // Continue with next batch
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, skipped };
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
  console.log('PlayPickr Game Database Population');
  console.log('='.repeat(60));
  console.log(`Target: ${TARGET_COUNT} games\n`);

  // Check current count
  const { count: currentCount } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true });

  console.log(`Current games in database: ${currentCount || 0}`);
  console.log(`Games to fetch: ${TARGET_COUNT - (currentCount || 0)}\n`);

  if (currentCount >= TARGET_COUNT) {
    console.log('✅ Already have enough games!');
    return;
  }

  let totalInserted = 0;
  let totalSkipped = 0;
  let page = 1;
  let hasMore = true;

  console.log('Starting to fetch games from RAWG API...\n');

  while (hasMore && totalInserted + (currentCount || 0) < TARGET_COUNT) {
    try {
      // Fetch games from RAWG
      console.log(`Fetching page ${page} (${BATCH_SIZE} games)...`);
      const rawgData = await fetchGamesFromRAWG(page, BATCH_SIZE);

      if (!rawgData.results || rawgData.results.length === 0) {
        console.log('  ℹ️  No more games available');
        hasMore = false;
        break;
      }

      // Filter games that have genres
      const gamesWithGenres = rawgData.results.filter(
        game => game.genres && game.genres.length > 0 
      );

      if (gamesWithGenres.length === 0) {
        console.log('  ⚠️  No games with genres and tags on this page, skipping...');
        page++;
        await sleep(DELAY_BETWEEN_REQUESTS);
        continue;
      }

      // Transform games
      const transformedGames = gamesWithGenres.map(transformRAWGGame);

      // Insert into database
      const { inserted, skipped } = await insertGames(transformedGames);
      totalInserted += inserted;
      totalSkipped += skipped;

      console.log(`  ✅ Inserted: ${inserted}, Skipped: ${skipped}, Total: ${totalInserted + (currentCount || 0)}`);

      // Check if we've reached our target
      if (totalInserted + (currentCount || 0) >= TARGET_COUNT) {
        console.log('\n✅ Reached target count!');
        break;
      }

      // Check if there are more pages
      if (!rawgData.next) {
        console.log('\nℹ️  No more pages available from RAWG API');
        hasMore = false;
        break;
      }

      page++;
      
      // Rate limiting - wait between requests
      await sleep(DELAY_BETWEEN_REQUESTS);

    } catch (error) {
      console.error(`❌ Error on page ${page}:`, error.message);
      
      // If rate limited, wait longer
      if (error.message.includes('429') || error.message.includes('rate')) {
        console.log('  ⏳ Rate limited, waiting 5 seconds...');
        await sleep(5000);
      } else {
        // For other errors, wait a bit and continue
        await sleep(1000);
        page++;
      }
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Population Complete!');
  console.log('='.repeat(60));
  console.log(`Total games in database: ${finalCount || 0}`);
  console.log(`Games inserted this run: ${totalInserted}`);
  console.log(`Games skipped (already existed): ${totalSkipped}`);
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

