import { useNavigate, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const TABS: { icon: IconName; label: string; path: string }[] = [
  { icon: 'home',   label: 'ホーム',     path: '/home' },
  { icon: 'ticket', label: '特典券',     path: '/tickets' },
  { icon: 'card',   label: 'ポイント',   path: '/points' },
  { icon: 'user',   label: 'マイページ', path: '/mypage' },
]

export function FanBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ icon, label, path }) => {
        const active = pathname === path || (path !== '/home' && pathname.startsWith(path))
        return (
          <button
            key={path}
            className={`nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            <div className="tab-icon"><Icon name={icon} size={20} /></div>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
