import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

const METHODS = [
  { id: 'paypay', label: 'PayPay', desc: 'PayPayアカウントと連携して支払い' },
  { id: 'credit', label: 'クレジットカード', desc: 'Visa / Mastercard / JCB / AMEX' },
]

export function FanPayment() {
  const navigate = useNavigate()
  const [connected, setConnected] = useState<Record<string, boolean>>({})

  return (
    <FanLayout>
      <FanTopbar title="お支払い方法" centered onBack={() => navigate('/mypage')} />
      <div className="content">
        <div className="caption" style={{ marginBottom: 14 }}>登録済みのお支払い方法を管理できます</div>
        <div className="list">
          {METHODS.map(m => (
            <div key={m.id} className="card row-card" style={{ gap: 12 }}>
              <div className="row-main">
                <div className="row-title">{m.label}</div>
                <div className="row-sub" style={{ marginTop: 2, fontSize: 10.5 }}>
                  {connected[m.id] ? '連携済み' : m.desc}
                </div>
              </div>
              <button
                className="outline-pill"
                style={{ flex: '0 0 auto' }}
                onClick={() => setConnected(c => ({ ...c, [m.id]: !c[m.id] }))}
              >
                {connected[m.id] ? '解除' : '連携'}
              </button>
            </div>
          ))}
        </div>
        <div className="info-block" style={{ marginTop: 16 }}>
          お支払い方法の追加・削除は本画面から行えます。クレジットカード情報は安全に暗号化して保管されます。
        </div>
      </div>
    </FanLayout>
  )
}
