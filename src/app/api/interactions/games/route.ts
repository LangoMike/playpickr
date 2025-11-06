import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { fetchGameBySlug, transformRAWGGame } from '@/lib/rawg'
import { RAWGGame } from '@/lib/rawg'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    let responseToReturn: NextResponse | null = null
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            if (!responseToReturn) {
              responseToReturn = NextResponse.next()
            }
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              responseToReturn!.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
      return responseToReturn || errorResponse
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!action || !['like', 'favorite', 'played'].includes(action)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid action. Must be like, favorite, or played' },
        { status: 400 }
      )
      return responseToReturn || errorResponse
    }

    // Get all game slugs for this interaction type
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('game_id')
      .eq('user_id', user.id)
      .eq('action', action)

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
      const errorResponse = NextResponse.json(
        { success: false, error: 'Failed to fetch interactions' },
        { status: 500 }
      )
      return responseToReturn || errorResponse
    }

    if (!interactions || interactions.length === 0) {
      const successResponse = NextResponse.json({
        success: true,
        data: []
      })
      return responseToReturn || successResponse
    }

    // Fetch game data for each slug
    // First, try to get from database cache
    const gameSlugs = interactions.map(i => i.game_id)
    const { data: cachedGames, error: cacheError } = await supabase
      .from('games')
      .select('*')
      .in('slug', gameSlugs)

    const games: RAWGGame[] = []
    const foundSlugs = new Set<string>()

    // Add cached games
    if (cachedGames && !cacheError) {
      for (const cachedGame of cachedGames) {
        // Transform database format back to RAWG format for consistency
        const game: RAWGGame = {
          id: cachedGame.rawg_id,
          name: cachedGame.name,
          slug: cachedGame.slug,
          description: cachedGame.description || '',
          description_raw: cachedGame.description || '',
          released: cachedGame.released || '',
          background_image: cachedGame.background_image || '',
          background_image_additional: cachedGame.background_image || '',
          website: cachedGame.website || '',
          rating: cachedGame.rating ? parseFloat(cachedGame.rating.toString()) : 0,
          rating_top: cachedGame.rating_top || 0,
          metacritic: cachedGame.metacritic || 0,
          playtime: cachedGame.playtime || 0,
          platforms: (cachedGame.platforms as RAWGGame['platforms']) || [],
          genres: (cachedGame.genres as RAWGGame['genres']) || [],
          tags: (cachedGame.tags as RAWGGame['tags']) || [],
          developers: (cachedGame.developers as RAWGGame['developers']) || [],
          publishers: (cachedGame.publishers as RAWGGame['publishers']) || [],
          stores: (cachedGame.stores as RAWGGame['stores']) || []
        }
        games.push(game)
        foundSlugs.add(cachedGame.slug)
      }
    }

    // Fetch missing games from RAWG API
    const missingSlugs = gameSlugs.filter(slug => !foundSlugs.has(slug))
    const fetchPromises = missingSlugs.map(async (slug) => {
      try {
        const rawgGame = await fetchGameBySlug(slug)
        games.push(rawgGame)
        
        // Cache the game in database (use upsert to handle conflicts gracefully)
        const gameData = transformRAWGGame(rawgGame)
        const { error: upsertError } = await supabase
          .from('games')
          .upsert(gameData, { onConflict: 'slug', ignoreDuplicates: false })
        
        if (upsertError) {
          console.error(`Error caching game ${slug}:`, upsertError)
          // Continue even if caching fails
        }
      } catch (error) {
        console.error(`Error fetching game ${slug}:`, error)
        // Continue with other games even if one fails
      }
    })

    await Promise.all(fetchPromises)

    // Sort games by name for consistent ordering
    games.sort((a, b) => a.name.localeCompare(b.name))

    const successResponse = NextResponse.json({
      success: true,
      data: games
    })
    return responseToReturn || successResponse

  } catch (error) {
    console.error('Error in interactions games API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

