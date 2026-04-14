import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../routes/routePaths'

type AuthNavCtaProps = {
  className: string
}

export default function AuthNavCta({ className }: AuthNavCtaProps) {
  const { isAuthenticated } = useAuth()

  return (
    <Link
      to={isAuthenticated ? ROUTES.MEU_PERFIL : ROUTES.LOGIN}
      className={className}
    >
      {isAuthenticated ? 'Minha conta' : 'Entrar'}
    </Link>
  )
}
