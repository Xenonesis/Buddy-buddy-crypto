import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          hash: string
          from_address: string
          to_address: string
          value: string
          gas_limit: string
          gas_price: string
          status: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hash: string
          from_address: string
          to_address: string
          value: string
          gas_limit: string
          gas_price: string
          status: string
          timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hash?: string
          from_address?: string
          to_address?: string
          value?: string
          gas_limit?: string
          gas_price?: string
          status?: string
          timestamp?: string
          created_at?: string
        }
      }
      recurring_payments: {
        Row: {
          id: string
          user_id: string
          recipient_address: string
          amount: string
          frequency: string
          next_payment_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipient_address: string
          amount: string
          frequency: string
          next_payment_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipient_address?: string
          amount?: string
          frequency?: string
          next_payment_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
  }
}