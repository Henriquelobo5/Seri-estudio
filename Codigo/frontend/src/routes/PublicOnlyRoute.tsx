import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from './routePaths'
import { useAuth } from '../context/AuthContext'

export default function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
