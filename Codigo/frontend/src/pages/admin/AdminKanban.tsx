import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'

type EtapaProducao = 'CORTE' | 'ESTAMPARIA' | 'COSTURA' | 'REVISAO' | 'EXPEDICAO'

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

type StageConfig = {
  key: EtapaProducao
  label: string
  description: string
  borderColor: string
  badgeColor: string
  accentColor: string
}

type PriorityFilter = 'TODOS' | 'URGENTES' | 'NO_PRAZO'
type SummaryKey = 'ATIVOS' | 'URGENTES' | 'PECAS' | 'MAIOR_FILA' | 'PRONTOS'

type SidebarItem = {
  label: string
  section?: string
  badge?: string
  active?: boolean
  route?: string
}

const STAGES: StageConfig[] = [
  { key: 'CORTE', label: 'Corte', description: 'Preparação da base', borderColor: '#2A5E40', badgeColor: 'rgba(42,94,64,.18)', accentColor: '#2A5E40' },
  { key: 'ESTAMPARIA', label: 'Estamparia', description: 'Arte em produção', borderColor: '#3d8c5e', badgeColor: 'rgba(61,140,94,.18)', accentColor: '#3d8c5e' },
  { key: 'COSTURA', label: 'Costura', description: 'Montagem das peças', borderColor: '#7EC89A', badgeColor: 'rgba(126,200,154,.18)', accentColor: '#7EC89A' },
  { key: 'REVISAO', label: 'Revisão', description: 'Conferência final', borderColor: '#B7CBBE', badgeColor: 'rgba(183,203,190,.18)', accentColor: '#B7CBBE' },
  { key: 'EXPEDICAO', label: 'Expedição', description: 'Pronto para envio', borderColor: '#F0EBE3', badgeColor: 'rgba(240,235,227,.16)', accentColor: '#F0EBE3' },
]

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'PRINCIPAL', section: 'title' },
  { label: 'Dashboard' },
  { label: 'Fichas técnicas', badge: '3', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos' },
  { label: 'Clientes' },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Fluxo de produção', active: true, route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro' },
]

function normalizeEtapa(etapa?: string | null): EtapaProducao {
  if (etapa === 'ESTAMPARIA' || etapa === 'COSTURA' || etapa === 'REVISAO' || etapa === 'EXPEDICAO') {
    return etapa
  }
  return 'CORTE'
}

function getStageConfig(etapa: EtapaProducao): StageConfig {
  return STAGES.find((stage) => stage.key === etapa) ?? STAGES[0]
}

function parseEspecificacoes(value?: string | null) {
  const parts = (value ?? '').split(',').map((item) => item.trim()).filter(Boolean)
  return {
    tecido: parts[0] ?? 'Sem tecido',
    gramatura: parts[1] ?? 'Sem gramatura',
    cor: parts[2] ?? 'Natural',
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

function getInitials(name?: string | null) {
  if (!name) return 'ST'

  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return parts[0].slice(0, 2).toUpperCase()
}

function getPriority(pedido: AdminPedido) {
  const totalPecas = getTotalPecas(pedido.quantidades)
  const createdAt = pedido.dataAbertura ? new Date(pedido.dataAbertura) : null
  const daysOpen = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 86400000) : 0
  const urgent =
    daysOpen >= 7 ||
    totalPecas >= 30 ||
    pedido.statusAtual === 'AGUARDANDO_ORCAMENTO' ||
    pedido.statusAtual === 'AGUARDANDO_ANALISE'

  return urgent
    ? { label: 'Urgente', className: 'ak-priority-urgent' }
    : { label: 'No prazo', className: 'ak-priority-ok' }
}

function getProductTone(produto?: string | null) {
  const normalized = (produto ?? '').toLowerCase()

  if (normalized.includes('moletom')) return 'ak-chip-violet'
  if (normalized.includes('ecobag')) return 'ak-chip-emerald'
  if (normalized.includes('polo')) return 'ak-chip-red'
  if (normalized.includes('regata')) return 'ak-chip-orange'
  return 'ak-chip-blue'
}

function getColorTone(cor?: string | null) {
  const normalized = (cor ?? '').toLowerCase()

  if (normalized.includes('preto')) return 'ak-chip-dark'
  if (normalized.includes('branco')) return 'ak-chip-light'
  if (normalized.includes('verde')) return 'ak-chip-green'
  if (normalized.includes('vermelho')) return 'ak-chip-red'
  if (normalized.includes('azul')) return 'ak-chip-blue'
  if (normalized.includes('cinza')) return 'ak-chip-gray'
  return 'ak-chip-neutral'
}

function formatDate(date?: string) {
  if (!date) return '--/--'

  const parsed = new Date(date)
  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPedidosLabel(value: number) {
  return `${formatNumber(value)} ${value === 1 ? 'pedido' : 'pedidos'}`
}

function getSearchText(pedido: AdminPedido) {
  const specs = parseEspecificacoes(pedido.fichaTecnica?.especificacoes)

  return [
    pedido.id,
    pedido.statusAtual,
    pedido.clienteNome,
    pedido.clienteEmail,
    pedido.fichaTecnica?.codigoDisplay,
    pedido.fichaTecnica?.identificacao,
    pedido.fichaTecnica?.produtoTipo,
    specs.tecido,
    specs.gramatura,
    specs.cor,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
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

function renderStageIcon(stage: EtapaProducao) {
  if (stage === 'CORTE') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7" cy="8" r="2.5" />
        <circle cx="7" cy="16" r="2.5" />
        <path d="M9 9l10 10M9 15l10-10" fill="none" />
      </svg>
    )
  }

  if (stage === 'ESTAMPARIA') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="5" width="6" height="6" rx="1.5" />
        <rect x="13" y="5" width="6" height="6" rx="1.5" />
        <rect x="9" y="13" width="6" height="6" rx="1.5" />
      </svg>
    )
  }

  if (stage === 'COSTURA') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 18l10-12 2 2-10 12H7z" fill="none" />
        <path d="M14 6l4 4" fill="none" />
      </svg>
    )
  }

  if (stage === 'REVISAO') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10" cy="10" r="5" fill="none" />
        <path d="M14 14l5 5" fill="none" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4l7 4v8l-7 4-7-4V8z" fill="none" />
      <path d="M9 12l2 2 4-4" fill="none" />
    </svg>
  )
}

export default function AdminKanban() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null)
  const [draggedPedidoId, setDraggedPedidoId] = useState<number | null>(null)
  const [dropStage, setDropStage] = useState<EtapaProducao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movingPedidoId, setMovingPedidoId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('TODOS')
  const [activeSummary, setActiveSummary] = useState<SummaryKey | null>(null)

  useEffect(() => {
    let isMounted = true

    apiRequest<AdminPedido[]>('/admin/pedidos')
      .then((data) => {
        if (!isMounted) return
        setPedidos(data)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Não foi possível carregar o fluxo de produção.')
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
  const pedidosAtivos = useMemo(
    () => pedidos.filter((pedido) => pedido.statusAtual !== 'CANCELADO'),
    [pedidos],
  )
  const urgentes = pedidosAtivos.filter((pedido) => getPriority(pedido).label === 'Urgente').length
  const totalPecasAtivas = pedidosAtivos.reduce((sum, pedido) => sum + getTotalPecas(pedido.quantidades), 0)
  const searchQuery = searchTerm.trim().toLowerCase()
  const hasFilters = searchQuery.length > 0 || priorityFilter !== 'TODOS'

  const pedidosFiltrados = useMemo(() => {
    return pedidosAtivos.filter((pedido) => {
      const prioridade = getPriority(pedido).label
      const matchesPriority =
        priorityFilter === 'TODOS' ||
        (priorityFilter === 'URGENTES' && prioridade === 'Urgente') ||
        (priorityFilter === 'NO_PRAZO' && prioridade === 'No prazo')
      const matchesSearch = searchQuery.length === 0 || getSearchText(pedido).includes(searchQuery)

      return matchesPriority && matchesSearch
    })
  }, [pedidosAtivos, priorityFilter, searchQuery])

  const stageStats = useMemo(
    () =>
      STAGES.map((stage) => {
        const stagePedidos = pedidosAtivos.filter((pedido) => normalizeEtapa(pedido.etapaProducao) === stage.key)
        const pecas = stagePedidos.reduce((sum, pedido) => sum + getTotalPecas(pedido.quantidades), 0)

        return {
          stage,
          count: stagePedidos.length,
          pecas,
        }
      }),
    [pedidosAtivos],
  )

  const busiestStage = stageStats.reduce((current, next) => (next.count > current.count ? next : current), stageStats[0])
  const readyCount = stageStats.find(({ stage }) => stage.key === 'EXPEDICAO')?.count ?? 0
  const boardSubtitle = hasFilters
    ? `${pedidosFiltrados.length} pedidos encontrados na visualizacao atual`
    : 'Arraste os pedidos entre as etapas ou clique para ver detalhes.'

  const summaryCards = useMemo(() => {
    const urgentPedidos = pedidosAtivos.filter((pedido) => getPriority(pedido).label === 'Urgente')
    const maiorFilaPedidos = pedidosAtivos.filter(
      (pedido) => normalizeEtapa(pedido.etapaProducao) === busiestStage.stage.key,
    )
    const prontosPedidos = pedidosAtivos.filter(
      (pedido) => normalizeEtapa(pedido.etapaProducao) === 'EXPEDICAO',
    )

    return [
      {
        key: 'ATIVOS' as const,
        className: 'ak-metric-card-green',
        label: 'Pedidos ativos',
        value: formatNumber(pedidosAtivos.length),
        helper: 'em todas as etapas',
        pedidos: pedidosAtivos,
      },
      {
        key: 'URGENTES' as const,
        className: 'ak-metric-card-red',
        label: 'Pedidos urgentes',
        value: formatNumber(urgentes),
        helper: 'precisam de atenção',
        pedidos: urgentPedidos,
      },
      {
        key: 'PECAS' as const,
        className: '',
        label: 'Peças em produção',
        value: formatNumber(totalPecasAtivas),
        helper: 'somadas dos pedidos',
        pedidos: pedidosAtivos,
      },
      {
        key: 'MAIOR_FILA' as const,
        className: '',
        label: 'Maior fila',
        value: formatNumber(busiestStage.count),
        helper: busiestStage.stage.label,
        pedidos: maiorFilaPedidos,
      },
      {
        key: 'PRONTOS' as const,
        className: '',
        label: 'Prontos para envio',
        value: formatNumber(readyCount),
        helper: 'em expedição',
        pedidos: prontosPedidos,
      },
    ]
  }, [busiestStage, pedidosAtivos, readyCount, totalPecasAtivas, urgentes])

  const activeSummaryCard = summaryCards.find((card) => card.key === activeSummary) ?? null

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  async function movePedidoToStage(pedidoId: number, nextStage: EtapaProducao) {
    const currentPedido = pedidos.find((pedido) => pedido.id === pedidoId)
    const currentStage = normalizeEtapa(currentPedido?.etapaProducao)

    if (!currentPedido || currentStage === nextStage) {
      return
    }

    setError('')
    setMovingPedidoId(pedidoId)
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoId ? { ...pedido, etapaProducao: nextStage } : pedido,
      ),
    )

    try {
      const updated = await apiRequest<AdminPedido>(`/admin/pedidos/${pedidoId}/etapa`, {
        method: 'PATCH',
        body: JSON.stringify({ etapaProducao: nextStage }),
      })

      setPedidos((prev) =>
        prev.map((pedido) => (pedido.id === pedidoId ? updated : pedido)),
      )
    } catch (err: unknown) {
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === pedidoId ? { ...pedido, etapaProducao: currentStage } : pedido,
        ),
      )
      setError(err instanceof Error ? err.message : 'Não foi possível mover o pedido.')
    } finally {
      setMovingPedidoId(null)
    }
  }

  function renderCard(pedido: AdminPedido) {
    const etapa = normalizeEtapa(pedido.etapaProducao)
    const specs = parseEspecificacoes(pedido.fichaTecnica?.especificacoes)
    const prioridade = getPriority(pedido)
    const totalPecas = getTotalPecas(pedido.quantidades)
    const initials = getInitials(pedido.clienteNome)
    const stageIndex = STAGES.findIndex((stage) => stage.key === etapa)
    const cardCode = pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`
    const title = pedido.fichaTecnica?.identificacao || 'Pedido em produção'
    const subtitle = pedido.clienteNome || 'Cliente Seri.'

    return (
      <button
        key={pedido.id}
        type="button"
        className={`ak-card ${selectedPedidoId === pedido.id ? 'is-selected' : ''} ${movingPedidoId === pedido.id ? 'is-moving' : ''}`}
        draggable
        onClick={() => setSelectedPedidoId(pedido.id)}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', String(pedido.id))
          setDraggedPedidoId(pedido.id)
        }}
        onDragEnd={() => {
          setDraggedPedidoId(null)
          setDropStage(null)
        }}
      >
        <div className="ak-card-top">
          <span className="ak-card-code">{cardCode}</span>
          <span className={`ak-priority ${prioridade.className}`}>{prioridade.label}</span>
        </div>

        <h3 className="ak-card-title">{title}</h3>
        <p className="ak-card-subtitle">{subtitle}</p>

        <div className="ak-card-info">
          <span>Aberto em {formatDate(pedido.dataAbertura)}</span>
          <span>{specs.tecido}</span>
        </div>

        <div className="ak-chip-row">
          <span className={`ak-chip ${getProductTone(pedido.fichaTecnica?.produtoTipo)}`}>
            {pedido.fichaTecnica?.produtoTipo || 'Produto'}
          </span>
          <span className={`ak-chip ${getColorTone(specs.cor)}`}>{specs.cor}</span>
        </div>

        <div className="ak-card-footer">
          <span className="ak-card-meta">{formatNumber(totalPecas)} peças</span>
          <div className="ak-progress" aria-hidden="true">
            {STAGES.map((stage, index) => (
              <span
                key={stage.key}
                className={`ak-progress-bar ${index <= stageIndex ? 'is-active' : ''}`}
                style={{ '--progress-color': getStageConfig(etapa).accentColor } as CSSProperties}
              />
            ))}
          </div>
          <span className="ak-avatar">{initials}</span>
        </div>
      </button>
    )
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
            <span className="ak-header-kicker">Produção</span>
            <h1>Fluxo de <em>produção.</em></h1>
            <p>{boardSubtitle}</p>
          </div>

        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        <section className="ak-overview" aria-label="Resumo da produção">
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

        <section className="ak-toolbar" aria-label="Controles do fluxo de produção">
          <label className="ak-search">
            <span>Buscar</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cliente, código ou produto"
            />
          </label>

          <div className="ak-filter-group" aria-label="Filtro de prioridade">
            <button
              type="button"
              className={priorityFilter === 'TODOS' ? 'is-active' : ''}
              onClick={() => setPriorityFilter('TODOS')}
            >
              Todos
            </button>
            <button
              type="button"
              className={priorityFilter === 'URGENTES' ? 'is-active' : ''}
              onClick={() => setPriorityFilter('URGENTES')}
            >
              Urgentes
            </button>
            <button
              type="button"
              className={priorityFilter === 'NO_PRAZO' ? 'is-active' : ''}
              onClick={() => setPriorityFilter('NO_PRAZO')}
            >
              No prazo
            </button>
          </div>

          <button
            type="button"
            className="ak-clear-filters"
            disabled={!hasFilters}
            onClick={() => {
              setSearchTerm('')
              setPriorityFilter('TODOS')
            }}
          >
            Limpar
          </button>
        </section>

        <div className="ak-board-shell">
          <div className="ak-board">
            {STAGES.map((stage) => {
              const columnPedidos = pedidosFiltrados.filter((pedido) => normalizeEtapa(pedido.etapaProducao) === stage.key)
              const columnPecas = columnPedidos.reduce((sum, pedido) => sum + getTotalPecas(pedido.quantidades), 0)

              return (
                <section
                  key={stage.key}
                  className={`ak-column ${dropStage === stage.key ? 'is-drop-target' : ''}`}
                  style={{ '--column-color': stage.borderColor, '--column-badge': stage.badgeColor } as CSSProperties}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (draggedPedidoId !== null) {
                      setDropStage(stage.key)
                    }
                  }}
                  onDragLeave={() => setDropStage((current) => (current === stage.key ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault()
                    const pedidoId = Number.parseInt(event.dataTransfer.getData('text/plain'), 10)
                    setDropStage(null)
                    setDraggedPedidoId(null)

                    if (!Number.isNaN(pedidoId)) {
                      void movePedidoToStage(pedidoId, stage.key)
                    }
                  }}
                >
                  <div className="ak-column-head">
                    <div className="ak-column-title-wrap">
                      <span className="ak-column-icon">{renderStageIcon(stage.key)}</span>
                      <div>
                        <span className="ak-column-title">{stage.label}</span>
                        <span className="ak-column-subtitle">{stage.description}</span>
                      </div>
                    </div>
                    <div className="ak-column-numbers">
                      <span className="ak-column-count">{formatPedidosLabel(columnPedidos.length)}</span>
                      <small>{formatNumber(columnPecas)} peças</small>
                    </div>
                  </div>

                  <div className="ak-column-body">
                    {loading ? (
                      <div className="ak-empty-state">Carregando pedidos...</div>
                    ) : columnPedidos.length === 0 ? (
                      <div className="ak-empty-state">
                        <span className="ak-empty-icon">{renderStageIcon(stage.key)}</span>
                        <strong>{hasFilters ? 'Sem resultado nesta etapa' : `Sem pedidos em ${stage.label}`}</strong>
                        <span>{hasFilters ? 'Ajuste a busca ou os filtros.' : 'A fila esta livre por enquanto.'}</span>
                      </div>
                    ) : (
                      columnPedidos.map(renderCard)
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </main>

      {selectedPedido ? (
        <div className="ak-drawer-backdrop" onClick={() => setSelectedPedidoId(null)}>
          <aside className="ak-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ak-drawer-head">
              <div>
                <span className="ak-drawer-code">{selectedPedido.fichaTecnica?.codigoDisplay || `SERI-${selectedPedido.id}`}</span>
                <h2>{selectedPedido.fichaTecnica?.identificacao || 'Pedido em produção'}</h2>
              </div>
              <button type="button" className="ak-drawer-close" onClick={() => setSelectedPedidoId(null)}>
                Fechar
              </button>
            </div>

            <div className="ak-drawer-section">
              <h3>Cliente</h3>
              <p>{selectedPedido.clienteNome || 'Cliente não informado'}</p>
              <span>{selectedPedido.clienteEmail || 'Sem e-mail cadastrado'}</span>
            </div>

            <div className="ak-drawer-grid">
              <div className="ak-drawer-section">
                <h3>Produto</h3>
                <p>{selectedPedido.fichaTecnica?.produtoTipo || 'Produto'}</p>
              </div>
              <div className="ak-drawer-section">
                <h3>Peças</h3>
                <p>{getTotalPecas(selectedPedido.quantidades)}</p>
              </div>
              <div className="ak-drawer-section">
                <h3>Cor</h3>
                <p>{parseEspecificacoes(selectedPedido.fichaTecnica?.especificacoes).cor}</p>
              </div>
              <div className="ak-drawer-section">
                <h3>Abertura</h3>
                <p>{formatDate(selectedPedido.dataAbertura)}</p>
              </div>
            </div>

            <div className="ak-drawer-section">
              <h3>Mover para</h3>
              <div className="ak-drawer-stages">
                {STAGES.map((stage) => (
                  <button
                    key={stage.key}
                    type="button"
                    className={`ak-stage-chip ${normalizeEtapa(selectedPedido.etapaProducao) === stage.key ? 'is-active' : ''}`}
                    onClick={() => void movePedidoToStage(selectedPedido.id, stage.key)}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ak-drawer-section">
              <h3>Observações</h3>
              <p>{selectedPedido.observacoes || 'Sem observações.'}</p>
            </div>
          </aside>
        </div>
      ) : null}

      {activeSummaryCard && !selectedPedido ? (
        <div className="ak-drawer-backdrop" onClick={() => setActiveSummary(null)}>
          <aside className="ak-drawer ak-summary-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ak-drawer-head">
              <div>
                <span className="ak-drawer-code">Resumo do fluxo</span>
                <h2>{activeSummaryCard.label}</h2>
                <p className="ak-summary-drawer-subtitle">
                  {formatPedidosLabel(activeSummaryCard.pedidos.length)}
                </p>
              </div>
              <button type="button" className="ak-drawer-close" onClick={() => setActiveSummary(null)}>
                Fechar
              </button>
            </div>

            <div className="ak-summary-list">
              {activeSummaryCard.pedidos.length === 0 ? (
                <div className="ak-summary-empty">Nenhum pedido nesse grupo.</div>
              ) : (
                activeSummaryCard.pedidos.map((pedido) => {
                  const specs = parseEspecificacoes(pedido.fichaTecnica?.especificacoes)
                  const etapa = getStageConfig(normalizeEtapa(pedido.etapaProducao))
                  return (
                    <button
                      key={pedido.id}
                      type="button"
                      className="ak-summary-item"
                      onClick={() => {
                        setActiveSummary(null)
                        setSelectedPedidoId(pedido.id)
                      }}
                    >
                      <span className="ak-summary-code">
                        {pedido.fichaTecnica?.codigoDisplay || `SERI-${pedido.id}`}
                      </span>
                      <strong>{pedido.fichaTecnica?.identificacao || 'Pedido em produção'}</strong>
                      <small>
                        {pedido.clienteNome || 'Cliente Seri.'} · {etapa.label} · {formatNumber(getTotalPecas(pedido.quantidades))} peças · {specs.cor}
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
