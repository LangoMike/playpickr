import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (we'll expand these as we build)
export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: number
          rawg_id: number
          slug: string
          name: string
          genres: string[]
          tags: string[]
          released: string | null
          rating: number | null
          metacritic: number | null
          background_image: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          rawg_id: number
          slug: string
          name: string
          genres?: string[]
          tags?: string[]
          released?: string | null
          rating?: number | null
          metacritic?: number | null
          background_image?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          rawg_id?: number
          slug?: string
          name?: string
          genres?: string[]
          tags?: string[]
          released?: string | null
          rating?: number | null
          metacritic?: number | null
          background_image?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          username: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          username?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          username?: string | null
          created_at?: string
        }
      }
      interactions: {
        Row: {
          id: number
          user_id: string
          game_id: number
          action: 'view' | 'like' | 'favorite' | 'dismiss' | 'rate' | 'played'
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          game_id: number
          action: 'view' | 'like' | 'favorite' | 'dismiss' | 'rate' | 'played'
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          game_id?: number
          action?: 'view' | 'like' | 'favorite' | 'dismiss' | 'rate' | 'played'
          rating?: number | null
          created_at?: string
        }
      }
    }
  }
}
