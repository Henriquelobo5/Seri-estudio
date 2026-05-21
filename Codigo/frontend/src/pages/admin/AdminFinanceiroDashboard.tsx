import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminFinanceiroDashboard.css'

// ─── Types ────────────────────────────────────────────────────────────────────

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

type MargemTipo = {
  tipo: string
  margemPct: number
}

type ProjecaoMes = {
  meta: number
  realizado: number
  pctMeta: number
  diasRestantes: number
  alcancavel: boolean
  faltaMeta: number
}

type AlertaFinanceiro = {
  tipo: 'ok' | 'warn'
  titulo: string
  descricao: string
}

type CategoriaCusto = {
  categoria: string
  valor: number
  pct: number
}

type DashboardData = {
  receitaBruta: number
  custoTotal: number
  lucroLiquido: number
  margemLiquida: number
  ticketMedio: number
  receitaDeltaPct: number
  custoDeltaPct: number
  lucroDeltaPct: number
  margemDeltaPp: number
  fluxoCaixa: FluxoMes[]
  topClientes: ClienteReceita[]
  margemPorTipo: MargemTipo[]
  projecao: ProjecaoMes
  alertas: AlertaFinanceiro[]
  breakdownCustos: CategoriaCusto[]
}

type Periodo = '7d' | '30d' | '90d' | '12m'

type TooltipState = { x: number; y: number; text: string } | null

// ─── Sidebar ─────────────────────────────────────────────────────────────────

type SidebarItem = { label: string; section?: string; badge?: string; active?: boolean; route?: string }

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'PRINCIPAL', section: 'title' },
  { label: 'Dashboard' },
  { label: 'Fichas técnicas', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos', route: ROUTES.ADMIN_PEDIDOS },
  { label: 'Clientes', route: ROUTES.ADMIN_CLIENTES },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Fluxo de produção', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro', active: true, route: ROUTES.ADMIN_FINANCEIRO_DASHBOARD },
]

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function formatBRLFull(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatPct(value: number, decimals = 1) {
  return `${value.toFixed(decimals).replace('.', ',')}%`
}

function getInitials(name?: string | null) {
  if (!name) return 'GS'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function deltaClass(value: number) {
  if (value > 0.5) return 'is-up'
  if (value < -0.5) return 'is-down'
  return 'is-flat'
}

function deltaLabel(value: number, suffix = '%') {
  const sign = value > 0 ? '↑ +' : value < 0 ? '↓ ' : '→ '
  return `${sign}${Math.abs(value).toFixed(1).replace('.', ',')}${suffix} vs anterior`
}

const CLIENT_COLORS = [
  { bg: '#EDE9FE', text: '#7C3AED' },
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#D1FAE5', text: '#059669' },
  { bg: '#FEE2E2', text: '#DC2626' },
]

const BAR_COLORS = ['#7EC89A', '#c4b5fd', '#fcd34d', '#6ee7b7', '#93C5FD', '#f9a8d4']
const DONUT_COLORS = ['#2A5E40', '#7C3AED', '#2563EB', '#D97706']

// ─── SVG Charts ──────────────────────────────────────────────────────────────

function CashflowChart({ data, onTooltip }: {
  data: FluxoMes[]
  onTooltip: (tip: TooltipState) => void
}) {
  const W = 500, H = 170, pL = 40, pR = 8, pT = 10, pB = 26
  const cW = W - pL - pR, cH = H - pT - pB
  const maxVal = Math.max(...data.map(d => Math.max(d.receita, d.custo, Math.max(d.lucro, 0))), 1) * 1.15
  const n = data.length || 1
  const bW = (cW / n) * 0.2
  const slotW = cW / n

  const gridTicks = [0, 0.25, 0.5, 0.75, 1]
  const barDefs = [
    { key: 'receita' as const, color: '#4ade80', label: 'Receita' },
    { key: 'custo' as const, color: '#fca5a5', label: 'Custo' },
    { key: 'lucro' as const, color: '#93C5FD', label: 'Lucro' },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: `${H}px`, overflow: 'visible' }}>
      {gridTicks.map(t => {
        const y = pT + cH * (1 - t)
        const val = Math.round(maxVal * t)
        return (
          <g key={t}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth={1} />
            {t > 0 && (
              <text x={pL - 5} y={y + 4} textAnchor="end" fontSize={9} fill="rgba(244,245,241,.28)" fontFamily="DM Sans">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            )}
          </g>
        )
      })}

      {data.map((d, i) => {
        const slotX = pL + i * slotW
        const cx = slotX + (slotW - barDefs.length * (bW + 2)) / 2
        return (
          <g key={d.mes}>
            {barDefs.map((bar, j) => {
              const val = d[bar.key]
              const bH = Math.max(0, val / maxVal * cH)
              const x = cx + j * (bW + 2)
              const y = pT + cH - bH
              return (
                <rect
                  key={bar.key}
                  x={x} y={y}
                  width={bW} height={bH}
                  rx={3} fill={bar.color} opacity={0.82}
                  onMouseEnter={e => {
                    const rect = (e.currentTarget.closest('.afd-chart-wrap') as HTMLElement).getBoundingClientRect()
                    onTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 34, text: `${d.mes} · ${bar.label}: ${formatBRL(val)}` })
                  }}
                  onMouseLeave={() => onTooltip(null)}
                  style={{ cursor: 'default' }}
                />
              )
            })}
            <text
              x={slotX + slotW / 2}
              y={pT + cH + 15}
              textAnchor="middle" fontSize={9}
              fill="rgba(244,245,241,.32)" fontFamily="DM Sans"
            >
              {d.mes}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function EvolutionChart({ data, onTooltip }: {
  data: FluxoMes[]
  onTooltip: (tip: TooltipState) => void
}) {
  const W = 360, H = 140, pL = 36, pR = 8, pT = 10, pB = 22
  const cW = W - pL - pR, cH = H - pT - pB
  const maxVal = Math.max(...data.map(d => d.receita), 1) * 1.12

  if (data.length < 2) return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: `${H}px` }}>
      <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={12} fill="rgba(244,245,241,.3)" fontFamily="DM Sans">
        Dados insuficientes
      </text>
    </svg>
  )

  const pts = data.map((d, i) => [
    pL + (i / (data.length - 1)) * cW,
    pT + (1 - d.receita / maxVal) * cH,
  ])

  const gridVals = [0, Math.round(maxVal * 0.5), Math.round(maxVal)]
  const polylinePoints = pts.map(p => p.join(',')).join(' ')
  const areaPath = `M ${pts[0][0]} ${pT + cH} ${pts.map(p => `L ${p[0]} ${p[1]}`).join(' ')} L ${pts[pts.length - 1][0]} ${pT + cH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: `${H}px`, overflow: 'visible' }}>
      <defs>
        <linearGradient id="evAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A5E40" stopOpacity={0.38} />
          <stop offset="100%" stopColor="#2A5E40" stopOpacity={0} />
        </linearGradient>
      </defs>

      {gridVals.map(v => {
        const y = v > 0 ? pT + (1 - v / maxVal) * cH : pT + cH
        return (
          <g key={v}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth={1} />
            <text x={pL - 5} y={y + 4} textAnchor="end" fontSize={9} fill="rgba(244,245,241,.28)" fontFamily="DM Sans">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </text>
          </g>
        )
      })}

      <path d={areaPath} fill="url(#evAreaGrad)" />
      <polyline
        points={polylinePoints}
        fill="none" stroke="#7EC89A"
        strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
      />

      {pts.map(([x, y], i) => (
        <circle
          key={i} cx={x} cy={y} r={4}
          fill="#0f130f" stroke="#7EC89A" strokeWidth={2}
          onMouseEnter={e => {
            const rect = (e.currentTarget.closest('.afd-chart-wrap') as HTMLElement).getBoundingClientRect()
            onTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 34, text: `${data[i].mes}: ${formatBRL(data[i].receita)}` })
          }}
          onMouseLeave={() => onTooltip(null)}
          style={{ cursor: 'default' }}
        />
      ))}

      {data.map((d, i) => {
        const x = pL + (i / (data.length - 1)) * cW
        return (
          <text key={i} x={x} y={pT + cH + 14} textAnchor="middle" fontSize={9} fill="rgba(244,245,241,.32)" fontFamily="DM Sans">
            {d.mes}
          </text>
        )
      })}
    </svg>
  )
}

function DonutChart({ data }: { data: CategoriaCusto[] }) {
  const cx = 65, cy = 65, R = 52, r = 32
  const total = data.reduce((s, d) => s + d.pct, 0) || 1
  const totalVal = data.reduce((s, d) => s + d.valor, 0)

  let angle = -Math.PI / 2
  const segments = data.map((d, i) => {
    const sw = (d.pct / total) * Math.PI * 2
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle)
    const x2 = cx + R * Math.cos(angle + sw), y2 = cy + R * Math.sin(angle + sw)
    const x3 = cx + r * Math.cos(angle + sw), y3 = cy + r * Math.sin(angle + sw)
    const x4 = cx + r * Math.cos(angle), y4 = cy + r * Math.sin(angle)
    const lg = sw > Math.PI ? 1 : 0
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${lg} 0 ${x4} ${y4} Z`
    angle += sw
    return { path, color: DONUT_COLORS[i % DONUT_COLORS.length], ...d }
  })

  return (
    <svg viewBox="0 0 260 130" style={{ width: '100%', height: '130px' }}>
      {segments.map((seg, i) => (
        <path key={i} d={seg.path} fill={seg.color} opacity={0.85} stroke="#0f130f" strokeWidth={2} />
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={13} fontFamily="DM Serif Display, Georgia, serif" fill="#f4f5f1">
        {formatBRL(totalVal)}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize={9} fill="rgba(244,245,241,.4)" fontFamily="DM Sans">
        custo total
      </text>
      {data.map((d, i) => {
        const lx = 145, ly = 18 + i * 27
        return (
          <g key={i}>
            <rect x={lx} y={ly} width={10} height={10} rx={3} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            <text x={lx + 14} y={ly + 9} fontSize={11} fill="rgba(244,245,241,.68)" fontFamily="DM Sans">{d.categoria}</text>
            <text x={255} y={ly + 9} textAnchor="end" fontSize={11} fontWeight={500} fill="#f4f5f1" fontFamily="DM Mono, monospace">{d.pct}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Sidebar icons ────────────────────────────────────────────────────────────

function SidebarIcon({ label }: { label: string }) {
  if (label === 'Dashboard') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  )
  if (label === 'Fichas técnicas') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h7l5 5v11H8z" fill="none" /><path d="M15 4v5h5" fill="none" />
      <path d="M11 14h6M11 18h6M11 10h2" fill="none" />
    </svg>
  )
  if (label === 'Pedidos') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h15l-1.5 9h-11z" fill="none" />
      <circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
    </svg>
  )
  if (label === 'Clientes') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 14 0" fill="none" />
    </svg>
  )
  if (label === 'Fluxo de produção') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" />
      <path d="M9 9v6M15 9v3" fill="none" />
    </svg>
  )
  if (label === 'Estoque') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4l8 4-8 4-8-4 8-4z" fill="none" /><path d="M4 12l8 4 8-4" fill="none" />
    </svg>
  )
  if (label === 'Custos e lucro') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" />
    </svg>
  )
  if (label === 'Dashboard financeiro') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M6 12h12" fill="none" />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '12m', label: '12 meses' },
]

export default function AdminFinanceiroDashboard() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('30d')

  const [cfTip, setCfTip] = useState<TooltipState>(null)
  const [evTip, setEvTip] = useState<TooltipState>(null)

  const cfRef = useRef<HTMLDivElement>(null)
  const evRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }, [isAuthenticated, navigate])

  const fetchDashboard = useCallback((p: Periodo) => {
    setLoading(true)
    setError('')
    apiRequest<DashboardData>(`/admin/financeiro/dashboard?periodo=${p}`)
      .then(d => setData(d))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Não foi possível carregar o dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchDashboard(periodo)
  }, [fetchDashboard, periodo])

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  function handlePeriodo(p: Periodo) {
    if (p !== periodo) setPeriodo(p)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="ak-page">
      {/* Sidebar */}
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
            {SIDEBAR_ITEMS.map(item => {
              if (item.section === 'title') return <div key={item.label} className="ak-menu-section">{item.label}</div>
              const cls = `ak-menu-item ${item.active ? 'is-active' : ''}`
              if (item.route) return (
                <Link key={item.label} to={item.route} className={cls}>
                  <span className="ak-menu-icon"><SidebarIcon label={item.label} /></span>
                  <span className="ak-menu-label">{item.label}</span>
                  {item.badge ? <span className="ak-menu-badge">{item.badge}</span> : null}
                </Link>
              )
              return (
                <button key={item.label} type="button" className={cls}>
                  <span className="ak-menu-icon"><SidebarIcon label={item.label} /></span>
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
          <button type="button" className="ak-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main className="ak-main">

        <header className="ak-header">
          <div>
            <span className="ak-header-kicker">Relatórios</span>
            <h1>Dashboard <em>financeiro.</em></h1>
            <p>Saúde financeira do estúdio em tempo real.</p>
          </div>
          <div className="afd-period-tabs">
            {PERIODOS.map(p => (
              <button
                key={p.value}
                type="button"
                className={`afd-ptab ${periodo === p.value ? 'is-active' : ''}`}
                onClick={() => handlePeriodo(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        {loading || !data ? (
          <div className="afd-loading-state">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            {loading ? 'Carregando dashboard...' : 'Sem dados disponíveis.'}
          </div>
        ) : (
          <div className="afd-content">

            {/* ── Hero KPIs ── */}
            <div className="afd-hero">
              <div className="afd-kpi">
                <div className="afd-kpi-label">Receita bruta</div>
                <div className="afd-kpi-value">{formatBRL(data.receitaBruta)}</div>
                <span className={`afd-delta ${deltaClass(data.receitaDeltaPct)}`}>
                  {deltaLabel(data.receitaDeltaPct)}
                </span>
              </div>

              <div className="afd-kpi">
                <div className="afd-kpi-label">Custo total</div>
                <div className="afd-kpi-value is-red">{formatBRL(data.custoTotal)}</div>
                <span className={`afd-delta ${deltaClass(-data.custoDeltaPct)}`}>
                  {deltaLabel(data.custoDeltaPct)}
                </span>
              </div>

              <div className="afd-kpi">
                <div className="afd-kpi-label">Lucro líquido</div>
                <div className={`afd-kpi-value ${data.lucroLiquido >= 0 ? 'is-green' : 'is-red'}`}>
                  {formatBRL(data.lucroLiquido)}
                </div>
                <span className={`afd-delta ${deltaClass(data.lucroDeltaPct)}`}>
                  {deltaLabel(data.lucroDeltaPct)}
                </span>
              </div>

              <div className="afd-kpi">
                <div className="afd-kpi-label">Margem líquida</div>
                <div className={`afd-kpi-value ${data.margemLiquida >= 25 ? 'is-green' : data.margemLiquida < 0 ? 'is-red' : ''}`}>
                  {formatPct(data.margemLiquida)}
                </div>
                <span className={`afd-delta ${deltaClass(data.margemDeltaPp)}`}>
                  {deltaLabel(data.margemDeltaPp, 'pp')}
                </span>
              </div>
            </div>

            {/* ── Row 1: Fluxo de caixa + Top clientes ── */}
            <div className="afd-g2">
              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Fluxo de caixa</div>
                    <div className="afd-card-sub">Receita vs Custo vs Lucro — últimos 8 meses</div>
                  </div>
                  <div className="afd-legend">
                    {[{ color: '#4ade80', label: 'Receita' }, { color: '#fca5a5', label: 'Custo' }, { color: '#93C5FD', label: 'Lucro' }].map(l => (
                      <div key={l.label} className="afd-legend-item">
                        <div className="afd-legend-dot" style={{ background: l.color }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="afd-card-body">
                  <div className="afd-chart-wrap" ref={cfRef}>
                    <CashflowChart data={data.fluxoCaixa} onTooltip={setCfTip} />
                    {cfTip && (
                      <div className="afd-chart-tip" style={{ left: cfTip.x, top: cfTip.y }}>{cfTip.text}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Receita por cliente</div>
                    <div className="afd-card-sub">Top 5 — período selecionado</div>
                  </div>
                </div>
                <div className="afd-card-body">
                  {data.topClientes.length === 0 ? (
                    <div className="afd-client-empty">Nenhum dado de venda no período.</div>
                  ) : (
                    data.topClientes.map((c, i) => (
                      <div key={c.nome} className="afd-client-item">
                        <div
                          className="afd-client-av"
                          style={{ background: CLIENT_COLORS[i % CLIENT_COLORS.length].bg, color: CLIENT_COLORS[i % CLIENT_COLORS.length].text }}
                        >
                          {c.iniciais}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="afd-client-name">{c.nome}</div>
                          <div className="afd-client-count">{c.totalPedidos} {c.totalPedidos === 1 ? 'pedido' : 'pedidos'}</div>
                        </div>
                        <span className="afd-client-value">{formatBRL(c.receita)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 2: Margem por tipo + Projeção + Alertas ── */}
            <div className="afd-g3">
              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Margem por tipo de peça</div>
                    <div className="afd-card-sub">Rentabilidade por produto</div>
                  </div>
                </div>
                <div className="afd-card-body">
                  {data.margemPorTipo.length === 0 ? (
                    <div className="afd-mbar-empty">Sem dados de margem por produto no período.</div>
                  ) : (
                    data.margemPorTipo.map((m, i) => (
                      <div key={m.tipo} className="afd-mbar-item">
                        <span className="afd-mbar-label" title={m.tipo}>{m.tipo}</span>
                        <div className="afd-mbar-track">
                          <div
                            className="afd-mbar-fill"
                            style={{ width: `${Math.min(100, Math.max(0, m.margemPct))}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                          />
                        </div>
                        <span className="afd-mbar-pct">{formatPct(m.margemPct, 0)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Projeção do mês</div>
                    <div className="afd-card-sub">Meta vs realizado até agora</div>
                  </div>
                </div>
                <div className="afd-card-body">
                  <div className="afd-proj-value">{formatBRLFull(data.projecao.meta)}</div>
                  <div className="afd-proj-sub">meta mensal</div>

                  <div className="afd-proj-row">
                    <span>Realizado</span>
                    <strong>
                      {formatBRL(data.projecao.realizado)}{' '}
                      <span style={{ color: 'var(--ak-brand-lime)' }}>({formatPct(data.projecao.pctMeta)})</span>
                    </strong>
                  </div>
                  <div className="afd-proj-track">
                    <div className="afd-proj-fill" style={{ width: `${data.projecao.pctMeta}%` }} />
                  </div>

                  <div className="afd-proj-box">
                    <div className="afd-proj-box-label">Falta para a meta</div>
                    <div className="afd-proj-box-value">{formatBRL(data.projecao.faltaMeta)}</div>
                    <div className="afd-proj-box-hint">
                      Projeção:{' '}
                      <strong style={{ color: data.projecao.alcancavel ? 'var(--ak-brand-lime)' : '#fca5a5' }}>
                        {data.projecao.alcancavel ? 'alcançável' : 'abaixo do ritmo'}
                      </strong>
                    </div>
                  </div>

                  <div className="afd-proj-remaining">
                    <span>Dias restantes no mês</span>
                    <span>{data.projecao.diasRestantes} dias</span>
                  </div>
                </div>
              </div>

              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Alertas financeiros</div>
                    <div className="afd-card-sub">Pontos de atenção do período</div>
                  </div>
                </div>
                <div className="afd-card-body">
                  {data.alertas.length === 0 ? (
                    <div className="afd-alerts-empty">Nenhum alerta no momento.</div>
                  ) : (
                    data.alertas.map((a, i) => (
                      <div key={i} className={`afd-alert ${a.tipo === 'ok' ? 'is-ok' : 'is-warn'}`}>
                        <div className="afd-alert-icon">
                          {a.tipo === 'ok' ? (
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#7EC89A" strokeWidth={2}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={2}>
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="afd-alert-title">{a.titulo}</div>
                          <div className="afd-alert-sub">{a.descricao}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 3: Evolução da receita + Breakdown de custos ── */}
            <div className="afd-g2b">
              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Evolução da receita</div>
                    <div className="afd-card-sub">Linha de tendência — últimos 8 meses</div>
                  </div>
                </div>
                <div className="afd-card-body">
                  <div className="afd-chart-wrap" ref={evRef}>
                    <EvolutionChart data={data.fluxoCaixa} onTooltip={setEvTip} />
                    {evTip && (
                      <div className="afd-chart-tip" style={{ left: evTip.x, top: evTip.y }}>{evTip.text}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="afd-card">
                <div className="afd-card-head">
                  <div>
                    <div className="afd-card-title">Breakdown de custos</div>
                    <div className="afd-card-sub">Composição do custo total no período</div>
                  </div>
                </div>
                <div className="afd-card-body">
                  {data.breakdownCustos.length === 0 ? (
                    <div className="afd-donut-empty">Sem dados de custo no período.</div>
                  ) : (
                    <DonutChart data={data.breakdownCustos} />
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
