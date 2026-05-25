export * from './database.types'

// ── App-level types ───────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  role: import('./database.types').UserRole
  display_name: string
  avatar_url?: string
}

export interface AppError {
  message: string
  code?: string
}

// ── Offline sync types ────────────────────────────────────────

export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'error'

export interface OfflineScanEntry {
  id: string                  // local UUID
  ticket_id: string
  staff_id: string
  scanned_at: string          // ISO timestamp
  device_id: string
  sync_status: SyncStatus
  created_locally_at: string
}

export interface SyncResult {
  synced: number
  conflicts: number
  errors: number
}

// ── QR types ─────────────────────────────────────────────────

export interface QRPayload {
  ticket_id: string
  qr_token: string
  event_id: string
  issued_at: string
}
