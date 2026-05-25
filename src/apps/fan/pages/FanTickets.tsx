import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets, type TicketWithDetails } from '@/hooks/useTickets'
import { QRModal } from '@/components/shared/QRModal'
import { CalendarDays, MapPin, Ticket, History } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function FanTickets() {
  const { tickets, loading } = useTickets()
  const [selected, setSelected] = useState<TicketWithDetails | null>(null)
  const navigate = useNavigate()

  const activeTickets = tickets.filter((t) => t.status === 'active')
  const usedTickets = tickets.filter((t) => t.status === 'used')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <h1 className="text-lg font-bold text-primary">マイチケット</h1>
      </header>

      <main className="p-4 space-y-6 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Ticket size={48} className="text-muted-foreground/30" />
            <div>
              <p className="font-medium">チケットがありません</p>
              <p className="text-sm text-muted-foreground mt-1">イベント画面から購入できます</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
            >
              イベントを見る
            </button>
          </div>
        ) : (
          <>
            {/* Active tickets */}
            {activeTickets.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                  有効なチケット（{activeTickets.length}枚）
                </h2>
                <div className="space-y-3">
                  {activeTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onTap={() => setSelected(ticket)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Used tickets */}
            {usedTickets.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                  使用済み（{usedTickets.length}枚）
                </h2>
                <div className="space-y-3 opacity-60">
                  {usedTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onTap={() => setSelected(ticket)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* QR Modal */}
      {selected && (
        <QRModal ticket={selected} onClose={() => setSelected(null)} />
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background px-6 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <CalendarDays size={20} />
            <span className="text-[10px]">イベント</span>
          </button>
          <button
            onClick={() => navigate('/tickets')}
            className="flex flex-col items-center gap-1 text-primary"
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

function TicketCard({
  ticket,
  onTap,
}: {
  ticket: TicketWithDetails
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      className="w-full rounded-xl border bg-card p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-sm">{ticket.ticket_type?.name}</p>
          <p className="text-xs text-muted-foreground">{ticket.event?.title}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays size={10} />
            <span>{ticket.event?.date ? formatDate(ticket.event.date) : '—'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} />
            <span>{ticket.event?.venue}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            ticket.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {ticket.status === 'active' ? '有効' : '使用済み'}
          </span>
          {ticket.status === 'active' && (
            <span className="text-[10px] text-primary font-medium">タップでQR表示</span>
          )}
        </div>
      </div>
    </button>
  )
}
