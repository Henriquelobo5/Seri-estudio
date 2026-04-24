import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../routes/routePaths'

type MyOrdersLinkProps = Omit<LinkProps, 'to'> & {
  children: ReactNode
}

export default function MyOrdersLink({ children, ...props }: MyOrdersLinkProps) {
  const { isAuthenticated, isAdmin } = useAuth()

  return (
    <Link to={isAuthenticated ? (isAdmin ? ROUTES.ADMIN_KANBAN : ROUTES.MEUS_PEDIDOS) : ROUTES.LOGIN} {...props}>
      {children}
    </Link>
  )
}
