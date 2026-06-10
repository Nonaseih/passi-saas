import { useEffect, useState } from 'react'
import { Calendar, Ticket, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface Stats {
  events: number
  ticketsSold: number
  revenue: number
}

export function AdminDashboard() {
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
          .limit(6),
      ])

      const revenue = (paymentsRes.data ?? []).reduce((sum: number, p: any) => sum + p.amount, 0)
      setStats({
        events: eventsRes.count ?? 0,
        ticketsSold: ticketsRes.count ?? 0,
        revenue,
      })
      setRecentPayments(recentRes.data ?? [])
      setUpcomingEvents(upcomingRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: '総イベント数', value: String(stats.events), icon: Calendar, color: 'text-violet-600 bg-violet-50' },
    { label: '販売チケット数', value: `${stats.ticketsSold} 枚`, icon: Ticket, color: 'text-blue-600 bg-blue-50' },
    { label: '総売上', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            {loading ? (
              <div className="w-full h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className="text-xl font-bold text-gray-900 mt-0.5">{value}</div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming events */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm text-gray-700 mb-4">直近のイベント</h3>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">予定なし</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{ev.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(ev.date).toLocaleDateString('ja-JP', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                      {' · '}{ev.venue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm text-gray-700 mb-4">最近の購入</h3>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">購入履歴なし</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600 truncate">
                    {(p.ticket_types as any)?.events?.title ?? '—'}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatPrice(p.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
