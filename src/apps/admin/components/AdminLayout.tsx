import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, Calendar, TrendingUp, Users, LogOut, UserCircle } from 'lucide-react'

const NAV = [
  { to: '/admin',        label: 'ダッシュボード', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'イベント管理',   icon: Calendar },
  { to: '/admin/sales',  label: '売上',           icon: TrendingUp },
  { to: '/admin/staff',  label: 'スタッフ',       icon: Users },
]

export function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <span className="font-bold text-base tracking-tight text-gray-900">PASSi Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <UserCircle size={16} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 truncate">{user?.display_name}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={13} />
            ログアウト
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
