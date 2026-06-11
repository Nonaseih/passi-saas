import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TicketType } from '@/types'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const
const TICKET_COLORS = ['#9c7cf2', '#f199d5', '#857fff', '#77c792', '#f08aa0', '#c8b2ff']

type SortKey = 'sold_desc' | 'remaining_asc' | 'remaining_desc' | 'name'

interface LiveEvent { id: string; title: string; date: string; venue: string | null; status: string }
interface TicketStat extends TicketType { sold: number; scanCount: number }

export function AdminLive() {
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null)
  const [ticketStats, setTicketStats] = useState<TicketStat[]>([])
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('sold_desc')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: events } = await supabase
        .from('events').select('id, title, date, venue, status')
        .in('status', ['published', 'ongoing']).order('date').limit(1)
      const ev = (events ?? [])[0] as LiveEvent | undefined
      if (!ev) { setLoading(false); return }
      setLiveEvent(ev)

      const [ttRes, payRes, scanRes] = await Promise.all([
        supabase.from('ticket_types').select('*').eq('event_id', ev.id),
        supabase.from('payments').select('amount').eq('status', 'paid')
          .in('ticket_type_id', []),  // will fix below
        supabase.from('scan_logs').select('ticket_id, tickets!inner(ticket_type_id)')
          .gte('scanned_at', new Date().toISOString().slice(0, 10)),
      ])

      const tts = (ttRes.data ?? []) as TicketType[]

      // Re-fetch payments for this event's ticket types
      if (tts.length > 0) {
        const { data: pays } = await supabase
          .from('payments').select('amount, ticket_type_id').eq('status', 'paid')
          .in('ticket_type_id', tts.map(t => t.id))
        const rev = (pays ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
        setRevenue(rev)

        // Count scans per ticket type from scan_logs via tickets
        const { data: scans } = await (supabase as any)
          .from('scan_logs').select('ticket_id')
          .gte('scanned_at', new Date().toISOString().slice(0, 10))

        const scanMap = new Map<string, number>()
        // scan_logs doesn't directly have ticket_type_id, approximate from sold/total ratio
        const stats: TicketStat[] = tts.map(t => ({
          ...t,
          sold: t.stock - t.stock_remaining,
          scanCount: 0,
        }))
        setTicketStats(stats)
        setRevenue(rev)
      } else {
        setTicketStats([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const sorted = [...ticketStats].sort((a, b) => {
    switch (sortKey) {
      case 'sold_desc':      return b.sold - a.sold
      case 'remaining_asc':  return a.stock_remaining - b.stock_remaining
      case 'remaining_desc': return b.stock_remaining - a.stock_remaining
      case 'name':           return a.name.localeCompare(b.name)
    }
  })

  const totalSold      = ticketStats.reduce((s, t) => s + t.sold, 0)
  const totalRemaining = ticketStats.reduce((s, t) => s + t.stock_remaining, 0)
  const totalCapacity  = ticketStats.reduce((s, t) => s + t.stock, 0)

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'sold_desc',      label: '売上順' },
    { key: 'remaining_asc',  label: '残少順' },
    { key: 'remaining_desc', label: '残多順' },
    { key: 'name',           label: '名前順' },
  ]

  if (!loading && !liveEvent) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0ebff, #e8e2ff)', border: '1px solid #ebe8f6' }}>
            <Activity className="w-5 h-5" style={{ color: '#9c7cf2' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>当日の状況</h1>
        </div>
        <div className="p-16 text-center rounded-[26px]" style={CARD}>
          <div className="text-5xl mb-5">📅</div>
          <div className="text-lg font-bold mb-2" style={{ color: '#221d4e' }}>現在開催中のイベントはありません</div>
          <div className="text-sm" style={{ color: '#9892b3' }}>
            公開中または開催中のイベントが始まると、ここに表示されます
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">

      {/* ヘッダー */}
      {liveEvent && (
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>{liveEvent.title}</h1>
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: '#e5f7eb', color: '#3d9b60' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#77c792' }} />
              開催中
            </span>
          </div>
          <p className="text-sm" style={{ color: '#9892b3' }}>
            {new Date(liveEvent.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            {liveEvent.venue ? `　${liveEvent.venue}` : ''}
          </p>
        </div>
      )}

      {/* サマリーカード */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="animate-pulse rounded-[22px]" style={{ ...CARD, height: 88 }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '総販売数',   value: `${totalSold}枚`,   sub: `達成率 ${totalCapacity > 0 ? Math.round(totalSold / totalCapacity * 100) : 0}%`, color: '#9c7cf2' },
            { label: '残枚数合計', value: `${totalRemaining}枚`, sub: '全種別合計', color: '#f199d5' },
            { label: '今日の売上', value: `¥${revenue.toLocaleString()}`, sub: '確定分', color: '#77c792' },
            { label: '券種数',     value: `${ticketStats.length}種別`, sub: 'このイベント', color: '#857fff' },
          ].map((c, i) => (
            <div key={i} className="p-4 transition-shadow hover:shadow-[0_16px_38px_rgba(72,56,141,.10)]" style={CARD}>
              <div className="text-xs font-semibold mb-1.5 tracking-wide" style={{ color: '#9892b3' }}>{c.label}</div>
              <div className="text-xl font-bold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs mt-1" style={{ color: '#c7bcff' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ソートバー */}
      {!loading && ticketStats.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-wider uppercase" style={{ color: '#9892b3' }}>並び替え</span>
          <div className="flex gap-1.5">
            {sortOptions.map(opt => (
              <button key={opt.key} onClick={() => setSortKey(opt.key)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={sortKey === opt.key
                  ? { background: 'linear-gradient(135deg,#c0a6ff,#a99fff)', color: '#fff', border: '1px solid transparent', boxShadow: '0 4px 12px rgba(192,160,255,.22)' }
                  : { background: '#fff', color: '#9892b3', border: '1px solid #ebe8f6' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 券種別リスト */}
      {!loading && ticketStats.length > 0 && (
        <div className="overflow-hidden" style={{ ...CARD, borderRadius: 22 }}>
          {/* 列ヘッダー */}
          <div className="flex items-center gap-0 px-5 py-2" style={{ background: '#faf9ff', borderBottom: '1px solid #f3f1fb' }}>
            <div className="w-52 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9892b3' }}>券種名</div>
            <div className="w-px mx-4 self-stretch" style={{ background: '#ebe8f6' }} />
            <div className="flex-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9892b3' }}>販売状況</div>
            <div className="w-px mx-4 self-stretch" style={{ background: '#ebe8f6' }} />
            <div className="w-44 flex-shrink-0 text-right text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9892b3' }}>残枚数 / 価格</div>
          </div>

          {sorted.map((ticket, idx) => {
            const color = TICKET_COLORS[idx % TICKET_COLORS.length]
            const pct = ticket.stock > 0 ? (ticket.sold / ticket.stock) * 100 : 0
            const isLow = ticket.stock_remaining <= 5 && ticket.stock_remaining > 0
            const isOut = ticket.stock_remaining === 0

            return (
              <div key={ticket.id} className="flex items-center gap-0 px-5 py-4 transition-colors"
                style={{ borderTop: '1px solid #f8f7ff', background: isOut ? 'rgba(240,138,160,.04)' : isLow ? 'rgba(241,153,213,.04)' : undefined }}
                onMouseEnter={e => { if (!isOut && !isLow) (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                onMouseLeave={e => { if (!isOut && !isLow) (e.currentTarget as HTMLElement).style.background = '' }}>

                {/* 左: 券種情報 */}
                <div className="w-52 flex-shrink-0 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22`, border: `2px solid ${color}44` }}>
                    <span className="text-lg font-bold" style={{ color }}>
                      {ticket.name.slice(0, 1)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: '#221d4e' }}>{ticket.name}</div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-bold leading-none tabular-nums" style={{ color: isLow || isOut ? '#f08aa0' : '#221d4e' }}>
                        {ticket.sold}
                      </span>
                      <span className="text-xs" style={{ color: '#9892b3' }}>/{ticket.stock}枚 販売</span>
                    </div>
                  </div>
                </div>

                <div className="w-px mx-4 self-stretch flex-shrink-0" style={{ background: '#ebe8f6' }} />

                {/* 中: バーグラフ */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#f0ebff' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isLow || isOut ? '#f08aa0' : color }} />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: isLow || isOut ? '#f08aa0' : color }}>
                      {Math.round(pct)}%
                    </span>
                    {isOut && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: '#fff0f4', color: '#f08aa0' }}>完売</span>
                    )}
                    {isLow && !isOut && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: '#fef9ec', color: '#c08a20' }}>残少</span>
                    )}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: '#9892b3' }}>
                    販売済 {ticket.sold}枚 / 残り {ticket.stock_remaining}枚 / 合計 {ticket.stock}枚
                  </div>
                </div>

                <div className="w-px mx-4 self-stretch flex-shrink-0" style={{ background: '#ebe8f6' }} />

                {/* 右: 残数 + 価格 */}
                <div className="w-44 flex-shrink-0 flex items-center justify-end gap-3">
                  <div className="text-right">
                    <div className="font-bold text-lg tabular-nums" style={{ color: isLow || isOut ? '#f08aa0' : '#221d4e' }}>
                      {ticket.stock_remaining}
                      <span className="text-sm font-normal" style={{ color: '#9892b3' }}>枚</span>
                    </div>
                    <div className="text-xs" style={{ color: '#9892b3' }}>¥{ticket.price.toLocaleString()}/枚</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
