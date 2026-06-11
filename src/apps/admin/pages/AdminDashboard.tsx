import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Plus, ArrowUpRight, Tag, Edit2, X, Check,
  Calendar, MapPin, Clock, FileText, Image, Link, Trash2,
  ToggleLeft, ToggleRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CARD = {
  background: '#ffffff',
  borderRadius: 22,
  border: '1px solid #ebe8f6',
  boxShadow: '0 8px 20px rgba(59,42,124,.06)',
} as const

const MODAL_CARD = {
  background: '#ffffff',
  borderRadius: 24,
  border: '1px solid #ebe8f6',
  boxShadow: '0 24px 60px rgba(59,42,124,.20)',
} as const

const OVERLAY = {
  background: 'rgba(29,19,74,.38)',
  backdropFilter: 'blur(6px)',
} as const

const inputStyle = { border: '1.5px solid #e8e6f3', color: '#221d4e', borderRadius: 12 } as const
const labelStyle = { color: '#9892b3', fontSize: 12, fontWeight: 600 } as const
const inputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#9c7cf2'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)'
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#e8e6f3'
    e.currentTarget.style.boxShadow = 'none'
  },
}

type ProtoStatus = 'preparing' | 'selling' | 'completed'
const STATUS_STYLES: Record<ProtoStatus, { bg: string; color: string }> = {
  selling:   { bg: '#e5f7eb', color: '#3d9b60' },
  preparing: { bg: '#fef9ec', color: '#c08a20' },
  completed: { bg: '#f3f3f8', color: '#888' },
}
const STATUS_LABELS: Record<ProtoStatus, string> = {
  selling: '販売中', preparing: '準備中', completed: '終了',
}

function toProto(s: string): ProtoStatus {
  if (s === 'published' || s === 'ongoing') return 'selling'
  if (s === 'completed' || s === 'cancelled') return 'completed'
  return 'preparing'
}
function fromProto(p: ProtoStatus): string {
  if (p === 'selling') return 'published'
  if (p === 'completed') return 'completed'
  return 'draft'
}

interface EventRow {
  id: string; title: string; date: string; venue: string | null
  status: string; capacity: number | null
}
interface PaymentRow {
  id: string; amount: number; paid_at: string | null; created_at: string
  ticket_types: { name: string; events: { title: string } | null } | null
}

interface AdBanner {
  id: string; title: string; imageUrl: string | null
  linkUrl: string; from: string; until: string; enabled: boolean
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState<{ id: string; title: string } | null>(null)
  const [detailModalId, setDetailModalId] = useState<string | null>(null)
  const [ticketModalId, setTicketModalId] = useState<string | null>(null)

  type EventForm = { title: string; date: string; venue: string; startTime: string; endTime: string; memo: string }
  const [eventForms, setEventForms] = useState<Record<string, EventForm>>({})

  const [ads, setAds] = useState<AdBanner[]>([
    { id: 'ad1', title: '開催予定イベント', imageUrl: null, linkUrl: '', from: '', until: '', enabled: true },
  ])
  const [adModalOpen, setAdModalOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<AdBanner | null>(null)
  const [adForm, setAdForm] = useState({ title: '', imageUrl: null as string | null, linkUrl: '', from: '', until: '', enabled: true })
  const adFileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const [evRes, payRes] = await Promise.all([
      supabase.from('events').select('id, title, date, venue, status, capacity').order('date'),
      supabase
        .from('payments')
        .select('id, amount, paid_at, created_at, ticket_types(name, events(title))')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(3),
    ])
    setEvents((evRes.data ?? []) as EventRow[])
    setPayments((payRes.data ?? []) as PaymentRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const upcomingEvents = events.filter(e => toProto(e.status) !== 'completed').slice(0, 4)
  const liveEvent = events.find(e => e.status === 'ongoing' || e.status === 'published')

  async function updateStatus(eventId: string, proto: ProtoStatus) {
    if (proto === 'completed') {
      const ev = events.find(e => e.id === eventId)
      setConfirmEnd({ id: eventId, title: ev?.title ?? '' })
      setStatusModalId(null)
      return
    }
    const newStatus = fromProto(proto)
    await (supabase.from('events') as any).update({ status: newStatus }).eq('id', eventId)
    setEvents(es => es.map(e => e.id === eventId ? { ...e, status: newStatus } : e))
    setStatusModalId(null)
  }

  async function doConfirmEnd() {
    if (!confirmEnd) return
    await (supabase.from('events') as any).update({ status: 'completed' }).eq('id', confirmEnd.id)
    setEvents(es => es.map(e => e.id === confirmEnd.id ? { ...e, status: 'completed' } : e))
    setConfirmEnd(null)
  }

  function openEventDetail(ev: EventRow) {
    if (!eventForms[ev.id]) {
      setEventForms(p => ({ ...p, [ev.id]: {
        title: ev.title, date: ev.date?.slice(0, 10) ?? '',
        venue: ev.venue ?? '', startTime: '14:00', endTime: '16:00', memo: '',
      }}))
    }
    setDetailModalId(ev.id)
  }

  async function saveEventDetail() {
    if (!detailModalId) return
    const form = eventForms[detailModalId]
    if (!form) return
    await (supabase.from('events') as any).update({
      title: form.title, date: form.date, venue: form.venue,
    }).eq('id', detailModalId)
    setEvents(es => es.map(e => e.id === detailModalId ? { ...e, title: form.title, date: form.date, venue: form.venue } : e))
    setDetailModalId(null)
  }

  function openAdModal(ad?: AdBanner) {
    if (ad) { setEditingAd(ad); setAdForm({ title: ad.title, imageUrl: ad.imageUrl, linkUrl: ad.linkUrl, from: ad.from, until: ad.until, enabled: ad.enabled }) }
    else { setEditingAd(null); setAdForm({ title: '', imageUrl: null, linkUrl: '', from: '', until: '', enabled: true }) }
    setAdModalOpen(true)
  }
  function saveAd() {
    if (!adForm.title.trim()) return
    if (editingAd) setAds(as => as.map(a => a.id === editingAd.id ? { ...a, ...adForm } : a))
    else setAds(as => [...as, { id: `ad-${Date.now()}`, ...adForm, imageUrl: adForm.imageUrl ?? null }])
    setAdModalOpen(false)
  }
  const toggleAd = (id: string) => setAds(as => as.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  const deleteAd = (id: string) => setAds(as => as.filter(a => a.id !== id))
  function handleAdImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAdForm(f => ({ ...f, imageUrl: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const today = new Date()
  const dateLabel = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  const detailEv = events.find(e => e.id === detailModalId)
  const ticketEv = events.find(e => e.id === ticketModalId)
  const statusEv = events.find(e => e.id === statusModalId)

  return (
    <div className="p-8 space-y-6">

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>ホーム</h1>
          <p className="text-sm mt-1" style={{ color: '#9892b3' }}>{dateLabel}</p>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-2 px-5 py-2.5 transition-opacity hover:opacity-85"
          style={{
            background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)',
            boxShadow: '0 8px 24px rgba(192,160,255,.22)',
            borderRadius: 14, color: '#fff', fontWeight: 600, fontSize: 13,
          }}
        >
          <Plus className="w-4 h-4" />
          イベントを作成
        </button>
      </div>

      {/* 開催中バナー */}
      {!loading && liveEvent && (
        <div
          className="rounded-[22px] p-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #b09ae0 0%, #c89cff 60%, #d8d0ff 100%)', boxShadow: '0 14px 38px rgba(124,58,237,.28)' }}
        >
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#77c792', boxShadow: '0 0 0 3px rgba(119,199,146,.30)' }} />
              <span className="text-sm font-medium opacity-80">現在開催中</span>
            </div>
            <div className="font-bold text-lg">{liveEvent.title}</div>
            <div className="text-sm opacity-70 mt-0.5">
              {new Date(liveEvent.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}　{liveEvent.venue ?? ''}
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/events')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors"
            style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.28)', borderRadius: 14, color: '#fff', backdropFilter: 'blur(12px)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.26)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.18)' }}
          >
            販売状況を確認
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2カラム */}
      <div className="grid grid-cols-5 gap-4">

        {/* 直近のイベント */}
        <div className="col-span-3 overflow-hidden transition-shadow hover:shadow-[0_16px_38px_rgba(72,56,141,.10)]" style={CARD}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
            <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>直近のイベント</h2>
            <button onClick={() => navigate('/admin/events')}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#9c7cf2' }}>
              すべて見る <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ background: '#faf9ff' }}>
                {['イベント名', '日付', 'ステータス', '操作'].map((h, i) => (
                  <th key={i}
                    className={`text-[11px] font-bold uppercase tracking-wider py-3 ${i === 0 ? 'px-6 text-left' : i === 3 ? 'px-4 text-right' : 'px-3 text-left'}`}
                    style={{ color: '#9892b3' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0,1,2].map(i => (
                  <tr key={i}><td colSpan={4} className="px-6 py-4">
                    <div className="h-5 rounded-lg animate-pulse" style={{ background: '#f3f1fb' }} />
                  </td></tr>
                ))
              ) : upcomingEvents.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-sm" style={{ color: '#9892b3' }}>開催予定のイベントはありません</td></tr>
              ) : upcomingEvents.map((ev, i) => {
                const proto = toProto(ev.status)
                const ss = STATUS_STYLES[proto]
                const dateStr = new Date(ev.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                return (
                  <tr key={ev.id} className="transition-colors" style={{ borderTop: '1px solid #f8f7ff' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm" style={{ color: '#221d4e' }}>{ev.title}</span>
                        {proto === 'selling' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#e5f7eb', color: '#3d9b60' }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#77c792' }} />
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: '#9892b3' }}>{ev.venue ?? ''}</div>
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap" style={{ color: '#6d6791' }}>{dateStr}</td>
                    <td className="px-3 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setStatusModalId(ev.id) }}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: ss.bg, color: ss.color, border: `1.5px solid ${ss.color}33` }}>
                        {STATUS_LABELS[proto]}
                        <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setTicketModalId(ev.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
                          style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.borderColor = '#c7bcff' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                          <Tag className="w-3 h-3" />商品
                        </button>
                        <button onClick={() => openEventDetail(ev)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
                          style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.borderColor = '#c7bcff' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                          <Edit2 className="w-3 h-3" />設定
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-3" style={{ borderTop: '1px solid #f3f1fb', background: '#faf9ff' }}>
            <button onClick={() => navigate('/admin/events')}
              className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#9c7cf2' }}>
              <Plus className="w-4 h-4" />イベントを作成
            </button>
          </div>
        </div>

        {/* 最近の購入 */}
        <div className="col-span-2 overflow-hidden transition-shadow hover:shadow-[0_16px_38px_rgba(72,56,141,.10)]" style={CARD}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
            <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>最近の購入</h2>
            <button onClick={() => navigate('/admin/sales')}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#9c7cf2' }}>
              すべて見る
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-4 space-y-4">
              {[0,1,2].map(i => <div key={i} className="h-8 rounded-xl animate-pulse" style={{ background: '#f3f1fb' }} />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm" style={{ color: '#9892b3' }}>購入履歴はありません</div>
          ) : (
            <div>
              {payments.map((p, i) => (
                <div key={p.id} className="px-5 py-4"
                  style={{ borderTop: i > 0 ? '1px solid #f8f7ff' : undefined }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm" style={{ color: '#221d4e' }}>
                      {(p.ticket_types as any)?.events?.title ?? '—'}
                    </span>
                    <span className="text-[11px]" style={{ color: '#c7bcff' }}>
                      {new Date(p.paid_at ?? p.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#6d6791' }}>{(p.ticket_types as any)?.name ?? ''}</span>
                    <span className="text-xs font-bold" style={{ color: '#9c7cf2' }}>
                      ¥{p.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3.5" style={{ borderTop: '1px solid #f3f1fb', background: '#faf9ff' }}>
            <button onClick={() => navigate('/admin/sales')}
              className="w-full text-center text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#9c7cf2' }}>
              売上レポートを確認 →
            </button>
          </div>
        </div>
      </div>

      {/* 広告バナー設定 */}
      <div style={CARD} className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0ebff, #e8e2ff)' }}>
              <Image className="w-3.5 h-3.5" style={{ color: '#9c7cf2' }} />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>広告バナー設定</h2>
              <p className="text-xs" style={{ color: '#9892b3' }}>ファンサイトに表示する広告を管理</p>
            </div>
          </div>
          <button onClick={() => openAdModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(192,160,255,.22)' }}>
            <Plus className="w-3.5 h-3.5" />広告を追加
          </button>
        </div>

        {ads.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: '#9892b3' }}>広告バナーがありません</div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f8f7ff' }}>
            {ads.map(ad => (
              <div key={ad.id} className="flex items-center gap-4 px-6 py-4 transition-colors"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <div className="w-14 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: ad.imageUrl ? 'transparent' : 'linear-gradient(135deg, #f0ebff, #e8e2ff)', border: '1px solid #ebe8f6' }}>
                  {ad.imageUrl
                    ? <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    : <Image className="w-5 h-5" style={{ color: '#c7bcff' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm truncate" style={{ color: '#221d4e' }}>{ad.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={ad.enabled ? { background: '#e5f7eb', color: '#3d9b60' } : { background: '#f3f3f8', color: '#aaa' }}>
                      {ad.enabled ? '公開中' : '非公開'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#9892b3' }}>
                    {ad.from && ad.until && <span>{ad.from} 〜 {ad.until}</span>}
                    {ad.linkUrl && (
                      <span className="flex items-center gap-0.5 truncate max-w-[200px]">
                        <Link className="w-3 h-3 flex-shrink-0" />{ad.linkUrl}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleAd(ad.id)}
                    className="p-1.5 rounded-xl transition-all"
                    style={{ color: ad.enabled ? '#9c7cf2' : '#aaa', border: '1.5px solid #ebe8f6' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    {ad.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openAdModal(ad)}
                    className="p-1.5 rounded-xl transition-all"
                    style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteAd(ad.id)}
                    className="p-1.5 rounded-xl transition-all"
                    style={{ color: '#f08aa0', border: '1.5px solid #ffc8d5' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff0f4' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 広告編集モーダル */}
      {adModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={OVERLAY} onClick={() => setAdModalOpen(false)}>
          <div className="w-full max-w-lg mx-4 overflow-hidden" style={{ ...MODAL_CARD, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #f3f1fb' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: '#221d4e' }}>{editingAd ? '広告を編集' : '広告を追加'}</h3>
                <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>ファンサイトに表示するバナー広告の設定</p>
              </div>
              <button onClick={() => setAdModalOpen(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#9892b3' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label style={labelStyle}>バナー画像</label>
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl cursor-pointer transition-colors overflow-hidden relative"
                  style={{ border: '2px dashed #e8e6f3', background: adForm.imageUrl ? 'transparent' : '#faf9ff' }}
                  onMouseEnter={e => { if (!adForm.imageUrl) e.currentTarget.style.borderColor = '#9c7cf2' }}
                  onMouseLeave={e => { if (!adForm.imageUrl) e.currentTarget.style.borderColor = '#e8e6f3' }}>
                  {adForm.imageUrl ? (
                    <>
                      <img src={adForm.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <Image className="w-5 h-5 text-white" />
                        <span className="text-[11px] text-white font-medium">変更する</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Image className="w-7 h-7 mb-2" style={{ color: '#c7bcff' }} />
                      <span className="text-sm font-medium" style={{ color: '#9892b3' }}>クリックして画像をアップロード</span>
                    </>
                  )}
                  <input ref={adFileRef} type="file" accept="image/*" className="hidden" onChange={handleAdImage} />
                </label>
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle}>タイトル <span style={{ color: '#f08aa0' }}>*</span></label>
                <input value={adForm.title} onChange={e => setAdForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：5月限定キャンペーン" className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all"
                  style={inputStyle} {...inputFocusHandlers} autoFocus />
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle} className="flex items-center gap-1"><Link className="w-3 h-3" />リンク先URL</label>
                <input value={adForm.linkUrl} onChange={e => setAdForm(f => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://example.com" className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all"
                  style={inputStyle} {...inputFocusHandlers} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><Calendar className="w-3 h-3" />表示開始日</label>
                  <input type="date" value={adForm.from.replace(/\//g, '-')}
                    onChange={e => setAdForm(f => ({ ...f, from: e.target.value.replace(/-/g, '/') }))}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                </div>
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><Calendar className="w-3 h-3" />表示終了日</label>
                  <input type="date" value={adForm.until.replace(/\//g, '-')}
                    onChange={e => setAdForm(f => ({ ...f, until: e.target.value.replace(/-/g, '/') }))}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#faf9ff', border: '1.5px solid #ebe8f6' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#221d4e' }}>ファンサイトに公開</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>オフにすると非公開になります</p>
                </div>
                <button onClick={() => setAdForm(f => ({ ...f, enabled: !f.enabled }))}>
                  {adForm.enabled
                    ? <ToggleRight className="w-8 h-8" style={{ color: '#9c7cf2' }} />
                    : <ToggleLeft className="w-8 h-8" style={{ color: '#d0cce8' }} />}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid #f3f1fb' }}>
              <button onClick={() => setAdModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: '#f0ebff', color: '#9892b3' }}>
                キャンセル
              </button>
              <button onClick={saveAd} disabled={!adForm.title.trim()}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity"
                style={{
                  background: adForm.title.trim() ? 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)' : '#e8e6f3',
                  color: adForm.title.trim() ? '#fff' : '#9892b3',
                  cursor: adForm.title.trim() ? 'pointer' : 'not-allowed',
                }}>
                {editingAd ? '保存する' : '追加する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ステータス選択モーダル */}
      {statusModalId && statusEv && (() => {
        const currentProto = toProto(statusEv.status)
        const options = [
          { key: 'preparing' as const, label: '準備中', desc: 'チケット販売前の状態', sub: 'ファンサイトでは「近日公開」と表示されます',
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#c08a20" strokeWidth="1.8"/><path d="M11 7v4l2.5 2.5" stroke="#c08a20" strokeWidth="1.8" strokeLinecap="round"/></svg> },
          { key: 'selling' as const, label: '販売中', desc: 'チケット販売受付中', sub: 'ファンサイトで購入・予約が可能な状態です',
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#3d9b60" strokeWidth="1.8"/><path d="M7 11l3 3 5-5" stroke="#3d9b60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { key: 'completed' as const, label: '終了', desc: '販売・イベント終了', sub: 'チケット販売を停止します', danger: true,
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#f08aa0" strokeWidth="1.8"/><path d="M14 8L8 14M8 8l6 6" stroke="#f08aa0" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        ] as const
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(29,19,74,.38)', backdropFilter: 'blur(6px)' }}
            onClick={() => setStatusModalId(null)}>
            <div className="w-full max-w-sm mx-4" style={{ background: '#ffffff', borderRadius: 28, border: '1px solid #ebe8f6', boxShadow: '0 24px 60px rgba(59,42,124,.22)', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f3f1fb' }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#c7bcff' }}>ステータスを変更</p>
                  <h3 className="font-bold text-sm" style={{ color: '#221d4e' }}>{statusEv.title}</h3>
                </div>
                <button onClick={() => setStatusModalId(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#9892b3' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-2.5">
                {options.map(({ key, label, desc, icon, danger }) => {
                  const isCurrent = currentProto === key
                  const sss = STATUS_STYLES[key]
                  return (
                    <button key={key} onClick={() => updateStatus(statusModalId, key)} disabled={isCurrent}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                      style={{ border: isCurrent ? `2px solid ${sss.color}55` : '1.5px solid #ebe8f6', background: isCurrent ? sss.bg : '#fafafa', cursor: isCurrent ? 'default' : 'pointer' }}
                      onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.border = `1.5px solid ${sss.color}55`; e.currentTarget.style.background = sss.bg } }}
                      onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.border = '1.5px solid #ebe8f6'; e.currentTarget.style.background = '#fafafa' } }}>
                      <div className="flex-shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold" style={{ color: danger ? '#f08aa0' : sss.color }}>{label}</span>
                          {isCurrent && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: sss.bg, color: sss.color }}>現在</span>}
                        </div>
                        <p className="text-xs font-medium" style={{ color: '#221d4e' }}>{desc}</p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 flex-shrink-0" style={{ color: sss.color }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 終了確認モーダル */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(29,19,74,.40)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm mx-4 overflow-hidden" style={{ background: '#ffffff', borderRadius: 24, border: '1px solid #ebe8f6', boxShadow: '0 24px 60px rgba(59,42,124,.22)' }}>
            <div className="flex flex-col items-center px-8 pt-8 pb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #fff0f4 0%, #ffe9ef 100%)', border: '1px solid #ffc8d5' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="#f08aa0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-base font-bold mb-1 text-center" style={{ color: '#221d4e' }}>イベントを終了しますか？</h3>
              <p className="text-sm text-center leading-relaxed" style={{ color: '#9892b3' }}>
                <span className="font-semibold" style={{ color: '#221d4e' }}>「{confirmEnd.title}」</span>
                のステータスを「終了」に変更します。<br />チケット販売が停止されます。
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={() => setConfirmEnd(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl" style={{ background: '#f0ebff', color: '#9892b3' }}>キャンセル</button>
              <button onClick={doConfirmEnd} className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity hover:opacity-85"
                style={{ background: 'linear-gradient(90deg, #f08aa0 0%, #e86d8a 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(240,138,160,.30)' }}>
                終了する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品設定モーダル（UI only） */}
      {ticketModalId && ticketEv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={OVERLAY} onClick={() => setTicketModalId(null)}>
          <div className="w-full max-w-lg mx-4 overflow-hidden" style={{ ...MODAL_CARD, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #f3f1fb' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: '#221d4e' }}>商品設定</h3>
                <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>{ticketEv.title}</p>
              </div>
              <button onClick={() => setTicketModalId(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#9892b3' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-8 text-center text-sm flex-1" style={{ color: '#9892b3' }}>
              <Tag className="w-8 h-8 mx-auto mb-3" style={{ color: '#c7bcff' }} />
              イベント管理ページでチケット種別を設定してください。
            </div>
            <div className="px-6 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid #f3f1fb' }}>
              <button onClick={() => setTicketModalId(null)} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: '#f0ebff', color: '#9892b3' }}>閉じる</button>
              <button onClick={() => { setTicketModalId(null); navigate('/admin/events') }}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity hover:opacity-85"
                style={{ background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(192,160,255,.22)' }}>
                イベント管理へ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* イベント設定モーダル */}
      {detailModalId && detailEv && (() => {
        const form = eventForms[detailModalId] ?? { title: detailEv.title, date: detailEv.date?.slice(0, 10) ?? '', venue: detailEv.venue ?? '', startTime: '14:00', endTime: '16:00', memo: '' }
        const update = (field: string, value: string) =>
          setEventForms(p => ({ ...p, [detailModalId]: { ...(p[detailModalId] ?? form), [field]: value } }))
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={OVERLAY} onClick={() => setDetailModalId(null)}>
            <div className="w-full max-w-xl mx-4 overflow-hidden" style={{ ...MODAL_CARD, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #f3f1fb' }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: '#221d4e' }}>イベント設定</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>{detailEv.title}</p>
                </div>
                <button onClick={() => setDetailModalId(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#9892b3' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label style={labelStyle}>イベント名</label>
                  <input value={form.title} onChange={e => update('title', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label style={labelStyle} className="flex items-center gap-1"><Calendar className="w-3 h-3" />開催日</label>
                    <input type="date" value={form.date} onChange={e => update('date', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                  </div>
                  <div className="space-y-1.5">
                    <label style={labelStyle} className="flex items-center gap-1"><MapPin className="w-3 h-3" />会場</label>
                    <input value={form.venue} onChange={e => update('venue', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                  </div>
                  <div className="space-y-1.5">
                    <label style={labelStyle} className="flex items-center gap-1"><Clock className="w-3 h-3" />開始時間</label>
                    <input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                  </div>
                  <div className="space-y-1.5">
                    <label style={labelStyle} className="flex items-center gap-1"><Clock className="w-3 h-3" />終了時間</label>
                    <input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><FileText className="w-3 h-3" />メモ・詳細</label>
                  <textarea value={form.memo} onChange={e => update('memo', e.target.value)}
                    placeholder="スタッフへの連絡事項、当日の注意点など..." rows={4}
                    className="w-full px-4 py-3 text-sm focus:outline-none transition-all resize-none"
                    style={{ ...inputStyle, borderRadius: 12 }} {...inputFocusHandlers} />
                </div>
              </div>
              <div className="px-6 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid #f3f1fb' }}>
                <button onClick={() => setDetailModalId(null)} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: '#f0ebff', color: '#9892b3' }}>キャンセル</button>
                <button onClick={saveEventDetail} className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity hover:opacity-85"
                  style={{ background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(192,160,255,.22)' }}>
                  保存
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
