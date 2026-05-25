import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/hooks/useEvents'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { formatDate } from '@/lib/utils'
import { QrCode, History, LogOut, CalendarDays, MapPin, ChevronRight } from 'lucide-react'

export function StaffHome() {
  const { user, signOut } = useAuth()
  const { events, loading } = useEvents()
  const { isOnline, syncing, lastSyncResult } = useOnlineStatus()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/staff/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offline banner */}
      <OfflineBanner isOnline={isOnline} syncing={syncing} lastSyncResult={lastSyncResult} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary">PassI Staff</h1>
            <p className="text-xs text-muted-foreground">{user?.display_name}</p>
          </div>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-24">
        {/* Online status indicator */}
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
          isOnline
            ? 'bg-green-50 text-green-700'
            : 'bg-yellow-50 text-yellow-700'
        }`}>
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isOnline ? 'オンライン — リアルタイム同期中' : 'オフライン — ローカル保存モード'}
        </div>

        {/* Event list */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">担当イベント</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">担当イベントはありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate(`/staff/scan?event=${event.id}`)}
                  className="w-full rounded-xl border bg-card p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-sm">{event.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays size={11} />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={11} />
                        <span>{event.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <QrCode size={20} />
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background px-6 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/staff')}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <QrCode size={20} />
            <span className="text-[10px]">スキャン</span>
          </button>
          <button
            onClick={() => navigate('/staff/history')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <History size={20} />
            <span className="text-[10px]">履歴</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
