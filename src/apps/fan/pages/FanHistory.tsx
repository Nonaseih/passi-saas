import { useNavigate } from 'react-router-dom'
import { usePayments } from '@/hooks/usePayments'
import { formatDate, formatPrice } from '@/lib/utils'
import type { PaymentStatus } from '@/types'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

const STATUS_LABEL: Record<PaymentStatus, { label: string; chip: string }> = {
  paid:     { label: '決済完了', chip: 'soft-success' },
  pending:  { label: '処理中',   chip: 'status-chip--subtle' },
  failed:   { label: '決済失敗', chip: 'soft-danger' },
  refunded: { label: '返金済み', chip: 'status-chip--used-soft' },
}

export function FanHistory() {
  const { payments, loading } = usePayments()
  const navigate = useNavigate()

  return (
    <FanLayout>
      <FanTopbar title="購入履歴" />

      <div className="content">
        {loading ? (
          <div className="history-list">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="fan-skeleton" style={{ height: 64, borderRadius: 16 }} />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyHistory onGoHome={() => navigate('/home')} />
        ) : (
          <div className="history-list">
            {payments.map((payment) => {
              const status = STATUS_LABEL[payment.status]
              return (
                <div key={payment.id} className="history-row">
                  <div className="history-row__date">
                    {formatDate(payment.created_at).slice(0, 10)}
                  </div>
                  <div className="history-row__label">
                    {payment.ticket_type?.name ?? '特典券'}
                    {payment.quantity > 1 && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>
                        ×{payment.quantity}
                      </span>
                    )}
                  </div>
                  <div className="history-row__amount" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 13 }}>{formatPrice(payment.amount)}</span>
                    <span className={`status-chip ${status.chip}`}>{status.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="info-block" style={{ marginTop: 24 }}>
          購入履歴はStripe経由の決済完了後に反映されます。返金・キャンセルはお問い合わせください。
        </div>
      </div>
    </FanLayout>
  )
}

function EmptyHistory({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 56, textAlign: 'center' }}>
      <div style={{ fontSize: 48, opacity: .3 }}>🧾</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>購入履歴がありません</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
          チケットを購入すると履歴が表示されます
        </div>
      </div>
      <button
        className="primary-btn"
        style={{ width: 'auto', padding: '0 28px', height: 44, fontSize: 13 }}
        onClick={onGoHome}
      >
        イベントを見る
      </button>
    </div>
  )
}
