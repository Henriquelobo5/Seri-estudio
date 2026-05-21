import { useDeferredValue, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminFichas.css'

type AdminStatus =
  | 'AGUARDANDO_ANALISE'
  | 'ORCAMENTO_ENVIADO'
  | 'EM_PRODUCAO'
  | 'PRONTO_PARA_RETIRADA'
  | 'ENTREGUE'
  | 'CANCELADO'

type FiltroStatus = 'TODOS' | AdminStatus
type FichasSummaryKey = 'TOTAL' | 'ANALISE' | 'ORCAMENTO' | 'PRODUCAO' | 'CONCLUIDAS'

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
}

type SidebarItem = {
  label: string
  section?: string
  badge?: string
  active?: boolean
  route?: string
}

type StatusOption = {
  value: AdminStatus
  label: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'AGUARDANDO_ANALISE', label: 'Aguardando análise' },
  { value: 'ORCAMENTO_ENVIADO', label: 'Orçamento enviado' },
  { value: 'EM_PRODUCAO', label: 'Em produção' },
  { value: 'PRONTO_PARA_RETIRADA', label: 'Pronto p/ retirada' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const FILTER_OPTIONS: Array<{ value: FiltroStatus; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'AGUARDANDO_ANALISE', label: 'Aguardando' },
  { value: 'ORCAMENTO_ENVIADO', label: 'Orçamento' },
  { value: 'EM_PRODUCAO', label: 'Em produção' },
  { value: 'PRONTO_PARA_RETIRADA', label: 'Prontos' },
]

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'PRINCIPAL', section: 'title' },
  { label: 'Dashboard', route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Fichas técnicas', active: true, route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos', route: ROUTES.ADMIN_PEDIDOS },
  { label: 'Clientes', route: ROUTES.ADMIN_CLIENTES },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Fluxo de produção', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro', route: ROUTES.ADMIN_FINANCEIRO_DASHBOARD },
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

function getStatusLabel(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  return STATUS_OPTIONS.find((option) => option.value === normalized)?.label ?? 'Aguardando análise'
}

function getStatusClass(status: string | null | undefined) {
  const normalized = normalizeStatus(status)

  if (normalized === 'AGUARDANDO_ANALISE') return 'af-status af-status-analise'
  if (normalized === 'ORCAMENTO_ENVIADO') return 'af-status af-status-orcamento'
  if (normalized === 'EM_PRODUCAO') return 'af-status af-status-producao'
  if (normalized === 'PRONTO_PARA_RETIRADA') return 'af-status af-status-pronto'
  if (normalized === 'ENTREGUE') return 'af-status af-status-entregue'
  return 'af-status af-status-cancelado'
}

function parseEspecificacoes(value?: string | null) {
  const parts = (value ?? '').split(',').map((item) => item.trim()).filter(Boolean)
  return {
    tecido: parts[0] ?? 'Sem tecido',
    gramatura: parts[1] ?? 'Sem gramatura',
    cor: parts[2] ?? 'Sem cor',
    tamanhos: parts.slice(3).join(', ') || 'Sem tamanhos',
  }
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

function getTamanhos(quantidades?: string, fallback?: string) {
  const parsed = (quantidades ?? '')
    .split(',')
    .map((item) => item.trim().split(':')[0]?.trim())
    .filter(Boolean)

  if (parsed.length > 0) {
    return parsed.join(', ')
  }

  return fallback || 'Sem tamanhos'
}

function getInitials(name?: string | null) {
  if (!name) return 'ST'

  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return parts[0].slice(0, 2).toUpperCase()
}

function getPrazoInfo(pedido: AdminPedido) {
  const totalPecas = getTotalPecas(pedido.quantidades)
  const createdAt = pedido.dataAbertura ? new Date(pedido.dataAbertura) : null
  const daysOpen = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 86400000) : 0
  const urgent = daysOpen >= 7 || totalPecas >= 30 || normalizeStatus(pedido.statusAtual) === 'AGUARDANDO_ANALISE'

  return urgent
    ? { label: 'Urgente', className: 'af-prazo af-prazo-urgent' }
    : { label: 'Normal', className: 'af-prazo af-prazo-normal' }
}

function formatCreatedAt(date?: string) {
  if (!date) return '--'

  const parsed = new Date(date)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86400000)
  const timeLabel = `${String(parsed.getHours()).padStart(2, '0')}h${String(parsed.getMinutes()).padStart(2, '0')}`

  if (diffDays === 0) return `Hoje, ${timeLabel}`
  if (diffDays === 1) return `Ontem, ${timeLabel}`

  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`
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

export default function AdminFichas() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null)
  const [draftStatus, setDraftStatus] = useState<AdminStatus>('AGUARDANDO_ANALISE')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FiltroStatus>('TODOS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null)
  const [activeSummary, setActiveSummary] = useState<FichasSummaryKey | null>(null)

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
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as fichas técnicas.')
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

  const selectedPedido = pedidos.find((pedido) => pedido.id === selectedPedidoId) ?? null

  useEffect(() => {
    if (selectedPedido) {
      setDraftStatus(normalizeStatus(selectedPedido.statusAtual))
    }
  }, [selectedPedido])

  const totalFichas = pedidos.length
  const aguardandoAnalise = pedidos.filter((pedido) => normalizeStatus(pedido.statusAtual) === 'AGUARDANDO_ANALISE').length
  const orcamentoEnviado = pedidos.filter((pedido) => normalizeStatus(pedido.statusAtual) === 'ORCAMENTO_ENVIADO').length
  const emProducao = pedidos.filter((pedido) => normalizeStatus(pedido.statusAtual) === 'EM_PRODUCAO').length
  const concluidas = pedidos.filter((pedido) => {
    const status = normalizeStatus(pedido.statusAtual)
    return status === 'PRONTO_PARA_RETIRADA' || status === 'ENTREGUE'
  }).length
  const summaryCards = [
    {
      key: 'TOTAL' as const,
      className: '',
      label: 'Total de fichas',
      value: totalFichas,
      helper: 'fichas registradas',
      pedidos,
    },
    {
      key: 'ANALISE' as const,
      className: '',
      label: 'Aguardando análise',
      value: aguardandoAnalise,
      helper: 'precisam de revisão',
      pedidos: pedidos.filter((pedido) => normalizeStatus(pedido.statusAtual) === 'AGUARDANDO_ANALISE'),
    },
    {
      key: 'ORCAMENTO' as const,
      className: '',
      label: 'Em orçamento',
      value: orcamentoEnviado,
      helper: 'aguardando aprovação',
      pedidos: pedidos.filter((pedido) => normalizeStatus(pedido.statusAtual) === 'ORCAMENTO_ENVIADO'),
    },
    {
      key: 'PRODUCAO' as const,
      className: 'ak-metric-card-green',
      label: 'Em produção',
      value: emProducao,
      helper: 'em andamento',
      pedidos: pedidos.filter((pedido) => normalizeStatus(pedido.statusAtual) === 'EM_PRODUCAO'),
    },
    {
      key: 'CONCLUIDAS' as const,
      className: '',
      label: 'Concluídas',
      value: concluidas,
      helper: 'prontas ou entregues',
      pedidos: pedidos.filter((pedido) => {
        const status = normalizeStatus(pedido.statusAtual)
        return status === 'PRONTO_PARA_RETIRADA' || status === 'ENTREGUE'
      }),
    },
  ]
  const activeSummaryCard = summaryCards.find((card) => card.key === activeSummary) ?? null

  const hasFilters = search.trim().length > 0 || filter !== 'TODOS'

  const headerSubtitle = hasFilters
    ? `Mostrando fichas filtradas. Limpe os filtros para ver todas as ${totalFichas}.`
    : 'Listagem, busca e gestão das fichas técnicas dos clientes.'

  const normalizedSearch = deferredSearch.trim().toUpperCase()
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const status = normalizeStatus(pedido.statusAtual)
    const passaFiltro = filter === 'TODOS' || status === filter
    const code = (pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`).toUpperCase()
    const cliente = (pedido.clienteNome ?? '').toUpperCase()
    const nome = (pedido.fichaTecnica?.identificacao ?? '').toUpperCase()
    const produto = (pedido.fichaTecnica?.produtoTipo ?? '').toUpperCase()
    const passaBusca =
      !normalizedSearch ||
      code.includes(normalizedSearch) ||
      cliente.includes(normalizedSearch) ||
      nome.includes(normalizedSearch) ||
      produto.includes(normalizedSearch)

    return passaFiltro && passaBusca
  })

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  function openPedido(pedido: AdminPedido) {
    setActiveSummary(null)
    setSelectedPedidoId(pedido.id)
    setDraftStatus(normalizeStatus(pedido.statusAtual))
  }

  async function saveStatus() {
    if (!selectedPedido) {
      return
    }

    const currentStatus = normalizeStatus(selectedPedido.statusAtual)
    if (draftStatus === currentStatus) {
      return
    }

    setError('')
    setSavingStatusId(selectedPedido.id)

    try {
      const updated = await apiRequest<AdminPedido>(`/admin/pedidos/${selectedPedido.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statusAtual: draftStatus }),
      })

      setPedidos((prev) =>
        prev.map((pedido) => (pedido.id === selectedPedido.id ? updated : pedido)),
      )
      setDraftStatus(normalizeStatus(updated.statusAtual))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o status do pedido.')
    } finally {
      setSavingStatusId(null)
    }
  }

  return (
    <div className="ak-page">
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
            <strong>{user?.name || 'Gestor Seri.'}</strong>
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
            <h1>Fichas <em>técnicas.</em></h1>
            <p>{headerSubtitle}</p>
          </div>

        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        <section className="ak-overview" aria-label="Resumo das fichas técnicas">
          {summaryCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`ak-metric-card ak-metric-button ${card.className} ${activeSummary === card.key ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedPedidoId(null)
                setActiveSummary(activeSummary === card.key ? null : card.key)
              }}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.helper}</small>
            </button>
          ))}
        </section>

        <section className="ak-toolbar" aria-label="Filtros das fichas técnicas">
          <label className="ak-search">
            <span>Buscar</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Código, cliente ou peça"
            />
          </label>

          <div className="ak-filter-group" aria-label="Filtro por status">
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

        <section className="af-table-shell">
          <table className="af-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Peça / ficha</th>
                <th>Qtd.</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Criado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="af-empty">
                    Carregando fichas técnicas...
                  </td>
                </tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="af-empty">
                    Nenhuma ficha encontrada com esse filtro.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((pedido) => {
                  const specs = parseEspecificacoes(pedido.fichaTecnica?.especificacoes)
                  const prazo = getPrazoInfo(pedido)
                  const totalPecas = getTotalPecas(pedido.quantidades)
                  const title = pedido.fichaTecnica?.identificacao || 'Pedido sem nome'
                  const productLabel = `${pedido.fichaTecnica?.produtoTipo || 'Produto'} · ${specs.cor}`
                  const detailsLabel = `${specs.tecido} · ${getTamanhos(pedido.quantidades, specs.tamanhos)}`

                  return (
                    <tr key={pedido.id} className={selectedPedidoId === pedido.id ? 'is-selected' : ''}>
                      <td>
                        <span className="af-code-pill">{pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`}</span>
                      </td>
                      <td>
                        <div className="af-cell-stack">
                          <strong>{pedido.clienteNome || 'Cliente Seri.'}</strong>
                          <span>{title}</span>
                        </div>
                      </td>
                      <td>
                        <div className="af-cell-stack">
                          <strong>{productLabel}</strong>
                          <span>{detailsLabel}</span>
                        </div>
                      </td>
                      <td>{totalPecas} peças</td>
                      <td>
                        <span className={prazo.className}>{prazo.label}</span>
                      </td>
                      <td>
                        <span className={getStatusClass(pedido.statusAtual)}>{getStatusLabel(pedido.statusAtual)}</span>
                      </td>
                      <td>{formatCreatedAt(pedido.dataAbertura)}</td>
                      <td>
                        <button type="button" className="af-view-btn" onClick={() => openPedido(pedido)}>
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </section>
      </main>

      {selectedPedido ? (
        <div className="af-drawer-backdrop" onClick={() => setSelectedPedidoId(null)}>
          <aside className="af-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="af-drawer-top">
              <div>
                <span className="af-drawer-code">{selectedPedido.fichaTecnica?.codigoDisplay || `SERI-${selectedPedido.id}`}</span>
                <h2>{selectedPedido.fichaTecnica?.identificacao || 'Pedido sem nome'}</h2>
                <p>{selectedPedido.clienteNome || 'Cliente Seri.'}</p>
              </div>

              <button type="button" className="af-drawer-close" onClick={() => setSelectedPedidoId(null)} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className="af-drawer-section">
              <h3>Status da ficha</h3>
              <select value={draftStatus} onChange={(event) => setDraftStatus(normalizeStatus(event.target.value))}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="af-drawer-section">
              <h3>Produto</h3>
              <div className="af-drawer-grid">
                <div className="af-info-card">
                  <span>Tipo / tecido / cor</span>
                  <strong>
                    {(selectedPedido.fichaTecnica?.produtoTipo || 'Produto')}, {parseEspecificacoes(selectedPedido.fichaTecnica?.especificacoes).tecido}, {parseEspecificacoes(selectedPedido.fichaTecnica?.especificacoes).cor}
                  </strong>
                </div>

                <div className="af-info-card">
                  <span>Tamanhos</span>
                  <strong>{getTamanhos(selectedPedido.quantidades, parseEspecificacoes(selectedPedido.fichaTecnica?.especificacoes).tamanhos)}</strong>
                </div>

                <div className="af-info-card">
                  <span>Quantidade</span>
                  <strong>{getTotalPecas(selectedPedido.quantidades)} peças</strong>
                </div>

                <div className="af-info-card">
                  <span>Prazo</span>
                  <strong>{getPrazoInfo(selectedPedido).label}</strong>
                </div>

                <div className="af-info-card">
                  <span>Gramatura</span>
                  <strong>{parseEspecificacoes(selectedPedido.fichaTecnica?.especificacoes).gramatura}</strong>
                </div>

                <div className="af-info-card">
                  <span>Criado em</span>
                  <strong>{formatCreatedAt(selectedPedido.dataAbertura)}</strong>
                </div>
              </div>
            </div>

            <div className="af-drawer-section">
              <h3>Contato</h3>
              <div className="af-drawer-grid">
                <div className="af-info-card">
                  <span>Cliente</span>
                  <strong>{selectedPedido.clienteNome || 'Cliente não informado'}</strong>
                </div>

                <div className="af-info-card">
                  <span>E-mail</span>
                  <strong>{selectedPedido.clienteEmail || 'Sem e-mail cadastrado'}</strong>
                </div>
              </div>
            </div>

            <div className="af-drawer-section">
              <h3>Observações</h3>
              <p className="af-observacoes">{selectedPedido.observacoes || 'Sem observações cadastradas.'}</p>
            </div>

            <button
              type="button"
              className="af-save-btn"
              onClick={() => void saveStatus()}
              disabled={savingStatusId === selectedPedido.id || draftStatus === normalizeStatus(selectedPedido.statusAtual)}
            >
              {savingStatusId === selectedPedido.id ? 'Salvando...' : 'Salvar alteração de status'}
            </button>
          </aside>
        </div>
      ) : null}

      {activeSummaryCard && !selectedPedido ? (
        <div className="af-drawer-backdrop" onClick={() => setActiveSummary(null)}>
          <aside className="af-drawer af-summary-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="af-drawer-top">
              <div>
                <span className="af-drawer-code">Resumo das fichas</span>
                <h2>{activeSummaryCard.label}</h2>
                <p>{activeSummaryCard.pedidos.length} {activeSummaryCard.pedidos.length === 1 ? 'ficha encontrada' : 'fichas encontradas'}</p>
              </div>

              <button type="button" className="af-drawer-close" onClick={() => setActiveSummary(null)} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className="ak-summary-list">
              {activeSummaryCard.pedidos.length === 0 ? (
                <div className="ak-summary-empty">Nenhuma ficha nesse grupo.</div>
              ) : (
                activeSummaryCard.pedidos.map((pedido) => {
                  const specs = parseEspecificacoes(pedido.fichaTecnica?.especificacoes)
                  return (
                    <button
                      key={pedido.id}
                      type="button"
                      className="ak-summary-item"
                      onClick={() => openPedido(pedido)}
                    >
                      <span className="ak-summary-code">
                        {pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`}
                      </span>
                      <strong>{pedido.fichaTecnica?.identificacao || 'Pedido sem nome'}</strong>
                      <small>
                        {pedido.clienteNome || 'Cliente Seri.'} · {getStatusLabel(pedido.statusAtual)} · {getTotalPecas(pedido.quantidades)} peças · {specs.cor}
                      </small>
                    </button>
                  )
                })
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
