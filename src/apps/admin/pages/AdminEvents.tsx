import { useState, useEffect } from 'react'
import { Plus, Tag, Search, X, Calendar, MapPin, Clock, FileText, Users, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Event, TicketType, EventStatus } from '@/types'

interface EventWithTickets extends Event {
  ticket_types: TicketType[]
}

type EventForm = { title: string; description: string; date: string; venue: string; startTime: string; endTime: string; status: EventStatus }
type TicketForm = { name: string; description: string; price: string; stock: string }
type TabKey = 'all' | 'upcoming' | 'completed'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const
const MODAL_CARD = { background: '#ffffff', borderRadius: 24, border: '1px solid #ebe8f6', boxShadow: '0 24px 60px rgba(59,42,124,.20)' } as const
const OVERLAY = { background: 'rgba(29,19,74,.38)', backdropFilter: 'blur(6px)' } as const
const inputStyle = { border: '1.5px solid #e8e6f3', color: '#221d4e', borderRadius: 12 } as const
const labelStyle = { color: '#9892b3', fontSize: 12, fontWeight: 600 } as const
const inputFH = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' },
  onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#e8e6f3';  e.currentTarget.style.boxShadow = 'none' },
}

type ProtoStatus = 'preparing' | 'selling' | 'completed'
const PROTO_STYLES: Record<ProtoStatus, { bg: string; color: string }> = {
  selling:   { bg: '#e5f7eb', color: '#3d9b60' },
  preparing: { bg: '#fef9ec', color: '#c08a20' },
  completed: { bg: '#f3f3f8', color: '#888' },
}
const PROTO_LABELS: Record<ProtoStatus, string> = { selling: '販売中', preparing: '準備中', completed: '終了' }
function toProto(s: EventStatus): ProtoStatus {
  if (s === 'published' || s === 'ongoing') return 'selling'
  if (s === 'completed' || s === 'cancelled') return 'completed'
  return 'preparing'
}
function fromProto(p: ProtoStatus): EventStatus {
  if (p === 'selling') return 'published'
  if (p === 'completed') return 'completed'
  return 'draft'
}

function soldCount(ev: EventWithTickets): number {
  return ev.ticket_types.reduce((s, t) => s + (t.stock - t.stock_remaining), 0)
}

const EMPTY_EVENT: EventForm = { title: '', description: '', date: '', venue: '', startTime: '14:00', endTime: '16:00', status: 'draft' }
const EMPTY_TICKET: TicketForm = { name: '', description: '', price: '', stock: '' }

export function AdminEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventWithTickets[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  const [eventModal, setEventModal] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingEvent, setEditingEvent] = useState<EventWithTickets | null>(null)
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT)
  const [eventSaving, setEventSaving] = useState(false)

  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState<{ id: string; title: string } | null>(null)

  const [ticketModal, setTicketModal] = useState<EventWithTickets | null>(null)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [ticketForm, setTicketForm] = useState<TicketForm>(EMPTY_TICKET)
  const [ticketSaving, setTicketSaving] = useState(false)

  async function fetchEvents() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*, ticket_types(*)').order('date', { ascending: false })
    setEvents((data ?? []) as EventWithTickets[])
    setLoading(false)
  }
  useEffect(() => { fetchEvents() }, [])

  function openCreate() { setEventForm(EMPTY_EVENT); setEditingEvent(null); setEventModal('create') }
  function openEdit(ev: EventWithTickets) {
    setEditingEvent(ev)
    setEventForm({ title: ev.title, description: ev.description ?? '', date: ev.date.slice(0, 10), venue: ev.venue, startTime: '14:00', endTime: '16:00', status: ev.status })
    setEventModal('edit')
  }

  async function saveEvent() {
    if (!eventForm.title || !eventForm.date || !eventForm.venue) return
    setEventSaving(true)
    const dateTime = eventForm.date + 'T' + eventForm.startTime + ':00'
    if (eventModal === 'create') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('events') as any).insert({ title: eventForm.title, description: eventForm.description || null, date: dateTime, venue: eventForm.venue, status: eventForm.status, created_by: user!.id })
    } else if (editingEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('events') as any).update({ title: eventForm.title, description: eventForm.description || null, date: dateTime, venue: eventForm.venue, status: eventForm.status }).eq('id', editingEvent.id)
    }
    setEventSaving(false); setEventModal('closed'); fetchEvents()
  }

  async function updateStatus(eventId: string, proto: ProtoStatus) {
    if (proto === 'completed') {
      const ev = events.find(e => e.id === eventId)
      setConfirmEnd({ id: eventId, title: ev?.title ?? '' }); setStatusModalId(null); return
    }
    const newStatus = fromProto(proto)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('events') as any).update({ status: newStatus }).eq('id', eventId)
    setEvents(es => es.map(e => e.id === eventId ? { ...e, status: newStatus } : e)); setStatusModalId(null)
  }

  async function doConfirmEnd() {
    if (!confirmEnd) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('events') as any).update({ status: 'completed' }).eq('id', confirmEnd.id)
    setEvents(es => es.map(e => e.id === confirmEnd.id ? { ...e, status: 'completed' } : e)); setConfirmEnd(null)
  }

  function openTickets(ev: EventWithTickets) { setTicketModal(ev); setEditingTicket(null); setTicketForm(EMPTY_TICKET) }
  function startEditTicket(t: TicketType) { setEditingTicket(t); setTicketForm({ name: t.name, description: t.description ?? '', price: String(t.price), stock: String(t.stock) }) }

  async function refreshTicketModal(eventId: string) {
    const { data } = await supabase.from('events').select('*, ticket_types(*)').eq('id', eventId).single()
    if (data) setTicketModal(data as EventWithTickets)
    fetchEvents()
  }

  async function saveTicket() {
    if (!ticketModal || !ticketForm.name || !ticketForm.price || !ticketForm.stock) return
    setTicketSaving(true)
    const price = parseInt(ticketForm.price), stock = parseInt(ticketForm.stock)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ttTable = supabase.from('ticket_types') as any
    if (editingTicket) {
      const soldCount = editingTicket.stock - editingTicket.stock_remaining
      await ttTable.update({ name: ticketForm.name, description: ticketForm.description || null, price, stock, stock_remaining: Math.max(0, stock - soldCount) }).eq('id', editingTicket.id)
    } else {
      await ttTable.insert({ event_id: ticketModal.id, name: ticketForm.name, description: ticketForm.description || null, price, stock, stock_remaining: stock })
    }
    setTicketSaving(false); setEditingTicket(null); setTicketForm(EMPTY_TICKET); refreshTicketModal(ticketModal.id)
  }

  async function deleteTicket(t: TicketType) {
    if (!confirm(`「${t.name}」を削除しますか？`)) return
    await supabase.from('ticket_types').delete().eq('id', t.id)
    if (ticketModal) refreshTicketModal(ticketModal.id)
  }

  const tabs: { key: TabKey; label: string }[] = [{ key: 'all', label: 'すべて' }, { key: 'upcoming', label: '開催予定' }, { key: 'completed', label: '終了済み' }]
  const filtered = events.filter(ev => {
    if (activeTab === 'upcoming' && (ev.status === 'completed' || ev.status === 'cancelled')) return false
    if (activeTab === 'completed' && ev.status !== 'completed' && ev.status !== 'cancelled') return false
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const canSaveEvent  = !!eventForm.title && !!eventForm.date && !!eventForm.venue
  const canSaveTicket = !!ticketForm.name && !!ticketForm.price && !!ticketForm.stock
  const statusEv      = events.find(e => e.id === statusModalId)

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%)', border: '1px solid #ebe8f6' }}>
            <Calendar className="w-5 h-5" style={{ color: '#9c7cf2' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>イベント一覧</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9892b3' }}>{filtered.length} 件</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)', boxShadow: '0 8px 24px rgba(192,160,255,.22)', borderRadius: 14, color: '#fff' }}>
          <Plus className="w-4 h-4" />イベントを作成
        </button>
      </div>

      {/* Table card */}
      <div style={CARD} className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={activeTab === tab.key ? { background: 'linear-gradient(90deg, #c89cff, #a79fff)', color: '#fff' } : { color: '#9892b3' }}
                onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.background = '#f0ebff' }}
                onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent' }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9892b3' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="イベント名で検索"
              className="pl-9 pr-4 py-2 text-sm focus:outline-none w-64" style={{ border: '1.5px solid #e8e6f3', borderRadius: 12 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }} />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ background: '#faf9ff' }}>
              {[
                { label: 'イベント名', cls: 'px-6 text-left' },
                { label: '日付',       cls: 'px-4 text-left' },
                { label: '会場',       cls: 'px-4 text-left' },
                { label: 'ステータス', cls: 'px-4 text-left' },
                { label: '販売数',     cls: 'px-4 text-right' },
                { label: '操作',       cls: 'px-4 text-right' },
              ].map(({ label, cls }) => (
                <th key={label} className={`text-[11px] font-bold uppercase tracking-wider py-3 ${cls}`} style={{ color: '#9892b3' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0,1,2].map(i => (
                <tr key={i}><td colSpan={6} className="px-6 py-4">
                  <div className="h-5 rounded-lg animate-pulse" style={{ background: '#f3f1fb' }} />
                </td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: '#9892b3' }}>
                該当するイベントがありません
              </td></tr>
            ) : filtered.map((ev, i) => {
              const proto = toProto(ev.status)
              const ss = PROTO_STYLES[proto]
              const sold = soldCount(ev)
              const totalCap = ev.ticket_types.reduce((s, t) => s + t.stock, 0)
              const dateStr = new Date(ev.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
              return (
                <tr key={ev.id} className="transition-colors" style={{ borderTop: i === 0 ? 'none' : '1px solid #f8f7ff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm" style={{ color: '#221d4e' }}>{ev.title}</span>
                      {proto === 'selling' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#e5f7eb', color: '#3d9b60' }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#77c792' }} />LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: '#9892b3' }}>{ev.ticket_types.length} 種別</div>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap" style={{ color: '#6d6791' }}>{dateStr}</td>
                  <td className="px-4 py-4 text-sm" style={{ color: '#6d6791' }}>{ev.venue}</td>
                  <td className="px-4 py-4">
                    <button onClick={e => { e.stopPropagation(); setStatusModalId(ev.id) }}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                      style={{ background: ss.bg, color: ss.color, border: `1.5px solid ${ss.color}33` }}>
                      {PROTO_LABELS[proto]}
                      <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-right" style={{ color: '#6d6791' }}>
                    <span className="font-semibold" style={{ color: '#221d4e' }}>{sold}</span>
                    {totalCap > 0 && <span style={{ color: '#9892b3' }}> / {totalCap}</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => { window.location.href = '/admin/staff' }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
                        style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.borderColor = '#c7bcff' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                        <Users className="w-3 h-3" />スタッフ
                      </button>
                      <button onClick={() => openTickets(ev)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
                        style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.borderColor = '#c7bcff' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                        <Tag className="w-3 h-3" />商品
                      </button>
                      <button onClick={() => openEdit(ev)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
                        style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.borderColor = '#c7bcff' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5a2.121 2.121 0 013 3L5 15l-4 1 1-4L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        設定
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="px-6 py-3" style={{ borderTop: '1px solid #f3f1fb', background: '#faf9ff' }}>
          <button onClick={openCreate}
            className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: '#9c7cf2' }}>
            <Plus className="w-4 h-4" />イベントを追加
          </button>
        </div>
      </div>

      {/* ステータス変更モーダル */}
      {statusModalId && statusEv && (() => {
        const currentProto = toProto(statusEv.status)
        const options = [
          { key: 'preparing' as const, label: '準備中', desc: 'チケット販売前の状態',
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#c08a20" strokeWidth="1.8"/><path d="M11 7v4l2.5 2.5" stroke="#c08a20" strokeWidth="1.8" strokeLinecap="round"/></svg> },
          { key: 'selling' as const, label: '販売中', desc: 'チケット販売受付中',
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#3d9b60" strokeWidth="1.8"/><path d="M7 11l3 3 5-5" stroke="#3d9b60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          { key: 'completed' as const, label: '終了', desc: '販売・イベント終了',
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#f08aa0" strokeWidth="1.8"/><path d="M14 8L8 14M8 8l6 6" stroke="#f08aa0" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        ] as const
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={OVERLAY} onClick={() => setStatusModalId(null)}>
            <div className="w-full max-w-sm mx-4 overflow-hidden" style={{ ...MODAL_CARD, borderRadius: 28 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f3f1fb' }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#c7bcff' }}>ステータスを変更</p>
                  <h3 className="font-bold text-sm" style={{ color: '#221d4e' }}>{statusEv.title}</h3>
                </div>
                <button onClick={() => setStatusModalId(null)} className="p-1.5 rounded-lg" style={{ color: '#9892b3' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-2.5">
                {options.map(({ key, label, desc, icon, danger }) => {
                  const isCurrent = currentProto === key
                  const sss = PROTO_STYLES[key]
                  return (
                    <button key={key} onClick={() => updateStatus(statusModalId, key)} disabled={isCurrent}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                      style={{ border: isCurrent ? `2px solid ${sss.color}55` : '1.5px solid #ebe8f6', background: isCurrent ? sss.bg : '#fafafa', cursor: isCurrent ? 'default' : 'pointer' }}
                      onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.border = `1.5px solid ${sss.color}55`; e.currentTarget.style.background = sss.bg } }}
                      onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.border = '1.5px solid #ebe8f6'; e.currentTarget.style.background = '#fafafa' } }}>
                      {icon}
                      <div className="flex-1">
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

      {/* 終了確認 */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(29,19,74,.40)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm mx-4 overflow-hidden" style={{ background: '#ffffff', borderRadius: 24, border: '1px solid #ebe8f6', boxShadow: '0 24px 60px rgba(59,42,124,.22)' }}>
            <div className="flex flex-col items-center px-8 pt-8 pb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #fff0f4, #ffe9ef)', border: '1px solid #ffc8d5' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f08aa0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-base font-bold mb-1 text-center" style={{ color: '#221d4e' }}>イベントを終了しますか？</h3>
              <p className="text-sm text-center leading-relaxed" style={{ color: '#9892b3' }}>
                <span className="font-semibold" style={{ color: '#221d4e' }}>「{confirmEnd.title}」</span>を終了します。<br />チケット販売が停止されます。
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

      {/* イベント作成/編集モーダル */}
      {eventModal !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={OVERLAY} onClick={() => setEventModal('closed')}>
          <div className="w-full max-w-xl mx-4 overflow-hidden" style={{ ...MODAL_CARD, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #f3f1fb' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: '#221d4e' }}>
                  {eventModal === 'create' ? 'イベントを作成' : 'イベント設定'}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>
                  {eventModal === 'create' ? '新しいイベントの基本情報を入力してください' : editingEvent?.title}
                </p>
              </div>
              <button onClick={() => setEventModal('closed')} className="p-1.5 rounded-lg" style={{ color: '#9892b3' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label style={labelStyle}>イベント名 <span style={{ color: '#f08aa0' }}>*</span></label>
                <input type="text" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：定期公演 特典会" className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><Calendar className="w-3 h-3" />開催日 <span style={{ color: '#f08aa0' }}>*</span></label>
                  <input type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} />
                </div>
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><MapPin className="w-3 h-3" />会場 <span style={{ color: '#f08aa0' }}>*</span></label>
                  <input type="text" value={eventForm.venue} onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))}
                    placeholder="例：渋谷ストリームホール" className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} />
                </div>
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><Clock className="w-3 h-3" />開始時間</label>
                  <input type="time" value={eventForm.startTime} onChange={e => setEventForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} />
                </div>
                <div className="space-y-1.5">
                  <label style={labelStyle} className="flex items-center gap-1"><Clock className="w-3 h-3" />終了時間</label>
                  <input type="time" value={eventForm.endTime} onChange={e => setEventForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle}>ステータス</label>
                <select value={eventForm.status} onChange={e => setEventForm(f => ({ ...f, status: e.target.value as EventStatus }))}
                  className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all" style={{ ...inputStyle, background: '#fff' }} {...inputFH}>
                  <option value="draft">準備中</option>
                  <option value="published">販売中</option>
                  <option value="ongoing">開催中</option>
                  <option value="completed">終了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle} className="flex items-center gap-1"><FileText className="w-3 h-3" />説明（任意）</label>
                <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="イベントの詳細..."
                  className="w-full px-4 py-3 text-sm focus:outline-none transition-all resize-none"
                  style={{ ...inputStyle, borderRadius: 12 }} {...inputFH} />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid #f3f1fb' }}>
              <button onClick={() => setEventModal('closed')} className="flex-1 py-2.5 text-sm font-medium rounded-xl" style={{ background: '#f0ebff', color: '#9892b3' }}>キャンセル</button>
              <button onClick={saveEvent} disabled={eventSaving || !canSaveEvent} className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity"
                style={{ background: canSaveEvent ? 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)' : '#e8e6f3', color: canSaveEvent ? '#fff' : '#9892b3', cursor: canSaveEvent ? 'pointer' : 'not-allowed', opacity: eventSaving ? 0.7 : 1 }}>
                {eventSaving ? '保存中...' : eventModal === 'create' ? '作成する' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* チケット種別モーダル */}
      {ticketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={OVERLAY} onClick={() => { setTicketModal(null); setEditingTicket(null) }}>
          <div className="w-full max-w-lg mx-4 overflow-hidden" style={{ ...MODAL_CARD, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #f3f1fb' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: '#221d4e' }}>チケット種別</h3>
                <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>{ticketModal.title}</p>
              </div>
              <button onClick={() => { setTicketModal(null); setEditingTicket(null) }} className="p-1.5 rounded-lg" style={{ color: '#9892b3' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
              {ticketModal.ticket_types.length === 0 && !editingTicket && (
                <p className="text-sm text-center py-4" style={{ color: '#9892b3' }}>チケット種別がありません</p>
              )}
              {ticketModal.ticket_types.map(t => (
                <div key={t.id} className="rounded-2xl transition-all"
                  style={{ border: editingTicket?.id === t.id ? '1.5px solid #c7bcff' : '1.5px solid #ebe8f6', background: editingTicket?.id === t.id ? '#f6f4ff' : '#fafafa' }}>
                  {editingTicket?.id === t.id ? (
                    <div className="p-4">
                      <TicketTypeForm form={ticketForm} onChange={setTicketForm} saving={ticketSaving} canSave={canSaveTicket}
                        onSave={saveTicket} onCancel={() => { setEditingTicket(null); setTicketForm(EMPTY_TICKET) }} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#221d4e' }}>{t.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#9892b3' }}>
                          ¥{t.price.toLocaleString()} · 残り {t.stock_remaining}/{t.stock} 枚
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => startEditTicket(t)} className="p-1.5 rounded-xl transition-all"
                          style={{ color: '#9892b3', border: '1.5px solid #ebe8f6' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff'; e.currentTarget.style.color = '#9c7cf2'; e.currentTarget.style.borderColor = '#c7bcff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9892b3'; e.currentTarget.style.borderColor = '#ebe8f6' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5a2.121 2.121 0 013 3L5 15l-4 1 1-4L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => deleteTicket(t)} className="p-1.5 rounded-xl transition-all"
                          style={{ color: '#f08aa0', border: '1.5px solid #ffc8d5' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fff0f4' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!editingTicket && (
                <div className="rounded-2xl p-4" style={{ background: '#faf9ff', border: '2px dashed #e8e6f3' }}>
                  <p className="text-xs font-bold mb-3" style={{ color: '#9892b3' }}>新しいチケット種別を追加</p>
                  <TicketTypeForm form={ticketForm} onChange={setTicketForm} saving={ticketSaving} canSave={canSaveTicket}
                    onSave={saveTicket} onCancel={null} isNew />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TicketTypeForm({ form, onChange, saving, canSave, onSave, onCancel, isNew }: {
  form: TicketForm; onChange: React.Dispatch<React.SetStateAction<TicketForm>>
  saving: boolean; canSave: boolean; onSave: () => void; onCancel: (() => void) | null; isNew?: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label style={labelStyle}>名前 <span style={{ color: '#f08aa0' }}>*</span></label>
          <input type="text" value={form.name} onChange={e => onChange(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} placeholder="例：2ショット" />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>価格 (円) <span style={{ color: '#f08aa0' }}>*</span></label>
          <input type="number" value={form.price} onChange={e => onChange(f => ({ ...f, price: e.target.value }))}
            className="w-full px-3 py-2 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} placeholder="3000" min="0" />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>在庫数 <span style={{ color: '#f08aa0' }}>*</span></label>
          <input type="number" value={form.stock} onChange={e => onChange(f => ({ ...f, stock: e.target.value }))}
            className="w-full px-3 py-2 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} placeholder="100" min="0" />
        </div>
        <div className="space-y-1.5">
          <label style={labelStyle}>説明（任意）</label>
          <input type="text" value={form.description} onChange={e => onChange(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 text-sm focus:outline-none transition-all" style={inputStyle} {...inputFH} placeholder="..." />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-xl" style={{ background: '#f0ebff', color: '#9892b3' }}>キャンセル</button>}
        <button onClick={onSave} disabled={saving || !canSave} className="px-4 py-2 text-sm font-bold rounded-xl transition-opacity"
          style={{ background: canSave ? 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)' : '#e8e6f3', color: canSave ? '#fff' : '#9892b3', cursor: canSave ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
          {saving ? '保存中...' : isNew ? '追加' : '更新'}
        </button>
      </div>
    </div>
  )
}
