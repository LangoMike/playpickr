// RAWG API utility functions

export interface RAWGGame {
  id: number
  name: string
  slug: string
  description: string
  description_raw: string
  released: string
  background_image: string
  background_image_additional: string
  website: string
  rating: number
  rating_top: number
  metacritic: number
  playtime: number
  platforms: Array<{
    platform: {
      id: number
      name: string
      slug: string
    }
  }>
  genres: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  developers: Array<{
    id: number
    name: string
    slug: string
  }>
  publishers: Array<{
    id: number
    name: string
    slug: string
  }>
  stores: Array<{
    id: number
    store: {
      id: number
      name: string
      slug: string
    }
  }>
  short_screenshots?: Array<{
    id: number
    image: string
  }>
  movies?: Array<{
    id: number
    name: string
    preview: string
    data: {
      '480': string
      max: string
    }
  }>
}

export interface RAWGSearchResult {
  count: number
  next: string | null
  previous: string | null
  results: RAWGGame[]
}

export interface RAWGRandomGameResult {
  count: number
  next: string | null
  previous: string | null
  results: RAWGGame[]
}

export interface RAWGScreenshot {
  id: number
  image: string
  width: number
  height: number
  is_deleted: boolean
}

export interface RAWGScreenshotResult {
  count: number
  next: string | null
  previous: string | null
  results: RAWGScreenshot[]
}

export interface RAWGTrailer {
  id: number
  name: string
  preview: string
  data: {
    '480': string
    max: string
  }
}

export interface RAWGTrailerResult {
  count: number
  next: string | null
  previous: string | null
  results: RAWGTrailer[]
}
/**
 * Get RAWG API key from environment variables
 */
export function getRAWGApiKey(): string {
  const apiKey = process.env.RAWG_API_KEY
  if (!apiKey) {
    throw new Error('RAWG_API_KEY environment variable is not set')
  }
  return apiKey
}

/**
 * Fetch a single game by slug from RAWG API
 */
export async function fetchGameBySlug(slug: string): Promise<RAWGGame> {
  const apiKey = getRAWGApiKey()
  const response = await fetch(
    `https://api.rawg.io/api/games/${slug}?key=${apiKey}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Game not found')
    }
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Search games by query from RAWG API
 */
export async function searchGames(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<RAWGSearchResult> {
  const apiKey = getRAWGApiKey()
  const params = new URLSearchParams({
    key: apiKey,
    search: query,
    page: page.toString(),
    page_size: pageSize.toString(),
  })

  const response = await fetch(
    `https://api.rawg.io/api/games?${params}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get popular games from RAWG API
 */
export async function getPopularGames(
  page: number = 1,
  pageSize: number = 20
): Promise<RAWGSearchResult> {
  const apiKey = getRAWGApiKey()
  const params = new URLSearchParams({
    key: apiKey,
    ordering: '-rating',
    page: page.toString(),
    page_size: pageSize.toString(),
  })

  const response = await fetch(
    `https://api.rawg.io/api/games?${params}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get random games from RAWG API
 * Fetches games with ratings (non-null) from random pages and shuffles the results
 * Uses multiple fetch attempts to ensure we get enough games with ratings
 * @param page - Optional page number. If not provided, uses a random page (1-500)
 * @param pageSize - Number of games per page (default: 20)
 */
export async function getRandomGames(
  page?: number,
  pageSize: number = 20
): Promise<RAWGRandomGameResult> {
  const apiKey = getRAWGApiKey()
  
  // Fetch games from a random page 
  const randomPage = page ?? Math.floor(Math.random() * 500) + 1
  
  // Use orderings that prioritize games with ratings (rating first is best)
  const orderings = ['-rating', '-metacritic', '-released', '-added']
  const randomOrdering = orderings[Math.floor(Math.random() * orderings.length)]
  
  // Fetch significantly more games to account for filtering (4x to be safe)
  const fetchSize = Math.max(pageSize * 4, 80)
  
  // Helper function to fetch and filter games
  const fetchGamesWithRatings = async (
    pageNum: number,
    ordering: string,
    size: number
  ): Promise<RAWGGame[]> => {
    const params = new URLSearchParams({
      key: apiKey,
      ordering: ordering,
      page: pageNum.toString(),
      page_size: size.toString(),
    })

    const response = await fetch(
      `https://api.rawg.io/api/games?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
    }

    const data: RAWGRandomGameResult = await response.json()
    
    // Filter out games without ratings (null, undefined, or 0)
    return (data.results || []).filter(
      (game) => game.rating != null && game.rating > 0
    )
  }

  // Collect all games with ratings across multiple attempts
  let allFilteredGames: RAWGGame[] = []
  let currentPage = randomPage
  let attempts = 0
  const maxAttempts = 5 // Maximum number of pages to try
  
  // Try multiple pages until we have enough games or hit max attempts
  while (allFilteredGames.length < pageSize && attempts < maxAttempts) {
    try {
      const games = await fetchGamesWithRatings(currentPage, randomOrdering, fetchSize)
      allFilteredGames = [...allFilteredGames, ...games]
      
      // If we still don't have enough, try the next page
      if (allFilteredGames.length < pageSize) {
        currentPage = currentPage + 1
        attempts++
        // If we've gone too far, try a different random page
        if (currentPage > 320) {
          currentPage = Math.floor(Math.random() * 320) + 1
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch games from page ${currentPage}:`, error)
      // Try a different random page on error
      currentPage = Math.floor(Math.random() * 320) + 1
      attempts++
    }
  }
  
  // If we still don't have enough after multiple attempts, try a different ordering
  if (allFilteredGames.length < pageSize && attempts >= maxAttempts) {
    try {
      // Try with rating ordering specifically (most reliable for rated games)
      const fallbackPage = Math.floor(Math.random() * 100) + 1 // Use first 100 pages for better coverage
      const fallbackGames = await fetchGamesWithRatings(fallbackPage, '-rating', fetchSize)
      allFilteredGames = [...allFilteredGames, ...fallbackGames]
    } catch (error) {
      console.warn('Fallback fetch failed:', error)
    }
  }
  
  // Shuffle the filtered results for true randomness
  if (allFilteredGames.length > 0) {
    const shuffled = [...allFilteredGames]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    // Take only the requested pageSize
    allFilteredGames = shuffled.slice(0, pageSize)
  }

  // Get the first page data for metadata
  let firstPageData: RAWGRandomGameResult
  try {
    const params = new URLSearchParams({
      key: apiKey,
      ordering: randomOrdering,
      page: randomPage.toString(),
      page_size: '20',
    })
    const response = await fetch(
      `https://api.rawg.io/api/games?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )
    firstPageData = await response.json()
  } catch {
    // Fallback metadata if fetch fails
    firstPageData = {
      count: allFilteredGames.length,
      next: null,
      previous: null,
      results: [],
    }
  }

  // Return the filtered results
  return {
    ...firstPageData,
    results: allFilteredGames,
    count: allFilteredGames.length,
  }
}

/**
 * Get trending games from RAWG API (based on player counts and release date)
 */
export async function getTrendingGames(
  page: number = 1,
  pageSize: number = 20,
  ordering: string = '-added'
): Promise<RAWGSearchResult> {
  const apiKey = getRAWGApiKey()
  const params = new URLSearchParams({
    key: apiKey,
    ordering: ordering,
    page: page.toString(),
    page_size: pageSize.toString(),
  })

  const response = await fetch(
    `https://api.rawg.io/api/games?${params}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch game screenshots from RAWG API
 */
export async function fetchGameScreenshots(
  gameId: number
): Promise<RAWGScreenshotResult> {
  const apiKey = getRAWGApiKey()
  const response = await fetch(
    `https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch game trailers/movies from RAWG API
 */
export async function fetchGameTrailers(
  gameId: number
): Promise<RAWGTrailerResult> {
  const apiKey = getRAWGApiKey()
  const response = await fetch(
    `https://api.rawg.io/api/games/${gameId}/movies?key=${apiKey}`,
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`RAWG API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Transform RAWG game data to match database schema
 */
export function transformRAWGGame(rawgGame: RAWGGame) {
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
  }
}

