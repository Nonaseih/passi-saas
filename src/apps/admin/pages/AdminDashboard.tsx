import { useEffect, useState } from 'react'
import { Calendar, Ticket, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

const CARD = {
  background: '#ffffff',
  borderRadius: 22,
  border: '1px solid #ebe8f6',
  boxShadow: '0 8px 20px rgba(59,42,124,.06)',
} as const

const BTN_PRIMARY = {
  background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)',
  boxShadow: '0 8px 24px rgba(192,160,255,.22)',
  borderRadius: 14,
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
} as const

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  published: { bg: '#e5f7eb', color: '#3d9b60' },
  ongoing:   { bg: '#e5f7eb', color: '#3d9b60' },
  draft:     { bg: '#fef9ec', color: '#c08a20' },
  completed: { bg: '#f3f3f8', color: '#888' },
  cancelled: { bg: '#f3f3f8', color: '#888' },
}
const STATUS_LABELS: Record<string, string> = {
  published: '販売中',
  ongoing:   '開催中',
  draft:     '準備中',
  completed: '終了',
  cancelled: 'キャンセル',
}

interface Stats {
  events: number
  ticketsSold: number
  revenue: number
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ events: 0, ticketsSold: 0, revenue: 0 })
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [eventsRes, ticketsRes, paymentsRes, recentRes, upcomingRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['active', 'used']),
        supabase.from('payments').select('amount').eq('status', 'paid'),
        supabase
          .from('payments')
          .select('amount, created_at, ticket_types(name, events(title))')
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('events')
          .select('id, title, date, venue, status')
          .gte('date', new Date().toISOString())
          .order('date')
          .limit(5),
      ])
      const revenue = (paymentsRes.data ?? []).reduce((sum: number, p: any) => sum + p.amount, 0)
      setStats({ events: eventsRes.count ?? 0, ticketsSold: ticketsRes.count ?? 0, revenue })
      setRecentPayments(recentRes.data ?? [])
      setUpcomingEvents(upcomingRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date()
  const dateLabel = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>ホーム</h1>
          <p className="text-sm mt-1" style={{ color: '#9892b3' }}>{dateLabel}</p>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-2 px-5 py-2.5 transition-opacity hover:opacity-85"
          style={BTN_PRIMARY}
        >
          <Plus className="w-4 h-4" />
          イベントを作成
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} className="rounded-[22px] p-5 animate-pulse" style={{ background: '#f3f1fb', height: 88 }} />
          ))
        ) : (
          <>
            <div className="rounded-[22px] p-5 flex items-center gap-4" style={CARD}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%)', border: '1px solid #ebe8f6' }}>
                <Calendar className="w-5 h-5" style={{ color: '#9c7cf2' }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: '#9892b3' }}>総イベント数</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: '#221d4e' }}>{stats.events}</div>
              </div>
            </div>
            <div className="rounded-[22px] p-5 flex items-center gap-4" style={CARD}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #eef9ff 0%, #e0f4ff 100%)', border: '1px solid #d6edfa' }}>
                <Ticket className="w-5 h-5" style={{ color: '#5badd4' }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: '#9892b3' }}>販売チケット数</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: '#221d4e' }}>{stats.ticketsSold} <span className="text-base font-normal" style={{ color: '#9892b3' }}>枚</span></div>
              </div>
            </div>
            <div className="rounded-[22px] p-5 flex items-center gap-4" style={CARD}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #edfff5 0%, #d5f5e5 100%)', border: '1px solid #c5eed9' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#3d9b60' }} />
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: '#9892b3' }}>総売上</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: '#221d4e' }}>{formatPrice(stats.revenue)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2-column */}
      <div className="grid grid-cols-5 gap-4">

        {/* Upcoming events */}
        <div className="col-span-3 overflow-hidden transition-shadow hover:shadow-[0_16px_38px_rgba(72,56,141,.10)]" style={CARD}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
            <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>直近のイベント</h2>
            <button
              onClick={() => navigate('/admin/events')}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#9c7cf2' }}
            >
              すべて見る <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ background: '#faf9ff' }}>
                {['イベント名', '日付', '会場', 'ステータス'].map((h, i) => (
                  <th
                    key={i}
                    className={`text-[11px] font-bold uppercase tracking-wider py-3 ${i === 0 ? 'px-6 text-left' : 'px-4 text-left'}`}
                    style={{ color: '#9892b3' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0, 1, 2].map(i => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-5 rounded-lg animate-pulse" style={{ background: '#f3f1fb' }} />
                    </td>
                  </tr>
                ))
              ) : upcomingEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm" style={{ color: '#9892b3' }}>
                    開催予定のイベントはありません
                  </td>
                </tr>
              ) : upcomingEvents.map((ev: any) => {
                const ss = STATUS_STYLES[ev.status] ?? STATUS_STYLES.draft
                const dateStr = new Date(ev.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                return (
                  <tr
                    key={ev.id}
                    className="transition-colors"
                    style={{ borderTop: '1px solid #f8f7ff' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#221d4e' }}>
                      {ev.title}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: '#6d6791' }}>{dateStr}</td>
                    <td className="px-4 py-4 text-sm" style={{ color: '#6d6791' }}>{ev.venue ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: ss.bg, color: ss.color, border: `1.5px solid ${ss.color}33` }}
                      >
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-3" style={{ borderTop: '1px solid #f3f1fb', background: '#faf9ff' }}>
            <button
              onClick={() => navigate('/admin/events')}
              className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#9c7cf2' }}
            >
              <Plus className="w-4 h-4" />
              イベントを作成
            </button>
          </div>
        </div>

        {/* Recent payments */}
        <div className="col-span-2 overflow-hidden transition-shadow hover:shadow-[0_16px_38px_rgba(72,56,141,.10)]" style={CARD}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
            <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>最近の購入</h2>
          </div>

          {loading ? (
            <div className="px-5 py-4 space-y-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-8 rounded-xl animate-pulse" style={{ background: '#f3f1fb' }} />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm" style={{ color: '#9892b3' }}>
              購入履歴はありません
            </div>
          ) : (
            <div>
              {recentPayments.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderTop: i > 0 ? '1px solid #f8f7ff' : undefined }}
                >
                  <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="text-sm font-semibold truncate" style={{ color: '#221d4e' }}>
                      {(p.ticket_types as any)?.events?.title ?? '—'}
                    </span>
                    <span className="text-xs" style={{ color: '#9892b3' }}>
                      {(p.ticket_types as any)?.name ?? ''}
                    </span>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0 ml-4" style={{ color: '#9c7cf2' }}>
                    {formatPrice(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
