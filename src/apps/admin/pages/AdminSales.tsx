import { useState, useEffect, useMemo } from 'react'
import { BarChart3, ChevronLeft, ChevronRight, Download, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const
const inputStyle = { border: '1.5px solid #e8e6f3', color: '#221d4e', borderRadius: 12 } as const

type PeriodKey = 'this-month' | 'last-month' | 'last-3' | 'all' | 'custom'
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'this-month', label: '今月' },
  { key: 'last-month', label: '先月' },
  { key: 'last-3', label: '過去3ヶ月' },
  { key: 'all', label: '全期間' },
  { key: 'custom', label: 'カスタム' },
]

interface PaymentRow {
  id: string; amount: number; quantity: number; paid_at: string | null; created_at: string
  ticket_types: { id: string; name: string; events: { id: string; title: string } | null } | null
}

interface EventItem { id: string; title: string }

function getPeriodBounds(key: PeriodKey, customFrom: string, customUntil: string): [Date | null, Date | null] {
  const now = new Date()
  const y = now.getFullYear(); const m = now.getMonth()
  if (key === 'this-month')  return [new Date(y, m, 1), null]
  if (key === 'last-month')  return [new Date(y, m - 1, 1), new Date(y, m, 0, 23, 59, 59)]
  if (key === 'last-3')      return [new Date(y, m - 3, 1), null]
  if (key === 'custom') {
    const s = customFrom  ? new Date(customFrom + 'T00:00:00') : null
    const e = customUntil ? new Date(customUntil + 'T23:59:59') : null
    return [s, e]
  }
  return [null, null]
}

interface TicketStat { id: string; name: string; eventTitle: string; revenue: number; count: number }
interface EventStat  { id: string; title: string; revenue: number; count: number }

type DetailType = 'ticket' | 'event'
interface DetailItem { type: DetailType; id: string; label: string }

export function AdminSales() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [allEvents, setAllEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  const [period, setPeriod] = useState<PeriodKey>('this-month')
  const [customFrom, setCustomFrom] = useState('')
  const [customUntil, setCustomUntil] = useState('')
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [eventSearch, setEventSearch] = useState('')

  const [detail, setDetail] = useState<DetailItem | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [payRes, evRes] = await Promise.all([
        supabase.from('payments').select('id, amount, quantity, paid_at, created_at, ticket_types(id, name, events(id, title))').eq('status', 'paid').order('paid_at', { ascending: false }),
        supabase.from('events').select('id, title').order('date', { ascending: false }),
      ])
      setPayments((payRes.data ?? []) as PaymentRow[])
      setAllEvents((evRes.data ?? []) as EventItem[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const [start, end] = getPeriodBounds(period, customFrom, customUntil)
    return payments.filter(p => {
      const date = new Date(p.paid_at ?? p.created_at)
      if (start && date < start) return false
      if (end && date > end) return false
      if (selectedEventIds.size > 0) {
        const evId = (p.ticket_types as any)?.events?.id
        if (!evId || !selectedEventIds.has(evId)) return false
      }
      return true
    })
  }, [payments, period, customFrom, customUntil, selectedEventIds])

  const totalRevenue = filtered.reduce((s, p) => s + p.amount, 0)
  const totalCount   = filtered.reduce((s, p) => s + (p.quantity ?? 1), 0)
  const avgAmount    = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0

  const ticketStats: TicketStat[] = useMemo(() => {
    const map = new Map<string, TicketStat>()
    for (const p of filtered) {
      const tt = p.ticket_types as any
      if (!tt) continue
      const id = tt.id ?? '—'
      const existing = map.get(id)
      if (existing) { existing.revenue += p.amount; existing.count += (p.quantity ?? 1) }
      else map.set(id, { id, name: tt.name ?? '—', eventTitle: tt.events?.title ?? '—', revenue: p.amount, count: p.quantity ?? 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [filtered])

  const eventStats: EventStat[] = useMemo(() => {
    const map = new Map<string, EventStat>()
    for (const p of filtered) {
      const ev = (p.ticket_types as any)?.events
      if (!ev) continue
      const existing = map.get(ev.id)
      if (existing) { existing.revenue += p.amount; existing.count += (p.quantity ?? 1) }
      else map.set(ev.id, { id: ev.id, title: ev.title, revenue: p.amount, count: p.quantity ?? 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [filtered])

  const maxTicketRev = Math.max(...ticketStats.map(t => t.revenue), 1)
  const maxEventRev  = Math.max(...eventStats.map(e => e.revenue), 1)

  // Detail drill-down data
  const detailPayments = useMemo(() => {
    if (!detail) return []
    return filtered.filter(p => {
      const tt = p.ticket_types as any
      if (detail.type === 'ticket') return tt?.id === detail.id
      return tt?.events?.id === detail.id
    })
  }, [filtered, detail])

  const allDetailItems: DetailItem[] = detail?.type === 'ticket'
    ? ticketStats.map(t => ({ type: 'ticket', id: t.id, label: t.name }))
    : eventStats.map(e => ({ type: 'event', id: e.id, label: e.title }))
  const detailIdx = detail ? allDetailItems.findIndex(d => d.id === detail.id) : -1

  function exportCSV() {
    const rows = detailPayments.map(p => {
      const tt = p.ticket_types as any
      return `${p.paid_at ?? p.created_at},${tt?.events?.title ?? ''},${tt?.name ?? ''},${p.quantity},${p.amount}`
    })
    const csv = ['日時,イベント,チケット種別,数量,金額', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `sales-${detail?.label ?? 'export'}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filteredEventList = allEvents.filter(e => !eventSearch || e.title.toLowerCase().includes(eventSearch.toLowerCase()))
  const toggleEvent = (id: string) => setSelectedEventIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const clearEventFilter = () => setSelectedEventIds(new Set())

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>

      {/* Left filter panel */}
      <div className="w-72 flex-shrink-0 overflow-y-auto p-5 space-y-6" style={{ borderRight: '1px solid #ebe8f6', background: '#faf9ff' }}>

        {/* 期間 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #c89cff, #a79fff)' }} />
            <span className="text-xs font-bold" style={{ color: '#221d4e' }}>期間</span>
          </div>
          <select value={period} onChange={e => setPeriod(e.target.value as PeriodKey)}
            className="w-full px-3 py-2.5 text-sm focus:outline-none transition-all"
            style={{ ...inputStyle, background: '#fff', appearance: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }}>
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          {period === 'custom' && (
            <div className="mt-3 space-y-2">
              <div>
                <div className="text-[11px] font-semibold mb-1" style={{ color: '#9892b3' }}>開始日</div>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm focus:outline-none transition-all" style={{ ...inputStyle, background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div>
                <div className="text-[11px] font-semibold mb-1" style={{ color: '#9892b3' }}>終了日</div>
                <input type="date" value={customUntil} onChange={e => setCustomUntil(e.target.value)}
                  className="w-full px-3 py-2 text-sm focus:outline-none transition-all" style={{ ...inputStyle, background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
            </div>
          )}
        </div>

        {/* イベントフィルター */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #c89cff, #a79fff)' }} />
              <span className="text-xs font-bold" style={{ color: '#221d4e' }}>イベント</span>
            </div>
            {selectedEventIds.size > 0 && (
              <button onClick={clearEventFilter}
                className="flex items-center gap-0.5 text-[10px] font-bold transition-colors"
                style={{ color: '#9c7cf2' }}>
                <X className="w-3 h-3" />解除
              </button>
            )}
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9892b3' }} />
            <input type="text" value={eventSearch} onChange={e => setEventSearch(e.target.value)}
              placeholder="イベント検索"
              className="w-full pl-7 pr-3 py-2 text-xs focus:outline-none"
              style={{ border: '1.5px solid #e8e6f3', borderRadius: 10, background: '#fff' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }} />
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8e6f3 transparent' }}>
            {filteredEventList.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: '#9892b3' }}>イベントが見つかりません</p>
            ) : filteredEventList.map(ev => {
              const checked = selectedEventIds.has(ev.id)
              return (
                <label key={ev.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer transition-colors"
                  style={{ background: checked ? '#f0ebff' : 'transparent' }}
                  onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = '#f6f4ff' }}
                  onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: checked ? 'linear-gradient(135deg, #c89cff, #a79fff)' : '#fff', border: checked ? 'none' : '1.5px solid #d0cce8' }}>
                    {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="text-xs leading-snug" style={{ color: checked ? '#9c7cf2' : '#6d6791', fontWeight: checked ? 600 : 400 }}>
                    {ev.title}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {detail ? (
          /* Detail drill-down view */
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setDetail(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                  <ChevronLeft className="w-4 h-4" />戻る
                </button>
                <div>
                  <div className="text-[11px] font-bold" style={{ color: '#9892b3' }}>
                    {detail.type === 'ticket' ? 'チケット種別' : 'イベント'}詳細
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: '#221d4e' }}>{detail.label}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {detailIdx > 0 && (
                  <button onClick={() => setDetail(allDetailItems[detailIdx - 1])}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                    <ChevronLeft className="w-3.5 h-3.5" />前
                  </button>
                )}
                {detailIdx < allDetailItems.length - 1 && (
                  <button onClick={() => setDetail(allDetailItems[detailIdx + 1])}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                    次<ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                  <Download className="w-3.5 h-3.5" />CSV出力
                </button>
              </div>
            </div>

            {/* KPI cards for detail */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '売上合計', value: `¥${detailPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}`, color: '#9c7cf2' },
                { label: '販売枚数', value: `${detailPayments.reduce((s, p) => s + (p.quantity ?? 1), 0)} 枚`, color: '#221d4e' },
                { label: '件数', value: `${detailPayments.length} 件`, color: '#221d4e' },
              ].map(kpi => (
                <div key={kpi.label} style={CARD} className="p-5">
                  <div className="text-xs font-medium mb-1" style={{ color: '#9892b3' }}>{kpi.label}</div>
                  <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Detail payments table */}
            <div style={CARD} className="overflow-hidden">
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
                <h3 className="font-bold text-sm" style={{ color: '#221d4e' }}>購入履歴</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#faf9ff' }}>
                    {[{ label: 'イベント', cls: 'px-6 text-left' }, { label: 'チケット種別', cls: 'px-4 text-left' }, { label: '数量', cls: 'px-4 text-right' }, { label: '金額', cls: 'px-4 text-right' }, { label: '日時', cls: 'px-4 text-left' }].map(({ label, cls }) => (
                      <th key={label} className={`text-[11px] font-bold uppercase tracking-wider py-3 ${cls}`} style={{ color: '#9892b3' }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailPayments.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: '#9892b3' }}>データがありません</td></tr>
                  ) : detailPayments.map((p, i) => {
                    const tt = p.ticket_types as any
                    return (
                      <tr key={p.id} className="transition-colors" style={{ borderTop: i === 0 ? 'none' : '1px solid #f8f7ff' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: '#221d4e' }}>{tt?.events?.title ?? '—'}</td>
                        <td className="px-4 py-4 text-sm" style={{ color: '#6d6791' }}>{tt?.name ?? '—'}</td>
                        <td className="px-4 py-4 text-sm text-right" style={{ color: '#6d6791' }}>{p.quantity}</td>
                        <td className="px-4 py-4 text-sm text-right font-bold" style={{ color: '#9c7cf2' }}>¥{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-4 text-xs whitespace-nowrap" style={{ color: '#9892b3' }}>
                          {new Date(p.paid_at ?? p.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>

        ) : (
          /* Main overview */
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%)', border: '1px solid #ebe8f6' }}>
                <BarChart3 className="w-5 h-5" style={{ color: '#9c7cf2' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>売上レポート</h1>
                <p className="text-sm mt-0.5" style={{ color: '#9892b3' }}>チケット販売の収益状況</p>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-4">
              {loading ? [0,1,2].map(i => <div key={i} className="rounded-[22px] animate-pulse" style={{ ...CARD, height: 88 }} />) : (
                <>
                  <div style={CARD} className="p-5">
                    <div className="text-xs font-medium mb-1" style={{ color: '#9892b3' }}>売上合計</div>
                    <div className="text-2xl font-bold" style={{ color: '#9c7cf2' }}>¥{totalRevenue.toLocaleString()}</div>
                    <div className="text-xs mt-1" style={{ color: '#9892b3' }}>{filtered.length} 件の支払い</div>
                  </div>
                  <div style={CARD} className="p-5">
                    <div className="text-xs font-medium mb-1" style={{ color: '#9892b3' }}>販売枚数</div>
                    <div className="text-2xl font-bold" style={{ color: '#221d4e' }}>{totalCount}<span className="text-base font-normal ml-1" style={{ color: '#9892b3' }}>枚</span></div>
                  </div>
                  <div style={CARD} className="p-5">
                    <div className="text-xs font-medium mb-1" style={{ color: '#9892b3' }}>平均単価</div>
                    <div className="text-2xl font-bold" style={{ color: '#221d4e' }}>¥{avgAmount.toLocaleString()}</div>
                  </div>
                </>
              )}
            </div>

            {/* チケット種別別 */}
            {!loading && ticketStats.length > 0 && (
              <div style={CARD} className="overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
                  <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>チケット種別別</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>各チケット種別のクリックで詳細を確認</p>
                </div>
                <div className="divide-y" style={{ borderColor: '#f8f7ff' }}>
                  {ticketStats.map(tt => {
                    const pct = Math.round((tt.revenue / maxTicketRev) * 100)
                    return (
                      <button key={tt.id} onClick={() => setDetail({ type: 'ticket', id: tt.id, label: tt.name })}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                        <div className="w-40 flex-shrink-0">
                          <div className="font-semibold text-sm mb-0.5" style={{ color: '#221d4e' }}>{tt.name}</div>
                          <div className="text-xs" style={{ color: '#9892b3' }}>{tt.eventTitle}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f0ebff' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c89cff, #a79fff)' }} />
                            </div>
                            <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: '#9892b3' }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="w-20 text-right flex-shrink-0">
                          <div className="font-bold text-sm" style={{ color: '#9c7cf2' }}>¥{tt.revenue.toLocaleString()}</div>
                          <div className="text-xs" style={{ color: '#9892b3' }}>{tt.count} 枚</div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#c7bcff' }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* イベント別 */}
            {!loading && eventStats.length > 0 && (
              <div style={CARD} className="overflow-hidden">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
                  <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>イベント別</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>各イベントのクリックで詳細を確認</p>
                </div>
                <div className="divide-y" style={{ borderColor: '#f8f7ff' }}>
                  {eventStats.map(ev => {
                    const pct = Math.round((ev.revenue / maxEventRev) * 100)
                    return (
                      <button key={ev.id} onClick={() => setDetail({ type: 'event', id: ev.id, label: ev.title })}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                        <div className="w-40 flex-shrink-0">
                          <div className="font-semibold text-sm" style={{ color: '#221d4e' }}>{ev.title}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f0ebff' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #77c7a8, #3d9b78)' }} />
                            </div>
                            <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: '#9892b3' }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="w-20 text-right flex-shrink-0">
                          <div className="font-bold text-sm" style={{ color: '#3d9b60' }}>¥{ev.revenue.toLocaleString()}</div>
                          <div className="text-xs" style={{ color: '#9892b3' }}>{ev.count} 枚</div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#c7bcff' }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20" style={{ color: '#9892b3' }}>
                <BarChart3 className="w-12 h-12 mb-3" style={{ color: '#e0daf5' }} />
                <p className="text-sm font-medium">この期間の売上データがありません</p>
                <p className="text-xs mt-1">期間や絞り込み条件を変更してください</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
