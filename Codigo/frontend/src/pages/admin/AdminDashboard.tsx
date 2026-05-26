import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminDashboard.css'

type Periodo = 7 | 30 | 90 | 365

type PedidosPorDiaItem = {
  label: string
  data: string
  quantidade: number
}

type DistribuicaoItem = {
  label: string
  quantidade: number
}

type DashboardOverviewResponse = {
  pedidosDoPeriodo: number
  pedidosPorDia: PedidosPorDiaItem[]
  pedidosPorStatus: DistribuicaoItem[]
}

type FluxoMes = {
  mes: string
  receita: number
  custo: number
  lucro: number
}

type ClienteReceita = {
  nome: string
  iniciais: string
  totalPedidos: number
  receita: number
}

type FinanceiroDashboardResponse = {
  receitaBruta: number
  margemLiquida: number
  ticketMedio: number
  receitaDeltaPct: number
  margemDeltaPp: number
  fluxoCaixa: FluxoMes[]
  topClientes: ClienteReceita[]
}

type AdminPedidoLite = {
  id: number
  quantidades?: string | null
  fichaTecnica?: {
    produtoTipo?: string | null
  } | null
}

type WeeklyVolume = {
  label: string
  quantidade: number
}

type ProdutoVolume = {
  label: string
  quantidade: number
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
  { label: 'Dashboard', active: true, route: ROUTES.ADMIN_DASHBOARD },
  { label: 'Fichas técnicas', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos', route: ROUTES.ADMIN_PEDIDOS },
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

const PERIODOS: { value: Periodo; label: string; financeiro: string }[] = [
  { value: 7, label: '7 dias', financeiro: '7d' },
  { value: 30, label: '30 dias', financeiro: '30d' },
  { value: 90, label: '90 dias', financeiro: '90d' },
  { value: 365, label: '12 meses', financeiro: '12m' },
]

const STATUS_COLORS: Record<string, string> = {
  'Em produção': '#7c3aed',
  'Aguardando análise': '#f59e0b',
  'Orçamento enviado': '#2563eb',
  'Pronto para retirada': '#10b981',
  Entregue: '#7ec89a',
  Cancelado: '#f87171',
}

const FALLBACK_COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#2563eb', '#7ec89a', '#f87171']
const REVENUE_COLORS = {
  receita: '#2f855a',
  custo: '#e7a0ad',
  lucro: '#89b8ef',
}
const PRODUCT_COLORS = ['#2f855a', '#8b5cf6', '#3b82f6', '#f59e0b', '#06b6d4']

function getInitials(name?: string | null) {
  if (!name) return 'GS'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPct(value: number, decimals = 1) {
  return `${value.toFixed(decimals).replace('.', ',')}%`
}

function financePeriod(periodo: Periodo) {
  return PERIODOS.find((item) => item.value === periodo)?.financeiro ?? '30d'
}

function metricTrend(value: number, suffix = '%') {
  if (Math.abs(value) < 0.05) return 'estável'
  const sign = value > 0 ? '↑ +' : '↓ -'
  return `${sign}${Math.abs(value).toFixed(1).replace('.', ',')}${suffix} vs anterior`
}

function marginFromMonth(month: FluxoMes) {
  return month.receita > 0 ? (month.lucro / month.receita) * 100 : 0
}

function getTotalPecas(quantidades?: string | null) {
  if (!quantidades) return 0
  return quantidades
    .split(',')
    .reduce((total, item) => total + (Number(item.split(':')[1]) || 0), 0)
}

function buildWeeklyVolumes(days: PedidosPorDiaItem[]) {
  if (days.length === 0) return [] as WeeklyVolume[]
  const grouped: WeeklyVolume[] = []
  for (let index = Math.max(0, days.length - 35); index < days.length; index += 7) {
    const slice = days.slice(index, index + 7)
    grouped.push({
      label: `S${grouped.length + 1}`,
      quantidade: slice.reduce((total, day) => total + day.quantidade, 0),
    })
  }
  return grouped.slice(-5)
}

function buildProductVolumes(pedidos: AdminPedidoLite[]) {
  const totals = new Map<string, number>()
  pedidos.forEach((pedido) => {
    const tipo = pedido.fichaTecnica?.produtoTipo?.trim() || 'Produto'
    totals.set(tipo, (totals.get(tipo) ?? 0) + getTotalPecas(pedido.quantidades))
  })

  return [...totals.entries()]
    .map(([label, quantidade]) => ({ label, quantidade }))
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)
}

function statusColor(label: string, index: number) {
  return STATUS_COLORS[label] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function useMeasuredWidth(minimum: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(minimum)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = (nextWidth: number) => {
      setWidth(Math.max(minimum, Math.floor(nextWidth)))
    }

    update(element.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) update(entry.contentRect.width)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [minimum])

  return { ref, width }
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
  return null
}

function RevenueChart({ data, width }: { data: FluxoMes[]; width: number }) {
  const W = width
  const H = 214
  const pL = 56
  const pR = 12
  const pT = 12
  const pB = 30
  const cW = W - pL - pR
  const cH = H - pT - pB
  const max = Math.max(...data.map((item) => Math.max(item.receita, item.custo, item.lucro)), 1) * 1.12
  const slots = data.length || 1
  const slotW = cW / slots
  const barW = Math.min(22, Math.max(8, slotW * 0.18))
  const ticks = [0.25, 0.5, 0.75, 1]

  return (
    <svg className="ad-fill-chart" viewBox={`0 0 ${W} ${H}`} aria-label="Faturamento mensal">
      {ticks.map((tick) => {
        const value = max * tick
        const y = pT + cH * (1 - tick)
        return (
          <g key={tick}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} />
            <text x={pL - 8} y={y + 4} textAnchor="end">
              {value >= 1000 ? `R$${Math.round(value / 1000)}k` : `R$${Math.round(value)}`}
            </text>
          </g>
        )
      })}
      {data.map((item, index) => {
        const center = pL + slotW * index + slotW / 2
        const bars = [
          { key: 'receita' as const, color: REVENUE_COLORS.receita },
          { key: 'custo' as const, color: REVENUE_COLORS.custo },
          { key: 'lucro' as const, color: REVENUE_COLORS.lucro },
        ]
        return (
          <g key={item.mes}>
            {bars.map((bar, barIndex) => {
              const value = Math.max(0, item[bar.key])
              const height = (value / max) * cH
              return (
                <rect
                  key={bar.key}
                  x={center + (barIndex - 1) * (barW + 4) - barW / 2}
                  y={pT + cH - height}
                  width={barW}
                  height={height}
                  rx={3}
                  fill={bar.color}
                />
              )
            })}
            <text x={center} y={H - 8} textAnchor="middle">
              {item.mes}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function StatusDonut({ data }: { data: DistribuicaoItem[] }) {
  const total = data.reduce((sum, item) => sum + item.quantidade, 0)
  const radius = 50
  const stroke = 20
  const circumference = Math.PI * 2 * radius
  let used = 0

  return (
    <div className="ad-status-layout">
      <svg viewBox="0 0 170 170" className="ad-status-donut" aria-label="Pedidos por status">
        <circle cx="85" cy="85" r={radius} className="ad-status-track" />
        {data.map((item, index) => {
          const length = total > 0 ? (item.quantidade / total) * circumference : 0
          const circle = (
            <circle
              key={item.label}
              cx="85"
              cy="85"
              r={radius}
              stroke={statusColor(item.label, index)}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-used}
            />
          )
          used += length
          return circle
        })}
        <text x="85" y="81" textAnchor="middle" className="ad-status-total">
          {total}
        </text>
        <text x="85" y="99" textAnchor="middle" className="ad-status-total-label">
          pedidos
        </text>
      </svg>
      <div className="ad-status-legend">
        {total === 0 ? <div className="ad-panel-empty">Sem pedidos registrados.</div> : null}
        {data.slice(0, 5).map((item, index) => (
          <div key={item.label} className="ad-status-row">
            <span style={{ background: statusColor(item.label, index) }} />
            <small>{item.label}</small>
            <strong>{item.quantidade}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyChart({ data, width }: { data: WeeklyVolume[]; width: number }) {
  const W = width
  const H = 190
  const pL = 36
  const pR = 14
  const pT = 16
  const pB = 30
  const cW = W - pL - pR
  const cH = H - pT - pB
  const max = Math.max(...data.map((item) => item.quantidade), 1)
  const slotW = cW / Math.max(data.length, 1)
  const guides = [0.5, 1]

  return (
    <svg className="ad-fill-chart" viewBox={`0 0 ${W} ${H}`} aria-label="Pedidos por semana">
      {guides.map((guide) => {
        const y = pT + cH * (1 - guide)
        return (
          <g key={guide}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} />
            <text x={pL - 7} y={y + 4} textAnchor="end">
              {Math.round(max * guide)}
            </text>
          </g>
        )
      })}
      {data.map((item, index) => {
        const barW = Math.min(34, slotW * 0.42)
        const height = (item.quantidade / max) * cH
        const x = pL + slotW * index + (slotW - barW) / 2
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={pT + cH - height}
              width={barW}
              height={height}
              rx={4}
              fill={index === 2 ? '#89b8ef' : index % 2 ? '#48a86e' : '#58bc7d'}
            />
            <text x={x + barW / 2} y={pT + cH - height - 8} textAnchor="middle">
              {item.quantidade}
            </text>
            <text x={x + barW / 2} y={H - 8} textAnchor="middle">
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function MarginGauge({ value }: { value: number }) {
  const progress = Math.min(1, Math.max(0, value / 50))
  const angle = Math.PI * (1 - progress)
  const needleX = 130 + Math.cos(angle) * 62
  const needleY = 118 - Math.sin(angle) * 62

  return (
    <div className="ad-margin-panel">
      <svg viewBox="0 0 260 152" className="ad-margin-gauge" aria-label="Margem média">
        <path d="M48 118a82 82 0 0 1 164 0" className="ad-gauge-track" />
        <path d="M48 118a82 82 0 0 1 47-74" className="ad-gauge-danger" />
        <path d="M95 44a82 82 0 0 1 117 74" className="ad-gauge-rest" />
        <line x1="130" y1="118" x2={needleX} y2={needleY} className="ad-gauge-needle" />
        <circle cx="130" cy="118" r="7" className="ad-gauge-center" />
        <text x="48" y="130">0%</text>
        <text x="205" y="130">50%</text>
        <text x="183" y="50">50%</text>
      </svg>
      <strong>{formatPct(value)}</strong>
      <span>de margem média neste período</span>
      <div className="ad-margin-target">
        <i style={{ width: `${Math.min(100, Math.max(0, (value / 50) * 100))}%` }} />
      </div>
      <div className="ad-margin-meta">
        <span>Meta: 25%</span>
        <b className={value >= 25 ? 'is-good' : ''}>
          {value >= 25 ? 'Acima da meta' : 'Abaixo da meta'}
        </b>
      </div>
    </div>
  )
}

function MarginTrendChart({ data, width }: { data: FluxoMes[]; width: number }) {
  const W = width
  const H = 196
  const pL = 42
  const pR = 14
  const pT = 16
  const pB = 32
  const cW = W - pL - pR
  const cH = H - pT - pB
  const points = data.map((item, index) => ({
    x: pL + (index / Math.max(1, data.length - 1)) * cW,
    y: pT + (1 - Math.min(50, Math.max(0, marginFromMonth(item))) / 50) * cH,
    item,
  }))
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <svg className="ad-fill-chart" viewBox={`0 0 ${W} ${H}`} aria-label="Evolução da margem">
      {[15, 25, 35, 50].map((value) => {
        const y = pT + (1 - value / 50) * cH
        return (
          <g key={value}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} className={value === 25 ? 'is-target' : ''} />
            <text x={pL - 8} y={y + 4} textAnchor="end">
              {value}%
            </text>
          </g>
        )
      })}
      {points.length > 1 ? <polyline points={polyline} className="ad-margin-line" /> : null}
      {points.map((point) => (
        <g key={point.item.mes}>
          <circle cx={point.x} cy={point.y} r="4" className="ad-margin-dot" />
          <text x={point.x} y={H - 8} textAnchor="middle">
            {point.item.mes}
          </text>
        </g>
      ))}
      <text x={W - pR} y={pT + (1 - 25 / 50) * cH - 6} textAnchor="end" className="ad-target-label">
        meta 25%
      </text>
    </svg>
  )
}

function ProductBars({ data }: { data: ProdutoVolume[] }) {
  const max = Math.max(...data.map((item) => item.quantidade), 1)
  if (data.length === 0) return <div className="ad-panel-empty">Nenhuma peça produzida ainda.</div>

  return (
    <div className="ad-product-list">
      {data.map((item, index) => (
        <div key={item.label} className="ad-product-row">
          <div>
            <strong>{item.label}</strong>
            <span>{formatNumber(item.quantidade)} un.</span>
          </div>
          <i>
            <b
              style={{
                width: `${(item.quantidade / max) * 100}%`,
                background: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
              }}
            />
          </i>
        </div>
      ))}
    </div>
  )
}

function TopClients({ data }: { data: ClienteReceita[] }) {
  if (data.length === 0) return <div className="ad-panel-empty">Sem faturamento por cliente no período.</div>
  return (
    <div className="ad-client-list">
      {data.slice(0, 5).map((cliente, index) => (
        <div key={cliente.nome} className="ad-client-row">
          <span>{index + 1}</span>
          <i>{cliente.iniciais}</i>
          <div>
            <strong>{cliente.nome}</strong>
            <small>{cliente.totalPedidos} {cliente.totalPedidos === 1 ? 'pedido' : 'pedidos'}</small>
          </div>
          <b>{formatBRL(cliente.receita)}</b>
        </div>
      ))}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  className = '',
  aside,
  children,
}: {
  title: string
  subtitle: string
  className?: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={`ad-indicator-card ${className}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {aside}
      </header>
      <div className="ad-indicator-body">{children}</div>
    </section>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [periodo, setPeriodo] = useState<Periodo>(30)
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null)
  const [financeiro, setFinanceiro] = useState<FinanceiroDashboardResponse | null>(null)
  const [pedidos, setPedidos] = useState<AdminPedidoLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const revenueMeasure = useMeasuredWidth(520)
  const weeklyMeasure = useMeasuredWidth(260)
  const trendMeasure = useMeasuredWidth(360)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      apiRequest<DashboardOverviewResponse>(`/admin/dashboard/overview?dias=${periodo}`),
      apiRequest<FinanceiroDashboardResponse>(`/admin/financeiro/dashboard?periodo=${financePeriod(periodo)}`),
    ])
      .then(([overviewData, financeiroData]) => {
        if (cancelled) return
        setOverview(overviewData)
        setFinanceiro(financeiroData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Não foi possível carregar o dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [periodo])

  useEffect(() => {
    let cancelled = false
    apiRequest<AdminPedidoLite[]>('/admin/pedidos')
      .then((data) => {
        if (!cancelled) setPedidos(data)
      })
      .catch(() => {
        if (!cancelled) setPedidos([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const weeklyVolumes = useMemo(() => buildWeeklyVolumes(overview?.pedidosPorDia ?? []), [overview])
  const productVolumes = useMemo(() => buildProductVolumes(pedidos), [pedidos])
  const flow = financeiro?.fluxoCaixa ?? []
  const margin = financeiro?.margemLiquida ?? 0

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
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
              if (item.section === 'title') return <div key={item.label} className="ak-menu-section">{item.label}</div>
              const className = `ak-menu-item ${item.active ? 'is-active' : ''}`
              return item.route ? (
                <Link key={item.label} to={item.route} className={className}>
                  <span className="ak-menu-icon">{renderSidebarIcon(item.label)}</span>
                  <span className="ak-menu-label">{item.label}</span>
                  {item.badge ? <span className="ak-menu-badge">{item.badge}</span> : null}
                </Link>
              ) : null
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

      <main className="ak-main ad-dashboard-main">
        <header className="ad-dashboard-top">
          <div>
            <h1>Dashboard de indicadores</h1>
            <p>Visão geral do estúdio em tempo real</p>
          </div>
          <div className="ad-period-tabs" aria-label="Período do dashboard">
            {PERIODOS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`ad-ptab ${periodo === item.value ? 'is-active' : ''}`}
                onClick={() => setPeriodo(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        <section className="ad-indicator-kpis" aria-label="Indicadores principais">
          <article>
            <span>Faturamento do período</span>
            <strong>{loading && !financeiro ? '—' : formatBRL(financeiro?.receitaBruta ?? 0)}</strong>
            <small className="is-up">{metricTrend(financeiro?.receitaDeltaPct ?? 0)}</small>
          </article>
          <article>
            <span>Pedidos no período</span>
            <strong>{loading && !overview ? '—' : formatNumber(overview?.pedidosDoPeriodo ?? 0)}</strong>
            <small className="is-up">últimos {periodo === 365 ? '12 meses' : `${periodo} dias`}</small>
          </article>
          <article>
            <span>Margem média</span>
            <strong>{loading && !financeiro ? '—' : formatPct(margin)}</strong>
            <small className={margin >= 25 ? 'is-up' : 'is-neutral'}>{metricTrend(financeiro?.margemDeltaPp ?? 0, 'pp')}</small>
          </article>
          <article>
            <span>Ticket médio</span>
            <strong>{loading && !financeiro ? '—' : formatBRL(financeiro?.ticketMedio ?? 0)}</strong>
            <small className="is-neutral">estável</small>
          </article>
        </section>

        <div className="ad-indicator-grid ad-indicator-grid-top">
          <Panel
            title="Faturamento mensal"
            subtitle="Receita e custo — últimos 8 meses"
            className="ad-revenue-card"
            aside={(
              <div className="ad-revenue-legend">
                <span><i style={{ background: REVENUE_COLORS.receita }} />Receita</span>
                <span><i style={{ background: REVENUE_COLORS.custo }} />Custo</span>
                <span><i style={{ background: REVENUE_COLORS.lucro }} />Lucro</span>
              </div>
            )}
          >
            <div className="ad-chart-surface ad-revenue-surface" ref={revenueMeasure.ref}>
              <RevenueChart data={flow} width={revenueMeasure.width} />
            </div>
          </Panel>

          <Panel title="Pedidos por status" subtitle="Distribuição atual" className="ad-status-card">
            <StatusDonut data={overview?.pedidosPorStatus ?? []} />
          </Panel>
        </div>

        <div className="ad-indicator-grid ad-indicator-grid-middle">
          <Panel title="Pedidos por semana" subtitle="Volume semanal">
            <div className="ad-chart-surface" ref={weeklyMeasure.ref}>
              <WeeklyChart data={weeklyVolumes} width={weeklyMeasure.width} />
            </div>
          </Panel>

          <Panel title="Margem média" subtitle="Rentabilidade do período">
            <MarginGauge value={margin} />
          </Panel>

          <Panel title="Top clientes" subtitle="Por faturamento no período">
            <TopClients data={financeiro?.topClientes ?? []} />
          </Panel>
        </div>

        <div className="ad-indicator-grid ad-indicator-grid-bottom">
          <Panel
            title="Evolução da margem"
            subtitle="Margem % mês a mês"
            aside={<span className="ad-window-pill">últimos 8 meses</span>}
          >
            <div className="ad-chart-surface" ref={trendMeasure.ref}>
              <MarginTrendChart data={flow} width={trendMeasure.width} />
            </div>
          </Panel>
          <Panel title="Peças mais produzidas" subtitle="Volume por tipo de produto">
            <ProductBars data={productVolumes} />
          </Panel>
        </div>
      </main>
    </div>
  )
}
