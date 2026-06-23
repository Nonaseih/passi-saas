import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { Icon } from '../components/Icon'

export function FanMyPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const menuItems = [
    { label: 'プロフィール編集', sub: user?.display_name ?? 'ユーザー', onClick: () => navigate('/mypage/profile') },
    { label: '推しグループ設定', sub: 'HzMe', onClick: () => navigate('/mypage/oshi') },
    { label: '購入履歴', sub: '過去の購入を確認', onClick: () => navigate('/history') },
    { label: 'お支払い方法', sub: 'カード・PayPay', onClick: () => navigate('/mypage/payment') },
    { label: '特典送付先住所', sub: '未登録', onClick: () => navigate('/mypage/address') },
  ]

  return (
    <FanLayout>
      <FanTopbar
        title="マイページ"
        right={
          <button className="icon-btn" onClick={() => navigate('/notifications')} aria-label="お知らせ">
            <Icon name="bell" size={18} />
            <span className="badge-dot" />
          </button>
        }
      />

      <div className="content">
        <section className="card profile-card">
          <div className="avatar-circle"><Icon name="user" size={28} /></div>
          <div className="row-main">
            <div className="row-title">{user?.display_name ?? 'ユーザー'}</div>
            <div className="row-sub">会員ID {user?.id?.slice(0, 8).toUpperCase()}</div>
          </div>
        </section>

        <section className="section menu-list">
          <div className="list">
            {menuItems.map((item) => (
              <button key={item.label} className="card row-card" onClick={item.onClick} style={{ width: '100%' }}>
                <div className="row-main">
                  <div className="row-title">{item.label}</div>
                  <div className="row-sub" style={{ marginTop: 2, fontSize: 10.5 }}>{item.sub}</div>
                </div>
                <div className="chevron">›</div>
              </button>
            ))}
          </div>

          <button className="outline-btn action-button"><Icon name="share" size={15} /> アプリをシェア</button>
          <button
            className="primary-btn action-button"
            style={{ background: 'linear-gradient(90deg, #f08aa0 0%, #e0668a 100%)', boxShadow: '0 14px 28px rgba(240,138,160,.28)' }}
            onClick={() => setShowLogoutModal(true)}
          >
            <Icon name="logout" size={15} /> ログアウト
          </button>
        </section>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>ログアウトしますか？</h3>
            <p>ログアウトするとサインイン画面に戻ります。</p>
            <div className="modal-actions">
              <button className="outline-btn" style={{ margin: 0 }} onClick={() => setShowLogoutModal(false)}>キャンセル</button>
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
