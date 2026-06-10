import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Ticket, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Event, TicketType, EventStatus } from '@/types'

interface EventWithTickets extends Event {
  ticket_types: TicketType[]
}

type EventForm = {
  title: string
  description: string
  date: string
  venue: string
  status: EventStatus
}

type TicketForm = {
  name: string
  description: string
  price: string
  stock: string
}

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: '下書き',
  published: '公開中',
  ongoing: '開催中',
  completed: '終了',
  cancelled: 'キャンセル',
}

const STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-500',
  published: 'bg-blue-50 text-blue-700',
  ongoing: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-400',
  cancelled: 'bg-red-50 text-red-600',
}

const EMPTY_EVENT: EventForm = { title: '', description: '', date: '', venue: '', status: 'draft' }
const EMPTY_TICKET: TicketForm = { name: '', description: '', price: '', stock: '' }

export function AdminEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventWithTickets[]>([])
  const [loading, setLoading] = useState(true)

  const [eventModal, setEventModal] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editingEvent, setEditingEvent] = useState<EventWithTickets | null>(null)
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT)
  const [eventSaving, setEventSaving] = useState(false)

  const [ticketModal, setTicketModal] = useState<EventWithTickets | null>(null)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [ticketForm, setTicketForm] = useState<TicketForm>(EMPTY_TICKET)
  const [ticketSaving, setTicketSaving] = useState(false)

  async function fetchEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*, ticket_types(*)')
      .order('date', { ascending: false })
    setEvents((data ?? []) as EventWithTickets[])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  function openCreate() {
    setEventForm(EMPTY_EVENT)
    setEditingEvent(null)
    setEventModal('create')
  }

  function openEdit(ev: EventWithTickets) {
    setEditingEvent(ev)
    setEventForm({
      title: ev.title,
      description: ev.description ?? '',
      date: ev.date.slice(0, 16),
      venue: ev.venue,
      status: ev.status,
    })
    setEventModal('edit')
  }

  async function saveEvent() {
    if (!eventForm.title || !eventForm.date || !eventForm.venue) return
    setEventSaving(true)
    if (eventModal === 'create') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('events') as any).insert({
        title: eventForm.title,
        description: eventForm.description || null,
        date: eventForm.date,
        venue: eventForm.venue,
        status: eventForm.status,
        created_by: user!.id,
      })
    } else if (editingEvent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('events') as any).update({
        title: eventForm.title,
        description: eventForm.description || null,
        date: eventForm.date,
        venue: eventForm.venue,
        status: eventForm.status,
      }).eq('id', editingEvent.id)
    }
    setEventSaving(false)
    setEventModal('closed')
    fetchEvents()
  }

  async function deleteEvent(ev: EventWithTickets) {
    if (!confirm(`「${ev.title}」を削除しますか？\nチケット種別も全て削除されます。`)) return
    await supabase.from('events').delete().eq('id', ev.id)
    fetchEvents()
  }

  function openTickets(ev: EventWithTickets) {
    setTicketModal(ev)
    setEditingTicket(null)
    setTicketForm(EMPTY_TICKET)
  }

  function startEditTicket(t: TicketType) {
    setEditingTicket(t)
    setTicketForm({
      name: t.name,
      description: t.description ?? '',
      price: String(t.price),
      stock: String(t.stock),
    })
  }

  async function refreshTicketModal(eventId: string) {
    const { data } = await supabase
      .from('events')
      .select('*, ticket_types(*)')
      .eq('id', eventId)
      .single()
    if (data) setTicketModal(data as EventWithTickets)
    fetchEvents()
  }

  async function saveTicket() {
    if (!ticketModal || !ticketForm.name || !ticketForm.price || !ticketForm.stock) return
    setTicketSaving(true)
    const price = parseInt(ticketForm.price)
    const stock = parseInt(ticketForm.stock)
    if (editingTicket) {
      const soldCount = editingTicket.stock - editingTicket.stock_remaining
      await supabase.from('ticket_types').update({
        name: ticketForm.name,
        description: ticketForm.description || null,
        price,
        stock,
        stock_remaining: Math.max(0, stock - soldCount),
      }).eq('id', editingTicket.id)
    } else {
      await supabase.from('ticket_types').insert({
        event_id: ticketModal.id,
        name: ticketForm.name,
        description: ticketForm.description || null,
        price,
        stock,
        stock_remaining: stock,
      })
    }
    setTicketSaving(false)
    setEditingTicket(null)
    setTicketForm(EMPTY_TICKET)
    refreshTicketModal(ticketModal.id)
  }

  async function deleteTicket(t: TicketType) {
    if (!confirm(`「${t.name}」を削除しますか？`)) return
    await supabase.from('ticket_types').delete().eq('id', t.id)
    if (ticketModal) refreshTicketModal(ticketModal.id)
  }

  const canSaveEvent = !!eventForm.title && !!eventForm.date && !!eventForm.venue
  const canSaveTicket = !!ticketForm.name && !!ticketForm.price && !!ticketForm.stock

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">イベント管理</h1>
          <p className="text-sm text-gray-400 mt-0.5">{events.length} 件</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          新規作成
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-gray-400">
          <Calendar size={32} className="mb-3 opacity-30" />
          <p className="text-sm">イベントがありません</p>
          <button onClick={openCreate} className="mt-3 text-sm text-violet-600 hover:underline">
            最初のイベントを作成する
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">イベント名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">日時</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">会場</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">ステータス</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">チケット</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr
                  key={ev.id}
                  className={`hover:bg-gray-50 transition-colors ${i < events.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{ev.title}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(ev.date)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate text-xs">{ev.venue}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ev.status]}`}>
                      {STATUS_LABELS[ev.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openTickets(ev)}
                      className="flex items-center gap-1.5 text-violet-600 hover:text-violet-800 text-xs font-medium"
                    >
                      <Ticket size={13} />
                      {ev.ticket_types.length} 種別
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(ev)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteEvent(ev)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Event create / edit modal */}
      {eventModal !== 'closed' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {eventModal === 'create' ? 'イベント作成' : 'イベント編集'}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  イベント名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="例：AKB48 特典会 in 東京"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    日時 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ステータス</label>
                  <select
                    value={eventForm.status}
                    onChange={e => setEventForm(f => ({ ...f, status: e.target.value as EventStatus }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                  >
                    {(Object.entries(STATUS_LABELS) as [EventStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  会場 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.venue}
                  onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="例：Zepp Tokyo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">説明（任意）</label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                  placeholder="イベントの詳細..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setEventModal('closed')}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                キャンセル
              </button>
              <button
                onClick={saveEvent}
                disabled={eventSaving || !canSaveEvent}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {eventSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket types modal */}
      {ticketModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">チケット種別</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{ticketModal.title}</p>
              </div>
              <button
                onClick={() => { setTicketModal(null); setEditingTicket(null) }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {ticketModal.ticket_types.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">チケット種別がありません</p>
              )}
              {ticketModal.ticket_types.map(t => (
                <div
                  key={t.id}
                  className={`border rounded-xl p-3 ${editingTicket?.id === t.id ? 'border-violet-300 bg-violet-50' : 'border-gray-200'}`}
                >
                  {editingTicket?.id === t.id ? (
                    <TicketTypeForm
                      form={ticketForm}
                      onChange={setTicketForm}
                      saving={ticketSaving}
                      canSave={canSaveTicket}
                      onSave={saveTicket}
                      onCancel={() => { setEditingTicket(null); setTicketForm(EMPTY_TICKET) }}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatPrice(t.price)} · 残り {t.stock_remaining}/{t.stock} 枚
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEditTicket(t)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteTicket(t)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!editingTicket && (
                <div className="border border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3">新しいチケット種別を追加</p>
                  <TicketTypeForm
                    form={ticketForm}
                    onChange={setTicketForm}
                    saving={ticketSaving}
                    canSave={canSaveTicket}
                    onSave={saveTicket}
                    onCancel={null}
                    isNew
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TicketTypeForm({
  form, onChange, saving, canSave, onSave, onCancel, isNew,
}: {
  form: TicketForm
  onChange: React.Dispatch<React.SetStateAction<TicketForm>>
  saving: boolean
  canSave: boolean
  onSave: () => void
  onCancel: (() => void) | null
  isNew?: boolean
}) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">名前 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={e => onChange(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="例：2ショット"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">価格 (円) <span className="text-red-400">*</span></label>
          <input
            type="number"
            value={form.price}
            onChange={e => onChange(f => ({ ...f, price: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="3000"
            min="0"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">在庫数 <span className="text-red-400">*</span></label>
          <input
            type="number"
            value={form.stock}
            onChange={e => onChange(f => ({ ...f, stock: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="100"
            min="0"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">説明（任意）</label>
          <input
            type="text"
            value={form.description}
            onChange={e => onChange(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="..."
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
            キャンセル
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving || !canSave}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {saving ? '保存中...' : isNew ? '追加' : '更新'}
        </button>
      </div>
    </div>
  )
}
