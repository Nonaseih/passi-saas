import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTickets } from '@/hooks/useTickets'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import '../fan.css'
import { FanTopbar } from '../components/FanTopbar'
import { SlideToUse } from '../components/SlideToUse'

export function FanTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { tickets, loading, refetch } = useTickets()
  const navigate = useNavigate()
  const [marking, setMarking] = useState(false)
  const [toast, setToast] = useState('')

  const ticket = tickets.find((t) => t.id === ticketId)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  async function handleUse() {
    if (!ticket || marking || ticket.status === 'used') return
    setMarking(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('tickets') as any)
      .update({ status: 'used' })
      .eq('id', ticket.id)
    if (error) {
      showToast('エラーが発生しました。もう一度お試しください。')
    } else {
      await refetch()
      showToast('特典券を使用済みにしました')
    }
    setMarking(false)
  }

  if (loading) {
    return (
      <div className="fan-app ticket-detail-screen">
        <div className="fan-screen">
          <FanTopbar title="特典券" centered onBack={() => navigate('/tickets')} />
          <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="fan-skeleton" style={{ width: '100%', height: 200, borderRadius: 26 }} />
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="fan-app ticket-detail-screen">
        <div className="fan-screen">
          <FanTopbar title="特典券" centered onBack={() => navigate('/tickets')} />
          <div className="content">
            <div className="card info-card" style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-2)' }}>
              チケットが見つかりません
            </div>
            <button className="outline-btn" onClick={() => navigate('/tickets')}>
              特典券一覧に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const used = ticket.status === 'used'

  return (
    <div className="fan-app ticket-detail-screen">
      <div className="fan-screen">
        <FanTopbar
          title={ticket.ticket_type?.name ?? '特典券'}
          centered
          onBack={() => navigate('/tickets')}
        />

        <div className="content">
          {/* Ticket showcase */}
          <div className="ticket-showcase">
            <div className="ticket-showcase__glow" />
            <div className="ticket-card-visual ticket-card-visual--detail">
              <div
                style={{
                  width: '100%',
                  aspectRatio: '91/55',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(145deg, #fff 0%, #faf7ff 100%)',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 40 }}>🎫</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', letterSpacing: '.04em' }}>
                  {ticket.ticket_type?.name}
                </div>
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div className="meta-strip">
            <div className="meta-col">
              <div className="meta-col__label">イベント</div>
              <div className="meta-col__value" style={{ fontSize: 12, lineHeight: 1.4, wordBreak: 'break-all' }}>
                {ticket.event?.title ?? '—'}
              </div>
            </div>
            <div className="meta-col">
              <div className="meta-col__label">日時</div>
              <div className="meta-col__value" style={{ fontSize: 11, lineHeight: 1.4 }}>
                {ticket.event?.date ? formatDate(ticket.event.date) : '—'}
              </div>
            </div>
            <div className="meta-col">
              <div className="meta-col__label">ステータス</div>
              <div className={`meta-col__value${used ? '' : ' pink'}`}>
                {used ? '使用済' : '未使用'}
              </div>
            </div>
          </div>

          {/* Slide to use panel */}
          <div className="ticket-detail-panel">
            <div className="panel__title">
              {used ? '使用済みです' : '使用する'}
            </div>
            {!used && (
              <div className="helper-center">この画面をスタッフに提示してください</div>
            )}
            <SlideToUse used={used} onUse={handleUse} />
            <button className="outline-btn outline-btn--ticket" onClick={() => navigate('/tickets')}>
              キャンセル
            </button>
          </div>

          <div className="warning-box warning-box--ticket">
            ※ 使用後は取り消せません。<br />
            ※ スタッフ確認後に操作してください。
          </div>
        </div>

        {/* Toast */}
        {toast && <div className="fan-toast">{toast}</div>}
      </div>
    </div>
  )
}
