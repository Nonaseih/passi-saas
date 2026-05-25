import { useEffect } from 'react'
import { QRDisplay } from './QRDisplay'
import type { TicketWithDetails } from '@/hooks/useTickets'
import type { QRPayload } from '@/types'
import { formatDate } from '@/lib/utils'

interface QRModalProps {
  ticket: TicketWithDetails
  onClose: () => void
}

export function QRModal({ ticket, onClose }: QRModalProps) {
  const payload: QRPayload = {
    ticket_id: ticket.id,
    qr_token: ticket.qr_token,
    event_id: ticket.event_id,
    issued_at: ticket.purchased_at,
  }

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-xs flex-col items-center gap-6 rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {ticket.event?.title}
          </p>
          <h2 className="mt-1 text-lg font-bold">{ticket.ticket_type?.name}</h2>
        </div>

        {/* QR Code */}
        <QRDisplay payload={payload} size="lg" />

        {/* Ticket info */}
        <div className="w-full space-y-1 rounded-lg bg-muted px-4 py-3 text-center text-sm">
          <p className="text-xs text-muted-foreground">開催日時</p>
          <p className="font-medium">{ticket.event?.date ? formatDate(ticket.event.date) : '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">会場</p>
          <p className="font-medium">{ticket.event?.venue}</p>
        </div>

        {/* Status badge */}
        <span className={`rounded-full px-4 py-1 text-xs font-semibold ${
          ticket.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {ticket.status === 'active' ? '有効' : '使用済み'}
        </span>

        <button
          onClick={onClose}
          className="w-full rounded-lg border py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
