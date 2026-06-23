import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { X, LogOut, Check, ChevronRight, Music2, Smartphone } from 'lucide-react'
import logo from '@/public/logo.png'

const GROUPS = [
  { id: 'hzme', name: 'HzMe' },
  { id: 'appare', name: 'Appare!' },
  { id: 'myojou', name: 'myojou' },
]

export function StaffHamburgerMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [groupSwitchOpen, setGroupSwitchOpen] = useState(false)
  const currentGroupId = localStorage.getItem('currentGroupId') || 'hzme'
  const currentGroup = GROUPS.find(g => g.id === currentGroupId) || GROUPS[0]

  const switchGroup = (id: string) => {
    localStorage.setItem('currentGroupId', id)
    setGroupSwitchOpen(false)
    onClose()
  }
  const handleLogout = async () => { await signOut(); navigate('/staff/login') }

  if (!isOpen) return null
  return (
    <>
      <div className="absolute inset-0 bg-black/40 z-40" onClick={onClose} style={{ backdropFilter: 'blur(2px)' }} />
      <div className="absolute top-0 left-0 h-full w-72 z-50 overflow-y-auto" style={{ background: 'linear-gradient(180deg,#fff 0%,#faf9ff 100%)', borderRight: '1px solid #ebe8f6', boxShadow: '4px 0 24px rgba(59,42,124,.12)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <img src={logo} alt="PASSi" className="h-7 w-auto" />
            <div className="text-[10px] font-semibold mt-0.5" style={{ color: '#c7bcff' }}>管理パネル</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: '#9892b3' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="h-px mx-4" style={{ background: '#ebe8f6' }} />
        <div className="px-4 py-4 space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#c7bcff' }}>グループ</div>
            <button onClick={() => setGroupSwitchOpen(true)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: '#f6f4ff', border: '1.5px solid #e8e4f8' }}>
              <div className="flex items-center gap-2"><Music2 className="w-4 h-4" style={{ color: '#9c7cf2' }} /><span className="text-sm font-bold" style={{ color: '#221d4e' }}>{currentGroup.name}</span></div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#9c7cf2' }}>切り替え <ChevronRight className="w-3.5 h-3.5" /></div>
            </button>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#c7bcff' }}>画面モード</div>
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg,rgba(156,124,242,.13),rgba(133,127,255,.08))', border: '1.5px solid rgba(156,124,242,.20)', color: '#9c7cf2' }}>
              <Smartphone className="w-4 h-4" /> チェキスタッフ用 <Check className="w-3.5 h-3.5 ml-auto" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3" style={{ borderTop: '1px solid #ebe8f6' }}>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ color: '#f05475' }}><LogOut className="w-4 h-4" /> ログアウト</button>
        </div>
      </div>
      {groupSwitchOpen && (
        <>
          <div className="absolute inset-0 bg-black/40 z-50" onClick={() => setGroupSwitchOpen(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 z-50 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #ebe8f6', boxShadow: '0 20px 50px rgba(59,42,124,.18)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
              <h3 className="font-bold text-sm" style={{ color: '#221d4e' }}>グループを選択</h3>
              <button onClick={() => setGroupSwitchOpen(false)} className="p-1.5 rounded-lg" style={{ color: '#9892b3' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2">
              {GROUPS.map(g => (
                <button key={g.id} onClick={() => switchGroup(g.id)} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3">
                  {g.id === currentGroupId ? <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#9c7cf2' }} /> : <div className="w-4 h-4 flex-shrink-0" />}
                  <span className={`text-sm ${g.id === currentGroupId ? 'font-bold' : 'font-medium'}`} style={{ color: g.id === currentGroupId ? '#9c7cf2' : '#221d4e' }}>{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
