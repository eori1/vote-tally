import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const envInfo = process.env.VERCEL ? 'on Vercel' : 'locally'
  throw new Error(
    `Missing Supabase environment variables ${envInfo}. ` +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.'
  )
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