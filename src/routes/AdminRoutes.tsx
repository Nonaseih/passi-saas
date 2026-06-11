import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AdminLayout } from '@/apps/admin/components/AdminLayout'

import { AdminLogin } from '@/apps/admin/pages/AdminLogin'
import { AdminDashboard } from '@/apps/admin/pages/AdminDashboard'
import { AdminEvents } from '@/apps/admin/pages/AdminEvents'
import { AdminTickets } from '@/apps/admin/pages/AdminTickets'
import { AdminUsers } from '@/apps/admin/pages/AdminUsers'
import { AdminSales } from '@/apps/admin/pages/AdminSales'
import { AdminStaff } from '@/apps/admin/pages/AdminStaff'
import { AdminLive } from '@/apps/admin/pages/AdminLive'
import { AdminPoints } from '@/apps/admin/pages/AdminPoints'
import { AdminSettings } from '@/apps/admin/pages/AdminSettings'

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="live" element={<AdminLive />} />
          <Route path="points" element={<AdminPoints />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  )
}
