import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthNavCta from '../../components/ui/AuthNavCta'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import {
  getProfileRequest,
  type ProfileResponse,
  updateProfileRequest,
} from '../../services/auth'
import '../public/MeusPedidos.css'
import './MeuPerfil.css'

type ProfileForm = {
  nome: string
  email: string
  cpfCnpj: string
  whatsapp: string
  endereco: string
}

const EMPTY_FORM: ProfileForm = {
  nome: '',
  email: '',
  cpfCnpj: '',
  whatsapp: '',
  endereco: '',
}

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

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }
  }

  return (email ?? 'US').slice(0, 2).toUpperCase()
}

function getFirstName(name?: string): string {
  if (!name) return 'Cliente'
  return name.trim().split(' ')[0]
}

function mapProfileToForm(profile: ProfileResponse): ProfileForm {
  return {
    nome: profile.nome ?? '',
    email: profile.email ?? '',
    cpfCnpj: formatCpfCnpj(profile.cpfCnpj ?? ''),
    whatsapp: formatWhatsapp(profile.whatsapp ?? ''),
    endereco: profile.endereco ?? '',
  }
}

export default function MeuPerfil() {
  const navigate = useNavigate()
  const { user, setAuth, logout } = useAuth()

  const [form, setForm] = useState<ProfileForm>({
    ...EMPTY_FORM,
    nome: user?.name ?? '',
    email: user?.email ?? '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    getProfileRequest()
      .then((profile) => {
        if (!isMounted) return
        setForm(mapProfileToForm(profile))
        setError('')
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Nao foi possivel carregar seus dados.')
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const displayName = form.nome || user?.name
  const displayEmail = form.email || user?.email
  const initials = getInitials(displayName, displayEmail)
  const firstName = getFirstName(displayName)

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(ROUTES.MEUS_PEDIDOS)
  }

  function resetFeedback() {
    if (error) setError('')
    if (success) setSuccess('')
  }

  function handleFieldChange(field: keyof ProfileForm) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      resetFeedback()
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  function handleCpfCnpjChange(event: ChangeEvent<HTMLInputElement>) {
    resetFeedback()
    setForm((prev) => ({ ...prev, cpfCnpj: formatCpfCnpj(event.target.value) }))
  }

  function handleWhatsappChange(event: ChangeEvent<HTMLInputElement>) {
    resetFeedback()
    setForm((prev) => ({ ...prev, whatsapp: formatWhatsapp(event.target.value) }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.nome.trim().length < 3) {
      setError('Informe um nome valido com pelo menos 3 caracteres.')
      return
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Informe um e-mail valido.')
      return
    }

    try {
      setSaving(true)

      const updated = await updateProfileRequest({
        nome: form.nome.trim(),
        email: form.email.trim(),
        cpfCnpj: onlyDigits(form.cpfCnpj),
        whatsapp: onlyDigits(form.whatsapp),
        endereco: form.endereco.trim(),
      })

      setForm(mapProfileToForm(updated))

      if (updated.token) {
        setAuth(updated.token, {
          email: updated.email,
          name: updated.nome,
        })
      }

      setSuccess('Perfil atualizado com sucesso.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel atualizar seu perfil.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="mp-page pf-page">
      <div className="mp-grain" aria-hidden="true" />

      <nav className="mp-nav">
        <Link to={ROUTES.HOME} className="mp-nav-brand">
          <div className="mp-nav-logo">
            <img src={logo} alt="Seri." />
          </div>
          <span className="mp-nav-name">Seri.</span>
        </Link>

        <div className="mp-nav-center">
          <Link to={ROUTES.HOME} className="mp-nl">Home</Link>
          <Link to={ROUTES.CATALOGO} className="mp-nl">Portfolio</Link>
          <a href={`${ROUTES.HOME}#como-funciona`} className="mp-nl">Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`} className="mp-nl">Contato</a>
          <Link to={ROUTES.MEUS_PEDIDOS} className="mp-nl">Meus pedidos</Link>
        </div>

        <div className="mp-nav-right">
          <AuthNavCta className="mp-nav-cta" />
        </div>
      </nav>

      <div className="mp-back-row">
        <div className="mp-back-inner">
          <button type="button" className="mp-back-button" onClick={handleBack}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        </div>
      </div>

      <div className="mp-page-hero pf-hero">
        <div className="mp-hero-inner">
          <div>
            <div className="mp-hero-eyebrow">Olá, {firstName}</div>
            <h1 className="mp-hero-h1">Meu perfil</h1>
            <p className="mp-hero-sub">Atualize seus dados e mantenha sua conta pronta para novos pedidos.</p>
          </div>

          <div className="pf-hero-badges">
            <div className="pf-hero-badge">
              <span className="pf-hero-badge-label">Conta</span>
              <strong>Cliente</strong>
            </div>
            <div className="pf-hero-badge">
              <span className="pf-hero-badge-label">Sessao</span>
              <strong>Ativa</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="pf-layout">
        <section className="pf-main">
          <div className="pf-card">
            <div className="pf-card-head">
              <div>
                <h2 className="pf-card-title">Dados da conta</h2>
                <p className="pf-card-subtitle">Essas informacoes aparecem no seu atendimento e no fluxo dos pedidos.</p>
              </div>
              <Link to={ROUTES.MEUS_PEDIDOS} className="pf-head-link">
                Ver meus pedidos
              </Link>
            </div>

            {loading ? (
              <div className="pf-state">Carregando seus dados...</div>
            ) : (
              <form className="pf-form" onSubmit={handleSubmit}>
                <div className="pf-grid pf-grid-two">
                  <div className="pf-field">
                    <label htmlFor="nome">Nome completo</label>
                    <input
                      id="nome"
                      type="text"
                      value={form.nome}
                      onChange={handleFieldChange('nome')}
                      placeholder="Seu nome"
                      disabled={saving}
                      autoComplete="name"
                    />
                  </div>

                  <div className="pf-field">
                    <label htmlFor="email">E-mail</label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={handleFieldChange('email')}
                      placeholder="seu@email.com"
                      disabled={saving}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="pf-grid pf-grid-two">
                  <div className="pf-field">
                    <label htmlFor="cpfCnpj">CPF / CNPJ</label>
                    <input
                      id="cpfCnpj"
                      type="text"
                      inputMode="numeric"
                      value={form.cpfCnpj}
                      onChange={handleCpfCnpjChange}
                      placeholder="000.000.000-00"
                      disabled={saving}
                    />
                  </div>

                  <div className="pf-field">
                    <label htmlFor="whatsapp">WhatsApp</label>
                    <input
                      id="whatsapp"
                      type="text"
                      inputMode="numeric"
                      value={form.whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(00) 00000-0000"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="pf-field">
                  <label htmlFor="endereco">Endereco</label>
                  <textarea
                    id="endereco"
                    rows={4}
                    value={form.endereco}
                    onChange={handleFieldChange('endereco')}
                    placeholder="Rua, numero, bairro, cidade"
                    disabled={saving}
                    autoComplete="street-address"
                  />
                </div>

                {error && <div className="pf-alert pf-alert-error">{error}</div>}
                {success && <div className="pf-alert pf-alert-success">{success}</div>}

                <div className="pf-actions">
                  <button
                    type="button"
                    className="pf-btn pf-btn-secondary"
                    onClick={() => navigate(ROUTES.MEUS_PEDIDOS)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar alteracoes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <aside className="pf-sidebar">
          <div className="pf-card pf-profile-card">
            <div className="pf-avatar">{initials}</div>
            <h3 className="pf-profile-name">{displayName || 'Cliente'}</h3>
            <p className="pf-profile-email">{displayEmail || 'Sem e-mail cadastrado'}</p>

            <div className="pf-profile-meta">
              <div>
                <span className="pf-meta-label">WhatsApp</span>
                <strong>{form.whatsapp || 'Nao informado'}</strong>
              </div>
              <div>
                <span className="pf-meta-label">Documento</span>
                <strong>{form.cpfCnpj || 'Nao informado'}</strong>
              </div>
            </div>
          </div>

          <div className="pf-card pf-shortcuts-card">
            <div className="mp-atls">
              <div className="mp-atl-title">Atalhos</div>

              <Link to={ROUTES.MEUS_PEDIDOS} className="mp-atl">
                <span className="mp-atldot" style={{ background: '#60a5fa' }} />
                <span className="mp-atllbl">Voltar para pedidos</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <Link to={ROUTES.CRIAR_FICHA} className="mp-atl">
                <span className="mp-atldot" style={{ background: 'var(--mp-lime)' }} />
                <span className="mp-atllbl">Criar nova ficha</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <button type="button" className="mp-atl pf-atl-danger" onClick={handleLogout}>
                <span className="mp-atldot" style={{ background: '#f87171' }} />
                <span className="mp-atllbl">Sair da conta</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="pf-card">
            <h3 className="pf-side-title">Importante</h3>
            <ul className="pf-tips">
              <li>Se voce alterar o e-mail, o proximo login passa a usar o novo endereco.</li>
              <li>Os campos de contato ajudam o estudio a confirmar orcamentos e entregas.</li>
              <li>CPF ou CNPJ e opcional, mas facilita a identificacao da sua conta.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
