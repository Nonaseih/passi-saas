import { useState, useEffect } from 'react'
import { ShoppingBag, Tag, Plus, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #c0a6ff 0%, #f199d5 100%)',
  'linear-gradient(135deg, #9c7cf2 0%, #c8b2ff 100%)',
  'linear-gradient(135deg, #f199d5 0%, #ffbad0 100%)',
  'linear-gradient(135deg, #857fff 0%, #b0a8ff 100%)',
  'linear-gradient(135deg, #77c792 0%, #a8e6c0 100%)',
  'linear-gradient(135deg, #f08aa0 0%, #ffb9c8 100%)',
]

interface TicketCard {
  id: string
  name: string
  price: number
  points: number | null
  stock: number
  stock_remaining: number
  event_id: string
  event_title: string
  event_date: string
  event_status: string
}

export function AdminTickets() {
  const [tickets, setTickets] = useState<TicketCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'soldout'>('all')
  const navigate = useNavigate()

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('ticket_types')
      .select('id, name, price, points, stock, stock_remaining, event_id, events!inner(title, date, status)')
      .order('created_at', { ascending: false })
    const rows: TicketCard[] = (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      points: r.points,
      stock: r.stock,
      stock_remaining: r.stock_remaining,
      event_id: r.event_id,
      event_title: r.events?.title ?? '',
      event_date: r.events?.date ?? '',
      event_status: r.events?.status ?? '',
    }))
    setTickets(rows)
    setLoading(false)
  }

  const filtered = tickets.filter(t => {
    if (filter === 'available') return t.stock_remaining > 0
    if (filter === 'soldout')   return t.stock_remaining === 0
    return true
  })

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all',       label: 'すべて' },
    { key: 'available', label: '販売中' },
    { key: 'soldout',   label: '完売' },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f0ebff,#e8e2ff)', border: '1px solid #ebe8f6' }}>
            <ShoppingBag className="w-5 h-5" style={{ color: '#9c7cf2' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#221d4e' }}>商品管理</h1>
            <p className="text-sm" style={{ color: '#9892b3' }}>全イベントのチケット券種一覧</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg,#c0a6ff,#9c7cf2)', color: '#fff', boxShadow: '0 4px 16px rgba(156,124,242,.3)' }}>
          <Plus className="w-4 h-4" />
          券種を追加する
        </button>
      </div>

      {/* フィルター */}
      <div className="flex items-center gap-2">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
            style={filter === f.key
              ? { background: 'linear-gradient(135deg,#c0a6ff,#a99fff)', color: '#fff', border: '1px solid transparent', boxShadow: '0 4px 12px rgba(192,160,255,.22)' }
              : { background: '#fff', color: '#9892b3', border: '1px solid #ebe8f6' }}>
            {f.label}
            {f.key === 'all' && <span className="ml-1.5 text-xs opacity-70">{tickets.length}</span>}
          </button>
        ))}
      </div>

      {/* カードグリッド */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="animate-pulse rounded-[22px]" style={{ ...CARD, height: 200 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-[22px]" style={CARD}>
          <div className="text-5xl mb-4">🎟️</div>
          <div className="font-bold text-lg mb-1" style={{ color: '#221d4e' }}>券種がありません</div>
          <div className="text-sm mb-5" style={{ color: '#9892b3' }}>
            イベント管理からイベントに券種を追加してください
          </div>
          <button
            onClick={() => navigate('/admin/events')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#c0a6ff,#9c7cf2)', color: '#fff', boxShadow: '0 4px 16px rgba(156,124,242,.3)' }}>
            <ExternalLink className="w-4 h-4" />
            イベント管理へ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((ticket, idx) => {
            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]
            const sold = ticket.stock - ticket.stock_remaining
            const pct = ticket.stock > 0 ? sold / ticket.stock : 0
            const isSoldOut = ticket.stock_remaining === 0
            const isLow = !isSoldOut && ticket.stock_remaining <= 5

            return (
              <div key={ticket.id} className="overflow-hidden rounded-[22px] cursor-pointer transition-all hover:-translate-y-0.5"
                style={{ ...CARD, boxShadow: '0 8px 28px rgba(59,42,124,.09)' }}
                onClick={() => navigate('/admin/events')}>

                {/* グラデーションヘッダー */}
                <div className="relative px-5 pt-5 pb-8" style={{ background: gradient }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,.25)', backdropFilter: 'blur(4px)' }}>
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    {isSoldOut ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,.9)', color: '#f08aa0' }}>完売</span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,.9)', color: '#c08a20' }}>残少</span>
                    ) : null}
                  </div>
                  <div className="text-white font-bold text-base leading-snug">{ticket.name}</div>
                </div>

                {/* 本文 */}
                <div className="px-5 pb-4 -mt-5">
                  {/* イベント名バッジ */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold mb-3"
                    style={{ background: '#fff', border: '1px solid #ebe8f6', color: '#9c7cf2', boxShadow: '0 2px 8px rgba(59,42,124,.08)' }}>
                    📅 {ticket.event_title}
                  </div>

                  {/* 価格・ポイント */}
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-xl font-bold" style={{ color: '#221d4e' }}>
                      ¥{ticket.price.toLocaleString()}
                    </span>
                    {ticket.points != null && ticket.points > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                        style={{ background: '#fef9ec', color: '#c08a20', border: '1px solid #fde9a0' }}>
                        {ticket.points}pt
                      </span>
                    )}
                  </div>

                  {/* 在庫バー */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs" style={{ color: '#9892b3' }}>
                      <span>販売状況</span>
                      <span className="tabular-nums" style={{ color: isSoldOut ? '#f08aa0' : isLow ? '#c08a20' : '#221d4e', fontWeight: 600 }}>
                        {sold}/{ticket.stock}枚
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0ebff' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct * 100}%`, background: isSoldOut ? '#f08aa0' : isLow ? '#fbbf24' : 'linear-gradient(90deg,#c0a6ff,#9c7cf2)' }} />
                    </div>
                  </div>

                  {/* 設定ボタン */}
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/admin/events') }}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: '#f5f2ff', color: '#9c7cf2', border: '1px solid #ddd6ff' }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    デザイン・設定
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
