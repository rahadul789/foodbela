import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import ProtectedRoute from '@/routes/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/dashboard/Dashboard'
import RestaurantSetup from '@/pages/dashboard/RestaurantSetup'
import Categories from '@/pages/dashboard/menu/Categories'
import Items from '@/pages/dashboard/menu/Items'
import Promotions from '@/pages/dashboard/Promotions'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="restaurant" element={<RestaurantSetup />} />
        <Route path="menu/categories" element={<Categories />} />
        <Route path="menu/items" element={<Items />} />
        <Route path="promotions" element={<Promotions />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
