import { useEffect, useState } from 'react'
import { syncOfflineScans } from '@/lib/offline/sync'
import type { SyncResult } from '@/types'

export function useOnlineStatus(onSync?: (result: SyncResult) => void) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      // Auto-sync when connection restored
      setSyncing(true)
      syncOfflineScans()
        .then((result) => {
          setLastSyncResult(result)
          onSync?.(result)
        })
        .finally(() => setSyncing(false))
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onSync])

  return { isOnline, syncing, lastSyncResult }
}
