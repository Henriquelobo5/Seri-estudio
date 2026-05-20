import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import { ROUTES } from '../../routes/routePaths'
import { apiRequest } from '../../services/api'
import './AdminKanban.css'
import './AdminEstoque.css'

type Categoria = 'TINTA' | 'TELA' | 'EMULSAO' | 'TECIDO' | 'OUTROS'
type Status = 'OK' | 'BAIXO' | 'CRITICO' | 'SEM_ESTOQUE'
type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'AJUSTE'
type EstoqueSummaryKey = 'ITENS' | 'OK' | 'BAIXO' | 'CRITICO' | 'MOVIMENTACOES'

type InsumoResponse = {
  idInsumo: number
  nomeItem: string
  categoria: Categoria
  qtdEstoque: number
  qtdMinima: number
  unidadeMedida: string
  precoUnitario: number | null
  consumoPorPeca: number | null
  status: Status
}

type MovimentacaoResponse = {
  idMovimentacao: number
  tipo: TipoMovimentacao
  quantidade: number
  quantidadeReal: number
  motivo: string
  dataHora: string
  qtdAposMovimentacao: number
  idInsumo: number
  insumoNome: string
  administradorNome: string | null
}

type ModalKind =
  | 'cadastrar'
  | 'editar'
  | 'abastecer'
  | 'simular'
  | 'ajuste'
  | 'saida-manual'
  | 'excluir'
  | null

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
  { label: 'Fichas técnicas', route: ROUTES.ADMIN_FICHAS },
  { label: 'Pedidos' },
  { label: 'Clientes', route: ROUTES.ADMIN_CLIENTES },
  { label: 'PRODUÇÃO', section: 'title' },
  { label: 'Fluxo de produção', route: ROUTES.ADMIN_KANBAN },
  { label: 'Estoque', active: true, route: ROUTES.ADMIN_ESTOQUE },
  { label: 'RELATÓRIOS', section: 'title' },
  { label: 'Custos e lucro', route: ROUTES.ADMIN_CUSTOS },
  { label: 'Dashboard financeiro', route: ROUTES.ADMIN_FINANCEIRO_DASHBOARD },
]

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'TINTA', label: 'Tinta' },
  { value: 'TELA', label: 'Tela' },
  { value: 'EMULSAO', label: 'Emulsão' },
  { value: 'TECIDO', label: 'Tecido' },
  { value: 'OUTROS', label: 'Outros' },
]

function getInitials(name?: string | null) {
  if (!name) return 'ST'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

function categoriaLabel(cat: Categoria) {
  return CATEGORIAS.find((c) => c.value === cat)?.label ?? cat
}

function statusLabel(status: Status) {
  if (status === 'OK') return 'OK'
  if (status === 'BAIXO') return 'Baixo'
  if (status === 'CRITICO') return 'Crítico'
  return 'Sem estoque'
}

function statusIcon(status: Status) {
  if (status === 'OK') return '✓'
  if (status === 'BAIXO') return '⚠'
  if (status === 'CRITICO') return '!'
  return '✕'
}

function formatDataHora(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const now = new Date()
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diaMov = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (hoje.getTime() - diaMov.getTime()) / (1000 * 60 * 60 * 24)
  if (diff === 0) return `Hoje ${hh}h${mm}`
  if (diff === 1) return `Ontem ${hh}h${mm}`
  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mo} ${hh}h${mm}`
}

function truncate(text: string, n = 38) {
  if (!text) return ''
  return text.length > n ? text.slice(0, n) + '…' : text
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
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

function renderCategoriaIcon(cat: Categoria) {
  if (cat === 'TINTA') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10z" fill="none" />
      </svg>
    )
  }
  if (cat === 'TELA') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="1.5" fill="none" />
        <path d="M4 9h16M4 14h16M9 4v16M14 4v16" fill="none" />
      </svg>
    )
  }
  if (cat === 'EMULSAO') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3s4 5 4 9a4 4 0 0 1-8 0c0-4 4-9 4-9z" fill="none" />
        <circle cx="10" cy="13" r="1" />
      </svg>
    )
  }
  if (cat === 'TECIDO') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h3l2 2 2-2h3l3 4-3 2v10H7V10L4 8z" fill="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16v13H4z" fill="none" />
      <path d="M4 7l8-3 8 3" fill="none" />
      <path d="M12 4v16" fill="none" />
    </svg>
  )
}

const initialDraft = {
  nomeItem: '',
  categoria: 'TINTA' as Categoria,
  qtdEstoque: 0,
  qtdMinima: 0,
  unidadeMedida: '',
  precoUnitario: '' as number | '',
  consumoPorPeca: '' as number | '',
}

export default function AdminEstoque() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [insumos, setInsumos] = useState<InsumoResponse[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<'TODAS' | Categoria>('TODAS')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [modalAberto, setModalAberto] = useState<ModalKind>(null)
  const [insumoSelecionado, setInsumoSelecionado] = useState<InsumoResponse | null>(null)
  const [menuAberto, setMenuAberto] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [activeSummary, setActiveSummary] = useState<EstoqueSummaryKey | null>(null)

  const [draftInsumo, setDraftInsumo] = useState(initialDraft)
  const [draftAbastecer, setDraftAbastecer] = useState({
    idInsumo: 0,
    quantidade: 0,
    motivo: '',
  })
  const [draftSimular, setDraftSimular] = useState({
    quantidadePecas: 0,
    observacao: '',
  })
  const [draftAjuste, setDraftAjuste] = useState({
    novoSaldo: 0,
    motivo: '',
  })
  const [draftSaidaManual, setDraftSaidaManual] = useState({
    quantidade: 0,
    motivo: '',
  })

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    try {
      const [ins, movs] = await Promise.all([
        apiRequest<InsumoResponse[]>('/admin/estoque'),
        apiRequest<MovimentacaoResponse[]>('/admin/estoque/movimentacoes'),
      ])
      setInsumos(ins)
      setMovimentacoes(movs)
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o estoque.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const insumosFiltrados = useMemo(() => {
    let lista = insumos
    if (categoriaFiltro !== 'TODAS') {
      lista = lista.filter((i) => i.categoria === categoriaFiltro)
    }
    if (busca.trim()) {
      const q = busca.trim().toLowerCase()
      lista = lista.filter((i) => i.nomeItem.toLowerCase().includes(q))
    }
    return lista
  }, [insumos, categoriaFiltro, busca])

  const kpiItens = insumos.length
  const kpiOk = insumos.filter((i) => i.status === 'OK').length
  const kpiBaixo = insumos.filter((i) => i.status === 'BAIXO').length
  const kpiCritico = insumos.filter(
    (i) => i.status === 'CRITICO' || i.status === 'SEM_ESTOQUE',
  ).length

  const insumosCriticos = insumos.filter(
    (i) => i.status === 'CRITICO' || i.status === 'SEM_ESTOQUE',
  )
  const summaryCards = [
    {
      key: 'ITENS' as const,
      className: '',
      label: 'Itens cadastrados',
      value: kpiItens,
      helper: 'tipos de insumo',
    },
    {
      key: 'OK' as const,
      className: 'ak-metric-card-green',
      label: 'Nível adequado',
      value: kpiOk,
      helper: 'insumos com saldo OK',
    },
    {
      key: 'BAIXO' as const,
      className: 'ak-metric-card-yellow',
      label: 'Atenção',
      value: kpiBaixo,
      helper: 'nível baixo',
    },
    {
      key: 'CRITICO' as const,
      className: 'ak-metric-card-red',
      label: 'Urgente',
      value: kpiCritico,
      helper: 'crítico ou sem estoque',
    },
    {
      key: 'MOVIMENTACOES' as const,
      className: '',
      label: 'Movimentações',
      value: movimentacoes.length,
      helper: 'registradas no período',
    },
  ]
  const activeSummaryCard = summaryCards.find((card) => card.key === activeSummary) ?? null
  const activeSummaryInsumos =
    activeSummary === 'ITENS'
      ? insumos
      : activeSummary === 'OK'
        ? insumos.filter((i) => i.status === 'OK')
        : activeSummary === 'BAIXO'
          ? insumos.filter((i) => i.status === 'BAIXO')
          : activeSummary === 'CRITICO'
            ? insumosCriticos
            : []
  const activeSummaryMovimentacoes = activeSummary === 'MOVIMENTACOES' ? movimentacoes : []
  const activeSummaryCount =
    activeSummary === 'MOVIMENTACOES'
      ? activeSummaryMovimentacoes.length
      : activeSummaryInsumos.length

  const hasFilters = busca.trim().length > 0 || categoriaFiltro !== 'TODAS'

  const headerSubtitle = hasFilters
    ? `${insumosFiltrados.length} ${insumosFiltrados.length === 1 ? 'insumo encontrado' : 'insumos encontrados'} na visualização atual.`
    : 'Gerencie insumos, monitore alertas e registre movimentações de entrada e saída.'

  function abrirCadastrar() {
    setDraftInsumo(initialDraft)
    setInsumoSelecionado(null)
    setModalError('')
    setModalAberto('cadastrar')
  }

  function abrirEditar(ins: InsumoResponse) {
    setActiveSummary(null)
    setDraftInsumo({
      nomeItem: ins.nomeItem,
      categoria: ins.categoria,
      qtdEstoque: ins.qtdEstoque,
      qtdMinima: ins.qtdMinima,
      unidadeMedida: ins.unidadeMedida,
      precoUnitario: ins.precoUnitario ?? '',
      consumoPorPeca: ins.consumoPorPeca ?? '',
    })
    setInsumoSelecionado(ins)
    setModalError('')
    setModalAberto('editar')
    setMenuAberto(null)
  }

  function abrirAbastecerHeader() {
    setInsumoSelecionado(null)
    setDraftAbastecer({ idInsumo: insumos[0]?.idInsumo ?? 0, quantidade: 0, motivo: '' })
    setModalError('')
    setModalAberto('abastecer')
  }

  function abrirAbastecerCard(ins: InsumoResponse) {
    setActiveSummary(null)
    setInsumoSelecionado(ins)
    setDraftAbastecer({ idInsumo: ins.idInsumo, quantidade: 0, motivo: '' })
    setModalError('')
    setModalAberto('abastecer')
  }

  function abrirSimular(ins: InsumoResponse) {
    setActiveSummary(null)
    setInsumoSelecionado(ins)
    setDraftSimular({ quantidadePecas: 0, observacao: '' })
    setModalError('')
    setModalAberto('simular')
  }

  function abrirAjuste(ins: InsumoResponse) {
    setActiveSummary(null)
    setInsumoSelecionado(ins)
    setDraftAjuste({ novoSaldo: ins.qtdEstoque, motivo: '' })
    setModalError('')
    setModalAberto('ajuste')
    setMenuAberto(null)
  }

  function abrirSaidaManual(ins: InsumoResponse) {
    setActiveSummary(null)
    setInsumoSelecionado(ins)
    setDraftSaidaManual({ quantidade: 0, motivo: '' })
    setModalError('')
    setModalAberto('saida-manual')
    setMenuAberto(null)
  }

  function abrirExcluir(ins: InsumoResponse) {
    setActiveSummary(null)
    setInsumoSelecionado(ins)
    setModalError('')
    setModalAberto('excluir')
    setMenuAberto(null)
  }

  function fecharModal() {
    setModalAberto(null)
    setModalError('')
    setSubmitting(false)
  }

  async function submitInsumoForm() {
    setModalError('')
    setSubmitting(true)
    try {
      const body = {
        nomeItem: draftInsumo.nomeItem,
        categoria: draftInsumo.categoria,
        qtdEstoque: Number(draftInsumo.qtdEstoque),
        qtdMinima: Number(draftInsumo.qtdMinima),
        unidadeMedida: draftInsumo.unidadeMedida,
        precoUnitario: draftInsumo.precoUnitario === '' ? null : Number(draftInsumo.precoUnitario),
        consumoPorPeca:
          draftInsumo.consumoPorPeca === '' ? null : Number(draftInsumo.consumoPorPeca),
      }
      if (modalAberto === 'cadastrar') {
        await apiRequest('/admin/estoque', { method: 'POST', body: JSON.stringify(body) })
      } else if (modalAberto === 'editar' && insumoSelecionado) {
        await apiRequest(`/admin/estoque/${insumoSelecionado.idInsumo}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      }
      await carregarTudo()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao salvar insumo.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAbastecer() {
    setModalError('')
    setSubmitting(true)
    try {
      const id = insumoSelecionado?.idInsumo ?? draftAbastecer.idInsumo
      if (!id) throw new Error('Selecione um insumo')
      await apiRequest(`/admin/estoque/${id}/movimentar`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'ENTRADA',
          quantidade: Number(draftAbastecer.quantidade),
          motivo: draftAbastecer.motivo || 'Reposição manual',
        }),
      })
      await carregarTudo()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao abastecer.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSimular() {
    setModalError('')
    setSubmitting(true)
    try {
      if (!insumoSelecionado) throw new Error('Insumo não selecionado')
      await apiRequest(`/admin/estoque/${insumoSelecionado.idInsumo}/simular-abate`, {
        method: 'POST',
        body: JSON.stringify({
          quantidadePecas: Number(draftSimular.quantidadePecas),
          observacao: draftSimular.observacao,
        }),
      })
      await carregarTudo()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao simular abate.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAjuste() {
    setModalError('')
    setSubmitting(true)
    try {
      if (!insumoSelecionado) throw new Error('Insumo não selecionado')
      if (!draftAjuste.motivo.trim()) throw new Error('Motivo é obrigatório')
      await apiRequest(`/admin/estoque/${insumoSelecionado.idInsumo}/movimentar`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'AJUSTE',
          quantidade: Number(draftAjuste.novoSaldo),
          motivo: draftAjuste.motivo,
        }),
      })
      await carregarTudo()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao ajustar inventário.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSaidaManual() {
    setModalError('')
    setSubmitting(true)
    try {
      if (!insumoSelecionado) throw new Error('Insumo não selecionado')
      if (!draftSaidaManual.motivo.trim()) throw new Error('Motivo é obrigatório')
      await apiRequest(`/admin/estoque/${insumoSelecionado.idInsumo}/movimentar`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'SAIDA',
          quantidade: Number(draftSaidaManual.quantidade),
          motivo: draftSaidaManual.motivo,
        }),
      })
      await carregarTudo()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao registrar saída.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitExcluir() {
    setModalError('')
    setSubmitting(true)
    try {
      if (!insumoSelecionado) throw new Error('Insumo não selecionado')
      await apiRequest(`/admin/estoque/${insumoSelecionado.idInsumo}`, { method: 'DELETE' })
      await carregarTudo()
      fecharModal()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao excluir.')
    } finally {
      setSubmitting(false)
    }
  }

  const consumoSimulado = useMemo(() => {
    if (!insumoSelecionado || !insumoSelecionado.consumoPorPeca) return null
    const pecas = Number(draftSimular.quantidadePecas) || 0
    const total = pecas * insumoSelecionado.consumoPorPeca
    const arred = Math.ceil(total)
    const novoSaldo = insumoSelecionado.qtdEstoque - arred
    const insuficiente = arred > insumoSelecionado.qtdEstoque
    return { pecas, total, arred, novoSaldo, insuficiente }
  }, [draftSimular.quantidadePecas, insumoSelecionado])

  const saidaInsuficiente = useMemo(() => {
    if (!insumoSelecionado) return false
    const qtd = Number(draftSaidaManual.quantidade) || 0
    return qtd > insumoSelecionado.qtdEstoque
  }, [draftSaidaManual.quantidade, insumoSelecionado])

  const diferencaAjuste = useMemo(() => {
    if (!insumoSelecionado) return 0
    return Number(draftAjuste.novoSaldo) - insumoSelecionado.qtdEstoque
  }, [draftAjuste.novoSaldo, insumoSelecionado])

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
            <h1>Controle de <em>estoque.</em></h1>
            <p>{headerSubtitle}</p>
          </div>

          <div className="ak-header-badges">
            <button type="button" className="ae-btn ae-btn-secondary" onClick={abrirCadastrar}>
              + Cadastrar insumo
            </button>
            <button type="button" className="ae-btn ae-btn-primary" onClick={abrirAbastecerHeader}>
              + Abastecer estoque
            </button>
          </div>
        </header>

        {error ? <div className="ak-alert">{error}</div> : null}

        {!bannerDismissed && insumosCriticos.length > 0 ? (
          <div className="ae-banner">
            <span className="ae-banner-icon">⚠</span>
            <span className="ae-banner-text">
              <strong>{insumosCriticos.length}</strong>{' '}
              {insumosCriticos.length === 1 ? 'insumo em' : 'insumos em'} nível crítico —{' '}
              {insumosCriticos.map((i) => i.nomeItem).join(', ')}{' '}
              {insumosCriticos.length === 1 ? 'precisa' : 'precisam'} de reposição urgente.
            </span>
            <button
              type="button"
              className="ae-banner-close"
              onClick={() => setBannerDismissed(true)}
              aria-label="Fechar alerta"
            >
              ✕
            </button>
          </div>
        ) : null}

        <section className="ak-overview" aria-label="Resumo do estoque">
          {summaryCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`ak-metric-card ak-metric-button ${card.className} ${activeSummary === card.key ? 'is-active' : ''}`}
              onClick={() => {
                setModalAberto(null)
                setActiveSummary(activeSummary === card.key ? null : card.key)
              }}
            >
              <span>{card.label}</span>
              <strong>{formatNumber(card.value)}</strong>
              <small>{card.helper}</small>
            </button>
          ))}
        </section>

        <section className="ak-toolbar" aria-label="Filtros do estoque">
          <label className="ak-search">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome do insumo"
            />
          </label>

          <div className="ak-filter-group" aria-label="Filtro por categoria">
            <button
              type="button"
              className={categoriaFiltro === 'TODAS' ? 'is-active' : ''}
              onClick={() => setCategoriaFiltro('TODAS')}
            >
              Todas
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={categoriaFiltro === c.value ? 'is-active' : ''}
                onClick={() => setCategoriaFiltro(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ak-clear-filters"
            disabled={!hasFilters}
            onClick={() => {
              setBusca('')
              setCategoriaFiltro('TODAS')
            }}
          >
            Limpar
          </button>
        </section>

        <div className="ae-grid">
          <div className="ae-cards">
            {loading ? (
              <div className="ae-empty">Carregando insumos...</div>
            ) : insumosFiltrados.length === 0 ? (
              <div className="ae-empty">Nenhum insumo encontrado.</div>
            ) : (
              insumosFiltrados.map((ins) => {
                const progressoMax = Math.max(ins.qtdMinima * 5, 1)
                const pct = Math.min(100, (ins.qtdEstoque / progressoMax) * 100)
                const semConsumo = ins.consumoPorPeca == null

                return (
                  <div key={ins.idInsumo} className={`ae-card ae-card-${ins.status.toLowerCase()}`}>
                    <div className="ae-card-head">
                      <div className={`ae-card-icon cat-${ins.categoria.toLowerCase()}`}>
                        {renderCategoriaIcon(ins.categoria)}
                      </div>
                      <div className="ae-card-head-actions">
                        <div className="ae-card-menu-wrap">
                          <button
                            type="button"
                            className="ae-card-menu-btn"
                            onClick={() =>
                              setMenuAberto(menuAberto === ins.idInsumo ? null : ins.idInsumo)
                            }
                            aria-label="Menu"
                          >
                            ⋯
                          </button>
                          {menuAberto === ins.idInsumo ? (
                            <div className="ae-card-menu">
                              <button type="button" onClick={() => abrirEditar(ins)}>
                                Editar
                              </button>
                              <button type="button" onClick={() => abrirAjuste(ins)}>
                                Ajuste de inventário
                              </button>
                              <button
                                type="button"
                                className="ae-menu-outflow"
                                onClick={() => abrirSaidaManual(ins)}
                              >
                                Dar saída manual
                              </button>
                              <button
                                type="button"
                                className="ae-menu-danger"
                                onClick={() => abrirExcluir(ins)}
                              >
                                Excluir
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <span className={`ae-status ae-status-${ins.status.toLowerCase()}`}>
                          <span className="ae-status-icon">{statusIcon(ins.status)}</span>
                          {statusLabel(ins.status)}
                        </span>
                      </div>
                    </div>
                    <div className="ae-card-name">{ins.nomeItem}</div>
                    <div className="ae-card-cat">{categoriaLabel(ins.categoria)}</div>

                    <div className="ae-card-qty">
                      <span className="ae-card-qty-num">{ins.qtdEstoque}</span>
                      <span className="ae-card-qty-un">{ins.unidadeMedida}</span>
                    </div>

                    <div className="ae-progress">
                      <div
                        className={`ae-progress-fill st-${ins.status.toLowerCase()}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="ae-card-meta">
                      <div>
                        <div className="ae-meta-label">MÍNIMO</div>
                        <div className="ae-meta-val">
                          {ins.qtdMinima} {ins.unidadeMedida}
                        </div>
                      </div>
                      <div>
                        <div className="ae-meta-label">POR PEÇA</div>
                        <div className="ae-meta-val">
                          {ins.consumoPorPeca != null
                            ? `${ins.consumoPorPeca} ${ins.unidadeMedida}`
                            : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="ae-card-actions">
                      <button
                        type="button"
                        className="ae-btn ae-btn-card-secondary"
                        onClick={() => abrirAbastecerCard(ins)}
                      >
                        + Abastecer
                      </button>
                      <button
                        type="button"
                        className="ae-btn ae-btn-card-outflow"
                        disabled={semConsumo}
                        title={
                          semConsumo
                            ? 'Configure o consumo por peça antes de simular'
                            : undefined
                        }
                        onClick={() => abrirSimular(ins)}
                      >
                        - Registrar saída
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <aside className="ae-mov-side">
            <div className="ae-mov-head">
              <strong>Movimentações</strong>
              <span>Entradas, saídas e ajustes</span>
            </div>
            <div className="ae-mov-list">
              {movimentacoes.length === 0 ? (
                <div className="ae-empty-soft">Nenhuma movimentação ainda.</div>
              ) : (
                movimentacoes.map((mov) => {
                  const sinal =
                    mov.tipo === 'ENTRADA' ? '+' : mov.tipo === 'SAIDA' ? '-' : '≈'
                  const valorClass = mov.tipo === 'ENTRADA' ? 'pos' : mov.tipo === 'SAIDA' ? 'neg' : 'aju'
                  return (
                    <div key={mov.idMovimentacao} className="ae-mov-item">
                      <span className={`ae-mov-dot dot-${mov.tipo.toLowerCase()}`} />
                      <div className="ae-mov-body">
                        <div className="ae-mov-motivo">{truncate(mov.motivo)}</div>
                        <div className="ae-mov-sub">
                          {mov.insumoNome} · {formatDataHora(mov.dataHora)}
                        </div>
                      </div>
                      <div className={`ae-mov-val ${valorClass}`}>
                        {sinal}
                        {mov.quantidade}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        </div>
      </main>

      {activeSummaryCard ? (
        <div className="ak-drawer-backdrop" onClick={() => setActiveSummary(null)}>
          <aside className="ak-drawer ak-summary-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ak-drawer-head">
              <div>
                <span className="ak-drawer-code">Resumo do estoque</span>
                <h2>{activeSummaryCard.label}</h2>
                <p className="ak-summary-drawer-subtitle">
                  {formatNumber(activeSummaryCount)}{' '}
                  {activeSummary === 'MOVIMENTACOES'
                    ? activeSummaryCount === 1 ? 'movimentação encontrada' : 'movimentações encontradas'
                    : activeSummaryCount === 1 ? 'insumo encontrado' : 'insumos encontrados'}
                </p>
              </div>
              <button type="button" className="ak-drawer-close" onClick={() => setActiveSummary(null)}>
                Fechar
              </button>
            </div>

            <div className="ak-summary-list">
              {activeSummary === 'MOVIMENTACOES' ? (
                activeSummaryMovimentacoes.length === 0 ? (
                  <div className="ak-summary-empty">Nenhuma movimentação registrada.</div>
                ) : (
                  activeSummaryMovimentacoes.map((mov) => {
                    const sinal = mov.tipo === 'ENTRADA' ? '+' : mov.tipo === 'SAIDA' ? '-' : '≈'
                    return (
                      <div key={mov.idMovimentacao} className="ak-summary-item ae-summary-static">
                        <span className="ak-summary-code">{mov.tipo}</span>
                        <strong>{mov.insumoNome}</strong>
                        <small>
                          {sinal}{mov.quantidade} · {truncate(mov.motivo)} · {formatDataHora(mov.dataHora)}
                        </small>
                      </div>
                    )
                  })
                )
              ) : activeSummaryInsumos.length === 0 ? (
                <div className="ak-summary-empty">Nenhum insumo nesse grupo.</div>
              ) : (
                activeSummaryInsumos.map((ins) => (
                  <button
                    key={ins.idInsumo}
                    type="button"
                    className="ak-summary-item"
                    onClick={() => abrirEditar(ins)}
                  >
                    <span className="ak-summary-code">{categoriaLabel(ins.categoria)}</span>
                    <strong>{ins.nomeItem}</strong>
                    <small>
                      {statusLabel(ins.status)} · {formatNumber(ins.qtdEstoque)} {ins.unidadeMedida} em estoque · mínimo {formatNumber(ins.qtdMinima)}
                    </small>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {/* MODAIS */}
      {(modalAberto === 'cadastrar' || modalAberto === 'editar') && (
        <ModalShell
          title={modalAberto === 'cadastrar' ? 'Cadastrar insumo' : 'Editar insumo'}
          subtitle={
            modalAberto === 'cadastrar'
              ? 'Adicione um novo insumo ao estoque'
              : 'Atualize os dados do insumo'
          }
          onClose={fecharModal}
        >
          <div className="ae-form">
            <label className="ae-field">
              <span>Nome do item</span>
              <input
                type="text"
                value={draftInsumo.nomeItem}
                onChange={(e) => setDraftInsumo({ ...draftInsumo, nomeItem: e.target.value })}
              />
            </label>
            <label className="ae-field">
              <span>Categoria</span>
              <select
                value={draftInsumo.categoria}
                onChange={(e) =>
                  setDraftInsumo({ ...draftInsumo, categoria: e.target.value as Categoria })
                }
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="ae-field-row">
              <label className="ae-field">
                <span>Quantidade em estoque</span>
                <input
                  type="number"
                  min={0}
                  value={draftInsumo.qtdEstoque}
                  onChange={(e) =>
                    setDraftInsumo({ ...draftInsumo, qtdEstoque: Number(e.target.value) })
                  }
                />
              </label>
              <label className="ae-field">
                <span>Quantidade mínima</span>
                <input
                  type="number"
                  min={0}
                  value={draftInsumo.qtdMinima}
                  onChange={(e) =>
                    setDraftInsumo({ ...draftInsumo, qtdMinima: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className="ae-field">
              <span>Unidade de medida</span>
              <input
                type="text"
                placeholder="ex: kg, L, m, un"
                value={draftInsumo.unidadeMedida}
                onChange={(e) => setDraftInsumo({ ...draftInsumo, unidadeMedida: e.target.value })}
              />
            </label>
            <div className="ae-field-row">
              <label className="ae-field">
                <span>Preço unitário (opcional)</span>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={draftInsumo.precoUnitario}
                  onChange={(e) =>
                    setDraftInsumo({
                      ...draftInsumo,
                      precoUnitario: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="ae-field">
                <span>Consumo por peça (opcional)</span>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={draftInsumo.consumoPorPeca}
                  onChange={(e) =>
                    setDraftInsumo({
                      ...draftInsumo,
                      consumoPorPeca: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <p className="ae-help">
              Consumo por peça: quantidade desse insumo consumida por peça produzida. Necessário
              para usar "Simular abate".
            </p>
            {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
            <div className="ae-modal-actions">
              <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-primary"
                onClick={submitInsumoForm}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {modalAberto === 'abastecer' && (
        <ModalShell
          title="Abastecer estoque"
          subtitle="Registrar entrada de insumo"
          onClose={fecharModal}
        >
          <div className="ae-form">
            <label className="ae-field">
              <span>Insumo</span>
              {insumoSelecionado ? (
                <div className="ae-readonly">
                  {insumoSelecionado.nomeItem} ({insumoSelecionado.qtdEstoque}{' '}
                  {insumoSelecionado.unidadeMedida})
                </div>
              ) : (
                <select
                  value={draftAbastecer.idInsumo}
                  onChange={(e) =>
                    setDraftAbastecer({ ...draftAbastecer, idInsumo: Number(e.target.value) })
                  }
                >
                  {insumos.map((i) => (
                    <option key={i.idInsumo} value={i.idInsumo}>
                      {i.nomeItem} ({i.qtdEstoque} {i.unidadeMedida})
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className="ae-field">
              <span>Quantidade a adicionar</span>
              <input
                type="number"
                min={1}
                value={draftAbastecer.quantidade}
                onChange={(e) =>
                  setDraftAbastecer({ ...draftAbastecer, quantidade: Number(e.target.value) })
                }
              />
            </label>
            <label className="ae-field">
              <span>Fornecedor / observação</span>
              <input
                type="text"
                placeholder="ex: Compra fornecedor ABC"
                value={draftAbastecer.motivo}
                onChange={(e) => setDraftAbastecer({ ...draftAbastecer, motivo: e.target.value })}
              />
            </label>
            {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
            <div className="ae-modal-actions">
              <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-primary"
                onClick={submitAbastecer}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Confirmar entrada'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {modalAberto === 'simular' && insumoSelecionado && (
        <ModalShell title="Simular abate" subtitle="Saída por produção" onClose={fecharModal}>
          <div className="ae-form">
            <div className="ae-info-box">
              <strong>{insumoSelecionado.nomeItem}</strong>
              <span>
                Saldo: {insumoSelecionado.qtdEstoque} {insumoSelecionado.unidadeMedida} · Consumo:{' '}
                {insumoSelecionado.consumoPorPeca ?? '—'} {insumoSelecionado.unidadeMedida}/peça
              </span>
            </div>
            <label className="ae-field">
              <span>Quantidade de peças</span>
              <input
                type="number"
                min={1}
                value={draftSimular.quantidadePecas}
                onChange={(e) =>
                  setDraftSimular({ ...draftSimular, quantidadePecas: Number(e.target.value) })
                }
              />
            </label>
            <label className="ae-field">
              <span>Produto / observação</span>
              <input
                type="text"
                placeholder="ex: Moletom formatura"
                value={draftSimular.observacao}
                onChange={(e) => setDraftSimular({ ...draftSimular, observacao: e.target.value })}
              />
            </label>
            {consumoSimulado && consumoSimulado.pecas > 0 ? (
              <div className={`ae-preview ${consumoSimulado.insuficiente ? 'is-bad' : ''}`}>
                <div>
                  {consumoSimulado.pecas} × {insumoSelecionado.consumoPorPeca}{' '}
                  {insumoSelecionado.unidadeMedida} ={' '}
                  <strong>
                    {consumoSimulado.total.toFixed(2)} {insumoSelecionado.unidadeMedida}
                  </strong>
                </div>
                <div>
                  Saldo após: <strong>{consumoSimulado.novoSaldo}</strong>{' '}
                  {insumoSelecionado.unidadeMedida}
                </div>
                {consumoSimulado.insuficiente ? (
                  <div className="ae-preview-error">
                    Estoque insuficiente — necessário {consumoSimulado.arred}, disponível{' '}
                    {insumoSelecionado.qtdEstoque}.
                  </div>
                ) : null}
              </div>
            ) : null}
            {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
            <div className="ae-modal-actions">
              <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-outflow"
                onClick={submitSimular}
                disabled={submitting || consumoSimulado?.insuficiente}
              >
                {submitting ? 'Salvando...' : 'Confirmar abate'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {modalAberto === 'ajuste' && insumoSelecionado && (
        <ModalShell
          title="Ajuste de inventário"
          subtitle="Corrija o saldo manualmente após contagem física"
          onClose={fecharModal}
        >
          <div className="ae-form">
            <div className="ae-info-box">
              <strong>{insumoSelecionado.nomeItem}</strong>
              <span>
                Saldo atual: {insumoSelecionado.qtdEstoque} {insumoSelecionado.unidadeMedida}
              </span>
            </div>
            <label className="ae-field">
              <span>Novo saldo</span>
              <input
                type="number"
                min={0}
                value={draftAjuste.novoSaldo}
                onChange={(e) =>
                  setDraftAjuste({ ...draftAjuste, novoSaldo: Number(e.target.value) })
                }
              />
            </label>
            <div className={`ae-diff ${diferencaAjuste < 0 ? 'neg' : diferencaAjuste > 0 ? 'pos' : ''}`}>
              Diferença: {diferencaAjuste > 0 ? '+' : ''}
              {diferencaAjuste} {insumoSelecionado.unidadeMedida}
            </div>
            <label className="ae-field">
              <span>Motivo</span>
              <input
                type="text"
                placeholder="ex: Inventário mensal"
                value={draftAjuste.motivo}
                onChange={(e) => setDraftAjuste({ ...draftAjuste, motivo: e.target.value })}
              />
            </label>
            {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
            <div className="ae-modal-actions">
              <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-primary"
                onClick={submitAjuste}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Confirmar ajuste'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {modalAberto === 'saida-manual' && insumoSelecionado && (
        <ModalShell
          title="Dar saída manual"
          subtitle="Registre uma baixa de estoque (descarte, perda, empréstimo, etc)"
          onClose={fecharModal}
        >
          <div className="ae-form">
            <div className="ae-info-box">
              <strong>{insumoSelecionado.nomeItem}</strong>
              <span>
                {insumoSelecionado.qtdEstoque} {insumoSelecionado.unidadeMedida} disponíveis
              </span>
            </div>
            <label className="ae-field">
              <span>Quantidade a remover</span>
              <input
                type="number"
                min={1}
                value={draftSaidaManual.quantidade}
                onChange={(e) =>
                  setDraftSaidaManual({
                    ...draftSaidaManual,
                    quantidade: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="ae-field">
              <span>Motivo</span>
              <input
                type="text"
                placeholder="Ex: Descarte — material danificado"
                value={draftSaidaManual.motivo}
                onChange={(e) =>
                  setDraftSaidaManual({ ...draftSaidaManual, motivo: e.target.value })
                }
              />
            </label>
            {saidaInsuficiente ? (
              <div className="ae-preview is-bad">
                <div className="ae-preview-error">
                  Estoque insuficiente. Disponível: {insumoSelecionado.qtdEstoque}{' '}
                  {insumoSelecionado.unidadeMedida}.
                </div>
              </div>
            ) : null}
            {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
            <div className="ae-modal-actions">
              <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-outflow"
                onClick={submitSaidaManual}
                disabled={
                  submitting ||
                  Number(draftSaidaManual.quantidade) <= 0 ||
                  !draftSaidaManual.motivo.trim() ||
                  saidaInsuficiente
                }
              >
                {submitting ? 'Salvando...' : 'Confirmar saída'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {modalAberto === 'excluir' && insumoSelecionado && (
        <ModalShell title="Excluir insumo" onClose={fecharModal}>
          <div className="ae-form">
            <p className="ae-confirm-text">
              Tem certeza que deseja excluir <strong>{insumoSelecionado.nomeItem}</strong>? Esta
              ação não pode ser desfeita.
            </p>
            {modalError ? <div className="ae-modal-error">{modalError}</div> : null}
            <div className="ae-modal-actions">
              <button type="button" className="ae-btn ae-btn-ghost" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="ae-btn ae-btn-danger"
                onClick={submitExcluir}
                disabled={submitting}
              >
                {submitting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="ae-overlay" onClick={onClose}>
      <div className="ae-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ae-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="ae-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
