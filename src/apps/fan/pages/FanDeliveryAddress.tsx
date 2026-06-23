import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

export function FanDeliveryAddress() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullname: '', postalCode: '', address: '', phone: '' })
  const [toast, setToast] = useState('')
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <FanLayout>
      <FanTopbar title="特典送付先住所" centered onBack={() => navigate('/mypage')} />
      <div className="content">
        <div className="info-block" style={{ marginTop: 0 }}>
          登録した住所は、郵送特典の送付先として使用されます。申請時に自動入力されます。
        </div>
        <section className="section">
          <div className="mail-form-section">
            <div className="mail-form-field">
              <label className="mail-form-label" htmlFor="daFullname">氏名 <span className="required">必須</span></label>
              <input id="daFullname" className="mail-form-input" type="text" value={form.fullname} onChange={set('fullname')} placeholder="例）山田 花子" />
            </div>
            <div className="mail-form-field">
              <label className="mail-form-label" htmlFor="daPostal">郵便番号 <span className="required">必須</span></label>
              <input id="daPostal" className="mail-form-input" type="text" inputMode="numeric" value={form.postalCode} onChange={set('postalCode')} placeholder="例）123-4567" />
            </div>
            <div className="mail-form-field">
              <label className="mail-form-label" htmlFor="daAddress">住所 <span className="required">必須</span></label>
              <input id="daAddress" className="mail-form-input" type="text" value={form.address} onChange={set('address')} placeholder="例）東京都渋谷区○○1-2-3 ○○マンション101" />
            </div>
            <div className="mail-form-field">
              <label className="mail-form-label" htmlFor="daPhone">電話番号 <span className="required">必須</span></label>
              <input id="daPhone" className="mail-form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="例）090-1234-5678" />
            </div>
          </div>
        </section>
        <button className="primary-btn action-button" style={{ marginTop: 8 }} onClick={() => { setToast('保存しました'); setTimeout(() => setToast(''), 1600) }}>保存する</button>
      </div>
      {toast && <div className="fan-toast">{toast}</div>}
    </FanLayout>
  )
}
