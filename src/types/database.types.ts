// ============================================================
// Database Types — mirrors Supabase PostgreSQL schema
// ============================================================

export type UserRole = 'fan' | 'staff' | 'admin'

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'

export type TicketStatus = 'pending' | 'active' | 'used' | 'expired' | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// ── users ────────────────────────────────────────────────────
export interface User {
  id: string
  role: UserRole
  display_name: string
  email: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ── events ───────────────────────────────────────────────────
export interface Event {
  id: string
  title: string
  description?: string
  date: string
  venue: string
  status: EventStatus
  created_by: string
  created_at: string
  updated_at: string
}

// ── ticket_types ─────────────────────────────────────────────
export interface TicketType {
  id: string
  event_id: string
  name: string
  description?: string
  price: number           // stored in JPY (integer)
  stock: number
  stock_remaining: number
  valid_from?: string
  valid_until?: string
  created_at: string
  updated_at: string
}

// ── tickets ──────────────────────────────────────────────────
export interface Ticket {
  id: string
  user_id: string
  ticket_type_id: string
  event_id: string
  status: TicketStatus
  qr_token: string        // UUID v4 — unique per ticket
  purchased_at: string
  used_at?: string
  used_by?: string        // staff user id
  expires_at?: string
  created_at: string
  updated_at: string
  // joined fields
  ticket_type?: TicketType
  event?: Event
}

// ── payments ─────────────────────────────────────────────────
export interface Payment {
  id: string
  user_id: string
  ticket_type_id: string
  stripe_session_id: string
  stripe_payment_intent_id?: string
  amount: number          // JPY
  quantity: number
  status: PaymentStatus
  paid_at?: string
  created_at: string
  updated_at: string
}

// ── scan_logs ────────────────────────────────────────────────
export interface ScanLog {
  id: string
  ticket_id: string
  staff_id: string
  scanned_at: string
  device_id: string
  offline_flag: boolean
  synced_at?: string
  created_at: string
}

// ── Supabase DB shape (for typed client) ─────────────────────
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      ticket_types: {
        Row: TicketType
        Insert: Omit<TicketType, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TicketType, 'id' | 'created_at'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Ticket, 'id' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      scan_logs: {
        Row: ScanLog
        Insert: Omit<ScanLog, 'id' | 'created_at'>
        Update: Partial<Omit<ScanLog, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      event_status: EventStatus
      ticket_status: TicketStatus
      payment_status: PaymentStatus
    }
  }
}
