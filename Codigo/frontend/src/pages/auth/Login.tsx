import { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { loginRequest } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageTransition from '../../components/PageTransition'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const emailValido = /\S+@\S+\.\S+/.test(email)
    if (!emailValido) {
      setError('Informe um e-mail válido.')
      return
    }

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    try {
      setLoading(true)
      const token = await loginRequest(email, senha)
      
      // Extract user info from JWT
      const [, payloadBase64] = token.split('.')
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
      const payload = JSON.parse(payloadJson) as { email?: string; nome?: string; name?: string }
      
      const userName = payload.nome || payload.name || email.split('@')[0]
      
      setAuth(token, { email, name: userName })
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha no login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const onInput =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
    }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F0EBE3] flex items-center justify-center px-4 animate-fadeIn">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 border border-[#EEE8DF] transition-all duration-300 animate-slideUp">
          <Link to={ROUTES.HOME} className="text-[#2A5E40] text-2xl font-bold mb-8 inline-block hover:opacity-80 transition-opacity animate-fadeIn-delay-100">
            Seri.
          </Link>

          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2 animate-fadeIn-delay-200">Entrar</h1>
          <p className="text-[#888] text-sm mb-6 animate-fadeIn-delay-200">Use seu e-mail e senha para acessar.</p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="animate-fadeIn-delay-300">
              <label className="block text-sm text-[#444] mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={onInput(setEmail)}
                placeholder="seu@email.com"
                disabled={loading}
                className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30 disabled:opacity-50 transition-opacity"
              />
            </div>

            <div className="animate-fadeIn-delay-300">
              <label className="block text-sm text-[#444] mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={onInput(setSenha)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5E40]/30 disabled:opacity-50 transition-opacity"
              />
            </div>

            {error && <p className="text-sm text-red-600 animate-slideDown">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2A5E40] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#1D4A2F] transition-all duration-200 disabled:opacity-70 flex items-center justify-center animate-fadeIn-delay-400"
            >
              {loading ? <LoadingSpinner /> : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-[#888] mt-6 animate-fadeIn-delay-400">
            Não tem conta?{' '}
            <Link to={ROUTES.CADASTRO} className="text-[#2A5E40] font-medium hover:underline transition-colors">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
