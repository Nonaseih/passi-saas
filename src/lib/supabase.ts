import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env.local file.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Typed table helpers
export const db = {
  users: () => supabase.from('users'),
  events: () => supabase.from('events'),
  ticketTypes: () => supabase.from('ticket_types'),
  tickets: () => supabase.from('tickets'),
  payments: () => supabase.from('payments'),
  scanLogs: () => supabase.from('scan_logs'),
}
