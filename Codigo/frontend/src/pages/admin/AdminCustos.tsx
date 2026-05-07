import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminCustos.css'

type FinanceiroData = {
  id: number
  custoMaterial: number
  custoEstamparia: number
  custoMo: number
  custoManutencao: number
  valorVenda: number
  lucroLiquido: number
}

type PedidoFinanceiro = {
  id: number
  codigoDisplay: string | null
  identificacao: string | null
  clienteNome: string | null
  quantidades: string | null
  produtoTipo: string | null
  dataAbertura: string | null
  financeiro: FinanceiroData | null
}

type CostDraft = {
  custoMaterial: number
  custoEstamparia: number
  custoMo: number
  custoManutencao: number
  valorVenda: number
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
  { label: 'Dashboard' },
  { label: 'Fichas técnicas', badge: '3', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos' },
  { label: 'Clientes' },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Kanban', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', active: true, route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro' },
]

function getInitials(name?: string | null) {
  if (!name) return 'ST'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function getTotalPecas(quantidades?: string | null) {
  if (!quantidades) return 0
  return quantidades
    .split(',')
    .map((item) => item.trim())
    .reduce((sum, item) => {
      const [, qty] = item.split(':')
      const v = Number.parseInt(qty ?? '0', 10)
      return sum + (Number.isNaN(v) ? 0 : v)
    }, 0)
}

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function getMargemClass(margem: number) {
  if (margem >= 35) return 'ac-margin-hi'
  if (margem >= 20) return 'ac-margin-mid'
  if (margem > 0) return 'ac-margin-lo'
  return 'ac-margin-none'
}

function calcTotal(draft: CostDraft) {
  return draft.custoMaterial + draft.custoEstamparia + draft.custoMo + draft.custoManutencao
}

function calcMargem(draft: CostDraft) {
  const custo = calcTotal(draft)
  const lucro = draft.valorVenda - custo
  return draft.valorVenda > 0 ? (lucro / draft.valorVenda) * 100 : 0
}

function emptyDraft(financeiro: FinanceiroData | null, valorVendaFallback = 0): CostDraft {
  return {
    custoMaterial: financeiro?.custoMaterial ?? 0,
    custoEstamparia: financeiro?.custoEstamparia ?? 0,
    custoMo: financeiro?.custoMo ?? 0,
    custoManutencao: financeiro?.custoManutencao ?? 0,
    valorVenda: financeiro?.valorVenda ?? valorVendaFallback,
  }
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
  if (label === 'Kanban') {
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

export default function AdminCustos() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [pedidos, setPedidos] = useState<PedidoFinanceiro[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<CostDraft>({ custoMaterial: 0, custoEstamparia: 0, custoMo: 0, custoManutencao: 0, valorVenda: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    apiRequest<PedidoFinanceiro[]>('/admin/financeiro')
      .then((data) => {
        if (!isMounted) return
        setPedidos(data)
        if (data.length > 0) {
          const first = data[0]
          setSelectedId(first.id)
          setDraft(emptyDraft(first.financeiro))
        }
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

  const selectedPedido = pedidos.find((p) => p.id === selectedId) ?? null

  function selectPedido(pedido: PedidoFinanceiro) {
    setSelectedId(pedido.id)
    setDraft(emptyDraft(pedido.financeiro))
    setSavedId(null)
    setError('')
  }

  function updateDraft(field: keyof CostDraft, raw: string) {
    const v = parseFloat(raw) || 0
    setDraft((prev) => ({ ...prev, [field]: v }))
  }

  async function handleSave() {
    if (!selectedPedido) return
    setSaving(true)
    setError('')
    try {
      const updated = await apiRequest<FinanceiroData>(`/admin/financeiro/${selectedPedido.id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      })
      setPedidos((prev) =>
        prev.map((p) => (p.id === selectedPedido.id ? { ...p, financeiro: updated } : p)),
      )
      setSavedId(selectedPedido.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os custos.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  // KPI aggregates
  const faturamento = pedidos.reduce((s, p) => s + (p.financeiro?.valorVenda ?? 0), 0)
  const custoTotal = pedidos.reduce((s, p) => {
    if (!p.financeiro) return s
    const f = p.financeiro
    return s + f.custoMaterial + f.custoEstamparia + f.custoMo + f.custoManutencao
  }, 0)
  const lucroTotal = faturamento - custoTotal
  const pedidosComVenda = pedidos.filter((p) => (p.financeiro?.valorVenda ?? 0) > 0)
  const pedidosRegistrados = pedidos.filter((p) => p.financeiro != null).length
  const margemMedia = pedidosComVenda.length > 0
    ? pedidosComVenda.reduce((s, p) => {
        const f = p.financeiro!
        const ct = f.custoMaterial + f.custoEstamparia + f.custoMo + f.custoManutencao
        const m = f.valorVenda > 0 ? ((f.valorVenda - ct) / f.valorVenda) * 100 : 0
        return s + m
      }, 0) / pedidosComVenda.length
    : 0

  const currentCusto = calcTotal(draft)
  const currentLucro = draft.valorVenda - currentCusto
  const currentMargem = calcMargem(draft)

  const headerSubtitle = pedidos.length === 0
    ? 'Nenhum pedido carregado ainda.'
    : `Registre custos por pedido e acompanhe a margem automaticamente. ${pedidosRegistrados} de ${pedidos.length} já com financeiro.`

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
            <span className="ak-header-kicker">Relatórios</span>
            <h1>Custos e <em>lucro.</em></h1>
            <p>{headerSubtitle}</p>
          </div>

          <div className="ak-header-badges">
            <span className="ak-header-pill ak-pill-blue">{formatNumber(pedidos.length)} pedidos</span>
            <span className="ak-header-pill ak-pill-yellow">{formatNumber(pedidosRegistrados)} registrados</span>
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        <section className="ak-overview" aria-label="Resumo financeiro">
          <article className="ak-metric-card ak-metric-card-green">
            <span>Faturamento do mês</span>
            <strong>{formatBRL(faturamento)}</strong>
            <small>soma dos preços de venda</small>
          </article>
          <article className="ak-metric-card ak-metric-card-red">
            <span>Custo total</span>
            <strong>{formatBRL(custoTotal)}</strong>
            <small>soma de todos os custos</small>
          </article>
          <article className="ak-metric-card">
            <span>Lucro líquido</span>
            <strong>{formatBRL(lucroTotal)}</strong>
            <small>faturamento − custos</small>
          </article>
          <article className="ak-metric-card ak-metric-card-yellow">
            <span>Margem média</span>
            <strong>{margemMedia.toFixed(1).replace('.', ',')}%</strong>
            <small>média dos pedidos</small>
          </article>
          <article className="ak-metric-card">
            <span>Pedidos registrados</span>
            <strong>{formatNumber(pedidosRegistrados)}</strong>
            <small>de {formatNumber(pedidos.length)} ativos</small>
          </article>
        </section>

        <div className="ac-grid">
          <div className="ac-table-side">
            <div className="ac-table-head">
              <div>
                <div className="ac-table-head-title">Pedidos ativos</div>
                <div className="ac-table-head-sub">Clique em um pedido para registrar os custos</div>
              </div>
            </div>

            <div className="ac-table-shell">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Pedido</th>
                    <th>Peças</th>
                    <th>Custo total</th>
                    <th>Venda</th>
                    <th>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="ac-empty">Carregando pedidos...</td>
                    </tr>
                  ) : pedidos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ac-empty">Nenhum pedido encontrado.</td>
                    </tr>
                  ) : (
                    pedidos.map((pedido) => {
                      const fin = pedido.financeiro
                      const custo = fin
                        ? fin.custoMaterial + fin.custoEstamparia + fin.custoMo + fin.custoManutencao
                        : null
                      const venda = fin?.valorVenda ?? null
                      const margem = fin && venda && venda > 0
                        ? ((venda - (custo ?? 0)) / venda) * 100
                        : null
                      const totalPecas = getTotalPecas(pedido.quantidades)

                      return (
                        <tr
                          key={pedido.id}
                          className={selectedId === pedido.id ? 'is-selected' : ''}
                          onClick={() => selectPedido(pedido)}
                        >
                          <td>
                            <span className="ac-code-pill">
                              {pedido.codigoDisplay || `SERI-${pedido.id}`}
                            </span>
                          </td>
                          <td>
                            <div className="ac-cell-stack">
                              <strong>{pedido.identificacao || 'Pedido sem nome'}</strong>
                              <span>{pedido.clienteNome || 'Cliente Seri.'}</span>
                            </div>
                          </td>
                          <td>{totalPecas > 0 ? `${totalPecas} peças` : '--'}</td>
                          <td>
                            {custo !== null ? (
                              <span className="ac-mono">{formatBRL(custo)}</span>
                            ) : (
                              <span style={{ color: 'var(--ak-text-dim)' }}>--</span>
                            )}
                          </td>
                          <td>
                            {venda !== null && venda > 0 ? (
                              <span className="ac-mono">{formatBRL(venda)}</span>
                            ) : (
                              <span style={{ color: 'var(--ak-text-dim)' }}>--</span>
                            )}
                          </td>
                          <td>
                            {margem !== null ? (
                              <span className={`ac-margin-val ${getMargemClass(margem)}`}>
                                {margem.toFixed(1).replace('.', ',')}%
                              </span>
                            ) : (
                              <span className="ac-margin-val ac-margin-none">--</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="ac-form-side">
            <div className="ac-rp-head">
              <div className="ac-rp-head-title">Registrar custos</div>
              <div className="ac-rp-head-sub">
                {selectedPedido ? 'Edite os custos e salve' : 'Selecione um pedido à esquerda'}
              </div>
            </div>

            {selectedPedido ? (
              <>
                <div className="ac-rp-body">
                  <div className="ac-sel-info">
                    <div className="ac-sel-code">
                      {selectedPedido.codigoDisplay || `SERI-${selectedPedido.id}`}
                    </div>
                    <div className="ac-sel-name">
                      {selectedPedido.identificacao || 'Pedido sem nome'}
                    </div>
                    <div className="ac-sel-meta">
                      {[
                        selectedPedido.clienteNome,
                        selectedPedido.quantidades
                          ? `${getTotalPecas(selectedPedido.quantidades)} peças`
                          : null,
                        selectedPedido.produtoTipo,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>

                  <div className="ac-sec-lbl">Custos</div>

                  {/* Custo: Peça / Tecido */}
                  <div className="ac-cost-row">
                    <div className="ac-cost-label">
                      <div className="ac-cost-icon">
                        <svg viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                      <div>
                        <div className="ac-cost-name">Peça / Tecido</div>
                        <div className="ac-cost-sub">Material bruto</div>
                      </div>
                    </div>
                    <div className="ac-cost-input-wrap">
                      <span className="ac-cost-pfx">R$</span>
                      <input
                        className="ac-cost-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.custoMaterial || ''}
                        onChange={(e) => updateDraft('custoMaterial', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Custo: Estamparia */}
                  <div className="ac-cost-row">
                    <div className="ac-cost-label">
                      <div className="ac-cost-icon">
                        <svg viewBox="0 0 24 24">
                          <rect x="5" y="5" width="6" height="6" rx="1.5" />
                          <rect x="13" y="5" width="6" height="6" rx="1.5" />
                          <rect x="9" y="13" width="6" height="6" rx="1.5" />
                        </svg>
                      </div>
                      <div>
                        <div className="ac-cost-name">Estamparia</div>
                        <div className="ac-cost-sub">Tinta, tela e insumos</div>
                      </div>
                    </div>
                    <div className="ac-cost-input-wrap">
                      <span className="ac-cost-pfx">R$</span>
                      <input
                        className="ac-cost-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.custoEstamparia || ''}
                        onChange={(e) => updateDraft('custoEstamparia', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Custo: Mão de obra */}
                  <div className="ac-cost-row">
                    <div className="ac-cost-label">
                      <div className="ac-cost-icon">
                        <svg viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div>
                        <div className="ac-cost-name">Mão de obra</div>
                        <div className="ac-cost-sub">Corte, costura, acabamento</div>
                      </div>
                    </div>
                    <div className="ac-cost-input-wrap">
                      <span className="ac-cost-pfx">R$</span>
                      <input
                        className="ac-cost-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.custoMo || ''}
                        onChange={(e) => updateDraft('custoMo', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Custo: Outros */}
                  <div className="ac-cost-row">
                    <div className="ac-cost-label">
                      <div className="ac-cost-icon">
                        <svg viewBox="0 0 24 24">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <div className="ac-cost-name">Outros</div>
                        <div className="ac-cost-sub">Embalagem, frete, extras</div>
                      </div>
                    </div>
                    <div className="ac-cost-input-wrap">
                      <span className="ac-cost-pfx">R$</span>
                      <input
                        className="ac-cost-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.custoManutencao || ''}
                        onChange={(e) => updateDraft('custoManutencao', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Preço de venda */}
                  <div className="ac-pv-wrap">
                    <div className="ac-pv-label">Preço de venda combinado</div>
                    <input
                      className="ac-pv-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.valorVenda || ''}
                      onChange={(e) => updateDraft('valorVenda', e.target.value)}
                    />
                  </div>

                  {/* Summary */}
                  <div className="ac-summary">
                    <div className="ac-sum-row">
                      <span className="ac-sum-key">Custo total</span>
                      <span className="ac-sum-val">{formatBRL(currentCusto)}</span>
                    </div>
                    <div className="ac-sum-row">
                      <span className="ac-sum-key">Lucro bruto</span>
                      <span className="ac-sum-val">{formatBRL(currentLucro)}</span>
                    </div>
                    <div className="ac-sum-row big">
                      <span className="ac-sum-key">Margem de lucro</span>
                      <span className="ac-sum-val">
                        {currentMargem.toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                    <div className="ac-margin-bar-track">
                      <div
                        className="ac-margin-bar-fill"
                        style={{ width: `${Math.max(0, Math.min(100, currentMargem))}%` }}
                      />
                    </div>
                    <div className="ac-sum-pv-row">
                      <span className="ac-sum-pv-key">Preço de venda</span>
                      <span className="ac-sum-pv-val">{formatBRL(draft.valorVenda)}</span>
                    </div>
                  </div>
                </div>

                <div className="ac-rp-foot">
                  {savedId === selectedPedido.id && !saving ? (
                    <p className="ac-saved-msg">Custos salvos com sucesso!</p>
                  ) : null}
                  <button
                    type="button"
                    className="ac-save-btn"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar custos do pedido'}
                  </button>
                </div>
              </>
            ) : (
              <div className="ac-rp-empty">
                <svg viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <p>Selecione um pedido na tabela para registrar os custos</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
