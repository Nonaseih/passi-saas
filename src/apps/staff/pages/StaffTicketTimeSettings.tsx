import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'

// Visual dummy: per-ticket timer config isn't in the original schema, so this
// edits local state only (matches the prototype's 仮実装). Persisting it would
// be additional (out-of-original-scope) work.
interface TicketTime { id: string; name: string; imageUrl?: string; seconds: number }

export function StaffTicketTimeSettings() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<TicketTime[]>([
    { id: 'unsigned', name: 'サイン無しチェキ券', imageUrl: '/tickets/ticket-unsigned.png', seconds: 45 },
    { id: 'signed', name: 'サインありチェキ券', imageUrl: '/tickets/ticket-signed.png', seconds: 60 },
    { id: 'comment', name: 'コメントありチェキ券', imageUrl: '/tickets/ticket-comment.png', seconds: 90 },
  ])

  const updateSeconds = (id: string, value: string) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 0) return
    setTickets(tickets.map(t => (t.id === id ? { ...t, seconds: num } : t)))
  }
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60), s = seconds % 60
    if (m === 0) return `${s}秒`
    if (s === 0) return `${m}分`
    return `${m}分${s}秒`
  }
  const handleSave = () => { alert('保存しました（デモ）'); navigate('/staff/settings') }

  return (
    <div className="min-h-screen bg-[#faf9ff] pb-6">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/staff/settings')} className="flex items-center gap-2 py-2 pr-4 -ml-2">
            <ArrowLeft className="w-5 h-5 text-[#9c7cf2]" /><span className="text-base text-[#9c7cf2]">設定</span>
          </button>
        </div>
        <h2 className="font-bold text-base text-[#221d4e] mt-1">チェキ券ごとの持ち時間</h2>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-[#9892b3] mb-2">券種ごとにタイマーの初期時間を設定します。もぎり完了後にこの時間でカウントダウンが始まります。</p>

        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-16 h-11 rounded-md overflow-hidden flex-shrink-0 bg-[#f6f4ff] flex items-center justify-center">
                {ticket.imageUrl
                  ? <img src={ticket.imageUrl} alt={ticket.name} className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  : <div className="text-[#9c7cf2] text-[10px]">画像なし</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[#221d4e] truncate">{ticket.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#9892b3]" />
                  <span className="text-xs text-[#9c7cf2] font-medium">{formatTime(ticket.seconds)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <input type="number" inputMode="numeric" min="0" max="600" value={ticket.seconds} onChange={(e) => updateSeconds(ticket.id, e.target.value)} className="w-16 px-2 py-1.5 border border-[#ebe8f6] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#9c7cf2]" />
                <span className="text-sm text-[#9892b3]">秒</span>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-[#221d4e] mb-3">クイック設定</div>
          <div className="flex gap-2 flex-wrap">
            {[30, 45, 60, 90, 120].map((sec) => (
              <button key={sec} onClick={() => setTickets(tickets.map(t => ({ ...t, seconds: sec })))} className="px-3 py-1.5 border border-[#9c7cf2] text-[#9c7cf2] rounded-full text-sm hover:bg-[#faf9ff] transition-colors">
                全て{formatTime(sec)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] text-white rounded-lg font-medium shadow-sm mt-2">保存する</button>
      </div>
    </div>
  )
}
