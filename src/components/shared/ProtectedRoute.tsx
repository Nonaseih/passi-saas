import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  console.log('[ProtectedRoute] loading:', loading, '| user:', user?.email, '| role:', user?.role, '| allowedRoles:', allowedRoles)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    console.log('[ProtectedRoute] no user → redirecting to', redirectTo)
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] role mismatch — user.role:', user.role, 'not in', allowedRoles, '→ blocking redirect (DEBUG)')
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
