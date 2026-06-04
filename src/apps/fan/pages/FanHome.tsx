import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEvents } from '@/hooks/useEvents'
import { formatDate, formatPrice } from '@/lib/utils'
import { Bell, Search, CalendarDays, MapPin } from 'lucide-react'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

export function FanHome() {
  const { user } = useAuth()
  const { events, loading } = useEvents()
  const navigate = useNavigate()

  return (
    <FanLayout>
      <FanTopbar
        title="PASSI"
        right={
          <button className="icon-btn" aria-label="通知">
            <Bell size={18} />
          </button>
        }
      />

      <div className="content content--home">
        {/* Search bar */}
        <div className="search-input card">
          <Search size={16} color="var(--text-3)" />
          <input type="text" placeholder="イベント・グループを検索" readOnly style={{ cursor: 'default' }} />
        </div>

        {/* Greeting */}
        {user?.display_name && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
            こんにちは、<span style={{ color: 'var(--primary)', fontWeight: 700 }}>{user.display_name}</span> さん
          </div>
        )}

        {/* Events section */}
        <div className="section">
          <div className="section-head">
            <div className="section-title">
              <CalendarDays size={16} />
              開催中・近日イベント
            </div>
          </div>

          {loading ? (
            <div className="quick-stack">
              {[0, 1, 2].map((i) => (
                <div key={i} className="fan-skeleton" style={{ height: 74, borderRadius: 18 }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="card info-card" style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
              現在開催中のイベントはありません
            </div>
          ) : (
            <div className="quick-stack">
              {events.map((event) => (
                <div key={event.id} className="card quick-card--wide" style={{ pointerEvents: 'auto', cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: '12px 14px' }}>
                  {/* Event header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="quick-card__group">{event.title}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, color: 'var(--text-3)' }}>
                          <CalendarDays size={10} />{formatDate(event.date)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, color: 'var(--text-3)' }}>
                          <MapPin size={10} />{event.venue}
                        </span>
                      </div>
                    </div>
                    <span className={`status-chip ${event.status === 'ongoing' ? 'soft-success' : 'status-chip--subtle'}`}>
                      {event.status === 'ongoing' ? '開催中' : '近日開催'}
                    </span>
                  </div>

                  {/* Ticket types */}
                  {event.ticket_types.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {event.ticket_types.map((tt) => (
                        <div
                          key={tt.id}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)' }}>{tt.name}</span>
                            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>
                              {formatPrice(tt.price)}
                            </span>
                          </div>
                          <button
                            className="quick-card__buy-btn"
                            onClick={() => navigate(`/purchase/${tt.id}`)}
                            disabled={tt.stock_remaining === 0}
                          >
                            {tt.stock_remaining === 0 ? '売切れ' : '購入する'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="section">
          <div className="section-head">
            <div className="section-title">クイックアクセス</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              className="card"
              onClick={() => navigate('/tickets')}
              style={{ padding: '16px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5f1ff 0%, #ede8ff 100%)' }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>🎫</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>特典券を見る</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>未使用・使用済み</div>
            </button>
            <button
              className="card"
              onClick={() => navigate('/history')}
              style={{ padding: '16px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #fff5fe 0%, #ffe8f9 100%)' }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>🧾</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>購入履歴</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>過去の購入を確認</div>
            </button>
          </div>
        </div>
      </div>
    </FanLayout>
  )
}
