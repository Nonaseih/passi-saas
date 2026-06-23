import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

import { StaffLogin } from '@/apps/staff/pages/StaffLogin'
import { StaffProgress } from '@/apps/staff/pages/StaffProgress'
import { StaffSettings } from '@/apps/staff/pages/StaffSettings'
import { StaffTicketTimeSettings } from '@/apps/staff/pages/StaffTicketTimeSettings'
import { StaffNotificationSettings } from '@/apps/staff/pages/StaffNotificationSettings'
import { StaffAccount } from '@/apps/staff/pages/StaffAccount'
import { StaffHelp } from '@/apps/staff/pages/StaffHelp'
import { StaffScanner } from '@/apps/staff/pages/StaffScanner'
import { StaffHistory } from '@/apps/staff/pages/StaffHistory'

export function StaffRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/staff/login" element={<StaffLogin />} />

      {/* Protected — staff + admin */}
      <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} redirectTo="/staff/login" />}>
        <Route path="/staff" element={<StaffProgress />} />
        <Route path="/staff/scan" element={<StaffScanner />} />
        <Route path="/staff/history" element={<StaffHistory />} />
      </Route>
    </Routes>
  )
}
