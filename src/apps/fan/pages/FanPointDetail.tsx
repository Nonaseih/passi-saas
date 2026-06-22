import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { GROUPS, REWARDS } from '../data/prototype'

type RewardFilter = 'all' | 'available' | 'redeemed'

export function FanPointDetail() {
  const navigate = useNavigate()
  const { groupId } = useParams<{ groupId: string }>()
  const group = GROUPS.find(g => g.id === groupId) ?? GROUPS[0]
  const [filter, setFilter] = useState<RewardFilter>('all')

  const rewards = REWARDS.filter(r =>
    filter === 'available' ? r.status === '達成済み'
    : filter === 'redeemed' ? r.status !== '達成済み'
    : true)

  return (
    <FanLayout>
      <FanTopbar title={group.name} centered onBack={() => navigate('/points')} />
      <div className="content content--point-detail">
        <div className="banner banner--detail"><div className="banner__img" /></div>
        <div className="points-summary">
          <div className="section-head section-head--points">
            <div className="points-summary__left">
              <div className="caption">保有ポイント</div>
              <div className="points-value big">{group.points}pt</div>
              <div className="card-expiry-label" style={{ marginTop: 4 }}>有効期限：{group.cardExpiry}まで</div>
            </div>
            <button className="outline-pill" onClick={() => navigate(`/points/${group.id}/history`)}>履歴を見る</button>
          </div>

          <div className="reward-segments">
            {([['all', 'すべて'], ['available', '利用可能'], ['redeemed', '交換済み']] as [RewardFilter, string][]).map(([v, l]) => (
              <button key={v} className={`secondary-chip${filter === v ? ' active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>

          <div className="reward-list">
            {rewards.map(r => (
              <button key={r.id} className="reward-row" onClick={() => navigate(`/points/${group.id}/reward/${r.id}`)}>
                <div className="reward-point"><span>{r.points}</span><small>pt</small></div>
                <div className="reward-content">
                  <div className="reward-name">{r.label}</div>
                  <div className="reward-desc">{r.points}ポイント達成で利用可能</div>
                </div>
                <div className="reward-status">
                  <span className={`status-chip${r.status === '達成済み' ? ' soft-success' : ''}`}>{r.status}</span>
                  <span className="chevron">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </FanLayout>
  )
}
