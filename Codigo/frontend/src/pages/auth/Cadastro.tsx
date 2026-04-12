import { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { loginRequest, registerRequest } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import './Auth.css'

const onlyDigits = (value: string) => value.replace(/\D/g, '')

const formatCpfCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const formatWhatsapp = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export default function Cadastro() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (nome.trim().length < 3) {
      setError('Informe um nome válido com pelo menos 3 caracteres.')
      return
    }

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

      await registerRequest({
        nome,
        email,
        senha,
        tipoUsuario: 'CLIENTE',
        cpfCnpj: onlyDigits(cpfCnpj),
        whatsapp: onlyDigits(whatsapp),
        endereco,
      })

      const token = await loginRequest(email, senha)
      setAuth(token, { email, name: nome })
      navigate(ROUTES.CATALOGO, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar usuário.')
    } finally {
      setLoading(false)
    }
  }

  const onInput =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
    }

  const onCpfCnpjInput = (event: ChangeEvent<HTMLInputElement>) => {
    setCpfCnpj(formatCpfCnpj(event.target.value))
  }

  const onWhatsappInput = (event: ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsapp(event.target.value))
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
          Já tem conta?{' '}
          <Link to={ROUTES.LOGIN}>Entrar</Link>
        </p>
      </header>

      {/* ── BODY ── */}
      <main className="auth-page-body">
        <div className="auth-inner">

          {/* ── LADO ESQUERDO ── */}
          <div className="auth-side-text">
            <span className="auth-eyebrow">Plataforma de pedidos</span>
            <h1 className="auth-big-title">
              Crie sua conta<br />e comece <em>agora.</em>
            </h1>
            <p className="auth-big-desc">
              Cadastre-se gratuitamente e tenha acesso completo ao estúdio digital para gerenciar suas peças.
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
              <Link to={ROUTES.LOGIN} className="auth-tab">Entrar</Link>
              <span className="auth-tab on">Cadastrar</span>
            </div>

            <h2 className="auth-form-title">Criar conta</h2>
            <p className="auth-form-sub">Preencha os dados para começar.</p>

            <form onSubmit={onSubmit}>
              <div className="auth-field">
                <label htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  required
                  value={nome}
                  onChange={onInput(setNome)}
                  placeholder="Seu nome"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

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
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-field-row">
                <div className="auth-field">
                  <label htmlFor="cpfCnpj">CPF / CNPJ</label>
                  <input
                    id="cpfCnpj"
                    inputMode="numeric"
                    value={cpfCnpj}
                    onChange={onCpfCnpjInput}
                    placeholder="000.000.000-00"
                    disabled={loading}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="whatsapp">WhatsApp</label>
                  <input
                    id="whatsapp"
                    inputMode="numeric"
                    value={whatsapp}
                    onChange={onWhatsappInput}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="endereco">Endereço</label>
                <input
                  id="endereco"
                  type="text"
                  value={endereco}
                  onChange={onInput(setEndereco)}
                  placeholder="Rua, número, cidade"
                  disabled={loading}
                  autoComplete="street-address"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn-go" disabled={loading}>
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    Cadastrar e entrar
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Já tem conta?{' '}
              <Link to={ROUTES.LOGIN}>Entrar</Link>
            </p>
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
