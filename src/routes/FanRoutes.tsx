import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

import { FanHome } from '@/apps/fan/pages/FanHome'
import { FanLogin } from '@/apps/fan/pages/FanLogin'
import { FanRegister } from '@/apps/fan/pages/FanRegister'
import { FanForgotPassword } from '@/apps/fan/pages/FanForgotPassword'
import { FanResetPassword } from '@/apps/fan/pages/FanResetPassword'
import { FanTickets } from '@/apps/fan/pages/FanTickets'
import { FanPurchase } from '@/apps/fan/pages/FanPurchase'
import { FanHistory } from '@/apps/fan/pages/FanHistory'

export function FanRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<FanLogin />} />
      <Route path="/register" element={<FanRegister />} />
      <Route path="/forgot-password" element={<FanForgotPassword />} />
      <Route path="/reset-password" element={<FanResetPassword />} />

      {/* Protected — fan only */}
      <Route element={<ProtectedRoute allowedRoles={['fan']} />}>
        <Route path="/" element={<FanHome />} />
        <Route path="/tickets" element={<FanTickets />} />
        <Route path="/purchase/:ticketTypeId" element={<FanPurchase />} />
        <Route path="/history" element={<FanHistory />} />
      </Route>
    </Routes>
  )
}
