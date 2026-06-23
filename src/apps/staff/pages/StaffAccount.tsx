import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export function StaffAccount() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const roleLabel = user?.role === 'admin' ? '運営スタッフ' : 'チェキスタッフ'

  // Real password change via Supabase Auth (in-scope account management).
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { alert('すべての項目を入力してください'); return }
    if (newPassword !== confirmPassword) { alert('新しいパスワードが一致しません'); return }
    if (newPassword.length < 6) { alert('パスワードは6文字以上で入力してください'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) { alert('変更に失敗しました：' + error.message); return }
    alert('パスワードを変更しました')
    setIsPasswordChangeOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-[#faf9ff] pb-6">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/staff/settings')} className="flex items-center gap-2 py-2 pr-4 -ml-2">
            <ArrowLeft className="w-5 h-5 text-[#9c7cf2]" /><span className="text-base text-[#9c7cf2]">設定</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-[#221d4e] mb-3">アカウント情報</div>
          <div className="space-y-3">
            <div><div className="text-xs text-[#9892b3] mb-1">スタッフ名</div><div className="text-sm text-[#221d4e]">{user?.display_name ?? '—'}</div></div>
            <div><div className="text-xs text-[#9892b3] mb-1">権限</div><div className="text-sm text-[#221d4e]">{roleLabel}</div></div>
            <div><div className="text-xs text-[#9892b3] mb-1">メールアドレス</div><div className="text-sm text-[#221d4e]">{user?.email ?? '—'}</div></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <button onClick={() => setIsPasswordChangeOpen(!isPasswordChangeOpen)} className="w-full text-left">
            <div className="text-sm font-medium text-[#9c7cf2]">パスワードを変更</div>
          </button>
          {isPasswordChangeOpen && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-[#9892b3] mb-1">現在のパスワード</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-[#ebe8f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7cf2] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#9892b3] mb-1">新しいパスワード</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-[#ebe8f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7cf2] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#9892b3] mb-1">新しいパスワード（確認）</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-[#ebe8f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7cf2] text-sm" />
              </div>
              <button onClick={handlePasswordChange} disabled={saving} className="w-full py-2 bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] text-white rounded-lg font-medium text-sm shadow-sm disabled:opacity-50">
                {saving ? '変更中...' : 'パスワードを変更'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
