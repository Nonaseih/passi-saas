import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
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
    // Safety net: if auth hasn't resolved in 8 s (e.g. Supabase project paused),
    // clear the stale session so the app doesn't spin forever.
    const failsafe = setTimeout(async () => {
      setUser(null)
      setSession(null)
      setLoading(false)
      await supabase.auth.signOut()
    }, 8000)

    // onAuthStateChange fires INITIAL_SESSION on mount — no need for getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(failsafe)
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(authUser: User) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, role, display_name, email, avatar_url')
        .eq('id', authUser.id)
        .abortSignal(controller.signal)
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
        return
      }

      // Row missing — provision it now (handles cases where the SIGNED_UP
      // event never fired, or an earlier upsert silently failed).
      if (error?.code === 'PGRST116' || !data) {
        console.warn('AuthContext: users row missing, provisioning now')
        const displayName =
          authUser.user_metadata?.display_name ??
          authUser.email ??
          'Fan'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('users') as any).insert({
          id: authUser.id,
          email: authUser.email ?? '',
          display_name: displayName,
          role: 'fan',
        })

        if (!insertError) {
          const { data: retryData } = await supabase
            .from('users')
            .select('id, role, display_name, email, avatar_url')
            .eq('id', authUser.id)
            .single<{
              id: string
              role: import('@/types').UserRole
              display_name: string
              email: string
              avatar_url: string | null
            }>()

          if (retryData) {
            setUser({
              id: retryData.id,
              email: retryData.email,
              role: retryData.role,
              display_name: retryData.display_name,
              avatar_url: retryData.avatar_url ?? undefined,
            })
          }
        } else {
          console.error('AuthContext: failed to provision users row', insertError.message)
        }
      } else {
        console.error('AuthContext: fetchUserProfile error', String(error))
      }
    } catch (e) {
      console.error('AuthContext: fetchUserProfile threw unexpectedly', e)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signUp(email: string, password: string, displayName: string) {
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
