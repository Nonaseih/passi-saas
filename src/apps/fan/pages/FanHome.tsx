import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import { formatPrice } from '@/lib/utils'
import { Search, Bell, Ticket, Volume2, QrCode, CalendarDays } from 'lucide-react'
import { FanLayout } from '../components/FanLayout'
import { FanTopbar } from '../components/FanTopbar'
import passLogo from '@/public/logo.png'

type Filter = 'selling' | 'today' | 'tomorrow' | 'date' | null

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return '開催中'
  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h >= 24) return `${Math.floor(h / 24)}日`
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function CalendarCard({
  year, month, selected, eventDates, onPrev, onNext, onSelect,
}: {
  year: number
  month: number
  selected: string
  eventDates: Set<string>
  onPrev: () => void
  onNext: () => void
  onSelect: (date: string) => void
}) {
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const dayLabels = ['日','月','火','水','木','金','土']
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="home-calendar-card">
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
              {d}
              {hasEvent && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function FanHome() {
  const { events, loading } = useEvents()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>(null)
  const [dateValue, setDateValue] = useState('')  // YYYY/MM/DD
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [now, setNow] = useState(new Date())

  // Tick every second for the countdown
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const eventDateSet = useMemo(() => {
    const s = new Set<string>()
    events.forEach(e => s.add(toDateStr(new Date(e.date))))
    return s
  }, [events])

  const todayStr    = toDateStr(now)
  const tomorrow    = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDateStr(tomorrow)

  const isSearching = search.trim().length > 0

  const searchResults = isSearching
    ? events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const filteredEvents = (() => {
    if (!filter) return events
    const d = new Date(now)
    if (filter === 'selling') return events.filter(e => e.status === 'ongoing')
    if (filter === 'today')   return events.filter(e => new Date(e.date).toDateString() === d.toDateString())
    if (filter === 'tomorrow') {
      const t = new Date(d); t.setDate(t.getDate() + 1)
      return events.filter(e => new Date(e.date).toDateString() === t.toDateString())
    }
    if (filter === 'date' && dateValue) {
      return events.filter(e => toDateStr(new Date(e.date)) === dateValue)
    }
    return events
  })()

  // Next upcoming event for the countdown card
  const nextEvent = events
    .map(e => ({ ...e, _dt: new Date(e.date) }))
    .filter(e => e._dt >= now)
    .sort((a, b) => a._dt.getTime() - b._dt.getTime())[0] ?? null

  // Hero = first ongoing or first event
  const heroEvent = events.find(e => e.status === 'ongoing') ?? events[0] ?? null

  return (
    <FanLayout>
      <FanTopbar
        title={<img src={passLogo} alt="PASSi" style={{ height: 32, objectFit: 'contain' }} />}
        right={
          <button className="icon-btn" aria-label="通知">
            <Bell size={18} />
          </button>
        }
      />

      <div className="content content--home">

        {/* Hero card */}
        {heroEvent && (
          <>
            <div className="card hero hero--home">
              <div className="hero__content hero__content--home">
                <div className="hero__tag hero__tag--home">
                  {heroEvent.status === 'ongoing' ? 'LIVE' : 'NEXT'}
                </div>
                <div className="hero__title hero__title--home">{heroEvent.title}</div>
                <div className="hero__meta hero__meta--home">{heroEvent.venue}</div>
                <button
                  className="hero__cta hero__cta--home"
                  onClick={() => heroEvent.ticket_types[0] && navigate(`/purchase/${heroEvent.ticket_types[0].id}`)}
                >
                  詳細はこちら
                </button>
              </div>
              {/* Gradient accent instead of photo */}
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%',
                background: 'linear-gradient(135deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,.06) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ticket size={42} color="rgba(255,255,255,.55)" />
              </div>
            </div>
            <div className="pager pager--home">
              <span className="dot active" /><span className="dot" /><span className="dot" />
            </div>
          </>
        )}

        {/* Search bar + filter chips */}
        <section className="section section--home-tight">
          <div className="search-input card">
            <Search size={15} color="var(--text-2)" />
            <input
              type="text"
              placeholder="グループ名・イベント名を検索"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: 'var(--text)', caretColor: 'var(--primary)' }}
            />
            {search
              ? <button className="search-clear-btn" onClick={() => setSearch('')}>×</button>
              : <button className="search-qr-btn" aria-label="QRコードを読み取る" onClick={() => {}}>
                  <QrCode size={18} />
                </button>
            }
          </div>
          {!isSearching && (
            <div className="home-filter-row">
              {([
                ['selling', '販売中'],
                ['today',   '今日'],
                ['tomorrow','明日'],
              ] as [Filter, string][]).map(([key, label]) => (
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
                    setFilter('date')
                    setDateValue('')
                    setCalendarOpen(true)
                    setCalYear(now.getFullYear())
                    setCalMonth(now.getMonth())
                  } else {
                    setCalendarOpen(o => !o)
                  }
                }}
              >
                <CalendarDays size={11} />
                {filter === 'date' && dateValue
                  ? `${parseInt(dateValue.split('/')[1])}/${parseInt(dateValue.split('/')[2])}`
                  : '日付指定'}
              </button>
            </div>
          )}
          {filter === 'date' && calendarOpen && (
            <CalendarCard
              year={calYear}
              month={calMonth}
              selected={dateValue}
              eventDates={eventDateSet}
              onPrev={() => {
                if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
                else setCalMonth(m => m - 1)
              }}
              onNext={() => {
                if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
                else setCalMonth(m => m + 1)
              }}
              onSelect={d => { setDateValue(d); setCalendarOpen(false) }}
            />
          )}
        </section>

        {/* Search results */}
        {isSearching && (
          <section className="section section--home-tight">
            <div className="section-head section-head--soft">
              <div className="section-title section-title--soft">
                <Search size={14} /> 検索結果
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{searchResults.length}件</span>
            </div>
            {searchResults.length > 0 ? (
              <div className="list">
                {searchResults.map(event => (
                  <button
                    key={event.id}
                    className="card row-card"
                    style={{ gap: 12, padding: '10px 12px' }}
                    onClick={() => event.ticket_types[0] && navigate(`/purchase/${event.ticket_types[0].id}`)}
                  >
                    <div className="row-main" style={{ minWidth: 0 }}>
                      <div className="row-title" style={{ fontSize: 12 }}>{event.title}</div>
                      <div className="row-sub" style={{ fontSize: 10, marginTop: 2 }}>{event.venue}</div>
                    </div>
                    <span className={`status-chip${event.status === 'ongoing' ? ' soft-success' : ' status-chip--subtle'}`} style={{ flex: '0 0 auto' }}>
                      {event.status === 'ongoing' ? '開催中' : '近日開催'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="card info-card" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                「{search}」に一致するイベントが見つかりませんでした
              </div>
            )}
          </section>
        )}

        {/* Main content — hidden while searching */}
        {!isSearching && (
          <>
            {/* Filter results */}
            {filter && (
              <section className="section section--home-tight" style={{ marginTop: 16 }}>
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft">
                    <Search size={14} />
                    {filter === 'selling' ? '販売中のイベント'
                      : filter === 'today' ? `今日 (${todayStr}) のイベント`
                      : filter === 'tomorrow' ? `明日 (${tomorrowStr}) のイベント`
                      : dateValue ? `${parseInt(dateValue.split('/')[1])}月${parseInt(dateValue.split('/')[2])}日 のイベント`
                      : '日付指定'}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{filteredEvents.length}件</span>
                </div>
                {filteredEvents.length > 0 ? (
                  <div className="list">
                    {filteredEvents.map(event => (
                      <button
                        key={event.id}
                        className="card row-card"
                        style={{ gap: 12, padding: '10px 12px' }}
                        onClick={() => event.ticket_types[0] && navigate(`/purchase/${event.ticket_types[0].id}`)}
                      >
                        <div className="row-main" style={{ minWidth: 0 }}>
                          <div className="row-title" style={{ fontSize: 12 }}>{event.title}</div>
                          <div className="row-sub" style={{ fontSize: 10, marginTop: 2 }}>{event.venue}</div>
                        </div>
                        <span className={`status-chip${event.status === 'ongoing' ? ' soft-success' : ' status-chip--subtle'}`}>
                          {event.status === 'ongoing' ? '開催中' : '近日開催'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="card info-card" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    該当するイベントが見つかりませんでした
                  </div>
                )}
                <button className="filter-back-btn" onClick={() => { setFilter(null); setDateValue(''); setCalendarOpen(false) }}>
                  ← ホームに戻る
                </button>
              </section>
            )}

            {/* Next event countdown card */}
            {!filter && nextEvent && (
              <section className="section section--home-tight" style={{ marginTop: 28 }}>
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft">
                    <Ticket size={14} /> 次の特典会まで
                  </div>
                </div>
                <button
                  className="card next-event-card"
                  onClick={() => navigate('/tickets')}
                >
                  <div className="next-event-card__thumb-wrap">
                    <div className="next-event-card__thumb" style={{
                      background: 'linear-gradient(135deg, #d2bcff 0%, #c9d0ff 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ticket size={24} color="rgba(255,255,255,.7)" />
                    </div>
                  </div>
                  <div className="next-event-card__body">
                    <div className="next-event-card__main">
                      <div className="next-event-card__title">{nextEvent.title}</div>
                      <div className="next-event-card__text">
                        {new Date(nextEvent.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="next-event-card__text">{nextEvent.venue}</div>
                    </div>
                    <div className="next-event-card__countdown">
                      <div className="next-event-card__countdown-label">開始まで</div>
                      <div className="next-event-card__countdown-time">
                        {formatCountdown(new Date(nextEvent.date))}
                      </div>
                    </div>
                  </div>
                </button>
              </section>
            )}

            {/* Quick purchase section */}
            {!filter && (
              <section className="section section--home-tight">
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft">
                    <Ticket size={14} /> 特典券を購入する
                  </div>
                </div>
                {loading ? (
                  <div className="quick-stack">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="fan-skeleton" style={{ height: 74, borderRadius: 18 }} />
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <div className="card info-card" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    現在開催中のイベントはありません
                  </div>
                ) : (
                  <div className="quick-stack">
                    {events.map(event => {
                      const selling = event.status === 'ongoing'
                      const eventDate = new Date(event.date)
                      const dow = ['日','月','火','水','木','金','土'][eventDate.getDay()]
                      const dateLabel = `${eventDate.getMonth()+1}/${eventDate.getDate()}(${dow})`

                      return (
                        <div key={event.id} className="card quick-card quick-card--wide" style={{ pointerEvents: 'auto', cursor: 'default' }}>
                          {/* Left: gradient placeholder */}
                          <div className="quick-card__photo" style={{
                            background: 'linear-gradient(135deg, #ede8ff 0%, #d5cbff 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ticket size={22} color="var(--primary-3)" />
                          </div>
                          <div className="quick-card__body">
                            <div className="quick-card__group">{event.title}</div>
                            <div className="quick-card__event-title">{event.venue}</div>
                            {selling ? (
                              <span className="quick-card__live-badge">
                                <span className="quick-card__live-dot" />
                                販売中
                              </span>
                            ) : (
                              <span className="quick-card__next-date">次回 {dateLabel}</span>
                            )}
                          </div>
                          {selling && event.ticket_types.length > 0 && (
                            <div className="quick-card__right">
                              <button
                                className="quick-card__buy-btn"
                                onClick={() => navigate(`/purchase/${event.ticket_types[0].id}`)}
                              >
                                購入
                              </button>
                              {event.ticket_types[0] && (
                                <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 4, textAlign: 'right' }}>
                                  {formatPrice(event.ticket_types[0].price)}〜
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Notices */}
            {!filter && (
              <section className="section section--home-tight">
                <div className="section-head section-head--soft">
                  <div className="section-title section-title--soft">
                    <Volume2 size={14} /> お知らせ
                  </div>
                  <span className="link-inline link-inline--soft">すべて見る</span>
                </div>
                <div className="notice-card-list">
                  <button className="notice-card notice-card--new">
                    <div className="notice-card__left"><span className="notice-card__new-dot" /></div>
                    <div className="notice-card__body">
                      <div className="notice-card__title">特典会の注意事項について</div>
                      <div className="notice-card__date">{new Date().getFullYear()}年{new Date().getMonth()+1}月</div>
                    </div>
                    <span className="notice-card__badge">NEW</span>
                    <span className="notice-card__arrow">›</span>
                  </button>
                  <button className="notice-card">
                    <div className="notice-card__left">
                      <span className="notice-card__icon"><Volume2 size={18} /></span>
                    </div>
                    <div className="notice-card__body">
                      <div className="notice-card__title">アプリ先行ポイントアップ開催中</div>
                      <div className="notice-card__date">{new Date().getFullYear()}年{new Date().getMonth()+1}月</div>
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
