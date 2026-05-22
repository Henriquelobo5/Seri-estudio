import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../routes/routePaths'

type MyOrdersLinkProps = Omit<LinkProps, 'to'> & {
  children: ReactNode
  hideForAdmin?: boolean
}

export default function MyOrdersLink({ children, hideForAdmin = false, ...props }: MyOrdersLinkProps) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) return null
  if (isAdmin && hideForAdmin) return null

  return (
    <Link to={isAdmin ? ROUTES.ADMIN_KANBAN : ROUTES.MEUS_PEDIDOS} {...props}>
      {children}
    </Link>
  )
}
