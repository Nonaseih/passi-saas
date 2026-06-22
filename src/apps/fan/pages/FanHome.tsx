import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import { Icon } from '../components/Icon'
import { SEARCH_GROUPS, PURCHASE_EVENTS, REAL_TICKET_TYPE_ID, type PurchaseEvent } from '../data/prototype'

type Filter = 'selling' | 'today' | 'tomorrow' | 'date' | null

function toDateStr(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function CalendarCard({
  year, month, selected, eventDates, onPrev, onNext, onSelect,
}: {
  year: number; month: number; selected: string; eventDates: Set<string>
  onPrev: () => void; onNext: () => void; onSelect: (d: string) => void
}) {
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土']
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="home-calendar-card card">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={onPrev}>‹</button>
        <span className="cal-nav-label">{year}年 {monthNames[month]}</span>
        <button className="cal-nav-btn" onClick={onNext}>›</button>
      </div>
      <div className="cal-day-labels">
        {dayLabels.map((d, i) => (
          <div key={d} className={`cal-day-label${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="cal-cell cal-empty" />
          const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(d).padStart(2, '0')}`
          const isSelected = selected === dateStr
          const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate()
          const hasEvent = eventDates.has(dateStr)
          return (
            <button
              key={d}
              className={`cal-cell${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${hasEvent ? ' has-event' : ''}`}
              onClick={() => onSelect(dateStr)}
            >
              {d}{hasEvent && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PhotoPlaceholder({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, #ede8ff 0%, #d5cbff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary-3)', ...style,
      }}
    >
      <Icon name="ticket" size={22} />
    </div>
  )
}

function EventRow({ event, onClick }: { event: PurchaseEvent; onClick: () => void }) {
  return (
    <button className="card row-card" style={{ gap: 12, padding: '10px 12px' }} onClick={onClick}>
      <PhotoPlaceholder className="quick-card__photo" />
      <div className="row-main" style={{ minWidth: 0 }}>
        <div className="row-title" style={{ fontSize: 12 }}>{event.title}</div>
        <div className="row-sub" style={{ fontSize: 10, marginTop: 2 }}>{event.group} ／ {event.date} {event.time}</div>
        <div className="row-sub" style={{ fontSize: 10 }}>{event.venue}</div>
      </div>
      <span className={`status-chip${event.selling ? ' soft-success' : ''}`} style={{ flex: '0 0 auto' }}>{event.status}</span>
    </button>
  )
}

export function FanHome() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>(null)
  const [dateValue, setDateValue] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

  const goBuy = () => navigate(`/purchase/${REAL_TICKET_TYPE_ID}`)

  const isSearching = search.trim().length > 0
  const eventDateSet = useMemo(() => new Set(PURCHASE_EVENTS.map(e => e.date)), [])

  const searchResults = isSearching
    ? PURCHASE_EVENTS.filter(e =>
        e.group.toLowerCase().includes(search.toLowerCase()) ||
        e.title.toLowerCase().includes(search.toLowerCase()))
    : []

  const now = new Date()
  const todayStr = toDateStr(now)
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDateStr(tomorrow)

  const filteredEvents = (() => {
    if (filter === 'selling') return PURCHASE_EVENTS.filter(e => e.selling)
    if (filter === 'today') return PURCHASE_EVENTS.filter(e => e.date === todayStr)
    if (filter === 'tomorrow') return PURCHASE_EVENTS.filter(e => e.date === tomorrowStr)
    if (filter === 'date' && dateValue) return PURCHASE_EVENTS.filter(e => e.date === dateValue)
    return PURCHASE_EVENTS
  })()
  const filterLabel =
    filter === 'selling' ? '販売中のイベント'
    : filter === 'today' ? `今日 (${todayStr}) のイベント`
    : filter === 'tomorrow' ? `明日 (${tomorrowStr}) のイベント`
    : filter === 'date' && dateValue ? `${dateValue} のイベント` : ''

  return (
    <FanLayout>
      <FanTopbar title="IDOL EVENTS" centered right={<div style={{ width: 36 }} />} />

      <div className="content content--home">
        {/* Hero */}
        <section className="card hero hero--home">
          <div className="hero__content hero__content--home">
            <div className="hero__tag hero__tag--home">LIVE</div>
            <div className="hero__title hero__title--home">Lumière 2nd ONE MAN LIVE</div>
            <div className="hero__meta hero__meta--home">2024.06.15 SAT / Zepp Shinjuku</div>
            <button className="hero__cta hero__cta--home" onClick={goBuy}>詳細はこちら</button>
          </div>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%',
            background: 'linear-gradient(135deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,.06) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.55)',
          }}>
            <Icon name="ticket" size={42} />
          </div>
        </section>
        <div className="pager pager--home"><span className="dot active" /><span className="dot" /><span className="dot" /></div>

        {/* Search + filters */}
        <section className="section section--home-tight">
          <div className="search-input card">
            <Icon name="search" size={15} />
            <input
              type="text"
              placeholder="グループ名・イベント名を検索"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: 'var(--text)', caretColor: 'var(--primary)' }}
            />
            {search
              ? <button className="search-clear-btn" onClick={() => setSearch('')}>×</button>
              : <button className="search-qr-btn" aria-label="QRコードを読み取る"><Icon name="qrscan" size={18} /></button>}
          </div>
          {!isSearching && (
            <div className="home-filter-row">
              {([['selling', '販売中'], ['today', '今日'], ['tomorrow', '明日']] as [Filter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  className={`home-filter-chip${filter === key ? ' active' : ''}`}
                  onClick={() => setFilter(f => f === key ? null : key)}
                >
                  {label}
                </button>
              ))}
              <button
                className={`home-filter-chip${filter === 'date' ? ' active' : ''}`}
                onClick={() => {
                  if (filter !== 'date') {
                    setFilter('date'); setDateValue(''); setCalendarOpen(true)
                    setCalYear(now.getFullYear()); setCalMonth(now.getMonth())
                  } else setCalendarOpen(o => !o)
                }}
              >
                <Icon name="calendar" size={11} />
                {filter === 'date' && dateValue ? `${parseInt(dateValue.split('/')[1])}/${parseInt(dateValue.split('/')[2])}` : '日付指定'}
              </button>
            </div>
          )}
          {filter === 'date' && calendarOpen && (
            <CalendarCard
              year={calYear} month={calMonth} selected={dateValue} eventDates={eventDateSet}
              onPrev={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1) }}
              onNext={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1) }}
              onSelect={d => { setDateValue(d); setCalendarOpen(false) }}
            />
          )}
        </section>

        {/* Search results */}
        {isSearching && (
          <section className="section section--home-tight">
            <div className="section-head section-head--soft">
              <div className="section-title section-title--soft"><Icon name="search" size={14} /> 検索結果</div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{searchResults.length}件</span>
            </div>
            {searchResults.length > 0 ? (
              <div className="list">
                {searchResults.map(e => <EventRow key={e.id} event={e} onClick={goBuy} />)}
              </div>
            ) : (
              <div className="card info-card" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                「{search}」に一致するイベントが見つかりませんでした
              </div>
            )}
          </section>
        )}

        {!isSearching && (
          <>
            {/* Filtered list */}
            {filter && (
              <section className="section section--home-tight" style={{ marginTop: 16 }}>
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft"><Icon name="search" size={14} /> {filterLabel || '日付指定'}</div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{filteredEvents.length}件</span>
                </div>
                {filter === 'date' && !dateValue ? null : filteredEvents.length > 0 ? (
                  <div className="list">{filteredEvents.map(e => <EventRow key={e.id} event={e} onClick={goBuy} />)}</div>
                ) : (
                  <div className="card info-card" style={{ fontSize: 12, color: 'var(--text-2)' }}>該当するイベントが見つかりませんでした</div>
                )}
                <button className="filter-back-btn" onClick={() => { setFilter(null); setDateValue(''); setCalendarOpen(false) }}>
                  <Icon name="back" size={14} /> ホームに戻る
                </button>
              </section>
            )}

            {/* Next event */}
            {!filter && (
              <section className="section section--home-tight" style={{ marginTop: 28 }}>
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft"><Icon name="ticket" size={14} /> 次の特典会まで</div>
                </div>
                <button className="card next-event-card" onClick={() => navigate('/tickets')}>
                  <div className="next-event-card__thumb-wrap">
                    <PhotoPlaceholder className="next-event-card__thumb" />
                  </div>
                  <div className="next-event-card__body">
                    <div className="next-event-card__main">
                      <div className="next-event-card__title">Lumière 特典会</div>
                      <div className="next-event-card__text">2024/06/15(土) 12:00〜</div>
                      <div className="next-event-card__text">東京国際フォーラム</div>
                    </div>
                    <div className="next-event-card__countdown">
                      <div className="next-event-card__countdown-label">開始まで</div>
                      <div className="next-event-card__countdown-time">02:15</div>
                    </div>
                  </div>
                </button>
              </section>
            )}

            {/* 推しグループ */}
            {!filter && (
              <section className="section section--home-tight">
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft"><Icon name="cart" size={14} /> 推しグループ</div>
                </div>
                <div className="quick-stack">
                  {SEARCH_GROUPS.map(group => {
                    const selling = PURCHASE_EVENTS.find(e => e.group === group.name && e.selling)
                    const future = PURCHASE_EVENTS
                      .filter(e => e.group === group.name && !e.selling)
                      .map(e => ({ ...e, _dt: new Date(e.date.replace(/\//g, '-') + 'T' + e.time) }))
                      .filter(e => e._dt > now)
                      .sort((a, b) => a._dt.getTime() - b._dt.getTime())
                    const nextEvent = future[0] ?? null
                    const event = selling ?? nextEvent

                    let badge: React.ReactNode = null
                    if (selling) {
                      badge = <span className="quick-card__live-badge"><span className="quick-card__live-dot" />販売中</span>
                    } else if (nextEvent) {
                      const diffMs = nextEvent._dt.getTime() - now.getTime()
                      const diffH = diffMs / 3600000
                      if (diffH > 0 && diffH <= 24) {
                        badge = <span className="quick-card__sale-countdown">販売開始まで {Math.floor(diffMs / 3600000)}時間{Math.floor((diffMs % 3600000) / 60000)}分</span>
                      } else if (diffH > 24) {
                        const dow = ['日', '月', '火', '水', '木', '金', '土'][nextEvent._dt.getDay()]
                        badge = <div className="quick-card__next-date">次回 {nextEvent._dt.getMonth() + 1}/{nextEvent._dt.getDate()}({dow})</div>
                      }
                    }

                    return (
                      <div key={group.id} className="card quick-card quick-card--wide">
                        <PhotoPlaceholder className="quick-card__photo" />
                        <div className="quick-card__body">
                          <div className="quick-card__group">{group.name}</div>
                          {event && <div className="quick-card__event-title">{event.title}</div>}
                          {badge}
                        </div>
                        {selling && (
                          <div className="quick-card__right">
                            <button className="quick-card__buy-btn" onClick={goBuy}>購入</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* お知らせ */}
            {!filter && (
              <section className="section section--home-tight">
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft"><Icon name="megaphone" size={14} /> お知らせ</div>
                  <span className="link-inline link-inline--soft" onClick={() => navigate('/notifications')}>すべて見る</span>
                </div>
                <div className="notice-card-list">
                  <button className="notice-card notice-card--new" onClick={() => navigate('/notifications')}>
                    <div className="notice-card__left"><span className="notice-card__new-dot" /></div>
                    <div className="notice-card__body">
                      <div className="notice-card__title">特典会の注意事項について</div>
                      <div className="notice-card__date">2024年5月17日</div>
                    </div>
                    <span className="notice-card__badge">NEW</span>
                    <span className="notice-card__arrow">›</span>
                  </button>
                  <button className="notice-card" onClick={() => navigate('/notifications')}>
                    <div className="notice-card__left"><span className="notice-card__icon"><Icon name="megaphone" size={18} /></span></div>
                    <div className="notice-card__body">
                      <div className="notice-card__title">アプリ先行ポイントアップ開催中</div>
                      <div className="notice-card__date">2024年5月15日</div>
                    </div>
                    <span className="notice-card__arrow">›</span>
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </FanLayout>
  )
}
