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

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/sales" element={<AdminSales />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
        </Route>
      </Route>
    </Routes>
  )
}
