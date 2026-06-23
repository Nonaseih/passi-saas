import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Menu, Clock, Search, Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { StaffHamburgerMenu } from '../components/StaffHamburgerMenu'
import { GROUP_MEMBERS, GROUP_EVENTS, type ProgressMember } from '../data/progress'
import logo from '@/public/logo.png'

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none'
}

export function StaffProgress() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'progress' | 'numbers'>('progress')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const [currentGroupId, setCurrentGroupId] = useState<string>(() => localStorage.getItem('currentGroupId') || 'hzme')
  const [members, setMembers] = useState<ProgressMember[]>(() => {
    const gid = localStorage.getItem('currentGroupId') || 'hzme'
    return [...(GROUP_MEMBERS[gid] ?? GROUP_MEMBERS['hzme'])]
  })

  const currentEvent = GROUP_EVENTS[currentGroupId] ?? GROUP_EVENTS['hzme']

  const handleMenuClose = () => {
    setIsMenuOpen(false)
    const newGroupId = localStorage.getItem('currentGroupId') || 'hzme'
    if (newGroupId !== currentGroupId) {
      setCurrentGroupId(newGroupId)
      setMembers([...(GROUP_MEMBERS[newGroupId] ?? GROUP_MEMBERS['hzme'])])
    }
  }

  const togglePause = (memberId: string) =>
    setMembers(members.map(m => (m.id === memberId ? { ...m, isPaused: !m.isPaused } : m)))
  const addTime = (memberId: string) =>
    setMembers(members.map(m => (m.id === memberId ? { ...m, timeRemaining: m.timeRemaining + 30 } : m)))
  const removeMember = (memberId: string) => setMembers(members.filter(m => m.id !== memberId))
  void addTime

  return (
    <div className="h-screen flex flex-col bg-[#faf9ff] relative overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-white flex-shrink-0 z-10" style={{ borderBottom: '1px solid #ebe8f6', boxShadow: '0 1px 8px rgba(59,42,124,.05)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-1.5 -ml-1.5 rounded-xl" style={{ color: '#6b7280' }}>
            <Menu className="w-5 h-5" />
          </button>
          <img src={logo} alt="PASSi" className="h-6 w-auto" />
          <button onClick={() => navigate('/staff/settings')} className="p-1.5 -mr-1.5 rounded-xl" style={{ color: '#6b7280' }}>
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-1">
          <div className="text-center mb-2">
            <div className="text-sm font-bold" style={{ color: '#221d4e' }}>{currentEvent.name}</div>
            <div className="text-xs mt-0.5" style={{ color: '#9892b3' }}>
              {currentEvent.date}　{currentEvent.startTime}〜{currentEvent.endTime}
            </div>
          </div>

          <div className="flex gap-0 border-b" style={{ borderColor: '#ebe8f6' }}>
            <button
              onClick={() => setActiveTab('progress')}
              className="flex-1 pb-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px"
              style={activeTab === 'progress' ? { borderColor: '#9c7cf2', color: '#9c7cf2' } : { borderColor: 'transparent', color: '#9892b3' }}
            >
              進行管理
            </button>
            <button
              onClick={() => setActiveTab('numbers')}
              className="flex-1 pb-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px"
              style={activeTab === 'numbers' ? { borderColor: '#9c7cf2', color: '#9c7cf2' } : { borderColor: 'transparent', color: '#9892b3' }}
            >
              整理番号
            </button>
          </div>
        </div>
      </div>

      <StaffHamburgerMenu isOpen={isMenuOpen} onClose={handleMenuClose} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 進行管理タブ */}
        {activeTab === 'progress' && (
          <div className="p-3 space-y-3 pb-4">
            {members.map((member) => {
              const isTicket = member.ticketImageUrl?.includes('/tickets/')
              return (
                <div key={member.id} className="rounded-2xl" style={{ background: '#fff', border: '1px solid #ebe8f6', boxShadow: '0 2px 8px rgba(59,42,124,.04)' }}>
                  <div className="flex gap-3 p-3">
                    <div
                      className="rounded-md shadow-sm flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{
                        background: `radial-gradient(ellipse at center, ${member.memberColor}55 0%, ${member.memberColor} 100%)`,
                        width: isTicket ? '108px' : '60px',
                        height: isTicket ? '45px' : '80px',
                        alignSelf: 'center',
                      }}
                    >
                      {member.ticketImageUrl
                        ? <img src={member.ticketImageUrl} alt={`${member.name}のチェキ券`} className="w-full h-full object-contain" onError={hideOnError} />
                        : <div className="w-6 h-6 rounded-full bg-white/70" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h2 className="font-bold text-base text-[#221d4e] truncate">{member.name}</h2>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#ede8ff', color: '#9c7cf2' }}>
                            対応中 {member.currentNumber}
                          </div>
                          <button onClick={() => removeMember(member.id)} className="w-5 h-5 rounded-full bg-[#ebe8f6] hover:bg-red-100 flex items-center justify-center transition-colors">
                            <X className="w-3 h-3 text-[#9892b3]" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <div className="text-[28px] font-bold leading-none" style={{ color: member.remainingTickets <= 3 ? '#ef4444' : '#221d4e' }}>
                            {member.remainingTickets}
                          </div>
                          <div className="text-[14px] text-[#999999]">/ {member.totalTickets}枚</div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {member.recentLogs.slice(0, 2).map((log, idx) => (
                          <div key={idx} className="text-[11px] text-[#9892b3]">{log.number} {log.time}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#ebe8f6] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#ede9fe" strokeWidth="6" fill="none" />
                          <circle cx="32" cy="32" r="28" stroke={member.isPaused ? '#c7bcff' : '#9c7cf2'} strokeWidth="6" fill="none" strokeDasharray={`${(member.timeRemaining / 60) * 176} 176`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[18px] leading-none" style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#221d4e', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
                            {Math.floor(member.timeRemaining / 60)}:{(member.timeRemaining % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePause(member.id)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium shadow-sm ${member.isPaused ? 'bg-[#6b7280] hover:bg-[#221d4e] text-white' : 'bg-gradient-to-r from-[#9c7cf2] to-[#c4b5fd] text-white'}`}
                      >
                        {member.isPaused ? '▶ 再開' : '⏸ 一時停止'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {(() => {
              const addable = (GROUP_MEMBERS[currentGroupId] ?? []).filter(gm => !members.some(m => m.id === gm.id))
              return addable.length > 0 ? (
                <button onClick={() => setShowAddModal(true)} className="w-full py-2 text-[#9c7cf2] text-sm font-medium hover:bg-[#ebe8f6] rounded-lg">
                  ＋ メンバーを追加
                </button>
              ) : null
            })()}
          </div>
        )}

        {/* 整理番号タブ */}
        {activeTab === 'numbers' && (
          <div className="pb-4">
            <div className="bg-white sticky top-0 z-10 border-b border-[#ebe8f6]">
              <div className="px-3 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9892b3]" />
                  <input
                    type="text"
                    placeholder="整理番号で検索（例：A-030）"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#faf9ff] border border-[#ebe8f6] rounded-lg text-sm text-[#221d4e] placeholder:text-[#9892b3] focus:outline-none focus:border-[#9c7cf2]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 space-y-3 mt-3">
              {members
                .filter((member) => !searchQuery || member.allNumbers.some((n) => n.number.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((member) => {
                  const isExpanded = expandedMemberId === member.id
                  const filteredNumbers = searchQuery
                    ? member.allNumbers.filter((n) => n.number.toLowerCase().includes(searchQuery.toLowerCase()))
                    : member.allNumbers
                  return (
                    <div key={member.id} className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #ebe8f6', boxShadow: '0 2px 8px rgba(59,42,124,.04)' }}>
                      <button onClick={() => setExpandedMemberId(isExpanded ? null : member.id)} className="w-full p-3 flex items-center gap-3">
                        <div className="w-[60px] h-[40px] rounded-md shadow-sm flex-shrink-0 overflow-hidden" style={{ backgroundColor: member.memberColor, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {!member.ticketImageUrl
                            ? <div className="w-full h-full flex items-center justify-center"><div className="w-5 h-5 rounded-full bg-white/80" /></div>
                            : <img src={member.ticketImageUrl} alt={member.name} className="w-full h-full object-cover object-top" onError={hideOnError} />}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-base text-[#221d4e] mb-0.5">{member.name}</h3>
                          <div className="text-xs text-[#9892b3]">
                            対応中：<span className="font-medium text-[#221d4e]">{member.currentNumber}</span>
                            {' '}・待ち：<span className="font-medium text-[#221d4e]">{member.waitingCount}名</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-[#9892b3] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#9892b3] flex-shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#ebe8f6] px-3 py-2 bg-[#faf9ff]">
                          <div className="max-h-[400px] overflow-y-auto">
                            <div className="grid grid-cols-4 gap-2">
                              {filteredNumbers.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`relative px-2 py-2 rounded-md text-xs font-medium text-center ${item.status === 'completed' ? 'bg-[#ebe8f6] text-[#9892b3] line-through' : item.status === 'current' ? 'text-white shadow-sm' : 'bg-white border border-[#ebe8f6] text-[#221d4e]'}`}
                                  style={item.status === 'current' ? { background: `linear-gradient(135deg, ${member.memberColor}, ${member.memberColor}dd)` } : {}}
                                >
                                  {item.status === 'completed' && <Check className="w-3 h-3 absolute top-0.5 right-0.5 text-[#9892b3]" />}
                                  {item.number}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* メンバー追加モーダル */}
      {showAddModal && (() => {
        const addable = (GROUP_MEMBERS[currentGroupId] ?? []).filter(gm => !members.some(m => m.id === gm.id))
        return (
          <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-t-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#ebe8f6]">
                <h3 className="font-bold text-base text-[#221d4e]">メンバーを選択</h3>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-[#9892b3]" /></button>
              </div>
              <div className="overflow-y-auto max-h-72">
                {addable.map((member) => (
                  <button key={member.id} onClick={() => { setMembers(prev => [...prev, member]); setShowAddModal(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#faf9ff] transition-colors border-b border-[#ebe8f6] last:border-0">
                    <div className="w-10 h-14 rounded-md flex-shrink-0 overflow-hidden" style={{ backgroundColor: member.memberColor }}>
                      {member.ticketImageUrl
                        ? <img src={member.ticketImageUrl} alt={member.name} className="w-full h-full object-contain" onError={hideOnError} />
                        : <div className="w-full h-full flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-white/80" /></div>}
                    </div>
                    <span className="font-medium text-[#221d4e] text-sm">{member.name}</span>
                    <div className="ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: member.accentColor }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 特典会進行状況（固定フッター） */}
      <div className="bg-white border-t border-[#ebe8f6] px-4 py-3.5 shadow-lg flex-shrink-0" style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#9c7cf2] flex-shrink-0" />
          <div className="text-sm text-[#9892b3] flex-shrink-0">残り</div>
          <div className="text-2xl font-bold text-[#221d4e] flex-shrink-0">42:32</div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#ebe8f6] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd]" style={{ width: '29%' }} />
            </div>
            <div className="text-xs text-[#9892b3] flex-shrink-0">29%</div>
          </div>
          <div className="text-sm text-[#221d4e] whitespace-nowrap flex-shrink-0">終了 {currentEvent.endTime}</div>
        </div>
      </div>
    </div>
  )
}
