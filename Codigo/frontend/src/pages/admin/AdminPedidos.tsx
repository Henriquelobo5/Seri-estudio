import { useDeferredValue, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminPedidos.css'

type AdminStatus =
  | 'AGUARDANDO_ANALISE'
  | 'ORCAMENTO_ENVIADO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PARA_RETIRADA'
  | 'ENTREGUE'
  | 'CANCELADO'

type EtapaProducao = 'CORTE' | 'ESTAMPARIA' | 'COSTURA' | 'REVISAO' | 'EXPEDICAO'

type PedidoFilter = 'TODOS' | 'AGUARDANDO' | 'EM_PRODUCAO' | 'ENTREGUE'

type AdminPedido = {
  id: number
  statusAtual: string
  etapaProducao?: string | null
  dataAbertura?: string
  quantidades?: string | null
  observacoes?: string | null
  clienteNome?: string | null
  clienteEmail?: string | null
  fichaTecnica?: {
    codigoDisplay?: string | null
    identificacao?: string | null
    produtoTipo?: string | null
    especificacoes?: string | null
    dataAbertura?: string
  } | null
}

type SidebarItem = {
  label: string
  section?: string
  badge?: string
  active?: boolean
  route?: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'PRINCIPAL', section: 'title' },
  { label: 'Dashboard', route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Fichas técnicas', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos', active: true, route: ROUTES.ADMIN_PEDIDOS },
  { label: 'Clientes', route: ROUTES.ADMIN_CLIENTES },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Fluxo de produção', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro', route: ROUTES.ADMIN_FINANCEIRO_DASHBOARD },
  { label: 'VITRINE', section: 'title' },
  { label: 'Portfólio', route: ROUTES.ADMIN_PORTFOLIO },
]

const FILTER_OPTIONS: Array<{ value: PedidoFilter; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'AGUARDANDO', label: 'Aguardando' },
  { value: 'EM_PRODUCAO', label: 'Em produção' },
  { value: 'ENTREGUE', label: 'Concluídos' },
]

const STATUS_OPTIONS: Array<{ value: AdminStatus; label: string }> = [
  { value: 'AGUARDANDO_ANALISE', label: 'Aguardando análise' },
  { value: 'ORCAMENTO_ENVIADO', label: 'Orçamento enviado' },
  { value: 'EM_PRODUCAO', label: 'Em produção' },
  { value: 'PRONTO_PARA_RETIRADA', label: 'Pronto para retirada' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const ETAPA_OPTIONS: Array<{ value: EtapaProducao; label: string }> = [
  { value: 'CORTE', label: 'Corte' },
  { value: 'ESTAMPARIA', label: 'Estamparia' },
  { value: 'COSTURA', label: 'Costura' },
  { value: 'REVISAO', label: 'Revisão' },
  { value: 'EXPEDICAO', label: 'Expedição' },
]

const AVATAR_COLORS = [
  { background: 'rgba(126,200,154,0.15)', color: '#7EC89A' },
  { background: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  { background: 'rgba(134,239,172,0.10)', color: '#86efac' },
  { background: 'rgba(42,94,64,0.28)', color: '#7EC89A' },
]

function normalizeStatus(status?: string | null): AdminStatus {
  if (!status) return 'AGUARDANDO_ANALISE'
  const s = status.trim().toUpperCase()
  const valid: AdminStatus[] = [
    'AGUARDANDO_ANALISE', 'ORCAMENTO_ENVIADO', 'EM_PRODUCAO',
    'PRONTO_PARA_RETIRADA', 'ENTREGUE', 'CANCELADO',
  ]
  if (valid.includes(s as AdminStatus)) return s as AdminStatus
  if (s === 'AGUARDANDO_ORCAMENTO') return 'AGUARDANDO_ANALISE'
  return 'AGUARDANDO_ANALISE'
}

function getStatusBadgeClass(status: AdminStatus) {
  switch (status) {
    case 'AGUARDANDO_ANALISE':   return 'ap-badge ap-badge-muted'
    case 'ORCAMENTO_ENVIADO':    return 'ap-badge ap-badge-pending'
    case 'EM_PRODUCAO':          return 'ap-badge ap-badge-active'
    case 'PRONTO_PARA_RETIRADA': return 'ap-badge ap-badge-ready'
    case 'ENTREGUE':             return 'ap-badge ap-badge-done'
    case 'CANCELADO':            return 'ap-badge ap-badge-cancel'
  }
}

function getStatusLabel(status: AdminStatus) {
  switch (status) {
    case 'AGUARDANDO_ANALISE':   return 'Aguardando'
    case 'ORCAMENTO_ENVIADO':    return 'Orçamento enviado'
    case 'EM_PRODUCAO':          return 'Em produção'
    case 'PRONTO_PARA_RETIRADA': return 'Pronto p/ retirada'
    case 'ENTREGUE':             return 'Entregue'
    case 'CANCELADO':            return 'Cancelado'
  }
}

function getEtapaClass(etapa?: string | null) {
  switch (etapa?.toUpperCase()) {
    case 'CORTE':      return 'ap-etapa ap-etapa-corte'
    case 'ESTAMPARIA': return 'ap-etapa ap-etapa-estamparia'
    case 'COSTURA':    return 'ap-etapa ap-etapa-costura'
    case 'REVISAO':    return 'ap-etapa ap-etapa-revisao'
    case 'EXPEDICAO':  return 'ap-etapa ap-etapa-expedicao'
    default:           return 'ap-etapa'
  }
}

function getEtapaLabel(etapa?: string | null) {
  switch (etapa?.toUpperCase()) {
    case 'CORTE':      return 'Corte'
    case 'ESTAMPARIA': return 'Estamparia'
    case 'COSTURA':    return 'Costura'
    case 'REVISAO':    return 'Revisão'
    case 'EXPEDICAO':  return 'Expedição'
    default:           return '—'
  }
}

function getInitials(name?: string | null) {
  if (!name) return 'CL'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function formatDate(date?: string | null) {
  if (!date) return '--/--/----'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '--/--/----'
  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`
}

function getTotalPecas(quantidades?: string | null) {
  if (!quantidades) return 0
  return quantidades
    .split(',')
    .map((item) => item.trim())
    .reduce((sum, item) => {
      const [, qty] = item.split(':')
      const n = Number.parseInt(qty ?? '0', 10)
      return sum + (Number.isNaN(n) ? 0 : n)
    }, 0)
}

function renderSidebarIcon(label: string) {
  if (label === 'Dashboard') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    )
  }
  if (label === 'Fichas técnicas') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4h7l5 5v11H8z" fill="none" />
        <path d="M15 4v5h5" fill="none" />
        <path d="M11 14h6M11 18h6M11 10h2" fill="none" />
      </svg>
    )
  }
  if (label === 'Pedidos') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h15l-1.5 9h-11z" fill="none" />
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </svg>
    )
  }
  if (label === 'Clientes') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19a7 7 0 0 1 14 0" fill="none" />
      </svg>
    )
  }
  if (label === 'Fluxo de produção') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" />
        <path d="M9 9v6M15 9v3" fill="none" />
      </svg>
    )
  }
  if (label === 'Estoque') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4l8 4-8 4-8-4 8-4z" fill="none" />
        <path d="M4 12l8 4 8-4" fill="none" />
      </svg>
    )
  }
  if (label === 'Custos e lucro') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" />
      </svg>
    )
  }
  if (label === 'Dashboard financeiro') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M6 12h12" fill="none" />
    </svg>
  )
}

export default function AdminPedidos() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PedidoFilter>('TODOS')
  const [drawerPedido, setDrawerPedido] = useState<AdminPedido | null>(null)
  const [draftStatus, setDraftStatus] = useState<AdminStatus>('AGUARDANDO_ANALISE')
  const [draftEtapa, setDraftEtapa] = useState<EtapaProducao | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [error, setError] = useState('')

  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let isMounted = true
    apiRequest<AdminPedido[]>('/admin/pedidos')
      .then((data) => {
        if (!isMounted) return
        setPedidos(data)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os pedidos.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => { isMounted = false }
  }, [])

  function openDrawer(pedido: AdminPedido) {
    setDrawerPedido(pedido)
    setDraftStatus(normalizeStatus(pedido.statusAtual))
    setDraftEtapa((pedido.etapaProducao?.toUpperCase() as EtapaProducao) || '')
    setSaveError('')
  }

  function closeDrawer() {
    if (saving) return
    setDrawerPedido(null)
    setSaveError('')
  }

  async function handleSave() {
    if (!drawerPedido || saving) return
    setSaving(true)
    setSaveError('')

    const id = drawerPedido.id
    const originalStatus = normalizeStatus(drawerPedido.statusAtual)
    const originalEtapa = (drawerPedido.etapaProducao?.toUpperCase() || '') as EtapaProducao | ''

    try {
      let updated = { ...drawerPedido }

      if (draftStatus !== originalStatus) {
        const result = await apiRequest<AdminPedido>(`/admin/pedidos/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ statusAtual: draftStatus }),
        })
        updated = result
      }

      if (draftEtapa && draftEtapa !== originalEtapa) {
        const result = await apiRequest<AdminPedido>(`/admin/pedidos/${id}/etapa`, {
          method: 'PATCH',
          body: JSON.stringify({ etapaProducao: draftEtapa }),
        })
        updated = result
      }

      setPedidos((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setDrawerPedido(updated)
      setDraftStatus(normalizeStatus(updated.statusAtual))
      setDraftEtapa((updated.etapaProducao?.toUpperCase() as EtapaProducao) || '')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  const hasFilters = search.trim().length > 0 || filter !== 'TODOS'
  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const status = normalizeStatus(pedido.statusAtual)
    const matchesFilter =
      filter === 'TODOS' ||
      (filter === 'AGUARDANDO' && (status === 'AGUARDANDO_ANALISE' || status === 'ORCAMENTO_ENVIADO')) ||
      (filter === 'EM_PRODUCAO' && (status === 'EM_PRODUCAO' || status === 'PRONTO_PARA_RETIRADA')) ||
      (filter === 'ENTREGUE' && (status === 'ENTREGUE' || status === 'CANCELADO'))

    const matchesSearch =
      !normalizedSearch ||
      (pedido.clienteNome?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (pedido.clienteEmail?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (pedido.fichaTecnica?.codigoDisplay?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (pedido.fichaTecnica?.identificacao?.toLowerCase().includes(normalizedSearch) ?? false)

    return matchesFilter && matchesSearch
  })

  const total = pedidos.length
  const emProducaoCount = pedidos.filter((p) => {
    const s = normalizeStatus(p.statusAtual)
    return s === 'EM_PRODUCAO' || s === 'PRONTO_PARA_RETIRADA'
  }).length
  const aguardandoCount = pedidos.filter((p) => {
    const s = normalizeStatus(p.statusAtual)
    return s === 'AGUARDANDO_ANALISE' || s === 'ORCAMENTO_ENVIADO'
  }).length
  const entreguesCount = pedidos.filter((p) => normalizeStatus(p.statusAtual) === 'ENTREGUE').length

  const isDirty =
    drawerPedido !== null &&
    (draftStatus !== normalizeStatus(drawerPedido.statusAtual) ||
      (draftEtapa !== '' && draftEtapa !== (drawerPedido.etapaProducao?.toUpperCase() || '')))

  const headerSubtitle = hasFilters
    ? `Mostrando ${pedidosFiltrados.length} de ${total} pedidos.`
    : 'Gerencie todos os pedidos e acompanhe o andamento de produção.'

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const drawerOrderCode = drawerPedido?.fichaTecnica?.codigoDisplay || `SERI-${drawerPedido?.id}`
  const drawerTitle = drawerPedido?.fichaTecnica?.identificacao || drawerPedido?.fichaTecnica?.produtoTipo || 'Pedido Seri.'
  const whatsappMsg = encodeURIComponent(`Olá! Sobre o seu pedido ${drawerOrderCode} — ${drawerTitle}.`)

  return (
    <div className="ak-page">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="ak-sidebar">
        <div className="ak-sidebar-top">
          <Link to={ROUTES.HOME} className="ak-brand">
            <div className="ak-brand-main">
              <div className="ak-brand-logo">
                <img src={logo} alt="Seri." />
              </div>
              <div className="ak-brand-name">Seri.</div>
            </div>
            <div className="ak-brand-sub">Painel de Administração</div>
          </Link>

          <nav className="ak-menu">
            {SIDEBAR_ITEMS.map((item) => {
              if (item.section === 'title') {
                return (
                  <div key={item.label} className="ak-menu-section">
                    {item.label}
                  </div>
                )
              }

              const className = `ak-menu-item ${item.active ? 'is-active' : ''}`
              if (item.route) {
                return (
                  <Link key={item.label} to={item.route} className={className}>
                    <span className="ak-menu-icon">{renderSidebarIcon(item.label)}</span>
                    <span className="ak-menu-label">{item.label}</span>
                    {item.badge ? <span className="ak-menu-badge">{item.badge}</span> : null}
                  </Link>
                )
              }

              return (
                <button key={item.label} type="button" className={className}>
                  <span className="ak-menu-icon">{renderSidebarIcon(item.label)}</span>
                  <span className="ak-menu-label">{item.label}</span>
                  {item.badge ? <span className="ak-menu-badge">{item.badge}</span> : null}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="ak-sidebar-bottom">
          <div className="ak-user-badge">{getInitials(user?.name)}</div>
          <div className="ak-user-meta">
            <strong>{user?.name || 'Administrador'}</strong>
            <span>Administrador</span>
          </div>
          <button type="button" className="ak-logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="ak-main ap-main">
        <header className="ak-header">
          <div>
            <span className="ak-header-kicker">Principal</span>
            <h1>Pedidos <em>do estúdio.</em></h1>
            <p>{headerSubtitle}</p>
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        {/* Summary */}
        <section className="ap-overview" aria-label="Resumo dos pedidos">
          <button
            type="button"
            className={`ak-metric-card ak-metric-button ${filter === 'TODOS' ? 'is-active' : ''}`}
            onClick={() => setFilter('TODOS')}
          >
            <span>Total de pedidos</span>
            <strong>{total}</strong>
            <small>todos os registros</small>
          </button>

          <button
            type="button"
            className={`ak-metric-card ak-metric-button ak-metric-card-green ${filter === 'EM_PRODUCAO' ? 'is-active' : ''}`}
            onClick={() => setFilter('EM_PRODUCAO')}
          >
            <span>Em produção</span>
            <strong>{emProducaoCount}</strong>
            <small>em andamento</small>
          </button>

          <button
            type="button"
            className={`ak-metric-card ak-metric-button ${filter === 'AGUARDANDO' ? 'is-active' : ''}`}
            onClick={() => setFilter('AGUARDANDO')}
          >
            <span>Aguardando</span>
            <strong>{aguardandoCount}</strong>
            <small>análise ou orçamento</small>
          </button>

          <button
            type="button"
            className={`ak-metric-card ak-metric-button ${filter === 'ENTREGUE' ? 'is-active' : ''}`}
            onClick={() => setFilter('ENTREGUE')}
          >
            <span>Entregues</span>
            <strong>{entreguesCount}</strong>
            <small>concluídos</small>
          </button>
        </section>

        {/* Toolbar */}
        <div className="ap-toolbar">
          <label className="ak-search">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente, código ou identificação"
            />
          </label>

          <div className="ak-filter-group" aria-label="Filtro por status">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={filter === opt.value ? 'is-active' : ''}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ak-clear-filters"
            disabled={!hasFilters}
            onClick={() => { setSearch(''); setFilter('TODOS') }}
          >
            Limpar
          </button>
        </div>

        {/* Table */}
        <div className="ap-table-wrap">
          {loading ? (
            <div className="ap-empty">Carregando pedidos...</div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="ap-empty">Nenhum pedido encontrado.</div>
          ) : (
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Identificação</th>
                  <th>Tipo / Peça</th>
                  <th>Qtd.</th>
                  <th>Etapa</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((pedido, index) => {
                  const status = normalizeStatus(pedido.statusAtual)
                  const totalPecas = getTotalPecas(pedido.quantidades)
                  const avatarStyle = AVATAR_COLORS[index % AVATAR_COLORS.length]
                  const code = pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`

                  return (
                    <tr key={pedido.id} onClick={() => openDrawer(pedido)}>
                      <td>
                        <span className="ap-chip">{code}</span>
                      </td>
                      <td>
                        <div className="ap-cli-row">
                          <span className="ap-cli-av" style={avatarStyle}>
                            {getInitials(pedido.clienteNome)}
                          </span>
                          <div>
                            <div className="ap-cli-name">{pedido.clienteNome || '—'}</div>
                            <div className="ap-cli-email">{pedido.clienteEmail || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ap-id-name">
                          {pedido.fichaTecnica?.identificacao || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="ap-id-tipo">
                          {pedido.fichaTecnica?.produtoTipo || '—'}
                        </div>
                      </td>
                      <td>{totalPecas > 0 ? totalPecas : '—'}</td>
                      <td>
                        <span className={getEtapaClass(pedido.etapaProducao)}>
                          {getEtapaLabel(pedido.etapaProducao)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(status)}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ak-text-dim)', fontSize: '12px' }}>
                        {formatDate(pedido.dataAbertura)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ap-btn-detail"
                          onClick={(e) => { e.stopPropagation(); openDrawer(pedido) }}
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Drawer ────────────────────────────────────────────────── */}
      <div
        className={`ap-drawer-overlay ${drawerPedido ? 'open' : ''}`}
        onClick={closeDrawer}
      />

      <aside className={`ap-drawer ${drawerPedido ? 'open' : ''}`}>
        {drawerPedido ? (
          <>
            <div className="ap-dw-head">
              <div>
                <div className="ap-dw-code">{drawerOrderCode}</div>
                <div className="ap-dw-title">{drawerTitle}</div>
                <div className="ap-dw-client">{drawerPedido.clienteNome || 'Cliente não identificado'}</div>
              </div>
              <button type="button" className="ap-dw-close" onClick={closeDrawer} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className="ap-dw-body">
              {/* Info grid */}
              <div className="ap-dw-section">
                <div className="ap-dw-section-label">Informações do pedido</div>
                <div className="ap-info-grid">
                  <div className="ap-info-cell">
                    <div className="ap-info-cell-label">Cliente</div>
                    <div className="ap-info-cell-value">{drawerPedido.clienteNome || '—'}</div>
                  </div>
                  <div className="ap-info-cell">
                    <div className="ap-info-cell-label">E-mail</div>
                    <div className="ap-info-cell-value" style={{ wordBreak: 'break-all', fontSize: '11.5px' }}>
                      {drawerPedido.clienteEmail || '—'}
                    </div>
                  </div>
                  <div className="ap-info-cell">
                    <div className="ap-info-cell-label">Data de abertura</div>
                    <div className="ap-info-cell-value">{formatDate(drawerPedido.dataAbertura)}</div>
                  </div>
                  <div className="ap-info-cell">
                    <div className="ap-info-cell-label">Total de peças</div>
                    <div className="ap-info-cell-value">{getTotalPecas(drawerPedido.quantidades) || '—'}</div>
                  </div>
                  {drawerPedido.fichaTecnica?.identificacao ? (
                    <div className="ap-info-cell" style={{ gridColumn: '1 / -1' }}>
                      <div className="ap-info-cell-label">Identificação</div>
                      <div className="ap-info-cell-value">{drawerPedido.fichaTecnica.identificacao}</div>
                    </div>
                  ) : null}
                  {drawerPedido.fichaTecnica?.especificacoes ? (
                    <div className="ap-info-cell" style={{ gridColumn: '1 / -1' }}>
                      <div className="ap-info-cell-label">Especificações</div>
                      <div className="ap-info-cell-value" style={{ fontSize: '12px', fontWeight: 400 }}>
                        {drawerPedido.fichaTecnica.especificacoes}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Status */}
              <div className="ap-dw-section">
                <div className="ap-dw-section-label">Status do pedido</div>
                <select
                  className="ap-select"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as AdminStatus)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Etapa */}
              <div className="ap-dw-section">
                <div className="ap-dw-section-label">Etapa de produção</div>
                <select
                  className="ap-select"
                  value={draftEtapa}
                  onChange={(e) => setDraftEtapa(e.target.value as EtapaProducao | '')}
                >
                  <option value="">— Sem etapa —</option>
                  {ETAPA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Observações */}
              {drawerPedido.observacoes ? (
                <div className="ap-dw-section">
                  <div className="ap-dw-section-label">Observações do cliente</div>
                  <textarea
                    className="ap-obs"
                    value={drawerPedido.observacoes}
                    readOnly
                  />
                </div>
              ) : null}
            </div>

            {saveError ? (
              <div className="ap-save-error">{saveError}</div>
            ) : null}

            <div className="ap-dw-foot">
              <a
                href={`https://wa.me/?text=${whatsappMsg}`}
                target="_blank"
                rel="noreferrer"
                className="ap-btn-ws"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.533 5.855L0 24l6.335-1.51A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 0 1-5.006-1.369l-.36-.214-3.76.896.911-3.668-.235-.377A9.818 9.818 0 0 1 2.182 12c0-5.415 4.403-9.818 9.818-9.818 5.415 0 9.818 4.403 9.818 9.818 0 5.415-4.403 9.818-9.818 9.818z" />
                </svg>
                WhatsApp
              </a>

              <button
                type="button"
                className="ap-btn-save"
                disabled={!isDirty || saving}
                onClick={handleSave}
              >
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  )
}
