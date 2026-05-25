import { openDB, type IDBPDatabase } from 'idb'
import type { OfflineScanEntry } from '@/types'

const DB_NAME = 'idol-saas-offline'
const DB_VERSION = 1

export interface OfflineDB {
  scan_queue: {
    key: string
    value: OfflineScanEntry
    indexes: { by_sync_status: string }
  }
}

let _db: IDBPDatabase<OfflineDB> | null = null

export async function getOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (_db) return _db

  _db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Scan queue — holds scans made while offline
      const scanStore = db.createObjectStore('scan_queue', { keyPath: 'id' })
      scanStore.createIndex('by_sync_status', 'sync_status')
    },
  })

  return _db
}

// ── Scan queue helpers ────────────────────────────────────────

export async function enqueueScan(entry: OfflineScanEntry): Promise<void> {
  const db = await getOfflineDB()
  await db.put('scan_queue', entry)
}

export async function getPendingScans(): Promise<OfflineScanEntry[]> {
  const db = await getOfflineDB()
  return db.getAllFromIndex('scan_queue', 'by_sync_status', 'pending')
}

export async function markScanSynced(id: string): Promise<void> {
  const db = await getOfflineDB()
  const entry = await db.get('scan_queue', id)
  if (entry) {
    await db.put('scan_queue', { ...entry, sync_status: 'synced' })
  }
}

export async function markScanConflict(id: string): Promise<void> {
  const db = await getOfflineDB()
  const entry = await db.get('scan_queue', id)
  if (entry) {
    await db.put('scan_queue', { ...entry, sync_status: 'conflict' })
  }
}

export async function clearSyncedScans(): Promise<void> {
  const db = await getOfflineDB()
  const synced = await db.getAllFromIndex('scan_queue', 'by_sync_status', 'synced')
  const tx = db.transaction('scan_queue', 'readwrite')
  await Promise.all(synced.map((e) => tx.store.delete(e.id)))
  await tx.done
}
