import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function StaffLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/staff')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* ロゴ・アプリ名 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="white">
              <path d="M20 5L25 15H15L20 5Z M20 35L15 25H25L20 35Z M5 20L15 15V25L5 20Z M35 20L25 25V15L35 20Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#221d4e] mb-1">チェキ進行管理</h1>
          <p className="text-sm text-[#9892b3]">スタッフ・運営管理アプリ</p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="text-sm text-center font-medium" style={{ color: '#f05475' }}>{error}</div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm text-[#221d4e] mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full px-3 py-2 border border-[#ebe8f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7cf2]"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm text-[#221d4e] mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-[#ebe8f6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7cf2]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] text-white py-3 rounded-xl font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <div className="text-center">
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-[#9c7cf2] hover:underline">
              パスワードを忘れた方はこちら
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
