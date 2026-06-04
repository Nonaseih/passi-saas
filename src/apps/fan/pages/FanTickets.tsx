import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets } from '@/hooks/useTickets'
import { formatDate } from '@/lib/utils'
import { SlidersHorizontal, Ticket } from 'lucide-react'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

type Tab = 'unused' | 'used'

export function FanTickets() {
  const { tickets, loading } = useTickets()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('unused')

  const unused = tickets.filter((t) => t.status === 'active')
  const used = tickets.filter((t) => t.status === 'used')
  const shown = tab === 'unused' ? unused : used

  return (
    <FanLayout>
      <FanTopbar
        title="特典券"
        right={
          <button className="icon-btn" aria-label="絞り込み">
            <SlidersHorizontal size={16} />
          </button>
        }
      />

      {/* Segmented tabs */}
      <div style={{ padding: '0 18px 14px' }}>
        <div className="segmented">
          <button
            className={`seg-btn${tab === 'unused' ? ' active' : ''}`}
            onClick={() => setTab('unused')}
          >
            未使用{unused.length > 0 ? `（${unused.length}）` : ''}
          </button>
          <button
            className={`seg-btn${tab === 'used' ? ' active' : ''}`}
            onClick={() => setTab('used')}
          >
            使用済み
          </button>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 0 }}>
        {loading ? (
          <div className="list ticket-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="fan-skeleton" style={{ height: 80, borderRadius: 20 }} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState tab={tab} onGoHome={() => navigate('/home')} />
        ) : (
          <div className="list ticket-list">
            {shown.map((ticket) => (
              <button
                key={ticket.id}
                className="card row-card ticket-list-item"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                style={{ textAlign: 'left' }}
              >
                <div className="ticket-list-thumb">
                  <Ticket size={22} color="var(--primary-3)" />
                </div>
                <div className="ticket-list-main">
                  <div className="ticket-list-title">{ticket.ticket_type?.name}</div>
                  <div className="ticket-list-sub">{ticket.event?.title}</div>
                  <div className="ticket-list-meta">
                    {ticket.event?.date ? formatDate(ticket.event.date) : ''} · {ticket.event?.venue}
                  </div>
                </div>
                <div className="ticket-list-right">
                  <span
                    className={`status-chip ${
                      ticket.status === 'active' ? 'soft-success' : 'status-chip--used-soft'
                    }`}
                  >
                    {ticket.status === 'active' ? '未使用' : '使用済'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </FanLayout>
  )
}

function EmptyState({ tab, onGoHome }: { tab: Tab; onGoHome: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, opacity: .3 }}>🎫</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {tab === 'unused' ? '未使用の特典券はありません' : '使用済みの特典券はありません'}
        </div>
        {tab === 'unused' && (
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
            ホームからイベントの特典券を購入できます
          </div>
        )}
      </div>
      {tab === 'unused' && (
        <button className="primary-btn" style={{ width: 'auto', padding: '0 28px', height: 44, fontSize: 13 }} onClick={onGoHome}>
          イベントを見る
        </button>
      )}
    </div>
  )
}
