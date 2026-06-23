import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets } from '@/hooks/useTickets'
import { formatDate } from '@/lib/utils'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { Icon } from '../components/Icon'

type Tab = 'unused' | 'used'

export function FanTickets() {
  const { tickets, loading } = useTickets()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('unused')
  const [usedModal, setUsedModal] = useState(false)

  const unused = tickets.filter((t) => t.status === 'active')
  const used = tickets.filter((t) => t.status === 'used')
  const shown = tab === 'unused' ? unused : used

  return (
    <FanLayout>
      <FanTopbar
        title="特典券一覧"
        centered
        right={<button className="icon-btn" aria-label="カート"><Icon name="cart" size={20} /></button>}
      />

      <div className="content">
        <section className="section">
          <div className="segmented">
            <button className={`seg-btn${tab === 'unused' ? ' active' : ''}`} onClick={() => setTab('unused')}>未使用</button>
            <button className={`seg-btn${tab === 'used' ? ' active' : ''}`} onClick={() => setTab('used')}>使用済み</button>
          </div>

          <div className="inline-filters">
            <button className="secondary-chip active">すべて</button>
            <button className="secondary-chip"><Icon name="filter" size={14} /> 絞り込み</button>
          </div>

          <div className="list-headline">
            <div className="list-headline__title">{tab === 'unused' ? '未使用特典券' : '使用済み特典券'}</div>
            <div className="list-headline__count">{shown.length}枚</div>
          </div>

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
                  <div className="ticket-list-thumb"><Icon name="ticket" size={22} /></div>
                  <div className="row-main ticket-list-main">
                    <div className="row-title ticket-list-title">{ticket.ticket_type?.name}</div>
                    <div className="row-sub ticket-list-sub">{ticket.event?.title}</div>
                    <div className="row-sub ticket-list-meta">
                      {tab === 'unused' ? '有効期限' : '使用日'} {ticket.event?.date ? formatDate(ticket.event.date) : ''}
                    </div>
                  </div>
                  {tab === 'unused' ? (
                    <div className="row-right ticket-list-right">
                      <div className="qty-large">1枚</div>
                      <div className="caption">残数</div>
                    </div>
                  ) : (
                    <div className="status-chip soft-danger">使用済み</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
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
