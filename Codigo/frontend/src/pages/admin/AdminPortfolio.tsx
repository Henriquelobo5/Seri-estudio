import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminPortfolio.css'

type PortfolioItem = {
  idItem: number
  titulo: string
  descricaoTecnica: string
  urlImagem: string | null
  categoria: string
}

type ModalKind = 'criar' | 'editar' | 'excluir' | null

const CATEGORIAS = ['Camiseta', 'Moletom', 'Regata', 'Polo', 'Ecobag', 'Outros']

const SIDEBAR_ITEMS = [
  { label: 'PRINCIPAL', section: 'title' as const },
  { label: 'Dashboard', route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Fichas técnicas', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos', route: ROUTES.ADMIN_PEDIDOS },
  { label: 'Clientes', route: ROUTES.ADMIN_CLIENTES },
  { label: 'PRODUÇÃO', section: 'title' as const },
  { label: 'Fluxo de produção', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'VITRINE', section: 'title' as const },
  { label: 'Portfólio', active: true, route: ROUTES.ADMIN_PORTFOLIO },
  { label: 'RELATÓRIOS', section: 'title' as const },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro', route: ROUTES.ADMIN_FINANCEIRO_DASHBOARD },
]

function getInitials(name?: string | null) {
  if (!name) return 'ST'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function renderSidebarIcon(label: string) {
  if (label === 'Dashboard') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>
  if (label === 'Fichas técnicas') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h7l5 5v11H8z" fill="none" /><path d="M15 4v5h5" fill="none" /><path d="M11 14h6M11 18h6M11 10h2" fill="none" /></svg>
  if (label === 'Pedidos') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h15l-1.5 9h-11z" fill="none" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></svg>
  if (label === 'Clientes') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 14 0" fill="none" /></svg>
  if (label === 'Fluxo de produção') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" fill="none" /><path d="M9 9v6M15 9v3" fill="none" /></svg>
  if (label === 'Estoque') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 4-8 4-8-4 8-4z" fill="none" /><path d="M4 12l8 4 8-4" fill="none" /></svg>
  if (label === 'Portfólio') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" fill="none" /><path d="M8 6V5a2 2 0 0 1 4 0v1M4 10h16" fill="none" /></svg>
  if (label === 'Custos e lucro') return <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" /></svg>
  if (label === 'Dashboard financeiro') return <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M6 12h12" fill="none" /></svg>
}

const initialDraft = {
  titulo: '',
  descricaoTecnica: '',
  urlImagem: '',
  categoria: 'Camiseta',
}

export default function AdminPortfolio() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalAberto, setModalAberto] = useState<ModalKind>(null)
  const [itemSelecionado, setItemSelecionado] = useState<PortfolioItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [draft, setDraft] = useState(initialDraft)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarItems()
  }, [])

  async function carregarItems() {
    setLoading(true)
    try {
      const data = await apiRequest<PortfolioItem[]>('/admin/portfolio')
      setItems(data)
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar portfólio.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  function abrirCriar() {
    setDraft(initialDraft)
    setImagemFile(null)
    setPreviewUrl(null)
    setModalError('')
    setItemSelecionado(null)
    setModalAberto('criar')
  }

  function abrirEditar(item: PortfolioItem) {
    setDraft({
      titulo: item.titulo,
      descricaoTecnica: item.descricaoTecnica ?? '',
      urlImagem: item.urlImagem ?? '',
      categoria: item.categoria,
    })
    setImagemFile(null)
    setPreviewUrl(item.urlImagem ?? null)
    setModalError('')
    setItemSelecionado(item)
    setModalAberto('editar')
  }

  function abrirExcluir(item: PortfolioItem) {
    setItemSelecionado(item)
    setModalError('')
    setModalAberto('excluir')
  }

  function fecharModal() {
    setModalAberto(null)
    setModalError('')
    setSubmitting(false)
    setImagemFile(null)
    setPreviewUrl(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImagemFile(file)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      setDraft((d) => ({ ...d, urlImagem: '' }))
    }
  }

  function handleUrlChange(val: string) {
    setDraft((d) => ({ ...d, urlImagem: val }))
    if (val) {
      setImagemFile(null)
      setPreviewUrl(val)
    } else {
      setPreviewUrl(null)
    }
  }

  async function submitForm() {
    setModalError('')
    setSubmitting(true)
    try {
      if (!draft.titulo.trim()) throw new Error('Título é obrigatório')
      if (!draft.categoria) throw new Error('Categoria é obrigatória')
      if (!imagemFile && !draft.urlImagem.trim()) throw new Error('Adicione uma imagem ou URL')

      const formData = new FormData()
      formData.append('dados', JSON.stringify({
        titulo: draft.titulo,
        descricaoTecnica: draft.descricaoTecnica,
        urlImagem: draft.urlImagem || null,
        categoria: draft.categoria,
      }))
      if (imagemFile) {
        formData.append('imagem', imagemFile)
      }

      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      if (modalAberto === 'criar') {
        const res = await fetch('http://localhost:8080/admin/portfolio', {
          method: 'POST',
          headers,
          body: formData,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message ?? `Erro ${res.status}`)
        }
      } else if (modalAberto === 'editar' && itemSelecionado) {
        const res = await fetch(`http://localhost:8080/admin/portfolio/${itemSelecionado.idItem}`, {
          method: 'PUT',
          headers,
          body: formData,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message ?? `Erro ${res.status}`)
        }
      }

      await carregarItems()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitExcluir() {
    setModalError('')
    setSubmitting(true)
    try {
      if (!itemSelecionado) return
      await apiRequest(`/admin/portfolio/${itemSelecionado.idItem}`, { method: 'DELETE' })
      await carregarItems()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao excluir.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ak-page">
      <aside className="ak-sidebar">
        <div className="ak-sidebar-top">
          <Link to={ROUTES.HOME} className="ak-brand">
            <div className="ak-brand-main">
              <div className="ak-brand-logo"><img src={logo} alt="Seri." /></div>
              <div className="ak-brand-name">Seri.</div>
            </div>
            <div className="ak-brand-sub">Painel de Administração</div>
          </Link>

          <nav className="ak-menu">
            {SIDEBAR_ITEMS.map((item) => {
              if (item.section === 'title') {
                return <div key={item.label} className="ak-menu-section">{item.label}</div>
              }
              const className = `ak-menu-item ${item.active ? 'is-active' : ''}`
              if (item.route) {
                return (
                  <Link key={item.label} to={item.route} className={className}>
                    <span className="ak-menu-icon">{renderSidebarIcon(item.label)}</span>
                    <span className="ak-menu-label">{item.label}</span>
                  </Link>
                )
              }
              return (
                <button key={item.label} type="button" className={className}>
                  <span className="ak-menu-icon">{renderSidebarIcon(item.label)}</span>
                  <span className="ak-menu-label">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="ak-sidebar-bottom">
          <div className="ak-user-badge">{getInitials(user?.name)}</div>
          <div className="ak-user-meta">
            <strong>{user?.name || 'Gestor Seri.'}</strong>
            <span>Administrador</span>
          </div>
          <button type="button" className="ak-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className="ak-main">
        <header className="ak-header">
          <div>
            <span className="ak-header-kicker">Vitrine</span>
            <h1>Portfólio <em>de trabalhos.</em></h1>
            <p>Gerencie as fotos e itens exibidos no portfólio público.</p>
          </div>
          <div className="ak-header-badges">
            <button type="button" className="ae-btn ae-btn-primary" onClick={abrirCriar}>
              + Adicionar item
            </button>
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        {loading ? (
          <div className="ap-empty">Carregando portfólio...</div>
        ) : items.length === 0 ? (
          <div className="ap-empty-state">
            <div className="ap-empty-icon">
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M6 32l10-10 8 8 6-6 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16" cy="20" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h3>Nenhum item no portfólio</h3>
            <p>Adicione fotos das camisas para exibir no portfólio público.</p>
            <button type="button" className="ae-btn ae-btn-primary" onClick={abrirCriar}>
              + Adicionar primeiro item
            </button>
          </div>
        ) : (
          <div className="ap-grid">
            {items.map((item) => (
              <div key={item.idItem} className="ap-card">
                <div className="ap-card-media">
                  {item.urlImagem ? (
                    <img src={item.urlImagem} alt={item.titulo} />
                  ) : (
                    <div className="ap-card-placeholder">
                      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                        <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 32l10-10 8 8 6-6 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="16" cy="20" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                  )}
                  <span className="ap-card-categoria">{item.categoria}</span>
                </div>
                <div className="ap-card-body">
                  <h3 className="ap-card-titulo">{item.titulo}</h3>
                  {item.descricaoTecnica && (
                    <p className="ap-card-desc">{item.descricaoTecnica}</p>
                  )}
                </div>
                <div className="ap-card-actions">
                  <button type="button" className="ae-btn ae-btn-secondary ap-btn-edit" onClick={() => abrirEditar(item)}>
                    Editar
                  </button>
                  <button type="button" className="ae-btn ae-btn-danger ap-btn-delete" onClick={() => abrirExcluir(item)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {(modalAberto === 'criar' || modalAberto === 'editar') && (
        <div className="ae-overlay" onClick={fecharModal}>
          <div className="ae-modal ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modal-head">
              <div>
                <h2>{modalAberto === 'criar' ? 'Adicionar item ao portfólio' : 'Editar item'}</h2>
                <p>{modalAberto === 'criar' ? 'Adicione uma nova foto ao portfólio público' : 'Atualize os dados do item'}</p>
              </div>
              <button type="button" className="ae-modal-close" onClick={fecharModal} aria-label="Fechar">✕</button>
            </div>

            <div className="ae-form">
              <label className="ae-field">
                <span>Título</span>
                <input
                  type="text"
                  placeholder="Ex: Camiseta Holloway — Banda X"
                  value={draft.titulo}
                  onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
                />
              </label>

              <label className="ae-field">
                <span>Categoria</span>
                <select
                  value={draft.categoria}
                  onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="ae-field">
                <span>Descrição técnica (opcional)</span>
                <input
                  type="text"
                  placeholder="Ex: Silk 4 cores, 180g/m²"
                  value={draft.descricaoTecnica}
                  onChange={(e) => setDraft({ ...draft, descricaoTecnica: e.target.value })}
                />
              </label>

              <div className="ap-imagem-section">
                <span className="ae-field-label">Imagem</span>

                <div
                  className={`ap-dropzone ${imagemFile ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="ap-preview-img" />
                  ) : (
                    <div className="ap-dropzone-placeholder">
                      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                        <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
                        <path d="M24 20v12M18 26l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p>Clique para fazer upload</p>
                      <small>JPG, PNG, WEBP até 10MB</small>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {imagemFile && (
                  <div className="ap-file-info">
                    <span>✓ {imagemFile.name}</span>
                    <button type="button" onClick={() => { setImagemFile(null); setPreviewUrl(draft.urlImagem || null) }}>
                      Remover
                    </button>
                  </div>
                )}

                <div className="ap-url-divider">
                  <span>ou cole uma URL</span>
                </div>

                <label className="ae-field">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={draft.urlImagem}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    disabled={!!imagemFile}
                  />
                </label>
              </div>

              {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
              <div className="ae-modal-actions">
                <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>Cancelar</button>
                <button type="button" className="ae-btn ae-btn-primary" onClick={submitForm} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAberto === 'excluir' && itemSelecionado && (
        <div className="ae-overlay" onClick={fecharModal}>
          <div className="ae-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modal-head">
              <div>
                <h2>Excluir item</h2>
              </div>
              <button type="button" className="ae-modal-close" onClick={fecharModal} aria-label="Fechar">✕</button>
            </div>
            <div className="ae-form">
              <p className="ae-confirm-text">
                Tem certeza que deseja excluir <strong>{itemSelecionado.titulo}</strong>? Esta ação não pode ser desfeita.
              </p>
              {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
              <div className="ae-modal-actions">
                <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>Cancelar</button>
                <button type="button" className="ae-btn ae-btn-danger" onClick={submitExcluir} disabled={submitting}>
                  {submitting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
