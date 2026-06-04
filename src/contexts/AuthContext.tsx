import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchUserProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session?.user) {
          // On first signup, insert the profile row before fetching it.
          // This avoids a race condition where fetchUserProfile runs before
          // the signUp() caller gets to its own insert.
          if ((event as string) === 'SIGNED_UP') {
            const displayName =
              session.user.user_metadata?.display_name ??
              session.user.email ??
              ''
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('users') as any).upsert(
              {
                id: session.user.id,
                email: session.user.email ?? '',
                display_name: displayName,
                role: 'fan',
              },
              { onConflict: 'id' }
            )
          }
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, role, display_name, email, avatar_url')
      .eq('id', userId)
      .single<{
        id: string
        role: import('@/types').UserRole
        display_name: string
        email: string
        avatar_url: string | null
      }>()

    if (!error && data) {
      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
        display_name: data.display_name,
        avatar_url: data.avatar_url ?? undefined,
      })
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signUp(email: string, password: string, displayName: string) {
    // Profile row is created in onAuthStateChange (SIGNED_UP event) to avoid
    // a race condition. We only need to trigger the auth signup here.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${import.meta.env.VITE_APP_URL}/login?confirmed=true`,
      },
    })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    })
    if (error) throw new Error(error.message)
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut, sendPasswordReset, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
