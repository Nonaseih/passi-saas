import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function FanForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-bold">メールを送信しました</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{email}</span> に
            パスワードリセット用のリンクを送信しました。
            メールをご確認ください。
          </p>
          <Link
            to="/login"
            className="block text-sm text-primary underline"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">PassI</h1>
          <p className="text-sm text-muted-foreground mt-1">パスワードをお忘れの方</p>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          登録済みのメールアドレスを入力してください。
          パスワードリセット用のリンクをお送りします。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? '送信中...' : 'リセットリンクを送信'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary underline">
            ログイン画面に戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
