const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const AUTH_TOKEN_KEY = 'auth_token'

export async function apiRequest<T = any>(
	path: string,
	options: RequestInit = {},
	requiresAuth = true,
): Promise<T> {
	const token = localStorage.getItem(AUTH_TOKEN_KEY)

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> | undefined),
	}

	if (requiresAuth && token) {
		headers.Authorization = `Bearer ${token}`
	}

	let response: Response
	try {
		response = await fetch(`${API_BASE_URL}${path}`, {
			...options,
			headers,
		})
	} catch {
		throw new Error('Não foi possível conectar ao backend. Verifique se a API está rodando em http://localhost:8080.')
	}

	const contentType = response.headers.get('content-type')
	const isJson = contentType?.includes('application/json')
	const body = isJson ? await response.json() : await response.text()

	if (!response.ok) {
		const message =
			(typeof body === 'object' && body?.message) ||
			(typeof body === 'object' && body?.error) ||
			`Erro HTTP ${response.status}`

		throw new Error(message)
	}

	return body as T
}
