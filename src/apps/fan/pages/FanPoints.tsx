import { useNavigate } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { GROUPS } from '../data/prototype'

export function FanPoints() {
  const navigate = useNavigate()
  return (
    <FanLayout>
      <FanTopbar title="ポイントカード" />
      <div className="content">
        <section className="section">
          <div className="list">
            {GROUPS.map(g => (
              <button key={g.id} className="card points-card" onClick={() => navigate(`/points/${g.id}`)}>
                <div className="points-card__img" />
                <div className="row-main">
                  <div className="row-title">{g.name}</div>
                  <div className="points-value">{g.points}pt</div>
                  <div className="card-expiry-label">有効期限：{g.cardExpiry}まで</div>
                </div>
                <div className="chevron">›</div>
              </button>
            ))}
          </div>
          <div className="info-block">
            特典券購入や来場でポイントが貯まります。達成した特典は、本アプリから申請・利用できます。ポイントの反映には数分かかる場合があります。
          </div>
        </section>
      </div>
    </FanLayout>
  )
}
