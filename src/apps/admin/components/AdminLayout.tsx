import { NavLink, Outlet } from 'react-router-dom'
import type { ComponentType } from 'react'
import {
  LayoutDashboard, Calendar, TrendingUp, Users, LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import logoUrl from '@/public/logo.png'

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }>; end?: boolean }
type NavSection = { title?: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/admin', label: 'ダッシュボード', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'イベント',
    items: [
      { to: '/admin/events', label: 'イベント管理', icon: Calendar },
    ],
  },
  {
    title: '管理',
    items: [
      { to: '/admin/staff', label: 'スタッフ', icon: Users },
    ],
  },
  {
    title: '分析',
    items: [
      { to: '/admin/sales', label: '売上', icon: TrendingUp },
    ],
  },
]

export function AdminLayout() {
  const { signOut } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#faf9ff' }}>
      <aside
        className="w-56 flex flex-col flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f6ff 100%)',
          borderRight: '1px solid #ebe8f6',
          boxShadow: '2px 0 16px rgba(156,124,242,.06)',
        }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <img src={logoUrl} alt="PASSi" className="w-20 h-auto" />
          <div className="text-[11px] mt-1 font-medium" style={{ color: '#c7bcff' }}>
            管理パネル
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-3" style={{ height: 1, background: '#ebe8f6' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.title && (
                <div
                  className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
                  style={{ color: '#c7bcff' }}
                >
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={({ isActive }) =>
                      isActive
                        ? {
                            background: 'linear-gradient(135deg, rgba(156,124,242,.13) 0%, rgba(133,127,255,.08) 100%)',
                            border: '1.5px solid rgba(156,124,242,.20)',
                            color: '#9c7cf2',
                            fontWeight: 700,
                            boxShadow: '0 2px 10px rgba(192,160,255,.12)',
                          }
                        : {
                            color: '#9892b3',
                            border: '1.5px solid transparent',
                          }
                    }
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      if (!el.style.fontWeight.includes('700')) {
                        el.style.background = '#f6f4ff'
                        el.style.color = '#6d6791'
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      if (!el.style.fontWeight.includes('700')) {
                        el.style.background = ''
                        el.style.color = '#9892b3'
                      }
                    }}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid #ebe8f6' }}>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: '#c7bcff', border: '1.5px solid transparent' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f6f4ff'
              e.currentTarget.style.color = '#9892b3'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = '#c7bcff'
            }}
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ background: '#faf9ff' }}>
        <Outlet />
      </main>
    </div>
  )
}
