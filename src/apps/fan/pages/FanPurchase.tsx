import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { CalendarDays, MapPin, Minus, Plus } from 'lucide-react'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

interface TicketTypeInfo {
  id: string
  name: string
  price: number
  stock_remaining: number
  description: string | null
  event: { id: string; title: string; date: string; venue: string } | null
}

export function FanPurchase() {
  const { ticketTypeId } = useParams<{ ticketTypeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticketType, setTicketType] = useState<TicketTypeInfo | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ticketTypeId) return
    ;(supabase.from('ticket_types') as ReturnType<typeof supabase.from>)
      .select('*, event:events(id, title, date, venue)')
      .eq('id', ticketTypeId)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data) {
          setTicketType({
            id: data.id,
            name: data.name,
            price: data.price,
            stock_remaining: data.stock_remaining,
            description: data.description,
            event: data.event ?? null,
          })
        }
        setLoading(false)
      })
  }, [ticketTypeId])

  async function handleCheckout() {
    if (!user || !ticketType) return
    setChecking(true)
    setError('')
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          ticket_type_id: ticketType.id,
          event_id: ticketType.event?.id,
          quantity,
          user_id: user.id,
        },
      })
      if (error) {
        // supabase-js's FunctionsHttpError.message is always the generic
        // "Edge Function returned a non-2xx status code" — the real reason
        // is JSON in the response body, reachable via error.context.
        let message = error.message
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json()
            if (body?.error) message = body.error
          } catch {
            // response body wasn't JSON — fall back to generic message
          }
        }
        throw new Error(message)
      }
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました')
      setChecking(false)
    }
  }

  const total = (ticketType?.price ?? 0) * quantity
  const maxQty = ticketType?.stock_remaining ?? 1

  if (loading) {
    return (
      <FanLayout>
        <FanTopbar title="特典券の購入" centered onBack={() => navigate(-1)} />
        <div className="content">
          <div className="fan-skeleton" style={{ height: 120, borderRadius: 22, marginTop: 8 }} />
          <div className="fan-skeleton" style={{ height: 80, borderRadius: 22, marginTop: 12 }} />
        </div>
      </FanLayout>
    )
  }

  if (!ticketType) {
    return (
      <FanLayout>
        <FanTopbar title="特典券の購入" centered onBack={() => navigate(-1)} />
        <div className="content">
          <div className="card info-card" style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-2)' }}>
            チケット情報が見つかりません
          </div>
        </div>
      </FanLayout>
    )
  }

  return (
    <FanLayout hideNav>
      <FanTopbar title="特典券の購入" centered onBack={() => navigate(-1)} />

      <div className="content" style={{ paddingBottom: 120 }}>
        {/* Event info card */}
        {ticketType.event && (
          <div className="card purchase-hero-card">
            <div className="group-name">{ticketType.event.title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
                <CalendarDays size={12} />{formatDate(ticketType.event.date)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
                <MapPin size={12} />{ticketType.event.venue}
              </span>
            </div>
          </div>
        )}

        {/* Ticket type info */}
        <div className="section">
          <div className="section-title section-title--purchase">購入する特典券</div>
          <div className="card option-card option-card--ticket" style={{ marginTop: 12 }}>
            <div className="option-left">
              <div>
                <div className="row-title" style={{ fontSize: 14, fontWeight: 700 }}>{ticketType.name}</div>
                {ticketType.description && (
                  <div className="row-sub" style={{ marginTop: 4 }}>{ticketType.description}</div>
                )}
                <div className="option-price-line" style={{ marginTop: 6, color: 'var(--primary)' }}>
                  {formatPrice(ticketType.price)} / 枚
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>
                  残り{ticketType.stock_remaining}枚
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantity stepper */}
        <div className="section">
          <div className="section-title section-title--purchase">枚数を選択</div>
          <div className="panel" style={{ marginTop: 12 }}>
            <div className="stepper">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{ opacity: quantity <= 1 ? .4 : 1 }}
              >
                <Minus size={18} />
              </button>
              <div className="stepper__value">
                {quantity}
                <span className="stepper__unit">枚</span>
              </div>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty}
                style={{ opacity: quantity >= maxQty ? .4 : 1 }}
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="helper-center">1回の購入につき最大{maxQty}枚まで</div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 14, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="info-block">
          決済はStripeのセキュアな環境で処理されます。購入後はマイチケット画面で確認できます。
        </div>
      </div>

      {/* Sticky checkout bar */}
      <div className="purchase-summary">
        <div className="summary-row-line">
          <div>
            <div className="label">枚数</div>
            <div className="value">{quantity}枚</div>
          </div>
          <div>
            <div className="label">合計</div>
            <div className="value">{formatPrice(total)}</div>
          </div>
        </div>
        <button
          className="primary-btn"
          style={{ width: '100%', height: 50, fontSize: 15, marginTop: 12 }}
          onClick={handleCheckout}
          disabled={checking || ticketType.stock_remaining === 0}
        >
          {checking ? '処理中...' : 'Stripeで決済する'}
        </button>
      </div>
    </FanLayout>
  )
}
