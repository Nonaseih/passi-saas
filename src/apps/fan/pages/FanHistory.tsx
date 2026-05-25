import { useNavigate } from 'react-router-dom'
import { usePayments } from '@/hooks/usePayments'
import { formatDate, formatPrice } from '@/lib/utils'
import { CalendarDays, Ticket, History, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { PaymentStatus } from '@/types'

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  paid: { label: '決済完了', icon: CheckCircle, className: 'text-green-600' },
  pending: { label: '処理中', icon: Clock, className: 'text-yellow-600' },
  failed: { label: '決済失敗', icon: XCircle, className: 'text-red-500' },
  refunded: { label: '返金済み', icon: XCircle, className: 'text-gray-500' },
}

export function FanHistory() {
  const { payments, loading } = usePayments()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <h1 className="text-lg font-bold text-primary">購入履歴</h1>
      </header>

      <main className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <History size={48} className="text-muted-foreground/30" />
            <div>
              <p className="font-medium">購入履歴がありません</p>
              <p className="text-sm text-muted-foreground mt-1">チケットを購入すると履歴が表示されます</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
            >
              イベントを見る
            </button>
          </div>
        ) : (
          payments.map((payment) => {
            const status = statusConfig[payment.status]
            const StatusIcon = status.icon
            return (
              <div key={payment.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-sm">{payment.ticket_type?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.quantity}枚 × {formatPrice(payment.ticket_type?.price ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold text-sm">{formatPrice(payment.amount)}</p>
                    <div className={`flex items-center gap-1 text-xs ${status.className}`}>
                      <StatusIcon size={12} />
                      <span>{status.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

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
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <Ticket size={20} />
            <span className="text-[10px]">チケット</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <History size={20} />
            <span className="text-[10px]">購入履歴</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
