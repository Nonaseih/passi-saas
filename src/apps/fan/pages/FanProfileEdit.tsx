import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { Icon } from '../components/Icon'

export function FanProfileEdit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState(user?.display_name ?? '')
  const [toast, setToast] = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600) }

  return (
    <FanLayout>
      <FanTopbar title="プロフィール編集" centered onBack={() => navigate('/mypage')} />
      <div className="content">
        <section className="section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 8 }}>
          <div className="avatar-circle avatar-circle--large"><Icon name="user" size={36} /></div>
          <button className="outline-pill" onClick={() => showToast('デモ準備中')}>プロフィール画像を変更</button>
        </section>
        <section className="section">
          <div className="form-title">表示名 <span className="required">必須</span></div>
          <label className="text-input card">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例）IDOLファン" />
          </label>
        </section>
        <button className="primary-btn action-button" style={{ marginTop: 24 }} onClick={() => showToast('保存しました')}>保存する</button>
      </div>
      {toast && <div className="fan-toast">{toast}</div>}
    </FanLayout>
  )
}
