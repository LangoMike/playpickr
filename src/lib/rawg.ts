// RAWG API utility functions

export interface RAWGGame {
  id: number
  name: string
  slug: string
  description: string
  released: string
  background_image: string
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
}

export interface RAWGSearchResult {
  count: number
  next: string | null
  previous: string | null
  results: RAWGGame[]
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
): Promise<RAWSearchResult> {
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
): Promise<RAWSearchResult> {
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
