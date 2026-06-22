import { useNavigate, useParams } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { GROUPS, POINT_HISTORY } from '../data/prototype'

export function FanPointHistory() {
  const navigate = useNavigate()
  const { groupId } = useParams<{ groupId: string }>()
  const group = GROUPS.find(g => g.id === groupId) ?? GROUPS[0]

  return (
    <FanLayout>
      <FanTopbar title="ポイント履歴" centered onBack={() => navigate(`/points/${group.id}`)} />
      <div className="content">
        <div className="caption" style={{ marginBottom: 14 }}>{group.name} のポイント獲得・利用履歴</div>
        <div className="history-list">
          {POINT_HISTORY.map((row, i) => (
            <div key={i} className="history-row">
              <div className="history-row__date">{row.date}</div>
              <div className={`history-row__label history-row__label--${row.type}`}>{row.label}</div>
              <div className={`history-row__points history-row__points--${row.type}`}>
                {row.type === 'plus' ? `+${row.points}pt` : '使用済'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FanLayout>
  )
}
