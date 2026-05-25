import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { FanRoutes } from '@/routes/FanRoutes'
import { StaffRoutes } from '@/routes/StaffRoutes'
import { AdminRoutes } from '@/routes/AdminRoutes'

/**
 * Root redirect — sends users to their role's home on the root path.
 */
function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const roleHome = {
    fan: '/tickets',
    staff: '/staff',
    admin: '/admin',
  }
  return <Navigate to={roleHome[user.role]} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      {/* Fan app handles /login, /register, /tickets, /purchase, /history */}
      <Route path="/*" element={<FanRoutes />} />
      {/* Staff app handles /staff/* */}
      <Route path="/staff/*" element={<StaffRoutes />} />
      {/* Admin app handles /admin/* */}
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
