import { useDeferredValue, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminClientes.css'

type AdminStatus =
  | 'AGUARDANDO_ANALISE'
  | 'ORCAMENTO_ENVIADO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PARA_RETIRADA'
  | 'ENTREGUE'
  | 'CANCELADO'

type ClienteFilter = 'TODOS' | 'ATIVOS' | 'NOVOS' | 'RECORRENTES'
type ClienteSummaryKey = 'TOTAL' | 'ATIVOS' | 'NOVOS' | 'RECORRENTES'

type AdminPedido = {
  id: number
  statusAtual: string
  etapaProducao?: string | null
  dataAbertura?: string
  quantidades?: string
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
  financeiro?: {
    valorVenda?: number | null
    lucroLiquido?: number | null
  } | null
}

type AdminCliente = {
  id: number
  nome: string
  email: string
  cpfCnpj?: string | null
  whatsapp?: string | null
  endereco?: string | null
  pedidos: AdminPedido[]
  totalPedidos: number
  pedidosAtivos: number
  pedidosEntregues: number
  ultimoPedido?: string
  primeiroPedido?: string
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
  { label: 'Pedidos', route: ROUTES.ADMIN_PEDIDOS },
  { label: 'Clientes', active: true, route: ROUTES.ADMIN_CLIENTES },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Fluxo de produção', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro', route: ROUTES.ADMIN_FINANCEIRO_DASHBOARD },
]

const FILTER_OPTIONS: Array<{ value: ClienteFilter; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ATIVOS', label: 'Ativos' },
  { value: 'NOVOS', label: 'Novos' },
  { value: 'RECORRENTES', label: 'Recorrentes' },
]

function normalizeStatus(status?: string | null): AdminStatus {
  if (!status) return 'AGUARDANDO_ANALISE'

  const normalized = status.trim().toUpperCase()
  if (normalized === 'AGUARDANDO_ORCAMENTO') return 'AGUARDANDO_ANALISE'
  if (normalized === 'ORCAMENTO_ENVIADO') return 'ORCAMENTO_ENVIADO'
  if (normalized === 'EM_PRODUCAO') return 'EM_PRODUCAO'
  if (normalized === 'PRONTO_PARA_RETIRADA') return 'PRONTO_PARA_RETIRADA'
  if (normalized === 'ENTREGUE') return 'ENTREGUE'
  if (normalized === 'CANCELADO') return 'CANCELADO'
  return 'AGUARDANDO_ANALISE'
}

function isActivePedido(pedido: AdminPedido) {
  const status = normalizeStatus(pedido.statusAtual)
  return status !== 'ENTREGUE' && status !== 'CANCELADO'
}

function getStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status)
  if (normalized === 'AGUARDANDO_ANALISE') return 'Aguardando análise'
  if (normalized === 'ORCAMENTO_ENVIADO') return 'Orçamento enviado'
  if (normalized === 'EM_PRODUCAO') return 'Em produção'
  if (normalized === 'PRONTO_PARA_RETIRADA') return 'Pronto para retirada'
  if (normalized === 'ENTREGUE') return 'Entregue'
  return 'Cancelado'
}

function getInitials(name?: string | null) {
  if (!name) return 'CL'

  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return parts[0].slice(0, 2).toUpperCase()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return 'Sem valor'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getTotalPecas(quantidades?: string) {
  if (!quantidades) return 0

  return quantidades
    .split(',')
    .map((item) => item.trim())
    .reduce((sum, item) => {
      const [, quantidade] = item.split(':')
      const value = Number.parseInt(quantidade ?? '0', 10)
      return sum + (Number.isNaN(value) ? 0 : value)
    }, 0)
}

function formatDate(date?: string) {
  if (!date) return '--/--/----'

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '--/--/----'

  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`
}

function isSameMonth(date?: string) {
  if (!date) return false

  const parsed = new Date(date)
  const now = new Date()
  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()
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

export default function AdminClientes() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [clientes, setClientes] = useState<AdminCliente[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ClienteFilter>('TODOS')
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [activeSummary, setActiveSummary] = useState<ClienteSummaryKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let isMounted = true

    apiRequest<AdminCliente[]>('/admin/clientes')
      .then((data) => {
        if (!isMounted) return
        setClientes(data)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os clientes.')
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

  const selectedCliente = clientes.find((cliente) => cliente.id === selectedClienteId) ?? null
  const ativos = clientes.filter((cliente) => cliente.pedidosAtivos > 0)
  const novos = clientes.filter((cliente) => isSameMonth(cliente.primeiroPedido))
  const recorrentes = clientes.filter((cliente) => cliente.totalPedidos >= 2)
  const summaryCards = [
    {
      key: 'TOTAL' as const,
      className: '',
      label: 'Total de clientes',
      value: clientes.length,
      helper: 'cadastrados',
      clientes,
    },
    {
      key: 'ATIVOS' as const,
      className: 'ak-metric-card-green',
      label: 'Ativos este mês',
      value: ativos.length,
      helper: 'com pedido aberto',
      clientes: ativos,
    },
    {
      key: 'NOVOS' as const,
      className: 'ac-metric-card-blue',
      label: 'Novos este mês',
      value: novos.length,
      helper: 'cadastros recentes',
      clientes: novos,
    },
    {
      key: 'RECORRENTES' as const,
      className: 'ac-metric-card-yellow',
      label: 'Recorrentes',
      value: recorrentes.length,
      helper: '2+ pedidos',
      clientes: recorrentes,
    },
  ]
  const activeSummaryCard = summaryCards.find((card) => card.key === activeSummary) ?? null
  const hasFilters = search.trim().length > 0 || filter !== 'TODOS'

  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const clientesFiltrados = clientes.filter((cliente) => {
    const matchesFilter =
      filter === 'TODOS' ||
      (filter === 'ATIVOS' && cliente.pedidosAtivos > 0) ||
      (filter === 'NOVOS' && isSameMonth(cliente.primeiroPedido)) ||
      (filter === 'RECORRENTES' && cliente.totalPedidos >= 2)
    const matchesSearch =
      !normalizedSearch ||
      cliente.nome.toLowerCase().includes(normalizedSearch) ||
      cliente.email.toLowerCase().includes(normalizedSearch)

    return matchesFilter && matchesSearch
  })

  const headerSubtitle = hasFilters
    ? `Mostrando ${clientesFiltrados.length} de ${clientes.length} clientes cadastrados.`
    : 'Gerencie e acompanhe todos os clientes do estúdio.'

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="ak-page ac-page">
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

      <main className="ak-main">
        <header className="ak-header">
          <div>
            <span className="ak-header-kicker">Principal</span>
            <h1>Clientes <em>cadastrados.</em></h1>
            <p>{headerSubtitle}</p>
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        <section className="ak-overview ac-overview" aria-label="Resumo dos clientes">
          {summaryCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`ak-metric-card ac-summary-card ${card.className} ${activeSummary === card.key ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedClienteId(null)
                setActiveSummary(activeSummary === card.key ? null : card.key)
              }}
            >
              <span>{card.label}</span>
              <strong>{formatNumber(card.value)}</strong>
              <small>{card.helper}</small>
            </button>
          ))}
        </section>

        <section className="ak-toolbar" aria-label="Filtros dos clientes">
          <label className="ak-search">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome ou e-mail do cliente"
            />
          </label>

          <div className="ak-filter-group" aria-label="Filtro por clientes">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={filter === option.value ? 'is-active' : ''}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ak-clear-filters"
            disabled={!hasFilters}
            onClick={() => {
              setSearch('')
              setFilter('TODOS')
            }}
          >
            Limpar
          </button>
        </section>

        <section className="ac-client-grid" aria-label="Lista de clientes">
          {loading ? (
            <div className="ac-empty">Carregando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="ac-empty">Nenhum cliente encontrado com esse filtro.</div>
          ) : (
            clientesFiltrados.map((cliente, index) => (
              <article key={cliente.id} className="ac-client-card">
                <div className="ac-client-head">
                  <span className={`ac-avatar ac-avatar-${index % 4}`}>{getInitials(cliente.nome)}</span>
                  <div>
                    <h2>{cliente.nome}</h2>
                    <p>{cliente.email}</p>
                    <small>Cliente desde {formatDate(cliente.primeiroPedido)}</small>
                  </div>
                </div>

                <div className="ac-client-stats">
                  <div>
                    <strong>{formatNumber(cliente.totalPedidos)}</strong>
                    <span>Pedidos</span>
                  </div>
                  <div>
                    <strong>{formatNumber(cliente.pedidosAtivos)}</strong>
                    <span>Ativos</span>
                  </div>
                  <div>
                    <strong>{formatNumber(cliente.pedidosEntregues)}</strong>
                    <span>Entregues</span>
                  </div>
                </div>

                <div className="ac-client-foot">
                  <span>Último: {formatDate(cliente.ultimoPedido)}</span>
                  <button type="button" onClick={() => setSelectedClienteId(cliente.id)}>
                    Ver pedidos
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {activeSummaryCard && !selectedCliente ? (
        <div className="ac-drawer-backdrop" onClick={() => setActiveSummary(null)}>
          <aside className="ac-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ac-drawer-top">
              <div>
                <span className="ac-drawer-code">Clientes</span>
                <h2>{activeSummaryCard.label}</h2>
                <p>{activeSummaryCard.clientes.length} {activeSummaryCard.clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}</p>
              </div>

              <button type="button" className="ac-drawer-close" onClick={() => setActiveSummary(null)} aria-label="Fechar">
                x
              </button>
            </div>

            <div className="ac-summary-client-list">
              {activeSummaryCard.clientes.length === 0 ? (
                <div className="ac-order-empty">Nenhum cliente nesse grupo.</div>
              ) : (
                activeSummaryCard.clientes.map((cliente) => (
                  <div key={cliente.id} className="ac-summary-client-item">
                    <div>
                      <strong>{cliente.nome}</strong>
                      <span>{cliente.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSummary(null)
                        setSelectedClienteId(cliente.id)
                      }}
                    >
                      Mais informações
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {selectedCliente ? (
        <div className="ac-drawer-backdrop" onClick={() => setSelectedClienteId(null)}>
          <aside className="ac-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ac-drawer-top">
              <div>
                <span className="ac-drawer-code">Cliente</span>
                <h2>{selectedCliente.nome}</h2>
                <p>{selectedCliente.email}</p>
              </div>

              <button type="button" className="ac-drawer-close" onClick={() => setSelectedClienteId(null)} aria-label="Fechar">
                x
              </button>
            </div>

            <div className="ac-drawer-summary">
              <div>
                <span>Pedidos</span>
                <strong>{formatNumber(selectedCliente.totalPedidos)}</strong>
              </div>
              <div className="is-highlight">
                <span>Ativos</span>
                <strong>{formatNumber(selectedCliente.pedidosAtivos)}</strong>
              </div>
              <div>
                <span>Entregues</span>
                <strong>{formatNumber(selectedCliente.pedidosEntregues)}</strong>
              </div>
            </div>

            <div className="ac-order-list">
              {selectedCliente.pedidos.length === 0 ? (
                <div className="ac-order-empty">Nenhum pedido cadastrado para este cliente.</div>
              ) : (
                selectedCliente.pedidos.map((pedido) => (
                  <div key={pedido.id} className="ac-order-item">
                    <div>
                      <span>{pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`}</span>
                      <strong>{pedido.fichaTecnica?.identificacao || pedido.fichaTecnica?.produtoTipo || 'Pedido Seri.'}</strong>
                      <small>{getStatusLabel(pedido.statusAtual)} · {formatDate(pedido.dataAbertura)}</small>
                      <dl className="ac-order-finance">
                        <div>
                          <dt>Total de peças</dt>
                          <dd>{formatNumber(getTotalPecas(pedido.quantidades))}</dd>
                        </div>
                        <div>
                          <dt>Total cobrado</dt>
                          <dd>{formatCurrency(pedido.financeiro?.valorVenda)}</dd>
                        </div>
                        <div>
                          <dt>Lucro líquido</dt>
                          <dd>{formatCurrency(pedido.financeiro?.lucroLiquido)}</dd>
                        </div>
                      </dl>
                    </div>
                    <span className={isActivePedido(pedido) ? 'ac-order-state is-active' : 'ac-order-state'}>
                      {isActivePedido(pedido) ? 'Ativo' : 'Finalizado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
