import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, ChevronRight, Bell, User, HelpCircle, Timer } from 'lucide-react'
import logo from '@/public/logo.png'

export function StaffSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roleLabel = user?.role === 'admin' ? '運営スタッフ' : 'チェキスタッフ'

  const menuItems = [
    { id: 'ticket-times', label: 'チェキ券ごとの持ち時間', subtitle: '券種ごとにタイマーの初期時間を設定', icon: <Timer className="w-5 h-5 text-[#9c7cf2]" />, route: '/staff/settings/ticket-times' },
    { id: 'notifications', label: '通知設定', subtitle: 'バイブレーション・サウンドなど', icon: <Bell className="w-5 h-5 text-[#9c7cf2]" />, route: '/staff/settings/notifications' },
    { id: 'account', label: 'アカウント', subtitle: `${user?.display_name ?? 'スタッフ'}（${roleLabel}）`, icon: <User className="w-5 h-5 text-[#9c7cf2]" />, route: '/staff/settings/account' },
    { id: 'help', label: 'ヘルプ', subtitle: '使い方・よくある質問', icon: <HelpCircle className="w-5 h-5 text-[#9c7cf2]" />, route: '/staff/settings/help' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9ff]">
      <div className="bg-white flex-shrink-0 z-10 sticky top-0" style={{ borderBottom: '1px solid #ebe8f6', boxShadow: '0 1px 8px rgba(59,42,124,.05)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/staff')} className="flex items-center gap-1.5 p-1.5 -ml-1.5 rounded-xl" style={{ color: '#9c7cf2' }}>
            <ArrowLeft className="w-4 h-4" /><span className="text-sm font-semibold">戻る</span>
          </button>
          <img src={logo} alt="PASSi" className="h-6 w-auto" />
          <div className="w-14" />
        </div>
        <div className="px-4 pb-3"><div className="text-base font-bold" style={{ color: '#221d4e' }}>設定</div></div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #ebe8f6', boxShadow: '0 2px 8px rgba(59,42,124,.04)' }}>
            {menuItems.map((item, idx) => (
              <button key={item.id} onClick={() => navigate(item.route)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ borderTop: idx > 0 ? '1px solid #f3f1fb' : 'none' }}>
                {item.icon}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#221d4e' }}>{item.label}</div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: '#9892b3' }}>{item.subtitle}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#c7bcff' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
