import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { User, History, CreditCard, LogOut, ChevronRight, Bell } from 'lucide-react'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

export function FanMyPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const menuItems = [
    {
      icon: History,
      label: '購入履歴',
      sub: '過去の購入を確認',
      onClick: () => navigate('/history'),
    },
    {
      icon: CreditCard,
      label: 'お支払い方法',
      sub: 'カード・PayPay',
      onClick: () => {},
    },
    {
      icon: Bell,
      label: '通知設定',
      sub: 'お知らせ・リマインダー',
      onClick: () => {},
    },
  ]

  return (
    <FanLayout>
      <FanTopbar title="マイページ" />

      <div className="content">
        {/* Profile card */}
        <div className="card profile-card">
          <div className="avatar-circle">
            <User size={28} color="white" />
          </div>
          <div className="row-main">
            <div className="row-title" style={{ fontSize: 15, fontWeight: 700 }}>
              {user?.display_name ?? 'ユーザー'}
            </div>
            <div className="row-sub">会員ID {user?.id?.slice(0, 8).toUpperCase()}</div>
            <div className="row-sub">{user?.email}</div>
          </div>
        </div>

        {/* Menu */}
        <div className="section menu-list">
          <div className="list">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className="card row-card"
                  onClick={item.onClick}
                  style={{ width: '100%' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    <Icon size={16} color="var(--primary)" />
                  </div>
                  <div className="row-main">
                    <div className="row-title" style={{ fontSize: 13 }}>{item.label}</div>
                    <div className="row-sub" style={{ marginTop: 2, fontSize: 10.5 }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-3)" />
                </button>
              )
            })}
          </div>

          <button
            className="primary-btn action-button"
            style={{ marginTop: 28, background: 'linear-gradient(90deg, #f08aa0 0%, #e0668a 100%)', boxShadow: '0 14px 28px rgba(240,138,160,.28)' }}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>

        <div className="info-block" style={{ marginTop: 24, textAlign: 'center' }}>
          PassI ファン向けアプリ<br />
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>v1.0.0 · お問い合わせはスタッフまで</span>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>ログアウトしますか？</h3>
            <p>ログアウトするとサインイン画面に戻ります。</p>
            <div className="modal-actions">
              <button className="outline-btn" style={{ margin: 0 }} onClick={() => setShowLogoutModal(false)}>
                キャンセル
              </button>
              <button
                className="primary-btn"
                style={{ background: 'linear-gradient(90deg, #f08aa0, #e0668a)', boxShadow: 'none' }}
                onClick={handleLogout}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </FanLayout>
  )
}
