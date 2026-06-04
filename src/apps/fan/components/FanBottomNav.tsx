import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Ticket, History, User } from 'lucide-react'

const TABS = [
  { icon: Home,    label: 'ホーム',     path: '/' },
  { icon: Ticket,  label: '特典券',     path: '/tickets' },
  { icon: History, label: '履歴',       path: '/history' },
  { icon: User,    label: 'マイページ', path: '/mypage' },
] as const

export function FanBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ icon: Icon, label, path }) => {
        const active = path === '/' ? pathname === '/' : pathname.startsWith(path)
        return (
          <button
            key={path}
            className={`nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            <div className="tab-icon"><Icon size={20} /></div>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
