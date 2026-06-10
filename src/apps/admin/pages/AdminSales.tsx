import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Search, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

const CARD = {
  background: '#ffffff',
  borderRadius: 22,
  border: '1px solid #ebe8f6',
  boxShadow: '0 8px 20px rgba(59,42,124,.06)',
} as const

type PeriodKey = 'this-month' | 'last-month' | 'last-3' | 'all'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'this-month',  label: '今月' },
  { key: 'last-month',  label: '先月' },
  { key: 'last-3',      label: '過去3ヶ月' },
  { key: 'all',         label: '全期間' },
]

interface PaymentRow {
  id: string
  amount: number
  quantity: number
  paid_at: string | null
  created_at: string
  ticket_types: {
    name: string
    events: { title: string } | null
  } | null
}

function periodStart(key: PeriodKey): Date | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (key === 'this-month') return new Date(y, m, 1)
  if (key === 'last-month') return new Date(y, m - 1, 1)
  if (key === 'last-3')     return new Date(y, m - 3, 1)
  return null
}

function periodEnd(key: PeriodKey): Date | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (key === 'last-month') return new Date(y, m, 0, 23, 59, 59)
  return null
}

export function AdminSales() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodKey>('this-month')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('payments')
        .select('id, amount, quantity, paid_at, created_at, ticket_types(name, events(title))')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
      setPayments((data ?? []) as PaymentRow[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const start = periodStart(period)
    const end   = periodEnd(period)
    return payments.filter(p => {
      const date = new Date(p.paid_at ?? p.created_at)
      if (start && date < start) return false
      if (end   && date > end)   return false
      const title = p.ticket_types?.events?.title ?? ''
      const name  = p.ticket_types?.name ?? ''
      if (search && !title.toLowerCase().includes(search.toLowerCase()) && !name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [payments, period, search])

  const totalRevenue = filtered.reduce((s, p) => s + p.amount, 0)
  const totalCount   = filtered.reduce((s, p) => s + (p.quantity ?? 1), 0)
  const avgAmount    = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #edfff5 0%, #d5f5e5 100%)', border: '1px solid #c5eed9' }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: '#3d9b60' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>売上</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9892b3' }}>チケット販売の収益</p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={
              period === p.key
                ? { background: 'linear-gradient(90deg, #c89cff, #a79fff)', color: '#fff' }
                : { color: '#9892b3' }
            }
            onMouseEnter={e => { if (period !== p.key) e.currentTarget.style.background = '#f0ebff' }}
            onMouseLeave={e => { if (period !== p.key) e.currentTarget.style.background = 'transparent' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} className="rounded-[22px] animate-pulse" style={{ ...CARD, height: 88 }} />
          ))
        ) : (
          <>
            <div className="rounded-[22px] p-5 flex items-center gap-4" style={CARD}>
              <div>
                <div className="text-xs font-medium" style={{ color: '#9892b3' }}>売上合計</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: '#221d4e' }}>{formatPrice(totalRevenue)}</div>
              </div>
            </div>
            <div className="rounded-[22px] p-5 flex items-center gap-4" style={CARD}>
              <div>
                <div className="text-xs font-medium" style={{ color: '#9892b3' }}>販売チケット数</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: '#221d4e' }}>{totalCount} <span className="text-base font-normal" style={{ color: '#9892b3' }}>枚</span></div>
              </div>
            </div>
            <div className="rounded-[22px] p-5 flex items-center gap-4" style={CARD}>
              <div>
                <div className="text-xs font-medium" style={{ color: '#9892b3' }}>平均単価</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: '#221d4e' }}>{formatPrice(avgAmount)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payments table */}
      <div style={CARD} className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
          <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>
            支払い一覧 <span className="font-normal text-xs ml-1" style={{ color: '#9892b3' }}>{filtered.length} 件</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9892b3' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="イベント・チケット名で検索"
                className="pl-9 pr-4 py-2 text-sm focus:outline-none w-64"
                style={{ border: '1.5px solid #e8e6f3', borderRadius: 12 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}
              title="CSV出力（実装予定）"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ background: '#faf9ff' }}>
              {[
                { label: 'イベント名',   cls: 'px-6 text-left' },
                { label: 'チケット種別', cls: 'px-4 text-left' },
                { label: '数量',         cls: 'px-4 text-right' },
                { label: '金額',         cls: 'px-4 text-right' },
                { label: '日時',         cls: 'px-4 text-left' },
              ].map(({ label, cls }) => (
                <th key={label} className={`text-[11px] font-bold uppercase tracking-wider py-3 ${cls}`} style={{ color: '#9892b3' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2, 3].map(i => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="h-5 rounded-lg animate-pulse" style={{ background: '#f3f1fb' }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: '#9892b3' }}>
                  {search ? '該当する支払いがありません' : 'この期間の支払いはありません'}
                </td>
              </tr>
            ) : filtered.map((p, i) => {
              const dateStr = new Date(p.paid_at ?? p.created_at).toLocaleString('ja-JP', {
                month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })
              return (
                <tr
                  key={p.id}
                  className="transition-colors"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid #f8f7ff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#221d4e' }}>
                    {p.ticket_types?.events?.title ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: '#6d6791' }}>
                    {p.ticket_types?.name ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-medium" style={{ color: '#6d6791' }}>
                    {p.quantity}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-bold" style={{ color: '#9c7cf2' }}>
                    {formatPrice(p.amount)}
                  </td>
                  <td className="px-4 py-4 text-xs whitespace-nowrap" style={{ color: '#9892b3' }}>
                    {dateStr}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
