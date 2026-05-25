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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to={redirectTo} replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home based on role
    const roleHome: Record<UserRole, string> = {
      fan: '/tickets',
      staff: '/staff',
      admin: '/admin',
    }
    return <Navigate to={roleHome[user.role]} replace />
  }

  return <Outlet />
}
