import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AUTH_TOKEN_KEY, parseAuthToken, type UserType } from '../services/auth'

function isTokenValid(token: string | null): boolean {
  if (!token) return false

  try {
    const payload = parseAuthToken(token)

    if (!payload.exp) return false

    const nowInSeconds = Math.floor(Date.now() / 1000)
    return payload.exp > nowInSeconds
  } catch {
    return false
  }
}

type AuthUser = {
  email: string
  name?: string
  tipoUsuario?: UserType
}

type AuthContextType = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!isTokenValid(storedToken)) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem('auth_user_email')
      localStorage.removeItem('auth_user_name')
      localStorage.removeItem('auth_user_tipo')
      return null
    }
    return storedToken
  })

  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const payload = storedToken ? parseAuthToken(storedToken) : {}

    const email = localStorage.getItem('auth_user_email') ?? payload.email
    const name = localStorage.getItem('auth_user_name') ?? payload.nome ?? payload.name
    const tipoUsuario = (localStorage.getItem('auth_user_tipo') ?? payload.tipoUsuario) as UserType | null

    return email
      ? {
          email,
          name: name || undefined,
          tipoUsuario: tipoUsuario || undefined,
        }
      : null
  })

  const setAuth = (nextToken: string, nextUser: AuthUser) => {
    if (!isTokenValid(nextToken)) {
      throw new Error('Token invalido ou expirado.')
    }

    localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    localStorage.setItem('auth_user_email', nextUser.email)

    if (nextUser.name) {
      localStorage.setItem('auth_user_name', nextUser.name)
    } else {
      localStorage.removeItem('auth_user_name')
    }

    if (nextUser.tipoUsuario) {
      localStorage.setItem('auth_user_tipo', nextUser.tipoUsuario)
    } else {
      localStorage.removeItem('auth_user_tipo')
    }

    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('auth_user_email')
    localStorage.removeItem('auth_user_name')
    localStorage.removeItem('auth_user_tipo')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: isTokenValid(token),
      isAdmin: user?.tipoUsuario === 'ADMIN',
      setAuth,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
