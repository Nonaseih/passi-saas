import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/hooks/useEvents'
import { formatDate, formatPrice } from '@/lib/utils'
import { CalendarDays, MapPin, Ticket, History, LogOut } from 'lucide-react'

export function FanHome() {
  const { user, signOut } = useAuth()
  const { events, loading } = useEvents()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">PassI</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.display_name}</span>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-24">
        <div>
          <h2 className="text-base font-semibold mb-3">開催中・近日イベント</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">現在開催中のイベントはありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border bg-card p-4 space-y-3 shadow-sm"
                >
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays size={12} />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} />
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  {/* Ticket types */}
                  {event.ticket_types.length > 0 && (
                    <div className="space-y-2">
                      {event.ticket_types.map((tt) => (
                        <button
                          key={tt.id}
                          onClick={() => navigate(`/purchase/${tt.id}`)}
                          disabled={tt.stock_remaining === 0}
                          className="w-full flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="font-medium text-primary">{tt.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              残り{tt.stock_remaining}枚
                            </span>
                            <span className="font-bold text-primary">
                              {formatPrice(tt.price)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background px-6 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <CalendarDays size={20} />
            <span className="text-[10px]">イベント</span>
          </button>
          <button
            onClick={() => navigate('/tickets')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <Ticket size={20} />
            <span className="text-[10px]">チケット</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <History size={20} />
            <span className="text-[10px]">購入履歴</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
