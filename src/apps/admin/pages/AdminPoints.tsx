import { useState, useEffect } from 'react'
import { Gift, ChevronDown, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const

type TabKey = 'card' | 'requests'

interface PaymentRequest {
  id: string
  user_display_name: string | null
  user_email: string
  event_title: string
  ticket_name: string
  amount: number
  quantity: number
  status: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  paid:    { label: '完了',   bg: '#e5f7eb', color: '#3d9b60' },
  pending: { label: '保留中', bg: '#fef9ec', color: '#c08a20' },
  failed:  { label: '失敗',   bg: '#fff0f4', color: '#f08aa0' },
}

interface CardStep {
  id: string
  label: string
  threshold: number
  reward: string
}

const DEFAULT_STEPS: CardStep[] = [
  { id: '1', label: 'ブロンズ',  threshold: 1,  reward: '特典A' },
  { id: '2', label: 'シルバー',  threshold: 3,  reward: '特典B' },
  { id: '3', label: 'ゴールド',  threshold: 5,  reward: '特典C' },
  { id: '4', label: 'プラチナ',  threshold: 10, reward: '特典D' },
]

export function AdminPoints() {
  const [tab, setTab] = useState<TabKey>('card')
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [steps, setSteps] = useState<CardStep[]>(() => {
    try { return JSON.parse(localStorage.getItem('passi_card_steps') ?? '') } catch { return DEFAULT_STEPS }
  })
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [cardSaved, setCardSaved] = useState(false)

  useEffect(() => {
    if (tab === 'requests') loadRequests()
  }, [tab])

  async function loadRequests() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('payments')
      .select(`
        id, amount, quantity, status, created_at,
        ticket_types!inner(name, events!inner(title)),
        users!inner(display_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    const rows: PaymentRequest[] = (data ?? []).map((r: any) => ({
      id: r.id,
      user_display_name: r.users?.display_name,
      user_email: r.users?.email ?? '',
      event_title: r.ticket_types?.events?.title ?? '',
      ticket_name: r.ticket_types?.name ?? '',
      amount: r.amount,
      quantity: r.quantity ?? 1,
      status: r.status,
      created_at: r.created_at,
    }))
    setRequests(rows)
    setLoading(false)
  }

  function saveCardSettings() {
    localStorage.setItem('passi_card_steps', JSON.stringify(steps))
    setCardSaved(true)
    setTimeout(() => setCardSaved(false), 2000)
  }

  function updateStep(id: string, field: keyof CardStep, value: string | number) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'card',     label: 'ポイントカード設定' },
    { key: 'requests', label: '購入履歴管理' },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f0ebff,#e8e2ff)', border: '1px solid #ebe8f6' }}>
          <Gift className="w-5 h-5" style={{ color: '#9c7cf2' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: '#221d4e' }}>ポイントカード</h1>
          <p className="text-sm" style={{ color: '#9892b3' }}>ポイント設定・購入履歴の管理</p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: '#f0ebff' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === t.key
              ? { background: '#fff', color: '#9c7cf2', boxShadow: '0 2px 10px rgba(156,124,242,.15)' }
              : { color: '#9892b3' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* カード設定タブ */}
      {tab === 'card' && (
        <div className="space-y-4">
          <div className="p-5" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: '#221d4e' }}>スタンプ段階の設定</h2>
              <div className="text-xs px-3 py-1 rounded-lg" style={{ background: '#fef9ec', color: '#c08a20', border: '1px solid #fde9a0' }}>
                将来機能 — 現在はUI確認のみ
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: '#9892b3' }}>
              チケット購入ごとにスタンプが加算されます。段階ごとに特典を設定できます。
            </p>

            {/* ステップ一覧 */}
            <div className="space-y-2.5">
              {steps.map((step, idx) => {
                const isEditing = editingStep === step.id
                return (
                  <div key={step.id} className="flex items-center gap-3 p-3.5 rounded-[16px] transition-all"
                    style={{ background: '#f8f7ff', border: `1.5px solid ${isEditing ? '#c0a6ff' : '#ebe8f6'}` }}>

                    {/* ステップ番号 */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg,#c0a6ff,#9c7cf2)', color: '#fff' }}>
                      {idx + 1}
                    </div>

                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input value={step.label} onChange={e => updateStep(step.id, 'label', e.target.value)}
                          placeholder="ラベル"
                          className="px-3 py-1.5 rounded-xl text-sm outline-none"
                          style={{ background: '#fff', border: '1.5px solid #c0a6ff', color: '#221d4e' }} />
                        <input value={step.threshold} onChange={e => updateStep(step.id, 'threshold', parseInt(e.target.value) || 0)}
                          type="number" placeholder="枚数"
                          className="px-3 py-1.5 rounded-xl text-sm outline-none"
                          style={{ background: '#fff', border: '1.5px solid #c0a6ff', color: '#221d4e' }} />
                        <input value={step.reward} onChange={e => updateStep(step.id, 'reward', e.target.value)}
                          placeholder="特典内容"
                          className="px-3 py-1.5 rounded-xl text-sm outline-none"
                          style={{ background: '#fff', border: '1.5px solid #c0a6ff', color: '#221d4e' }} />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-4">
                        <span className="font-bold text-sm w-20" style={{ color: '#221d4e' }}>{step.label}</span>
                        <span className="text-sm" style={{ color: '#9892b3' }}>
                          <span className="font-bold tabular-nums" style={{ color: '#9c7cf2' }}>{step.threshold}</span>枚達成
                        </span>
                        <span className="text-sm" style={{ color: '#9892b3' }}>→ {step.reward}</span>
                      </div>
                    )}

                    <button
                      onClick={() => setEditingStep(isEditing ? null : step.id)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isEditing ? '#e5f7eb' : '#f0ebff', border: `1px solid ${isEditing ? '#b2e4c5' : '#ddd6ff'}` }}>
                      {isEditing
                        ? <Check className="w-3.5 h-3.5" style={{ color: '#3d9b60' }} />
                        : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9c7cf2' }} />
                      }
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={saveCardSettings}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: cardSaved ? '#e5f7eb' : 'linear-gradient(135deg,#c0a6ff,#9c7cf2)', color: cardSaved ? '#3d9b60' : '#fff', boxShadow: cardSaved ? 'none' : '0 4px 16px rgba(156,124,242,.3)' }}>
                {cardSaved ? <><Check className="w-4 h-4" />保存しました</> : '設定を保存する'}
              </button>
              <p className="text-xs" style={{ color: '#c7bcff' }}>※ 設定はこのブラウザに保存されます</p>
            </div>
          </div>

          {/* プレビューカード */}
          <div className="p-5" style={CARD}>
            <h2 className="font-bold mb-4" style={{ color: '#221d4e' }}>カードプレビュー</h2>
            <div className="rounded-[20px] p-5 overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg,#c0a6ff 0%,#9c7cf2 50%,#f199d5 100%)', maxWidth: 320 }}>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-white opacity-80" />
                <span className="text-white font-bold text-sm opacity-90">PASSi ポイントカード</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,.25)', backdropFilter: 'blur(4px)', border: '1.5px solid rgba(255,255,255,.4)' }}>
                      <span className="text-white font-bold text-xs">{step.threshold}</span>
                    </div>
                    <span className="text-white text-[9px] font-semibold opacity-80">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 購入履歴タブ */}
      {tab === 'requests' && (
        <div style={CARD}>
          {/* フィルター */}
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
            {['all', 'paid', 'pending', 'failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={statusFilter === s
                  ? { background: 'linear-gradient(135deg,#c0a6ff,#a99fff)', color: '#fff', border: '1px solid transparent' }
                  : { background: '#fff', color: '#9892b3', border: '1px solid #ebe8f6' }}>
                {s === 'all' ? 'すべて' : STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
          </div>

          {/* テーブルヘッダー */}
          <div className="grid px-5 py-2.5"
            style={{ gridTemplateColumns: '1fr 1fr 1fr 80px 120px 100px', gap: '1rem', background: '#faf9ff', borderBottom: '1px solid #f3f1fb' }}>
            {['ユーザー', 'イベント', '券種', '枚数', '金額', 'ステータス'].map((h, i) => (
              <div key={i} className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9892b3' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm" style={{ color: '#9892b3' }}>読み込み中…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🧾</div>
              <div className="font-bold mb-1" style={{ color: '#221d4e' }}>購入履歴がありません</div>
              <div className="text-sm" style={{ color: '#9892b3' }}>ファンがチケットを購入すると、ここに表示されます</div>
            </div>
          ) : (
            filtered.map(req => {
              const sc = STATUS_CONFIG[req.status] ?? { label: req.status, bg: '#f0ebff', color: '#9892b3' }
              const initials = (req.user_display_name ?? req.user_email).slice(0, 2).toUpperCase()
              return (
                <div key={req.id} className="grid px-5 py-3.5 items-center"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 80px 120px 100px', gap: '1rem', borderBottom: '1px solid #f8f7ff' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#faf9ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>

                  {/* ユーザー */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#c0a6ff,#f199d5)', color: '#fff' }}>
                      {initials}
                    </div>
                    <span className="text-sm truncate" style={{ color: '#221d4e' }}>
                      {req.user_display_name ?? <span style={{ color: '#c7bcff', fontStyle: 'italic' }}>未設定</span>}
                    </span>
                  </div>

                  <div className="text-sm truncate" style={{ color: '#9892b3' }}>{req.event_title}</div>
                  <div className="text-sm truncate" style={{ color: '#221d4e', fontWeight: 600 }}>{req.ticket_name}</div>
                  <div className="text-sm tabular-nums" style={{ color: '#221d4e' }}>{req.quantity}枚</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: '#221d4e' }}>¥{req.amount.toLocaleString()}</div>
                  <div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
