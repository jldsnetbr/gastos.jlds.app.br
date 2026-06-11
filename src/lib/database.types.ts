export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string
        }
      }
      user_columns: {
        Row: {
          id: string
          user_id: string
          column_id: string
          name: string
          type: 'text' | 'number' | 'select' | 'date'
          options: Json | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          column_id: string
          name: string
          type: 'text' | 'number' | 'select' | 'date'
          options?: Json | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          column_id?: string
          name?: string
          type?: 'text' | 'number' | 'select' | 'date'
          options?: Json | null
          sort_order?: number
          created_at?: string
        }
      }
      month_registry: {
        Row: {
          id: string
          user_id: string
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
