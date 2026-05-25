import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEvent } from '@/hooks/useEvents'
import { formatDate, formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, CalendarDays, MapPin, ShoppingCart } from 'lucide-react'

export function FanPurchase() {
  const { ticketTypeId } = useParams<{ ticketTypeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Find the event that contains this ticket type
  const [eventId, setEventId] = useState<string | null>(null)
  const [ticketType, setTicketType] = useState<{
    id: string; name: string; price: number; stock_remaining: number; description: string | null
  } | null>(null)

  // Fetch ticket type info
  useEffect(() => {
    if (!ticketTypeId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase.from('ticket_types') as any)
      .select('*, events(id, title, date, venue)')
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
          })
          setEventId(data.events?.id ?? null)
        }
      })
  }, [ticketTypeId])

  const { event } = useEvent(eventId ?? '')

  async function handleCheckout() {
    if (!user || !ticketType || !eventId) return
    setLoading(true)
    setError('')

    try {
      // Call Edge Function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          ticket_type_id: ticketType.id,
          event_id: eventId,
          quantity,
          user_id: user.id,
        },
      })

      if (error) throw new Error(error.message)
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済の開始に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!ticketType) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const total = ticketType.price * quantity

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold">チケット購入</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-32">
        {/* Event info */}
        {event && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h2 className="font-bold">{event.title}</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays size={12} />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} />
              <span>{event.venue}</span>
            </div>
          </div>
        )}

        {/* Ticket type */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold">{ticketType.name}</h3>
          {ticketType.description && (
            <p className="text-sm text-muted-foreground">{ticketType.description}</p>
          )}
          <p className="text-lg font-bold text-primary">{formatPrice(ticketType.price)} / 枚</p>
          <p className="text-xs text-muted-foreground">残り{ticketType.stock_remaining}枚</p>
        </div>

        {/* Quantity */}
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-3">枚数を選択</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 rounded-full border text-xl font-bold hover:bg-muted"
            >
              −
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(ticketType.stock_remaining, quantity + 1))}
              className="h-10 w-10 rounded-full border text-xl font-bold hover:bg-muted"
            >
              ＋
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </main>

      {/* Checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">合計</span>
          <span className="font-bold text-lg">{formatPrice(total)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading || ticketType.stock_remaining === 0}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          <ShoppingCart size={16} />
          {loading ? '処理中...' : 'Stripeで決済する'}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          決済はStripeのセキュアな環境で処理されます
        </p>
      </div>
    </div>
  )
}
