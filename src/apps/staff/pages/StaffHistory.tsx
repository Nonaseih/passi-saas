import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { supabase } from '@/lib/supabase'
import { getPendingScans } from '@/lib/offline/db'
import { formatDate } from '@/lib/utils'
import { QrCode, History, ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import type { OfflineScanEntry } from '@/types'

interface ScanLogEntry {
  id: string
  scanned_at: string
  offline_flag: boolean
  ticket: {
    ticket_type: { name: string }
    event: { title: string }
    user: { display_name: string }
  }
}

export function StaffHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isOnline, syncing, lastSyncResult } = useOnlineStatus()

  const [onlineLogs, setOnlineLogs] = useState<ScanLogEntry[]>([])
  const [offlineQueue, setOfflineQueue] = useState<OfflineScanEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchHistory() {
      setLoading(true)

      // Today's scan logs from server
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('scan_logs')
        .select(`
          id, scanned_at, offline_flag,
          ticket:tickets(
            ticket_type:ticket_types(name),
            event:events(title),
            user:users(display_name)
          )
        `)
        .eq('staff_id', user!.id)
        .gte('scanned_at', today.toISOString())
        .order('scanned_at', { ascending: false })

      setOnlineLogs((data ?? []) as unknown as ScanLogEntry[])

      // Pending offline scans
      const pending = await getPendingScans()
      setOfflineQueue(pending)

      setLoading(false)
    }

    fetchHistory()
  }, [user])

  const totalToday = onlineLogs.length + offlineQueue.length

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner isOnline={isOnline} syncing={syncing} lastSyncResult={lastSyncResult} />

      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/staff')} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold">本日のスキャン履歴</h1>
            <p className="text-xs text-muted-foreground">合計 {totalToday} 件</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : totalToday === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <History size={48} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">本日のスキャン履歴はありません</p>
          </div>
        ) : (
          <>
            {/* Pending offline queue */}
            {offlineQueue.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-yellow-600 mb-2 flex items-center gap-1">
                  <WifiOff size={12} />
                  同期待ち（{offlineQueue.length}件）
                </h2>
                <div className="space-y-2">
                  {offlineQueue.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Ticket ID: {entry.ticket_id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-yellow-600">
                            {formatDate(entry.scanned_at)}
                          </p>
                        </div>
                        <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full">
                          未同期
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Synced online logs */}
            {onlineLogs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Wifi size={12} />
                  同期済み（{onlineLogs.length}件）
                </h2>
                <div className="space-y-2">
                  {onlineLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border bg-card px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 space-y-0.5">
                          <p className="text-sm font-medium">
                            {log.ticket?.ticket_type?.name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.ticket?.user?.display_name} · {log.ticket?.event?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(log.scanned_at)}
                          </p>
                        </div>
                        {log.offline_flag && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                            オフライン
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background px-6 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/staff')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <QrCode size={20} />
            <span className="text-[10px]">スキャン</span>
          </button>
          <button
            onClick={() => navigate('/staff/history')}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <History size={20} />
            <span className="text-[10px]">履歴</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
