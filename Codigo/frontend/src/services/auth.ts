import { apiRequest } from './api'

export const AUTH_TOKEN_KEY = 'auth_token'

export type RegisterPayload = {
  nome: string
  email: string
  senha: string
  tipoUsuario: 'CLIENTE' | 'ADMIN'
  cpfCnpj?: string
  whatsapp?: string
  endereco?: string
  nomeUsuario?: string
  nivelPermissao?: number
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
