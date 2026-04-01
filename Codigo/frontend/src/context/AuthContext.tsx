import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AUTH_TOKEN_KEY } from '../services/auth'

function isTokenValid(token: string | null): boolean {
  if (!token) return false

  try {
    const [, payloadBase64] = token.split('.')
    if (!payloadBase64) return false

    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadJson) as { exp?: number }

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
}

type AuthContextType = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
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
      return null
    }
    return storedToken
  })
  const [user, setUser] = useState<AuthUser | null>(() => {
    const email = localStorage.getItem('auth_user_email')
    const name = localStorage.getItem('auth_user_name')
    return email ? { email, name: name || undefined } : null
  })

  const setAuth = (nextToken: string, nextUser: AuthUser) => {
    if (!isTokenValid(nextToken)) {
      throw new Error('Token inválido ou expirado.')
    }

    localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    localStorage.setItem('auth_user_email', nextUser.email)
    if (nextUser.name) {
      localStorage.setItem('auth_user_name', nextUser.name)
    }
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('auth_user_email')
    localStorage.removeItem('auth_user_name')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: isTokenValid(token),
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
