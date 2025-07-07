import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: number
          name: string
          party: string | null
          position: string
          votes: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          party?: string | null
          position: string
          votes?: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          party?: string | null
          position?: string
          votes?: number
          description?: string | null
          created_at?: string
        }
      }
    }
  }
} 