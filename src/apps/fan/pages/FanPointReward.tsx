import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { SlideToUse } from '../components/SlideToUse'
import { GROUPS, REWARDS } from '../data/prototype'

export function FanPointReward() {
  const navigate = useNavigate()
  const { groupId, rewardId } = useParams<{ groupId: string; rewardId: string }>()
  const group = GROUPS.find(g => g.id === groupId) ?? GROUPS[0]
  const reward = REWARDS.find(r => r.id === rewardId) ?? REWARDS[0]
  const [used, setUsed] = useState(false)
  const [toast, setToast] = useState('')

  return (
    <FanLayout>
      <FanTopbar title="ポイント特典" centered onBack={() => navigate(`/points/${group.id}`)} right={<div style={{ width: 36 }} />} />
      <div className="content">
        <section className="reward-card">
          <div className="reward-card__eyebrow">達成済み特典</div>
          <div className="reward-card__name">{reward.label}</div>
          <div className="reward-card__points"><strong>{reward.points}</strong><span>pt</span></div>
          <div className="caption">{group.name} ポイントカード</div>
        </section>
        <div className="info-block">
          利用時はスタッフの確認を行ってください。ポイント特典は当日のみ利用できる場合があります。
        </div>
        <SlideToUse
          used={used}
          onUse={() => { setUsed(true); setToast('✓ 利用済みにしました'); setTimeout(() => setToast(''), 2000) }}
          label="右へスライドして使用済みにする"
          successLabel="✓ 利用済みにしました"
        />
        <button className="outline-btn" onClick={() => navigate(`/points/${group.id}`)}>戻る</button>
        <div className="warning-box">
          ポイント特典の利用後は取り消しできません。使用状況はポイント履歴にも反映されます。
        </div>
      </div>
      {toast && <div className="fan-toast">{toast}</div>}
    </FanLayout>
  )
}
