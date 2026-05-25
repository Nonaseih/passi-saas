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
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchUserProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })
    if (error) throw new Error(error.message)

    // Insert user profile row (role defaults to 'fan')
    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('users') as any).insert({
        id: data.user.id,
        email,
        display_name: displayName,
        role: 'fan',
      })
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
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
