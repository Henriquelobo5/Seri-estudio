import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from './routePaths'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  return <Outlet />
}
