import { apiRequest } from './api'

export const AUTH_TOKEN_KEY = 'auth_token'

export type UserType = 'CLIENTE' | 'ADMIN'

export type AuthTokenPayload = {
  email?: string
  nome?: string
  name?: string
  tipoUsuario?: UserType
  exp?: number
}

export type RegisterPayload = {
  nome: string
  email: string
  senha: string
  tipoUsuario: UserType
  cpfCnpj?: string
  whatsapp?: string
  endereco?: string
  nomeUsuario?: string
  nivelPermissao?: number
}

export type ProfileResponse = {
  nome: string
  email: string
  tipoUsuario: UserType
  cpfCnpj?: string | null
  whatsapp?: string | null
  endereco?: string | null
  token?: string | null
}

export type UpdateProfilePayload = {
  nome: string
  email: string
  cpfCnpj?: string
  whatsapp?: string
  endereco?: string
}

export function parseAuthToken(token: string): AuthTokenPayload {
  const [, payloadBase64] = token.split('.')
  if (!payloadBase64) {
    return {}
  }

  try {
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const payloadJson = atob(normalized)
    return JSON.parse(payloadJson) as AuthTokenPayload
  } catch {
    return {}
  }
}

export async function loginRequest(email: string, senha: string): Promise<string> {
  const response = await apiRequest<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  }, false)

  return response.token
}

export async function registerRequest(payload: RegisterPayload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false)
}

export async function refreshTokenRequest(token: string): Promise<string> {
  const response = await apiRequest<{ token: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }, false)

  return response.token
}

export async function getProfileRequest(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/auth/me')
}

export async function updateProfileRequest(payload: UpdateProfilePayload): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
