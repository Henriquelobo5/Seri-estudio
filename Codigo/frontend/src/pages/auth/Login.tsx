import { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { loginRequest } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import './Auth.css'

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

      const [, payloadBase64] = token.split('.')
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
      const payload = JSON.parse(payloadJson) as { email?: string; nome?: string; name?: string }

      const userName = payload.nome || payload.name || email.split('@')[0]

      setAuth(token, { email, name: userName })
      navigate(ROUTES.CATALOGO, { replace: true })
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
    <div className="auth-page">
      <div className="auth-grain" aria-hidden="true" />
      <div className="auth-bg-grid" aria-hidden="true" />
      <div className="auth-glow-tl" aria-hidden="true" />
      <div className="auth-glow-br" aria-hidden="true" />

      {/* ── HEADER ── */}
      <header className="auth-header">
        <Link to={ROUTES.HOME} className="auth-logo">
          <div className="auth-logo-box">
            <img src={logo} alt="Seri." />
          </div>
          <span className="auth-logo-name">Seri.</span>
        </Link>
        <p className="auth-header-hint">
          Não tem conta?{' '}
          <Link to={ROUTES.CADASTRO}>Cadastre-se</Link>
        </p>
      </header>

      {/* ── BODY ── */}
      <main className="auth-page-body">
        <div className="auth-inner">

          {/* ── LADO ESQUERDO ── */}
          <div className="auth-side-text">
            <span className="auth-eyebrow">Plataforma de pedidos</span>
            <h1 className="auth-big-title">
              Sua arte,<br />nossa <em>produção.</em>
            </h1>
            <p className="auth-big-desc">
              Gerencie suas fichas técnicas, acompanhe pedidos e comunique-se com o estúdio em um só lugar.
            </p>
            <div className="auth-feats">
              <div className="auth-feat">
                <div className="auth-feat-icon">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Criação de fichas técnicas digitais
              </div>
              <div className="auth-feat">
                <div className="auth-feat-icon">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Acompanhamento em tempo real
              </div>
              <div className="auth-feat">
                <div className="auth-feat-icon">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Histórico completo de pedidos
              </div>
            </div>
          </div>

          <div className="auth-vdivider" aria-hidden="true" />

          {/* ── FORMULÁRIO ── */}
          <div className="auth-form-wrap">
            {/* Tabs */}
            <div className="auth-tabs">
              <span className="auth-tab on">Entrar</span>
              <Link to={ROUTES.CADASTRO} className="auth-tab">Cadastrar</Link>
            </div>

            <h2 className="auth-form-title">Bem-vindo de volta</h2>
            <p className="auth-form-sub">Entre com sua conta para acessar o estúdio.</p>

            <form onSubmit={onSubmit}>
              <div className="auth-field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={onInput(setEmail)}
                  placeholder="seu@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="senha">Senha</label>
                <input
                  id="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={onInput(setSenha)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn-go" disabled={loading}>
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    Entrar
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Não tem conta?{' '}
              <Link to={ROUTES.CADASTRO}>Cadastre-se grátis</Link>
            </p>

            <div className="auth-admin-note">
              <p>Área restrita a clientes cadastrados. Se você é do time Seri., acesse pelo painel administrativo.</p>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="auth-footer">
        © {new Date().getFullYear()} Seri. Estúdio — Todos os direitos reservados.
      </footer>
    </div>
  )
}
