import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { Icon } from '../components/Icon'
import { SEARCH_GROUPS } from '../data/prototype'

export function FanOshiGroups() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [registered, setRegistered] = useState<string[]>(['HzMe'])

  const query = search.trim().toLowerCase()
  const results = query
    ? SEARCH_GROUPS.filter(g => g.name.toLowerCase().includes(query) && !registered.includes(g.name))
    : []
  const registeredGroups = SEARCH_GROUPS.filter(g => registered.includes(g.name))

  return (
    <FanLayout>
      <FanTopbar title="推しグループ設定" centered onBack={() => navigate('/mypage')} />
      <div className="content">
        <div className="search-input card">
          <Icon name="search" size={15} />
          <input type="text" placeholder="グループ名を検索して追加" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {query && results.length > 0 && (
          <>
            <div className="caption" style={{ margin: '14px 0 8px' }}>検索結果</div>
            <div className="list">
              {results.map(g => (
                <div key={g.id} className="card row-card" style={{ gap: 12 }}>
                  <div className="quick-card__photo" style={{ background: 'linear-gradient(135deg,#ede8ff,#d5cbff)' }} />
                  <div className="row-main"><div className="row-title">{g.name}</div></div>
                  <button className="oshi-action-btn oshi-action-btn--add" onClick={() => setRegistered(r => [...r, g.name])}>登録</button>
                </div>
              ))}
            </div>
          </>
        )}
        {query && results.length === 0 && (
          <div className="card info-card" style={{ marginTop: 12 }}>グループが見つかりません</div>
        )}

        <div className="caption" style={{ margin: '16px 0 8px' }}>登録中のグループ</div>
        {registeredGroups.length > 0 ? (
          <div className="list">
            {registeredGroups.map(g => (
              <div key={g.id} className="card row-card" style={{ gap: 12 }}>
                <div className="quick-card__photo" style={{ background: 'linear-gradient(135deg,#ede8ff,#d5cbff)' }} />
                <div className="row-main"><div className="row-title">{g.name}</div></div>
                <button className="oshi-action-btn oshi-action-btn--remove" onClick={() => setRegistered(r => r.filter(n => n !== g.name))}>削除</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card info-card">登録中のグループはありません</div>
        )}
      </div>
    </FanLayout>
  )
}
