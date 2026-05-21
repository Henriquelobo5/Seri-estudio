import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminDashboard.css'

type Periodo = 7 | 30 | 90

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
  pedidosEmProducao: number
  insumosEmAlerta: number
  movimentacoesDoMes: number
  pedidosPorDia: PedidosPorDiaItem[]
  pedidosPorStatus: DistribuicaoItem[]
  movimentacoesPorTipo: DistribuicaoItem[]
  insumosPorCategoria: DistribuicaoItem[]
}

type AtividadeRecenteResponse = {
  tipo:
    | 'PEDIDO_CRIADO'
    | 'FICHA_CRIADA'
    | 'MOV_ENTRADA'
    | 'MOV_SAIDA'
    | 'MOV_AJUSTE'
  descricao: string
  dataHora: string
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
]

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

const STATUS_PEDIDO_COLORS: Record<string, string> = {
  'Aguardando análise': '#94a3b8',
  'Orçamento enviado': '#93C5FD',
  'Em produção': '#7EC89A',
  'Pronto para retirada': '#fcd34d',
  Entregue: '#7C3AED',
  Cancelado: '#fca5a5',
}

const FALLBACK_DONUT_COLORS = ['#7EC89A', '#93C5FD', '#fcd34d', '#c4b5fd', '#fca5a5', '#7C3AED']

const TIPO_MOV_COLORS: Record<string, string> = {
  Entrada: '#7EC89A',
  'Saída': '#e36a6a',
  Ajuste: '#d4a64a',
}

const CATEGORIA_COLORS = ['#7EC89A', '#93C5FD', '#fcd34d', '#c4b5fd', '#fca5a5']

function getInitials(name?: string | null) {
  if (!name) return 'ST'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function tempoRelativo(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const agora = Date.now()
  const diffMs = agora - d.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const inicioEvento = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDias = Math.round((inicioHoje.getTime() - inicioEvento.getTime()) / 86400000)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (diffDias === 1) return `Ontem ${hh}h${mm}`
  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mo} ${hh}h`
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

type TooltipState = { x: number; y: number; text: string } | null

function LineChart({
  data,
  onTooltip,
}: {
  data: PedidosPorDiaItem[]
  onTooltip: (tip: TooltipState) => void
}) {
  const W = 520
  const H = 220
  const pL = 36
  const pR = 12
  const pT = 16
  const pB = 28
  const cW = W - pL - pR
  const cH = H - pT - pB
  const maxVal = Math.max(...data.map((d) => d.quantidade), 1) * 1.2

  if (data.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          fontSize={12}
          fill="rgba(244,245,241,.3)"
          fontFamily="DM Sans"
        >
          Sem dados no período
        </text>
      </svg>
    )
  }

  const denom = Math.max(1, data.length - 1)
  const pts = data.map((d, i) => [
    pL + (i / denom) * cW,
    pT + (1 - d.quantidade / maxVal) * cH,
  ])

  const gridVals = [0, Math.round(maxVal * 0.5), Math.round(maxVal)]
  const polylinePoints = pts.map((p) => p.join(',')).join(' ')
  const areaPath =
    data.length >= 2
      ? `M ${pts[0][0]} ${pT + cH} ${pts.map((p) => `L ${p[0]} ${p[1]}`).join(' ')} L ${pts[pts.length - 1][0]} ${pT + cH} Z`
      : ''

  const labelStep = Math.max(1, Math.ceil(data.length / 8))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="adLineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7EC89A" stopOpacity={0.38} />
          <stop offset="100%" stopColor="#7EC89A" stopOpacity={0} />
        </linearGradient>
      </defs>

      {gridVals.map((v) => {
        const y = pT + (1 - v / maxVal) * cH
        return (
          <g key={v}>
            <line
              x1={pL}
              y1={y}
              x2={W - pR}
              y2={y}
              stroke="rgba(255,255,255,.06)"
              strokeWidth={1}
            />
            <text
              x={pL - 5}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="rgba(244,245,241,.28)"
              fontFamily="DM Sans"
            >
              {v}
            </text>
          </g>
        )
      })}

      {areaPath ? <path d={areaPath} fill="url(#adLineGrad)" /> : null}

      {data.length >= 2 ? (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#7EC89A"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}

      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={4}
          fill="#0f130f"
          stroke="#7EC89A"
          strokeWidth={2}
          onMouseEnter={(e) => {
            const wrap = (e.currentTarget.closest('.ad-chart-wrap') as HTMLElement | null)
            if (!wrap) return
            const rect = wrap.getBoundingClientRect()
            onTooltip({
              x: e.clientX - rect.left + 12,
              y: e.clientY - rect.top - 34,
              text: `${data[i].label}: ${data[i].quantidade} ${data[i].quantidade === 1 ? 'pedido' : 'pedidos'}`,
            })
          }}
          onMouseLeave={() => onTooltip(null)}
          style={{ cursor: 'default' }}
        />
      ))}

      {data.map((d, i) => {
        if (i % labelStep !== 0 && i !== data.length - 1) return null
        const x = pL + (i / denom) * cW
        return (
          <text
            key={i}
            x={x}
            y={pT + cH + 16}
            textAnchor="middle"
            fontSize={9}
            fill="rgba(244,245,241,.32)"
            fontFamily="DM Sans"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

function DonutChart({
  data,
  colorFor,
  emptyLabel,
}: {
  data: DistribuicaoItem[]
  colorFor: (label: string, index: number) => string
  emptyLabel: string
}) {
  const cx = 75
  const cy = 80
  const R = 60
  const r = 38
  const total = data.reduce((s, d) => s + d.quantidade, 0)

  if (total === 0) {
    return (
      <svg viewBox="0 0 320 170" style={{ width: '100%', height: '100%' }}>
        <text
          x={160}
          y={85}
          textAnchor="middle"
          fontSize={12}
          fill="rgba(244,245,241,.3)"
          fontFamily="DM Sans"
        >
          {emptyLabel}
        </text>
      </svg>
    )
  }

  let angle = -Math.PI / 2
  const segments = data.map((d, i) => {
    const sw = (d.quantidade / total) * Math.PI * 2
    const color = colorFor(d.label, i)
    let path: string
    if (data.length === 1) {
      path = `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.001} ${cy - R} M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx - 0.001} ${cy - r} Z`
    } else {
      const x1 = cx + R * Math.cos(angle)
      const y1 = cy + R * Math.sin(angle)
      const x2 = cx + R * Math.cos(angle + sw)
      const y2 = cy + R * Math.sin(angle + sw)
      const x3 = cx + r * Math.cos(angle + sw)
      const y3 = cy + r * Math.sin(angle + sw)
      const x4 = cx + r * Math.cos(angle)
      const y4 = cy + r * Math.sin(angle)
      const lg = sw > Math.PI ? 1 : 0
      path = `M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${lg} 0 ${x4} ${y4} Z`
    }
    angle += sw
    return { path, color, ...d }
  })

  return (
    <svg viewBox="0 0 320 170" style={{ width: '100%', height: '100%' }}>
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.path}
          fill={seg.color}
          opacity={0.88}
          stroke="#0f130f"
          strokeWidth={2}
        />
      ))}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize={20}
        fontFamily="DM Serif Display, Georgia, serif"
        fill="#f4f5f1"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize={9}
        fill="rgba(244,245,241,.42)"
        fontFamily="DM Sans"
      >
        total
      </text>

      {data.map((d, i) => {
        const lx = 168
        const ly = 22 + i * 22
        return (
          <g key={i}>
            <rect x={lx} y={ly} width={10} height={10} rx={3} fill={colorFor(d.label, i)} />
            <text
              x={lx + 16}
              y={ly + 9}
              fontSize={11}
              fill="rgba(244,245,241,.7)"
              fontFamily="DM Sans"
            >
              {d.label}
            </text>
            <text
              x={310}
              y={ly + 9}
              textAnchor="end"
              fontSize={11}
              fontWeight={500}
              fill="#f4f5f1"
              fontFamily="DM Mono, monospace"
            >
              {d.quantidade}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function HBarChart({ data }: { data: DistribuicaoItem[] }) {
  if (data.length === 0) {
    return <div className="ad-empty-soft">Nenhum insumo cadastrado.</div>
  }
  const max = Math.max(...data.map((d) => d.quantidade), 1)
  return (
    <div className="ad-hbar-list">
      {data.map((d, i) => {
        const pct = (d.quantidade / max) * 100
        return (
          <div key={d.label} className="ad-hbar-item">
            <span className="ad-hbar-label">{d.label}</span>
            <div className="ad-hbar-track">
              <div
                className="ad-hbar-fill"
                style={{
                  width: `${pct}%`,
                  background: CATEGORIA_COLORS[i % CATEGORIA_COLORS.length],
                }}
              />
            </div>
            <span className="ad-hbar-val">{d.quantidade}</span>
          </div>
        )
      })}
    </div>
  )
}

function corPedidoStatus(label: string, index: number) {
  return STATUS_PEDIDO_COLORS[label] ?? FALLBACK_DONUT_COLORS[index % FALLBACK_DONUT_COLORS.length]
}

function corMovimentacaoTipo(label: string, index: number) {
  return TIPO_MOV_COLORS[label] ?? FALLBACK_DONUT_COLORS[index % FALLBACK_DONUT_COLORS.length]
}

function corAtividade(tipo: AtividadeRecenteResponse['tipo']) {
  if (tipo === 'MOV_ENTRADA') return 'var(--ak-brand-lime)'
  if (tipo === 'MOV_SAIDA') return '#e36a6a'
  if (tipo === 'MOV_AJUSTE') return '#d4a64a'
  return '#8b8b8b'
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [periodo, setPeriodo] = useState<Periodo>(30)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingAtividade, setLoadingAtividade] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null)
  const [atividades, setAtividades] = useState<AtividadeRecenteResponse[]>([])
  const [lineTip, setLineTip] = useState<TooltipState>(null)

  useEffect(() => {
    let cancelado = false
    setLoadingOverview(true)
    setError('')
    apiRequest<DashboardOverviewResponse>(`/admin/dashboard/overview?dias=${periodo}`)
      .then((data) => {
        if (!cancelado) setOverview(data)
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar o dashboard.')
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingOverview(false)
      })
    return () => {
      cancelado = true
    }
  }, [periodo])

  useEffect(() => {
    let cancelado = false
    setLoadingAtividade(true)
    apiRequest<AtividadeRecenteResponse[]>('/admin/dashboard/atividade-recente?limit=10')
      .then((data) => {
        if (!cancelado) setAtividades(data)
      })
      .catch(() => {
        if (!cancelado) setAtividades([])
      })
      .finally(() => {
        if (!cancelado) setLoadingAtividade(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const kpis = [
    {
      label: 'Pedidos do período',
      value: overview?.pedidosDoPeriodo ?? 0,
      helper: `últimos ${periodo} dias`,
    },
    {
      label: 'Em produção',
      value: overview?.pedidosEmProducao ?? 0,
      helper: 'pedidos ativos no fluxo',
    },
    {
      label: 'Insumos em alerta',
      value: overview?.insumosEmAlerta ?? 0,
      helper: 'crítico ou sem estoque',
      className: (overview?.insumosEmAlerta ?? 0) > 0 ? 'ak-metric-card-red' : '',
    },
    {
      label: 'Movimentações do mês',
      value: overview?.movimentacoesDoMes ?? 0,
      helper: 'entradas, saídas e ajustes',
    },
  ]

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
            <h1>Visão <em>geral.</em></h1>
            <p>Dashboard do estúdio em tempo real.</p>
          </div>

          <div className="ad-period-tabs">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`ad-ptab ${periodo === p.value ? 'is-active' : ''}`}
                onClick={() => setPeriodo(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        <section className="ak-overview" aria-label="Indicadores do estúdio">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`ak-metric-card ${kpi.className ?? ''}`}
            >
              <span>{kpi.label}</span>
              <strong>
                {loadingOverview && !overview ? '—' : formatNumber(kpi.value)}
              </strong>
              <small>{kpi.helper}</small>
            </div>
          ))}
        </section>

        <section className="ad-charts">
          <div className="ad-card">
            <div className="ad-card-head">
              <div>
                <div className="ad-card-title">Pedidos por dia</div>
                <div className="ad-card-sub">Últimos {periodo} dias</div>
              </div>
            </div>
            <div className="ad-card-body">
              <div className="ad-chart-wrap">
                {loadingOverview && !overview ? (
                  <div className="ad-empty-soft">Carregando...</div>
                ) : (
                  <LineChart data={overview?.pedidosPorDia ?? []} onTooltip={setLineTip} />
                )}
                {lineTip ? (
                  <div className="ad-chart-tip" style={{ left: lineTip.x, top: lineTip.y }}>
                    {lineTip.text}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-head">
              <div>
                <div className="ad-card-title">Pedidos por status</div>
                <div className="ad-card-sub">Distribuição atual</div>
              </div>
            </div>
            <div className="ad-card-body">
              <div className="ad-chart-wrap">
                {loadingOverview && !overview ? (
                  <div className="ad-empty-soft">Carregando...</div>
                ) : (
                  <DonutChart
                    data={overview?.pedidosPorStatus ?? []}
                    colorFor={corPedidoStatus}
                    emptyLabel="Sem pedidos registrados"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-head">
              <div>
                <div className="ad-card-title">Movimentações por tipo</div>
                <div className="ad-card-sub">Distribuição total</div>
              </div>
            </div>
            <div className="ad-card-body">
              <div className="ad-chart-wrap">
                {loadingOverview && !overview ? (
                  <div className="ad-empty-soft">Carregando...</div>
                ) : (
                  <DonutChart
                    data={overview?.movimentacoesPorTipo ?? []}
                    colorFor={corMovimentacaoTipo}
                    emptyLabel="Sem movimentações registradas"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-head">
              <div>
                <div className="ad-card-title">Insumos por categoria</div>
                <div className="ad-card-sub">Distribuição total</div>
              </div>
            </div>
            <div className="ad-card-body">
              {loadingOverview && !overview ? (
                <div className="ad-empty-soft">Carregando...</div>
              ) : (
                <HBarChart data={overview?.insumosPorCategoria ?? []} />
              )}
            </div>
          </div>
        </section>

        <section className="ad-activity-shell">
          <div className="ad-activity-head">
            <div className="ad-activity-head-title">Atividade recente</div>
            <div className="ad-activity-head-sub">Últimos eventos do sistema</div>
          </div>
          <div className="ad-activity-body">
            {loadingAtividade ? (
              <div className="ad-empty-soft">Carregando...</div>
            ) : atividades.length === 0 ? (
              <div className="ad-empty-soft">Nenhum evento nas últimas 72h.</div>
            ) : (
              atividades.map((a, i) => (
                <div key={`${a.tipo}-${a.dataHora}-${i}`} className="ad-activity-item">
                  <span
                    className="ad-activity-dot"
                    style={{ background: corAtividade(a.tipo) }}
                  />
                  <span className="ad-activity-text">{a.descricao}</span>
                  <span className="ad-activity-time">{tempoRelativo(a.dataHora)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
