import { useState, useEffect, useRef } from 'react'
import { Settings, Save, Upload, Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CARD = { background: '#ffffff', borderRadius: 22, border: '1px solid #ebe8f6', boxShadow: '0 8px 20px rgba(59,42,124,.06)' } as const
const INPUT_STYLE = { background: '#f8f7ff', border: '1.5px solid #ebe8f6', borderRadius: 14, color: '#221d4e', outline: 'none', padding: '10px 14px', fontSize: 14, width: '100%' } as const

interface TicketTypeSetting {
  id: string
  name: string
  price: number
  event_title: string
  event_id: string
}

interface NewRow {
  name: string
  price: string
}

export function AdminSettings() {
  const [orgName, setOrgName] = useState(() => localStorage.getItem('passi_org_name') ?? 'PASSi')
  const [orgLogo, setOrgLogo] = useState<string | null>(() => localStorage.getItem('passi_org_logo'))
  const [orgSaved, setOrgSaved] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  const [tickets, setTickets] = useState<TicketTypeSetting[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newRow, setNewRow] = useState<NewRow>({ name: '', price: '' })
  const [savingRow, setSavingRow] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Admin profile
  const [adminDisplayName, setAdminDisplayName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    loadTickets()
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoadingProfile(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingProfile(false); return }
    setAdminEmail(user.email ?? '')
    const { data } = await (supabase as any).from('users').select('display_name').eq('id', user.id).single()
    setAdminDisplayName(data?.display_name ?? '')
    setLoadingProfile(false)
  }

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase as any).from('users').update({ display_name: adminDisplayName }).eq('id', user.id)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function loadTickets() {
    setLoadingTickets(true)
    const { data } = await (supabase as any)
      .from('ticket_types')
      .select('id, name, price, event_id, events!inner(title)')
      .order('created_at', { ascending: false })
    setTickets((data ?? []).map((r: any) => ({
      id: r.id, name: r.name, price: r.price, event_id: r.event_id, event_title: r.events?.title ?? '',
    })))
    setLoadingTickets(false)
  }

  function saveOrgSettings() {
    localStorage.setItem('passi_org_name', orgName)
    if (orgLogo) localStorage.setItem('passi_org_logo', orgLogo)
    setOrgSaved(true)
    setTimeout(() => setOrgSaved(false), 2000)
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setOrgLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function startEditRow(t: TicketTypeSetting) {
    setEditingRow(t.id)
    setEditName(t.name)
    setEditPrice(String(t.price))
  }

  async function saveEditRow(id: string) {
    setSavingRow(true)
    const price = parseInt(editPrice) || 0
    await (supabase as any).from('ticket_types').update({ name: editName.trim(), price }).eq('id', id)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, name: editName.trim(), price } : t))
    setEditingRow(null)
    setSavingRow(false)
  }

  async function deleteRow(id: string) {
    setDeletingId(id)
    await (supabase as any).from('ticket_types').delete().eq('id', id)
    setTickets(prev => prev.filter(t => t.id !== id))
    setConfirmDeleteId(null)
    setDeletingId(null)
  }

  return (
    <div className="p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f0ebff,#e8e2ff)', border: '1px solid #ebe8f6' }}>
          <Settings className="w-5 h-5" style={{ color: '#9c7cf2' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: '#221d4e' }}>設定</h1>
          <p className="text-sm" style={{ color: '#9892b3' }}>組織情報・アカウント・券種管理</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* 組織設定 */}
        <div className="p-5" style={CARD}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#221d4e' }}>基本設定</h2>

          {/* ロゴ */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-2" style={{ color: '#9892b3' }}>ロゴ画像</label>
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed transition-all"
                style={{ borderColor: '#c0a6ff', background: '#f8f7ff' }}
                onClick={() => logoRef.current?.click()}>
                {orgLogo ? (
                  <img src={orgLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-5 h-5" style={{ color: '#c0a6ff' }} />
                )}
              </div>
              <div>
                <button onClick={() => logoRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: '#f0ebff', color: '#9c7cf2', border: '1px solid #ddd6ff' }}>
                  <Upload className="w-3.5 h-3.5" />
                  画像をアップロード
                </button>
                <p className="text-xs mt-1" style={{ color: '#c7bcff' }}>PNG / JPG / SVG 推奨</p>
              </div>
              <input type="file" accept="image/*" ref={logoRef} className="hidden" onChange={handleLogoFile} />
            </div>
          </div>

          {/* 組織名 */}
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#9892b3' }}>組織名 / グループ名</label>
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="例: PASSi"
              style={INPUT_STYLE}
              onFocus={e => (e.target.style.borderColor = '#c0a6ff')}
              onBlur={e => (e.target.style.borderColor = '#ebe8f6')}
            />
          </div>

          <button onClick={saveOrgSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: orgSaved ? '#e5f7eb' : 'linear-gradient(135deg,#c0a6ff,#9c7cf2)', color: orgSaved ? '#3d9b60' : '#fff', boxShadow: orgSaved ? 'none' : '0 4px 16px rgba(156,124,242,.3)' }}>
            {orgSaved ? <><Check className="w-4 h-4" />保存しました</> : <><Save className="w-4 h-4" />保存する</>}
          </button>
        </div>

        {/* アカウント設定 */}
        <div className="p-5" style={CARD}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#221d4e' }}>アカウント設定</h2>

          {loadingProfile ? (
            <div className="animate-pulse space-y-3">
              {[0,1].map(i => <div key={i} className="h-10 rounded-xl" style={{ background: '#f0ebff' }} />)}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#9892b3' }}>メールアドレス</label>
                <div className="px-3.5 py-2.5 rounded-[14px] text-sm" style={{ background: '#f0ebff', color: '#9892b3', border: '1.5px solid #ebe8f6' }}>
                  {adminEmail}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#9892b3' }}>表示名</label>
                <input
                  value={adminDisplayName}
                  onChange={e => setAdminDisplayName(e.target.value)}
                  placeholder="管理者の名前"
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = '#c0a6ff')}
                  onBlur={e => (e.target.style.borderColor = '#ebe8f6')}
                />
              </div>
              <button onClick={saveProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ background: profileSaved ? '#e5f7eb' : 'linear-gradient(135deg,#c0a6ff,#9c7cf2)', color: profileSaved ? '#3d9b60' : '#fff', boxShadow: profileSaved ? 'none' : '0 4px 16px rgba(156,124,242,.3)' }}>
                {profileSaved ? <><Check className="w-4 h-4" />保存しました</> : <><Save className="w-4 h-4" />保存する</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* チケット種別管理 */}
      <div style={CARD}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f1fb' }}>
          <h2 className="text-base font-bold" style={{ color: '#221d4e' }}>チケット種別管理</h2>
          <span className="text-xs" style={{ color: '#9892b3' }}>全イベントの券種を確認・編集できます</span>
        </div>

        {/* テーブルヘッダー */}
        <div className="grid px-5 py-2.5"
          style={{ gridTemplateColumns: '1fr 1fr 1fr 120px', gap: '1rem', background: '#faf9ff', borderBottom: '1px solid #f3f1fb' }}>
          {['券種名', 'イベント', '価格', '操作'].map((h, i) => (
            <div key={i} className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: '#9892b3', textAlign: i === 3 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loadingTickets ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9892b3' }}>読み込み中…</div>
        ) : (
          <>
            {tickets.map(ticket => {
              const isEditing = editingRow === ticket.id
              return (
                <div key={ticket.id} className="grid px-5 py-3 items-center"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 120px', gap: '1rem', borderBottom: '1px solid #f8f7ff' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#faf9ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>

                  {isEditing ? (
                    <>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13 }}
                        onFocus={e => (e.target.style.borderColor = '#c0a6ff')}
                        onBlur={e => (e.target.style.borderColor = '#ebe8f6')} />
                      <div className="text-sm" style={{ color: '#9892b3' }}>{ticket.event_title}</div>
                      <input value={editPrice} onChange={e => setEditPrice(e.target.value)}
                        type="number" placeholder="価格"
                        style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13 }}
                        onFocus={e => (e.target.style.borderColor = '#c0a6ff')}
                        onBlur={e => (e.target.style.borderColor = '#ebe8f6')} />
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-sm" style={{ color: '#221d4e' }}>{ticket.name}</div>
                      <div className="text-sm truncate" style={{ color: '#9892b3' }}>{ticket.event_title}</div>
                      <div className="text-sm font-semibold" style={{ color: '#221d4e' }}>¥{ticket.price.toLocaleString()}</div>
                    </>
                  )}

                  <div className="flex items-center justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEditRow(ticket.id)} disabled={savingRow}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#e5f7eb', border: '1px solid #b2e4c5' }}>
                          <Check className="w-3.5 h-3.5" style={{ color: '#3d9b60' }} />
                        </button>
                        <button onClick={() => setEditingRow(null)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#fff0f4', border: '1px solid #f5bbc7' }}>
                          <X className="w-3.5 h-3.5" style={{ color: '#f08aa0' }} />
                        </button>
                      </>
                    ) : confirmDeleteId === ticket.id ? (
                      <>
                        <span className="text-xs" style={{ color: '#f08aa0' }}>削除？</span>
                        <button onClick={() => deleteRow(ticket.id)} disabled={!!deletingId}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#fff0f4', border: '1px solid #f5bbc7' }}>
                          <Check className="w-3.5 h-3.5" style={{ color: '#f08aa0' }} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#f0ebff', border: '1px solid #ddd6ff' }}>
                          <X className="w-3.5 h-3.5" style={{ color: '#9892b3' }} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditRow(ticket)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#f0ebff', border: '1px solid #ddd6ff' }}>
                          <Pencil className="w-3.5 h-3.5" style={{ color: '#9c7cf2' }} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(ticket.id)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: '#fff0f4', border: '1px solid #f5bbc7' }}>
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#f08aa0' }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* 新規追加行 */}
            {addingRow ? (
              <div className="grid px-5 py-3 items-center"
                style={{ gridTemplateColumns: '1fr 1fr 1fr 120px', gap: '1rem', borderBottom: '1px solid #f8f7ff', background: '#faf9ff' }}>
                <input value={newRow.name} onChange={e => setNewRow(r => ({ ...r, name: e.target.value }))}
                  placeholder="券種名"
                  style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13 }}
                  onFocus={e => (e.target.style.borderColor = '#c0a6ff')}
                  onBlur={e => (e.target.style.borderColor = '#ebe8f6')} />
                <div className="text-xs" style={{ color: '#c7bcff', fontStyle: 'italic' }}>
                  ※ イベント管理から追加してください
                </div>
                <input value={newRow.price} onChange={e => setNewRow(r => ({ ...r, price: e.target.value }))}
                  type="number" placeholder="価格"
                  style={{ ...INPUT_STYLE, padding: '6px 10px', fontSize: 13 }}
                  onFocus={e => (e.target.style.borderColor = '#c0a6ff')}
                  onBlur={e => (e.target.style.borderColor = '#ebe8f6')} />
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => setAddingRow(false)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: '#fff0f4', border: '1px solid #f5bbc7' }}>
                    <X className="w-3.5 h-3.5" style={{ color: '#f08aa0' }} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-3">
                <button onClick={() => setAddingRow(true)}
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                  style={{ color: '#9892b3', border: '1.5px dashed #ddd6ff', width: '100%', justifyContent: 'center' }}>
                  <Plus className="w-3.5 h-3.5" />
                  券種を追加（イベント管理から追加推奨）
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
