import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { useAuth } from '../../context/AuthContext'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import logo from '../../assets/images/logo.png'
import { apiRequest } from '../../services/api'
import { parseEspecificacoesFicha } from '../../utils/fichaEspecificacoes'
import ThreeViewer from '../../components/ui/ThreeViewer'
import './MeusPedidos.css'

const TIPO_MODEL_URL: Record<string, string> = {
  Camiseta: '/models/tshirt.glb',
  Moletom:  '/models/hoodie.glb',
  Regata:   '/models/regata.glb',
  Polo:     '/models/polo.glb',
  Ecobag:   '/models/ecobag.glb',
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type StatusKey = 'p' | 'a' | 'o' | 'r' | 't' | 'e' | 'c'

interface Pedido {
  pedidoId: number
  id: string
  nome: string
  meta: string
  status: StatusKey
  emoji: string
  urlArte?: string
  urlPreview?: string
  primeiroTipo: string
  detalhes: {
    tipoTamanhos: string
    modelagemGramatura: string
    cor: string
    posicao: string
  }
}

// ── Helpers de mapeamento da API ──────────────────────────────────────────────

const EMOJI_MAP: Record<string, string> = {
  Camiseta: '👕', Moletom: '🧥', Regata: '🎽', Polo: '👔', Ecobag: '👜',
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '5531999159678').replace(/\D/g, '')

function buildStudioWhatsappHref(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${WHATSAPP_NUMBER}${text}`
}

function statusFromApi(s: string): StatusKey {
  if (s === 'AGUARDANDO_ANALISE' || s === 'AGUARDANDO_ORCAMENTO') return 'a'
  if (s === 'EM_PRODUCAO') return 'p'
  if (s === 'ORCAMENTO_ENVIADO') return 'o'
  if (s === 'PRONTO_PARA_RETIRADA') return 'r'
  if (s === 'EM_TRANSITO' || s === 'EM_TRANSPORTE' || s === 'ENVIADO') return 't'
  if (s === 'ENTREGUE') return 'e'
  if (s === 'CANCELADO') return 'c'
  return 'a'
}

function parseDateShort(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function parseEspecificacoes(esp: string) {
  return parseEspecificacoesFicha(esp)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return (email ?? 'U').slice(0, 2).toUpperCase()
}

function getFirstName(name?: string): string {
  if (!name) return 'Cliente'
  return name.trim().split(' ')[0]
}

const STATUS_LABEL: Partial<Record<StatusKey, string>> = {
  p: 'Em produção',
  o: 'Aguardando orçamento',
  t: 'Em trânsito',
  e: 'Entregue',
  c: 'Cancelado',
}

// ── Sub-componente: card de pedido ────────────────────────────────────────────

const STATUS_LABEL_MAP: Record<StatusKey, string> = {
  p: 'Em produção',
  a: 'Aguardando análise',
  o: 'Orçamento enviado',
  r: 'Pronto p/ retirada',
  t: 'Em trânsito',
  e: 'Entregue',
  c: 'Cancelado',
}

void STATUS_LABEL

function PedidoCard({ pedido, isOpen, onToggle, onCancelar, onRefazer }: {
  pedido: Pedido
  isOpen: boolean
  onToggle: () => void
  onCancelar: (id: number) => void
  onRefazer: () => void
}) {
  const badgeClass = {
    p: 'mp-badge-p',
    a: 'mp-badge-a',
    o: 'mp-badge-o',
    r: 'mp-badge-r',
    t: 'mp-badge-t',
    e: 'mp-badge-e',
    c: 'mp-badge-c',
  }[pedido.status]
  const isEntregue = pedido.status === 'e'
  const isCancelado = pedido.status === 'c'
  const { tipoTamanhos, modelagemGramatura, cor, posicao } = pedido.detalhes
  const modelUrl = TIPO_MODEL_URL[pedido.primeiroTipo] ?? TIPO_MODEL_URL['Camiseta']
  const whatsappHref = buildStudioWhatsappHref(
    `Olá, equipe Seri! Quero falar sobre o pedido ${pedido.id}.`,
  )

  return (
    <div className={`mp-pcard ${isOpen ? 'open' : ''}`}>
      <div className="mp-pm-main" onClick={onToggle}>
        <div className="mp-picon">
        {(pedido.urlPreview ?? pedido.urlArte)
          ? <img src={pedido.urlPreview ?? pedido.urlArte} alt="preview" className="mp-picon-img" />
          : pedido.emoji}
      </div>
        <div className="mp-pinfo">
          <div className="mp-pcode"><b>SERI</b>{pedido.id.slice(4)}</div>
          <div className="mp-pname">{pedido.nome}</div>
          <div className="mp-pmeta">{pedido.meta}</div>
        </div>
        <div className="mp-pright">
          <span className={`mp-badge ${badgeClass}`}>{STATUS_LABEL_MAP[pedido.status]}</span>
          <svg
            className="mp-chev"
            width="14" height="14" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="mp-pdetail">
          <div className="mp-detail-layout">
            {/* ── Preview 3D ───────────────────────────────────── */}
            <div className="mp-dpreview">
              <ThreeViewer
                modelUrl={modelUrl}
                artUrl={pedido.urlArte ?? null}
                pos="fc"
                moveMode={false}
                color={cor}
                artRotation={0}
                artScale={1}
                flipH={false}
                flipV={false}
              />
            </div>

            {/* ── Detalhes ─────────────────────────────────────── */}
            <div className="mp-dleft">
              <div className="mp-dgrid">
                {[
                  ['Tipo e Tamanhos', tipoTamanhos],
                  ['Gramatura e Modelagem', modelagemGramatura],
                  ['Cor', cor],
                  ['Posição', posicao],
                ].map(([label, val]) => (
                  <div key={label} className="mp-di">
                    <div className="mp-dil">{label}</div>
                    <div className="mp-div">{val}</div>
                  </div>
                ))}
              </div>
              <div className="mp-dacts">
                {isEntregue || isCancelado ? (
                  <button className="mp-da mp-da-d" onClick={onRefazer}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                    </svg>
                    Refazer pedido
                  </button>
                ) : (
                  <a className="mp-da mp-da-d" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(37,211,102,.75)">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                    </svg>
                    Falar com estúdio
                  </a>
                )}
                {!isCancelado && !isEntregue && pedido.status === 'o' && (
                  <button
                    className="mp-da mp-da-cancel"
                    onClick={e => { e.stopPropagation(); onCancelar(pedido.pedidoId) }}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Cancelar pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

type Filtro = 'todos' | StatusKey

export default function MeusPedidos() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)

  const initials  = getInitials(user?.name, user?.email)
  const firstName = getFirstName(user?.name)

  const [filtro,  setFiltro]  = useState<Filtro>('todos')
  const [openId,  setOpenId]  = useState<string | null>(null)
  const [busca,   setBusca]   = useState('')
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  async function handleCancelar(pedidoId: number) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return
    try {
      await apiRequest(`/pedido/${pedidoId}/cancelar`, { method: 'PATCH' })
      setPedidos(prev => prev.map(p =>
        p.pedidoId === pedidoId ? { ...p, status: 'c' as StatusKey } : p
      ))
    } catch (e: any) {
      alert(e.message ?? 'Erro ao cancelar pedido.')
    }
  }

  useEffect(() => {
    apiRequest<any[]>('/pedido/meus').then(data => {
      const mapped: Pedido[] = data.map(p => {
        const ficha = p.fichaTecnica ?? {}
        const esp = parseEspecificacoes(ficha.especificacoes ?? '')
        const data_ = ficha.dataAbertura ? parseDateShort(ficha.dataAbertura) : ''
        const qtdTotal = (p.quantidades ?? '').split(',').reduce((s: number, q: string) => {
          const n = parseInt(q.split(':')[1] ?? '0')
          return s + (isNaN(n) ? 0 : n)
        }, 0)
        // "Camiseta - M:1, Moletom - G:2" → "Camiseta - M ×1, Moletom - G ×2"
        const tipoTamanhos = (p.quantidades ?? '')
          .split(',')
          .map((s: string) => {
            const idx = s.lastIndexOf(':')
            const label = (idx === -1 ? s : s.slice(0, idx)).trim()
            const qtd = idx === -1 ? '' : s.slice(idx + 1).trim()
            if (!label) return ''
            const n = Number.parseInt(qtd, 10)
            return Number.isFinite(n) && n > 0 ? `${label} ×${n}` : label
          })
          .filter(Boolean)
          .join(', ') || esp.tamanhos || '—'

        return {
          pedidoId: p.id,
          id: ficha.codigoDisplay ?? String(p.id),
          nome: ficha.identificacao ?? 'Pedido',
          meta: `${qtdTotal} peças · ${data_}`,
          status: statusFromApi(p.statusAtual ?? ''),
          emoji: EMOJI_MAP[ficha.produtoTipo ?? ''] ?? '👕',
          urlArte: ficha.urlArte ?? undefined,
          urlPreview: ficha.urlPreview ?? undefined,
          primeiroTipo: (ficha.produtoTipo ?? 'Camiseta').split(',')[0].trim(),
          detalhes: {
            tipoTamanhos,
            modelagemGramatura: esp.modelagemGramatura,
            cor: esp.cor,
            posicao: '—',
          },
        }
      })
      setPedidos(mapped)
    }).catch(() => {})
  }, [])

  // Stats
  const total      = pedidos.length
  const emProd     = pedidos.filter((p: Pedido) => p.status === 'p' || p.status === 'r' || p.status === 't').length
  const entregues  = pedidos.filter((p: Pedido) => p.status === 'e').length

  // Filtragem
  const pedidosFiltrados = pedidos.filter((p: Pedido) => {
    const passaFiltro = filtro === 'todos' || p.status === filtro
    const q = busca.trim().toUpperCase()
    const passaBusca = !q || p.id.replace(/-/g, '').includes(q.replace(/-/g, '')) || p.nome.toUpperCase().includes(q)
    return passaFiltro && passaBusca
  })

  function toggleCard(id: string) {
    setOpenId(prev => prev === id ? null : id)
  }

  function focusSearch() {
    searchRef.current?.focus()
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(ROUTES.HOME)
  }

  return (
    <div className="mp-page">
      <div className="mp-grain" aria-hidden="true" />

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="mp-nav">
        <Link to={ROUTES.HOME} className="mp-nav-brand">
          <div className="mp-nav-logo">
            <img src={logo} alt="Seri." />
          </div>
          <span className="mp-nav-name">Seri.</span>
        </Link>

        <div className="mp-nav-center">
          <Link to={ROUTES.HOME} className="mp-nl">Home</Link>
          <Link to={ROUTES.CATALOGO} className="mp-nl">Portfólio</Link>
          <a href={`${ROUTES.HOME}#como-funciona`} className="mp-nl">Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`} className="mp-nl">Contato</a>
          <MyOrdersLink hideForAdmin className="mp-nl mp-nl-active">
            Meus pedidos
          </MyOrdersLink>
        </div>

        <div className="mp-nav-right">
          <AuthNavCta className="mp-nav-cta" />
        </div>
      </nav>

      <div className="mp-back-row">
        <div className="mp-back-inner">
          <button type="button" className="mp-back-button" onClick={handleBack}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        </div>
      </div>

      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <div className="mp-page-hero">
        <div className="mp-hero-inner">
          <div>
            <div className="mp-hero-eyebrow">Olá, {firstName}</div>
            <h1 className="mp-hero-h1">Meus pedidos</h1>
            <p className="mp-hero-sub">Acompanhe suas fichas técnicas e o status de cada produção</p>
          </div>
          <div className="mp-stats-row">
            <div className="mp-stat">
              <div className="mp-stat-val">{total}</div>
              <div className="mp-stat-lbl">Total</div>
            </div>
            <div className="mp-stat">
              <div className="mp-stat-val mp-hi">{emProd}</div>
              <div className="mp-stat-lbl">Em produção</div>
            </div>
            <div className="mp-stat">
              <div className="mp-stat-val">{entregues}</div>
              <div className="mp-stat-lbl">Entregues</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYOUT ────────────────────────────────────────────────────────── */}
      <div className="mp-layout">

        {/* LISTA */}
        <div>
          <div className="mp-list-head">
            <h2 className="mp-list-title">Fichas técnicas</h2>
            <Link to={ROUTES.CRIAR_FICHA} className="mp-btn-nova">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nova ficha
            </Link>
          </div>

          {/* Filtros */}
          <div className="mp-filters">
            {([
              ['todos', 'Todos'],
              ['a',     'Aguardando análise'],
              ['o',     'Orçamento enviado'],
              ['p',     'Em produção'],
              ['r',     'Pronto para retirada'],
              ['t',     'Em trânsito'],
              ['e',     'Entregue'],
              ['c',     'Cancelado'],
            ] as [Filtro, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`mp-fbtn ${filtro === key ? 'on' : ''}`}
                onClick={() => { setFiltro(key); setOpenId(null) }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Cards */}
          {pedidosFiltrados.length === 0 ? (
            <div className="mp-empty">
              <p>Nenhum pedido encontrado.</p>
            </div>
          ) : (
            pedidosFiltrados.map((p: Pedido) => (
              <PedidoCard
                key={p.pedidoId}
                pedido={p}
                isOpen={openId === p.id}
                onToggle={() => toggleCard(p.id)}
                onCancelar={handleCancelar}
                onRefazer={() => navigate(ROUTES.CRIAR_FICHA, { state: { prefill: p } })}
              />
            ))
          )}
        </div>

        {/* SIDEBAR */}
        <div className="mp-sidebar">
          <div className="mp-scard">

            {/* Perfil */}
            <div className="mp-ps">
              <div className="mp-pt">
                <div className="mp-avwrap">
                  <div className="mp-av">{initials}</div>
                  <div className="mp-avon" />
                </div>
                <div>
                  <div className="mp-uname">{user?.name ?? 'Cliente'}</div>
                  <div className="mp-uemail">{user?.email ?? ''}</div>
                </div>
              </div>

              {/* Mini stats */}
              <div className="mp-pmini">
                <div className="mp-pmi">
                  <div className="mp-pmiv">{total}</div>
                  <div className="mp-pmil">Pedidos</div>
                </div>
                <div className="mp-pmi">
                  <div className="mp-pmiv mp-hi">{emProd}</div>
                  <div className="mp-pmil">Ativos</div>
                </div>
                <div className="mp-pmi">
                  <div className="mp-pmiv">{entregues}</div>
                  <div className="mp-pmil">Entregues</div>
                </div>
              </div>

              {/* Busca */}
              <div className="mp-srch">
                <svg className="mp-srchi" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por código SERI-..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="mp-divider" />

            {/* Atalhos */}
            <div className="mp-atls">
              <div className="mp-atl-title">Atalhos</div>

              <Link to={ROUTES.CRIAR_FICHA} className="mp-atl">
                <span className="mp-atldot" style={{ background: 'var(--mp-lime)' }} />
                <span className="mp-atllbl">Nova ficha técnica</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <button className="mp-atl" onClick={focusSearch}>
                <span className="mp-atldot" style={{ background: '#60a5fa' }} />
                <span className="mp-atllbl">Consultar por código</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <a
                href={buildStudioWhatsappHref('Olá, equipe Seri! Quero falar com o estúdio.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mp-atl"
              >
                <span className="mp-atldot" style={{ background: 'rgba(37,211,102,.8)' }} />
                <span className="mp-atllbl">Falar com o estúdio</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </a>

              <Link to={ROUTES.MEU_PERFIL} className="mp-atl">
                <span className="mp-atldot" style={{ background: 'var(--mp-muted2)' }} />
                <span className="mp-atllbl">Editar meu perfil</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <button
                type="button"
                className="mp-atl"
                style={{ color: '#e05252' }}
                onClick={() => { logout(); navigate(ROUTES.LOGIN) }}
              >
                <span className="mp-atldot" style={{ background: '#e05252' }} />
                <span className="mp-atllbl">Sair da conta</span>
                <svg className="mp-atlarr" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
