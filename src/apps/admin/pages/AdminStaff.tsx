import { useState, useEffect } from 'react'
import { Users, UserMinus, UserPlus, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

const CARD = {
  background: '#ffffff',
  borderRadius: 22,
  border: '1px solid #ebe8f6',
  boxShadow: '0 8px 20px rgba(59,42,124,.06)',
} as const

const MODAL_CARD = {
  background: '#ffffff',
  borderRadius: 24,
  border: '1px solid #ebe8f6',
  boxShadow: '0 24px 60px rgba(59,42,124,.20)',
} as const

const OVERLAY = {
  background: 'rgba(29,19,74,.38)',
  backdropFilter: 'blur(6px)',
} as const

const inputStyle = { border: '1.5px solid #e8e6f3', color: '#221d4e', borderRadius: 12 } as const
const labelStyle = { color: '#9892b3', fontSize: 12, fontWeight: 600 } as const

export function AdminStaff() {
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [promoteModal, setPromoteModal] = useState(false)
  const [promoteEmail, setPromoteEmail] = useState('')
  const [promoteLoading, setPromoteLoading] = useState(false)
  const [promoteError, setPromoteError] = useState('')

  const [confirmDemote, setConfirmDemote] = useState<User | null>(null)
  const [demoteLoading, setDemoteLoading] = useState(false)

  async function fetchStaff() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false })
    setStaff((data ?? []) as User[])
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  async function promoteToStaff() {
    if (!promoteEmail.trim()) return
    setPromoteLoading(true)
    setPromoteError('')
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', promoteEmail.trim().toLowerCase())
      .single()
    if (error || !data) {
      setPromoteError('このメールアドレスのユーザーが見つかりません')
      setPromoteLoading(false)
      return
    }
    if (data.role === 'staff' || data.role === 'admin') {
      setPromoteError('このユーザーはすでにスタッフ以上の権限を持っています')
      setPromoteLoading(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('users') as any).update({ role: 'staff' }).eq('id', data.id)
    setPromoteLoading(false)
    setPromoteModal(false)
    setPromoteEmail('')
    fetchStaff()
  }

  async function demoteToFan() {
    if (!confirmDemote) return
    setDemoteLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('users') as any).update({ role: 'fan' }).eq('id', confirmDemote.id)
    setDemoteLoading(false)
    setConfirmDemote(null)
    fetchStaff()
  }

  const filtered = staff.filter(u => {
    if (!search) return true
    return (
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%)', border: '1px solid #ebe8f6' }}
          >
            <Users className="w-5 h-5" style={{ color: '#9c7cf2' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#221d4e' }}>スタッフ</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9892b3' }}>{staff.length} 名</p>
          </div>
        </div>
        <button
          onClick={() => { setPromoteModal(true); setPromoteEmail(''); setPromoteError('') }}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{
            background: 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)',
            boxShadow: '0 8px 24px rgba(192,160,255,.22)',
            borderRadius: 14,
            color: '#fff',
          }}
        >
          <UserPlus className="w-4 h-4" />
          スタッフを追加
        </button>
      </div>

      {/* Table card */}
      <div style={CARD} className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
          <h2 className="font-bold text-sm" style={{ color: '#221d4e' }}>スタッフ一覧</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9892b3' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="名前・メールで検索"
              className="pl-9 pr-4 py-2 text-sm focus:outline-none w-56"
              style={{ border: '1.5px solid #e8e6f3', borderRadius: 12 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ background: '#faf9ff' }}>
              {[
                { label: '名前',         cls: 'px-6 text-left' },
                { label: 'メールアドレス', cls: 'px-4 text-left' },
                { label: '追加日',       cls: 'px-4 text-left' },
                { label: '操作',         cls: 'px-4 text-right' },
              ].map(({ label, cls }) => (
                <th key={label} className={`text-[11px] font-bold uppercase tracking-wider py-3 ${cls}`} style={{ color: '#9892b3' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2].map(i => (
                <tr key={i}>
                  <td colSpan={4} className="px-6 py-4">
                    <div className="h-5 rounded-lg animate-pulse" style={{ background: '#f3f1fb' }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm" style={{ color: '#9892b3' }}>
                  {search ? '該当するスタッフがいません' : 'スタッフが登録されていません'}
                </td>
              </tr>
            ) : filtered.map((u, i) => (
              <tr
                key={u.id}
                className="transition-colors"
                style={{ borderTop: i === 0 ? 'none' : '1px solid #f8f7ff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f0ebff 0%, #e8e2ff 100%)', color: '#9c7cf2' }}
                    >
                      {u.display_name.slice(0, 1)}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: '#221d4e' }}>{u.display_name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm" style={{ color: '#6d6791' }}>{u.email}</td>
                <td className="px-4 py-4 text-xs" style={{ color: '#9892b3' }}>
                  {new Date(u.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setConfirmDemote(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{ color: '#f08aa0', border: '1.5px solid #ffc8d5' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fff0f4' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <UserMinus className="w-3 h-3" />
                      解除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Promote modal */}
      {promoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={OVERLAY}
          onClick={() => setPromoteModal(false)}
        >
          <div
            className="w-full max-w-md mx-4 overflow-hidden"
            style={MODAL_CARD}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: '1px solid #f3f1fb' }}>
              <div>
                <h3 className="font-bold text-base" style={{ color: '#221d4e' }}>スタッフを追加</h3>
                <p className="text-xs mt-0.5" style={{ color: '#9892b3' }}>既存ユーザーにスタッフ権限を付与します</p>
              </div>
              <button
                onClick={() => setPromoteModal(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#9892b3' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0ebff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label style={labelStyle}>メールアドレス <span style={{ color: '#f08aa0' }}>*</span></label>
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={e => { setPromoteEmail(e.target.value); setPromoteError('') }}
                  placeholder="staff@example.com"
                  className="w-full px-4 py-2.5 text-sm focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#9c7cf2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,160,255,.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e8e6f3'; e.currentTarget.style.boxShadow = 'none' }}
                  autoFocus
                />
                {promoteError && (
                  <p className="text-xs" style={{ color: '#f08aa0' }}>{promoteError}</p>
                )}
              </div>
              <div className="px-4 py-3 rounded-xl text-xs" style={{ background: '#faf9ff', border: '1.5px solid #ebe8f6', color: '#9892b3' }}>
                対象ユーザーはすでにPASSiアカウントを持っている必要があります。
              </div>
            </div>

            <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid #f3f1fb' }}>
              <button
                onClick={() => setPromoteModal(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl"
                style={{ background: '#f0ebff', color: '#9892b3' }}
              >
                キャンセル
              </button>
              <button
                onClick={promoteToStaff}
                disabled={promoteLoading || !promoteEmail.trim()}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity"
                style={{
                  background: promoteEmail.trim()
                    ? 'linear-gradient(90deg, #c89cff 0%, #a79fff 55%, #c7b7ff 100%)'
                    : '#e8e6f3',
                  color: promoteEmail.trim() ? '#fff' : '#9892b3',
                  cursor: promoteEmail.trim() ? 'pointer' : 'not-allowed',
                  opacity: promoteLoading ? 0.7 : 1,
                }}
              >
                {promoteLoading ? '処理中...' : '権限を付与する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote confirm modal */}
      {confirmDemote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(29,19,74,.40)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm mx-4 overflow-hidden"
            style={{
              background: '#ffffff',
              borderRadius: 24,
              border: '1px solid #ebe8f6',
              boxShadow: '0 24px 60px rgba(59,42,124,.22)',
            }}
          >
            <div className="flex flex-col items-center px-8 pt-8 pb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #fff0f4 0%, #ffe9ef 100%)', border: '1px solid #ffc8d5' }}
              >
                <UserMinus className="w-6 h-6" style={{ color: '#f08aa0' }} />
              </div>
              <h3 className="text-base font-bold mb-1 text-center" style={{ color: '#221d4e' }}>
                スタッフ権限を解除しますか？
              </h3>
              <p className="text-sm text-center leading-relaxed" style={{ color: '#9892b3' }}>
                <span className="font-semibold" style={{ color: '#221d4e' }}>「{confirmDemote.display_name}」</span>
                のスタッフ権限を解除します。<br />
                ログイン後はファンとして扱われます。
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setConfirmDemote(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
                style={{ background: '#f0ebff', color: '#9892b3' }}
              >
                キャンセル
              </button>
              <button
                onClick={demoteToFan}
                disabled={demoteLoading}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-opacity hover:opacity-85"
                style={{ background: 'linear-gradient(90deg, #f08aa0 0%, #e86d8a 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(240,138,160,.30)', opacity: demoteLoading ? 0.7 : 1 }}
              >
                {demoteLoading ? '処理中...' : '解除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
