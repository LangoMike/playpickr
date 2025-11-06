import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create a browser client that syncs sessions to cookies for SSR compatibility
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          rawg_id: number
          name: string
          slug: string
          description: string | null
          released: string | null
          background_image: string | null
          website: string | null
          rating: number | null
          rating_top: number | null
          metacritic: number | null
          playtime: number | null
          platforms: unknown | null
          genres: unknown | null
          tags: unknown | null
          developers: unknown | null
          publishers: unknown | null
          stores: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          rawg_id: number
          name: string
          slug: string
          description?: string | null
          released?: string | null
          background_image?: string | null
          website?: string | null
          rating?: number | null
          rating_top?: number | null
          metacritic?: number | null
          playtime?: number | null
          platforms?: unknown | null
          genres?: unknown | null
          tags?: unknown | null
          developers?: unknown | null
          publishers?: unknown | null
          stores?: unknown | null
        }
        Update: {
          id?: string
          rawg_id?: number
          name?: string
          slug?: string
          description?: string | null
          released?: string | null
          background_image?: string | null
          website?: string | null
          rating?: number | null
          rating_top?: number | null
          metacritic?: number | null
          playtime?: number | null
          platforms?: unknown | null
          genres?: unknown | null
          tags?: unknown | null
          developers?: unknown | null
          publishers?: unknown | null
          stores?: unknown | null
          created_at?: string
          updated_at?: string
        }
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          game_id: string
          action: Database['public']['Enums']['interaction_action']
          created_at: string
        }
        Insert: {
          user_id: string
          game_id: string
          action: Database['public']['Enums']['interaction_action']
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          action?: Database['public']['Enums']['interaction_action']
          created_at?: string
        }
      }
      similar_games: {
        Row: {
          id: string
          game_id: string
          similar_game_id: string
          similarity_score: number
          created_at: string
        }
        Insert: {
          game_id: string
          similar_game_id: string
          similarity_score: number
        }
        Update: {
          id?: string
          game_id?: string
          similar_game_id?: string
          similarity_score?: number
          created_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          user_id: string
          game_id: string
          score: number
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          game_id: string
          score: number
          reason?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          score?: number
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      interaction_action: 'like' | 'favorite' | 'played'
    }
  }
}

