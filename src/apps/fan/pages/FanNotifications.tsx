import { useNavigate } from 'react-router-dom'
import { Volume2 } from 'lucide-react'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'

const NOTICES = [
  {
    id: 1,
    title: '特典会の注意事項について',
    date: '2025年5月17日',
    isNew: true,
  },
  {
    id: 2,
    title: 'アプリ先行ポイントアップ開催中',
    date: '2025年5月15日',
    isNew: false,
  },
]

export function FanNotifications() {
  const navigate = useNavigate()

  return (
    <FanLayout>
      <FanTopbar
        title="お知らせ"
        centered
        onBack={() => navigate(-1)}
      />

      <div className="content">
        <section className="section">
          {NOTICES.length === 0 ? (
            <div className="card info-card" style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
              お知らせはありません
            </div>
          ) : (
            <div className="notice-card-list">
              {NOTICES.map(notice => (
                <button
                  key={notice.id}
                  className={`notice-card${notice.isNew ? ' notice-card--new' : ''}`}
                >
                  <div className="notice-card__left">
                    {notice.isNew
                      ? <span className="notice-card__new-dot" />
                      : <span className="notice-card__icon"><Volume2 size={18} /></span>
                    }
                  </div>
                  <div className="notice-card__body">
                    <div className="notice-card__title">{notice.title}</div>
                    <div className="notice-card__date">{notice.date}</div>
                  </div>
                  {notice.isNew && <span className="notice-card__badge">NEW</span>}
                  <span className="notice-card__arrow">›</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </FanLayout>
  )
}
