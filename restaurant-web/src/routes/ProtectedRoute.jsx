import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role && user.role !== 'restaurant_owner') {
    return <Navigate to="/login" replace />
  }

  return children
}
