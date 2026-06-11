import { useState, useEffect, useRef } from 'react'
import { Users, Pencil, Check, X, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const

interface FanUser {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export function AdminUsers() {
  const [users, setUsers] = useState<FanUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('users').select('id, email, display_name, avatar_url, created_at')
      .eq('role', 'fan').order('created_at', { ascending: false })
    setUsers((data ?? []) as FanUser[])
    setLoading(false)
  }

  function startEdit(u: FanUser) {
    setEditingId(u.id)
    setEditName(u.display_name ?? '')
  }

  async function saveName(id: string) {
    setSavingId(id)
    await (supabase as any).from('users').update({ display_name: editName.trim() || null }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, display_name: editName.trim() || null } : u))
    setEditingId(null)
    setSavingId(null)
  }

  async function uploadAvatar(id: string, file: File) {
    const ext = file.name.split('.').pop()
    const path = `avatars/${id}.${ext}`
    const { error } = await supabase.storage.from('public').upload(path, file, { upsert: true })
    if (error) { console.error(error); return }
    const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(path)
    await (supabase as any).from('users').update({ avatar_url: publicUrl }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, avatar_url: publicUrl } : u))
  }

  return (
    <div className="p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f0ebff,#e8e2ff)', border: '1px solid #ebe8f6' }}>
            <Users className="w-5 h-5" style={{ color: '#9c7cf2' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#221d4e' }}>ユーザー管理</h1>
            <p className="text-sm" style={{ color: '#9892b3' }}>登録ファンユーザーの一覧・編集</p>
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: '#f0ebff', color: '#9c7cf2', border: '1px solid #e0d8ff' }}>
          {users.length} 人
        </div>
      </div>

      {/* テーブル */}
      <div style={CARD}>
        {/* ヘッダー行 */}
        <div className="grid items-center px-5 py-3"
          style={{
            gridTemplateColumns: '56px 1fr 1fr 1fr 100px',
            gap: '1rem',
            background: '#faf9ff',
            borderBottom: '1px solid #f3f1fb',
            borderRadius: '22px 22px 0 0',
          }}>
          {['', 'ユーザー名', 'メールアドレス', '登録日', '操作'].map((h, i) => (
            <div key={i} className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: '#9892b3', textAlign: i === 4 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: '#9892b3' }}>読み込み中…</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">👤</div>
            <div className="font-bold mb-1" style={{ color: '#221d4e' }}>ユーザーが登録されていません</div>
            <div className="text-sm" style={{ color: '#9892b3' }}>ファンがアプリから登録すると、ここに表示されます</div>
          </div>
        ) : (
          <div>
            {users.map((user) => {
              const isEditing = editingId === user.id
              const initials = (user.display_name ?? user.email ?? '?').slice(0, 2).toUpperCase()

              return (
                <div key={user.id} className="grid items-center px-5 py-3.5"
                  style={{
                    gridTemplateColumns: '56px 1fr 1fr 1fr 100px',
                    gap: '1rem',
                    borderBottom: '1px solid #f8f7ff',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#faf9ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>

                  {/* アバター */}
                  <div className="relative w-fit">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover"
                        style={{ border: '2px solid #ebe8f6' }} />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg,#c0a6ff,#f199d5)', color: '#fff' }}>
                        {initials}
                      </div>
                    )}
                    <button
                      onClick={() => fileRefs.current[user.id]?.click()}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#9c7cf2', border: '2px solid #fff' }}
                      title="画像を変更">
                      <Upload className="w-2.5 h-2.5 text-white" />
                    </button>
                    <input type="file" accept="image/*" className="hidden"
                      ref={el => { fileRefs.current[user.id] = el }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(user.id, f) }} />
                  </div>

                  {/* 名前 */}
                  <div>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveName(user.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="w-full px-3 py-1.5 rounded-xl text-sm font-semibold outline-none"
                        style={{ background: '#f5f2ff', border: '2px solid #c0a6ff', color: '#221d4e' }}
                      />
                    ) : (
                      <span className="font-semibold text-sm" style={{ color: '#221d4e' }}>
                        {user.display_name ?? <span style={{ color: '#c7bcff', fontStyle: 'italic' }}>未設定</span>}
                      </span>
                    )}
                  </div>

                  {/* メール */}
                  <div className="text-sm truncate" style={{ color: '#9892b3' }}>{user.email}</div>

                  {/* 登録日 */}
                  <div className="text-xs" style={{ color: '#9892b3' }}>
                    {new Date(user.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>

                  {/* 操作ボタン */}
                  <div className="flex items-center justify-center gap-1.5">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveName(user.id)} disabled={!!savingId}
                          className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: '#e5f7eb', border: '1px solid #b2e4c5' }}
                          title="保存">
                          <Check className="w-3.5 h-3.5" style={{ color: '#3d9b60' }} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#fff0f4', border: '1px solid #f5bbc7' }}
                          title="キャンセル">
                          <X className="w-3.5 h-3.5" style={{ color: '#f08aa0' }} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(user)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: '#f0ebff', border: '1px solid #ddd6ff' }}
                        title="名前を編集">
                        <Pencil className="w-3.5 h-3.5" style={{ color: '#9c7cf2' }} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
