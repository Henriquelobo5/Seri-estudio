import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from './routePaths'
import { useAuth } from '../context/AuthContext'

export default function RequireAdminRoute() {
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
  }

  if (!isAdmin) {
    return <Navigate to={ROUTES.CATALOGO} replace />
  }

  return <Outlet />
}
