import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

import { StaffLogin } from '@/apps/staff/pages/StaffLogin'
import { StaffHome } from '@/apps/staff/pages/StaffHome'
import { StaffScanner } from '@/apps/staff/pages/StaffScanner'
import { StaffHistory } from '@/apps/staff/pages/StaffHistory'

export function StaffRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/staff/login" element={<StaffLogin />} />

      {/* Protected — staff + admin */}
      <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} redirectTo="/staff/login" />}>
        <Route path="/staff" element={<StaffHome />} />
        <Route path="/staff/scan" element={<StaffScanner />} />
        <Route path="/staff/history" element={<StaffHistory />} />
      </Route>
    </Routes>
  )
}
