import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from './routePaths'
import { useAuth } from '../context/AuthContext'

export default function PublicOnlyRoute() {
  const { isAuthenticated, isAdmin } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? ROUTES.ADMIN_KANBAN : ROUTES.CATALOGO} replace />
  }

  return <Outlet />
}
