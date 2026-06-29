/**
 * Hand-written to match supabase/migrations/20260627234219_init_schema.sql
 * exactly, in the same shape `supabase gen types typescript` produces.
 *
 * This is a stand-in for the generated file: once the migration is applied
 * to a real Supabase project, regenerate this from the live schema —
 * `supabase gen types typescript --linked > src/types/database.ts` — and it
 * should slot in as a drop-in replacement (same `Database` interface shape)
 * with no other code changes. See docs/09-api-design.md.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      decks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          language: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          description?: string | null
          language: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          language?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          deck_id: string
          user_id: string
          front: string
          back: string
          pronunciation: string | null
          notes: string | null
          example_sentence: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          user_id?: string
          front: string
          back: string
          pronunciation?: string | null
          notes?: string | null
          example_sentence?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          user_id?: string
          front?: string
          back?: string
          pronunciation?: string | null
          notes?: string | null
          example_sentence?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_study_state: {
        Row: {
          card_id: string
          user_id: string
          weight: number
          times_seen: number
          times_again: number
          times_good: number
          times_easy: number
          last_studied_at: string | null
        }
        Insert: {
          card_id: string
          user_id?: string
          weight?: number
          times_seen?: number
          times_again?: number
          times_good?: number
          times_easy?: number
          last_studied_at?: string | null
        }
        Update: {
          card_id?: string
          user_id?: string
          weight?: number
          times_seen?: number
          times_again?: number
          times_good?: number
          times_easy?: number
          last_studied_at?: string | null
        }
        Relationships: []
      }
    }
    // Required by supabase-js's GenericSchema constraint even when empty —
    // omitting these (rather than leaving them {}) breaks generic inference
    // on .insert()/.update(), surfacing as argument types resolving to `never`.
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
