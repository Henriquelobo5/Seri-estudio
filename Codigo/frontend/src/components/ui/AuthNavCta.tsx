import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../routes/routePaths'

type AuthNavCtaProps = {
  className: string
}

export default function AuthNavCta({ className }: AuthNavCtaProps) {
  const { isAuthenticated, isAdmin } = useAuth()
  const label = isAuthenticated ? (isAdmin ? 'Administração' : 'Minha conta') : 'Entrar'

  return (
    <Link
      to={isAuthenticated ? (isAdmin ? ROUTES.ADMIN_KANBAN : ROUTES.MEU_PERFIL) : ROUTES.LOGIN}
      className={className}
    >
      {label}
    </Link>
  )
}
