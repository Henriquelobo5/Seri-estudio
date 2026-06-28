import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import logo from '../../assets/images/logo.png'
import {
  buildModelagemResumoPorTipo,
  buildQuantidadesPorTipo,
  buildTamanhosPorTipo,
  getDefaultModelagemGramatura,
  getItensFichaSelecionados,
  getModelagensPorTipo,
  getTotalPecasPorTipo,
  resolveModelagemGramaturaFromDetails,
  type ItemFichaPorTipo,
  type ItensPorTipo,
} from '../../utils/fichaEspecificacoes'
import './ConstrutorFichaTecnica.css'

// ── Dados ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

const TIPOS = [
  { nome: 'Camiseta', emoji: '👕' },
  { nome: 'Moletom',  emoji: '🧥' },
  { nome: 'Regata',   emoji: '🎽' },
  { nome: 'Polo',     emoji: '👔' },
  { nome: 'Ecobag',   emoji: '👜' },
]

const CORES = [
  { nome: 'Preto',        hex: '#111111' },
  { nome: 'Branco',       hex: '#F4F4F0', borda: true },
  { nome: 'Verde',        hex: '#2A5E40' },
  { nome: 'Verde limão',  hex: '#84CC16' },
  { nome: 'Vermelho',     hex: '#B91C1C' },
  { nome: 'Rosa',         hex: '#EC4899' },
  { nome: 'Azul royal',   hex: '#1D4ED8' },
  { nome: 'Azul marinho', hex: '#0F172A' },
  { nome: 'Azul bebê',    hex: '#7DD3FC' },
  { nome: 'Amarelo',      hex: '#EAB308' },
  { nome: 'Laranja',      hex: '#EA580C' },
  { nome: 'Cinza claro',  hex: '#9CA3AF' },
  { nome: 'Cinza escuro', hex: '#374151' },
  { nome: 'Roxo',         hex: '#7C3AED' },
  { nome: 'Bordô',        hex: '#7F1D1D' },
  { nome: 'Marrom',       hex: '#78350F' },
]

type GrupoTamanho = {
  label: string
  itens: string[]
}

const TAMANHOS_VESTUARIO: GrupoTamanho[] = [
  { label: 'Adulto', itens: ['P', 'M', 'GG', '2G', '3G', '4G'] },
  { label: 'Infantil / Babylook', itens: ['PBL', 'MBL', 'GBL', 'GGBL'] },
]

const TAMANHOS_POR_TIPO: Record<string, GrupoTamanho[]> = {
  Camiseta: TAMANHOS_VESTUARIO,
  Regata: TAMANHOS_VESTUARIO,
  Polo: TAMANHOS_VESTUARIO,
  Moletom: [
    { label: 'Adulto', itens: ['P', 'M', 'GG', '2G', '3G', '4G'] },
  ],
  Ecobag: [
    { label: 'Tamanho da ecobag', itens: ['Pequena (20cm x 30cm)', 'Media (30cm x 40cm)', 'Grande (40cm x 50cm)'] },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGruposTamanhoPorTipo(tipo: string): GrupoTamanho[] {
  return TAMANHOS_POR_TIPO[tipo] ?? TAMANHOS_POR_TIPO.Camiseta
}

function getTamanhosDisponiveis(tipo: string): string[] {
  return getGruposTamanhoPorTipo(tipo).flatMap(grupo => grupo.itens)
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatTamanhoLabel(tamanho: string) {
  const match = tamanho.match(/^(.+?)\s+(\(.+\))$/)
  if (!match) return tamanho

  return (
    <>
      <span className="cf-tam-main">{match[1]}</span>
      <span className="cf-tam-measure">{match[2]}</span>
    </>
  )
}

function resolveTamanhos(tam: string | string[]): string[] {
  if (Array.isArray(tam)) return tam
  return !tam || tam === '\u2014'
    ? []
    : tam.split(',').map((t: string) => t.trim()).filter(Boolean)
}

function normalizeTipo(value?: string) {
  if (!value) return ''
  const firstTipo = value.split(',')[0]?.trim()
  return TIPOS.find((tipo) => tipo.nome === firstTipo)?.nome ?? ''
}

function createItemFicha(tipo: string): ItemFichaPorTipo {
  return {
    tipo,
    modelagemGramatura: getDefaultModelagemGramatura(tipo),
    tamanhos: [],
    quantidadesPorTamanho: {},
  }
}

function normalizeItemFicha(tipo: string, item: Partial<ItemFichaPorTipo>): ItemFichaPorTipo {
  const opcoesModelagem = getModelagensPorTipo(tipo)
  const modelagem = item.modelagemGramatura && opcoesModelagem.includes(item.modelagemGramatura)
    ? item.modelagemGramatura
    : opcoesModelagem[0] ?? ''
  const tamanhos = resolveTamanhos(item.tamanhos ?? [])
    .filter((tamanho) => getTamanhosDisponiveis(tipo).includes(tamanho))
  const quantidades = item.quantidadesPorTamanho ?? {}

  return {
    tipo,
    modelagemGramatura: modelagem,
    tamanhos,
    quantidadesPorTamanho: Object.fromEntries(
      tamanhos.map((tamanho) => {
        const quantidade = Number(quantidades[tamanho])
        return [tamanho, Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0]
      }),
    ),
  }
}

function resolveItensIniciais(detalhes: any): ItensPorTipo {
  const explicit = detalhes?.itensPorTipo
  if (explicit && typeof explicit === 'object') {
    const itens = Object.fromEntries(
      TIPOS
        .filter(({ nome }) => explicit[nome])
        .map(({ nome }) => [nome, normalizeItemFicha(nome, explicit[nome])]),
    )

    if (Object.keys(itens).length > 0) return itens
  }

  const tipoInicial = normalizeTipo(detalhes?.tipo) || 'Camiseta'
  return {
    [tipoInicial]: normalizeItemFicha(tipoInicial, {
      tipo: tipoInicial,
      modelagemGramatura: resolveModelagemGramaturaFromDetails(detalhes, tipoInicial),
      tamanhos: detalhes?.tamanhos ?? [],
      quantidadesPorTamanho: detalhes?.quantidadesPorTamanho ?? {},
    }),
  }
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function ConstrutorFichaTecnica() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as any)?.prefill
  const initialItensPorTipo = resolveItensIniciais(prefill?.detalhes)

  const [currentStep, setCurrentStep] = useState(1)
  const [itensPorTipo, setItensPorTipo] = useState<ItensPorTipo>(initialItensPorTipo)
  const initialCor = prefill?.detalhes?.cor ?? CORES[0].nome
  const [identificacao, setIdentificacao] = useState(prefill?.nome ?? '')
  const [activeSpecIdx, setActiveSpecIdx] = useState(0)
  const [specDir, setSpecDir] = useState(1)

  const tiposSelecionados = TIPOS.map(({ nome }) => nome).filter((nome) => Boolean(itensPorTipo[nome]))
  const itensSelecionados = getItensFichaSelecionados(itensPorTipo, tiposSelecionados)
  const tipoResumo = tiposSelecionados.join(', ')
  const modelagemResumo = buildModelagemResumoPorTipo(itensSelecionados)
  const tamanhosResumo = buildTamanhosPorTipo(itensSelecionados)
  const quantidadesResumo = buildQuantidadesPorTipo(itensSelecionados)
  const totalPecas = getTotalPecasPorTipo(itensSelecionados)

  const safeSpecIdx = Math.max(0, Math.min(activeSpecIdx, itensSelecionados.length - 1))

  function goSpec(dir: number) {
    setSpecDir(dir)
    setActiveSpecIdx(Math.max(0, Math.min(safeSpecIdx + dir, itensSelecionados.length - 1)))
  }

  function jumpSpec(index: number) {
    setSpecDir(index >= safeSpecIdx ? 1 : -1)
    setActiveSpecIdx(index)
  }

  function toggleTipo(nextTipo: string) {
    setItensPorTipo(prev => {
      if (prev[nextTipo]) {
        const next = { ...prev }
        delete next[nextTipo]
        return next
      }

      return { ...prev, [nextTipo]: createItemFicha(nextTipo) }
    })
  }

  function setModelagemTipo(tipo: string, value: string) {
    setItensPorTipo(prev => ({
      ...prev,
      [tipo]: {
        ...(prev[tipo] ?? createItemFicha(tipo)),
        modelagemGramatura: value,
      },
    }))
  }

  function toggleTam(tipo: string, tam: string) {
    setItensPorTipo(prev => {
      const item = prev[tipo] ?? createItemFicha(tipo)
      if (item.tamanhos.includes(tam)) {
        const nextQuantidades = { ...item.quantidadesPorTamanho }
        delete nextQuantidades[tam]

        return {
          ...prev,
          [tipo]: {
            ...item,
            tamanhos: item.tamanhos.filter(t => t !== tam),
            quantidadesPorTamanho: nextQuantidades,
          },
        }
      }

      return {
        ...prev,
        [tipo]: {
          ...item,
          tamanhos: [...item.tamanhos, tam],
          quantidadesPorTamanho: {
            ...item.quantidadesPorTamanho,
            [tam]: item.quantidadesPorTamanho[tam] ?? 0,
          },
        },
      }
    })
  }

  function setQuantidadeTam(tipo: string, tam: string, value: string) {
    const digits = onlyDigits(value)
    const quantidade = digits ? parseInt(digits, 10) : 0

    setItensPorTipo(prev => {
      const item = prev[tipo] ?? createItemFicha(tipo)
      return {
        ...prev,
        [tipo]: {
          ...item,
          tamanhos: item.tamanhos.includes(tam) ? item.tamanhos : [...item.tamanhos, tam],
          quantidadesPorTamanho: {
            ...item.quantidadesPorTamanho,
            [tam]: quantidade,
          },
        },
      }
    })
  }

  function getItemTotal(item: ItemFichaPorTipo) {
    return Object.values(item.quantidadesPorTamanho).reduce((sum, value) => sum + (Number(value) || 0), 0)
  }

  function buildFichaData() {
    return {
      identificacao,
      tipo: tipoResumo,
      tiposSelecionados,
      itensPorTipo,
      modelagemGramatura: modelagemResumo,
      tecido: modelagemResumo,
      gramatura: '',
      cor: initialCor,
      tamanhos: tamanhosResumo,
      quantidadesPorTamanho: quantidadesResumo,
      posicao: '',
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(step => step - 1)
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(ROUTES.CATALOGO)
  }

  // progresso
  const score = [
    tiposSelecionados.length > 0,
    totalPecas > 0,
    identificacao.length > 2,
  ].filter(Boolean).length
  const progressPct = Math.max(15, Math.round((score / 3) * 75))

  const btnNextOn = tiposSelecionados.length > 0 && totalPecas > 0 && identificacao.length > 2

  // step detail no sidebar
  const stepDetail = `${tipoResumo || 'Selecione uma peça'}` + (totalPecas ? ` · ${totalPecas} peça${totalPecas !== 1 ? 's' : ''}` : '')

  return (
    <div className="cf-page">

      {/* grain */}
      <div className="cf-grain" aria-hidden="true" />

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="cf-nav">
        <Link to={ROUTES.HOME} className="cf-nav-brand">
          <div className="cf-nav-logo">
            <img src={logo} alt="Seri." />
          </div>
          <span className="cf-nav-name">Seri.</span>
        </Link>

        <div className="cf-nav-center">
          <Link to={ROUTES.HOME}>Home</Link>
          <Link to={ROUTES.CATALOGO}>{'Portf\u00F3lio'}</Link>
          <a href={`${ROUTES.HOME}#como-funciona`}>Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`}>Contato</a>
          <MyOrdersLink hideForAdmin>Meus pedidos</MyOrdersLink>
        </div>

        <div className="cf-nav-right">
          <AuthNavCta className="cf-nav-cta" />
        </div>
      </nav>

      {/* ── STEPPER ────────────────────────────────────────────────────────── */}
      <div className="cf-sbar">
        {STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`cf-step ${currentStep === step.id ? 'active' : currentStep > step.id ? 'done' : ''}`}>
              <div className="cf-snum">{step.id}</div>
              <div className="cf-slabel">{step.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`cf-sline ${currentStep > step.id ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── LAYOUT ─────────────────────────────────────────────────────────── */}
      <div className="cf-layout">

        {/* MAIN */}
        <div className="cf-main">

          <div>
            <h1 className="cf-page-h1">Construtor de ficha técnica</h1>
            <p className="cf-page-sub">Configure seu pedido passo a passo</p>
          </div>

          {currentStep === 1 && (
            <>
              {/* ── TIPO DE PEÇA ─────────────────────────────────────────── */}
              <div className="cf-card">
                <div className="cf-card-head">
                  <div className="cf-ch-icon">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="cf-ch-title">Tipo de peça</div>
                    <div className="cf-ch-sub">Escolha o produto que deseja personalizar</div>
                  </div>
                </div>
                <div className="cf-card-body">
                  <div className="cf-tipo-grid">
                    {TIPOS.map(({ nome, emoji }) => {
                      const selecionado = tiposSelecionados.includes(nome)
                      return (
                        <button
                          key={nome}
                          type="button"
                          aria-pressed={selecionado}
                          className={`cf-tipo-btn ${selecionado ? 'sel' : ''}`}
                          onClick={() => toggleTipo(nome)}
                        >
                          <div className="cf-tipo-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <span className="cf-tipo-emoji">{emoji}</span>
                          <span className="cf-tipo-nome">{nome}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── ESPECIFICAÇÕES ────────────────────────────────────────── */}
              <div className="cf-card">
                <div className="cf-card-head">
                  <div className="cf-ch-icon">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="cf-ch-title">Gramatura e Modelagem</div>
                    <div className="cf-ch-sub">Escolha a base do produto e os tamanhos</div>
                  </div>
                  {totalPecas > 0 ? (
                    <div className="cf-qtd-total">
                      <span>Total de peças</span>
                      <strong>{totalPecas}</strong>
                    </div>
                  ) : null}
                </div>
                <div className="cf-card-body">
                  {itensSelecionados.length === 0 ? (
                    <div className="cf-empty-selection">Selecione pelo menos um tipo de peça para informar gramatura, tamanhos e quantidades.</div>
                  ) : (
                    <div className="cf-spec-carousel">
                      {itensSelecionados.length > 1 ? (
                        <div className="cf-spec-nav">
                          <button
                            type="button"
                            className="cf-spec-arrow"
                            onClick={() => goSpec(-1)}
                            disabled={safeSpecIdx === 0}
                            aria-label="Produto anterior"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                          </button>
                          <div className="cf-spec-nav-center">
                            <strong>{itensSelecionados[safeSpecIdx]?.tipo}</strong>
                            <span>{safeSpecIdx + 1} de {itensSelecionados.length}</span>
                          </div>
                          <button
                            type="button"
                            className="cf-spec-arrow"
                            onClick={() => goSpec(1)}
                            disabled={safeSpecIdx === itensSelecionados.length - 1}
                            aria-label="Próximo produto"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                        </div>
                      ) : null}

                      {itensSelecionados.map((item, idx) => {
                        if (idx !== safeSpecIdx) return null

                        const opcoesModelagem = getModelagensPorTipo(item.tipo)
                        const gruposTamanho = getGruposTamanhoPorTipo(item.tipo)
                        const modelagemSelecionada = opcoesModelagem.includes(item.modelagemGramatura)
                          ? item.modelagemGramatura
                          : opcoesModelagem[0] ?? ''
                        const itemTotal = getItemTotal(item)

                        return (
                          <section key={item.tipo} className={`cf-spec-item cf-spec-slide ${specDir >= 0 ? 'dir-next' : 'dir-prev'}`}>
                            <div className="cf-spec-item-head">
                              <div>
                                <strong>{item.tipo}</strong>
                                <span>{itemTotal > 0 ? `${itemTotal} peça${itemTotal !== 1 ? 's' : ''}` : 'Aguardando quantidade'}</span>
                              </div>
                            </div>

                            <div className="cf-spec-row">
                              <div className="cf-fld">
                                <label>Gramatura e Modelagem</label>
                                <select
                                  className="cf-select"
                                  value={modelagemSelecionada}
                                  onChange={e => setModelagemTipo(item.tipo, e.target.value)}
                                >
                                  {opcoesModelagem.map(opcao => <option key={opcao}>{opcao}</option>)}
                                </select>
                              </div>
                            </div>

                            <div className="cf-fld">
                              <label>
                                Tamanhos{' '}
                                <span style={{ fontSize: 10, color: 'rgba(250,250,248,.22)', textTransform: 'none', letterSpacing: 0 }}>
                                  (selecione um ou mais)
                                </span>
                              </label>
                              <div className="cf-tam-groups">
                                {gruposTamanho.map(grupo => (
                                  <div key={grupo.label}>
                                    <div className="cf-tam-group-label">{grupo.label}</div>
                                    <div className="cf-tam-row">
                                      {grupo.itens.map(t => {
                                        const selecionado = item.tamanhos.includes(t)
                                        return (
                                          <div key={t} className={`cf-tam-item ${t.length > 12 ? 'wide' : ''} ${selecionado ? 'sel' : ''}`}>
                                            <button
                                              type="button"
                                              className={`cf-tam-btn ${selecionado ? 'sel' : ''}`}
                                              onClick={() => toggleTam(item.tipo, t)}
                                            >{formatTamanhoLabel(t)}</button>
                                            {selecionado ? (
                                              <label className="cf-tam-qty">
                                                <span>Qtd.</span>
                                                <input
                                                  type="text"
                                                  inputMode="numeric"
                                                  pattern="[0-9]*"
                                                  value={item.quantidadesPorTamanho[t] ?? 0}
                                                  onKeyDown={e => {
                                                    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                                                    if (e.ctrlKey || e.metaKey || controlKeys.includes(e.key)) return
                                                    if (!/^\d$/.test(e.key)) e.preventDefault()
                                                  }}
                                                  onPaste={e => {
                                                    e.preventDefault()
                                                    setQuantidadeTam(item.tipo, t, e.clipboardData.getData('text'))
                                                  }}
                                                  onChange={e => setQuantidadeTam(item.tipo, t, e.target.value)}
                                                />
                                              </label>
                                            ) : null}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>
                        )
                      })}

                      {itensSelecionados.length > 1 ? (
                        <div className="cf-spec-dots">
                          {itensSelecionados.map((item, idx) => (
                            <button
                              key={item.tipo}
                              type="button"
                              className={`cf-spec-dot ${idx === safeSpecIdx ? 'on' : ''}`}
                              onClick={() => jumpSpec(idx)}
                              aria-label={`Ir para ${item.tipo}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* ── IDENTIFICAÇÃO ─────────────────────────────────────────── */}
              <div className="cf-card">
                <div className="cf-card-head">
                  <div className="cf-ch-icon">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                  </div>
                  <div>
                    <div className="cf-ch-title">Identificação do pedido</div>
                    <div className="cf-ch-sub">Um nome para encontrar fácil na sua área do cliente</div>
                  </div>
                </div>
                <div className="cf-card-body">
                  <input
                    type="text"
                    className="cf-id-input"
                    placeholder="Ex: Camisetas turma 2025, Moletom evento abril..."
                    value={identificacao}
                    onChange={e => setIdentificacao(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <p className="cf-id-hint">Mínimo 3 caracteres para avançar</p>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="cf-card">
              <div className="cf-card-head">
                <div className="cf-ch-icon">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div>
                  <div className="cf-ch-title">Detalhes do produto</div>
                  <div className="cf-ch-sub">Envie sua arte e configure a estampa</div>
                </div>
              </div>
              <div className="cf-card-body">
                <p style={{ fontSize: 13, color: 'rgba(250,250,248,.48)' }}>
                  Em breve você poderá enviar sua arte e configurar a posição da estampa aqui.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="cf-card">
              <div className="cf-card-head">
                <div className="cf-ch-icon">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="cf-ch-title">Detalhes do pedido</div>
                  <div className="cf-ch-sub">Informe os detalhes finais e revise seu pedido</div>
                </div>
              </div>
              <div className="cf-card-body">
                <p style={{ fontSize: 13, color: 'rgba(250,250,248,.48)' }}>
                  Revise todas as informações antes de enviar para orçamento via WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* ── FOOTER NAV ───────────────────────────────────────────────── */}
          <div className="cf-footer-row">
            {currentStep < STEPS.length ? (
              <>
                <button type="button" className="cf-btn-back" onClick={handleBack}>
                  ← Voltar
                </button>
                <button
                  className={`cf-btn-next ${btnNextOn || currentStep > 1 ? 'on' : ''}`}
                  onClick={() => {
                    if (currentStep === 1) {
                      if (!btnNextOn) return
                      navigate(ROUTES.DETALHES_PRODUTO, {
                        state: {
                          fichaData: buildFichaData(),
                        },
                      })
                    } else {
                      setCurrentStep(s => s + 1)
                    }
                  }}
                >
                  {currentStep === 1 ? 'Próximo: Detalhes do produto' : `Próximo: ${STEPS[currentStep].label}`}
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </>
            ) : (
              <button className="cf-btn-next on">
                Finalizar e enviar orçamento
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>

        </div>{/* /cf-main */}

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <div className="cf-sidebar">

          {/* Progresso */}
          <div className="cf-sb-blk">
            <div className="cf-sb-lbl">Progresso</div>
            <div className="cf-pb-wrap">
              <div className="cf-pb-fill" style={{ width: `${progressPct}%` }} />
            </div>
            {STEPS.map(step => (
              <div key={step.id} className="cf-pi">
                <div className={`cf-pidot ${currentStep === step.id ? 'active' : currentStep > step.id ? 'done' : ''}`}>
                  {step.id}
                </div>
                <div>
                  <div className={`cf-piname ${currentStep === step.id ? 'active' : currentStep > step.id ? 'done' : ''}`}>
                    {step.label}
                  </div>
                  <div className="cf-pidet">
                    {step.id === 1
                      ? stepDetail
                      : currentStep > step.id
                      ? 'Concluído'
                      : 'Aguardando...'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="cf-sb-blk">
            <div className="cf-sb-lbl">Resumo</div>
            <div className="cf-ri">
              <span className="cf-rk">Peça</span>
              <span className={`cf-rv ${!tipoResumo ? 'empty' : ''}`}>{tipoResumo || '—'}</span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Gramatura e Modelagem</span>
              <span className={`cf-rv ${!modelagemResumo ? 'empty' : ''}`}>{modelagemResumo || '—'}</span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Tamanhos</span>
              <span className={`cf-rv ${tamanhosResumo.length === 0 ? 'empty' : ''}`}>
                {tamanhosResumo.length ? tamanhosResumo.join(', ') : '—'}
              </span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Qtd. total</span>
              <span className={`cf-rv ${totalPecas === 0 ? 'empty' : ''}`}>
                {totalPecas || '—'}
              </span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Identificação</span>
              <span className={`cf-rv ${!identificacao ? 'empty' : ''}`}>
                {identificacao || '—'}
              </span>
            </div>
          </div>

          {/* Dica */}
          <div className="cf-dica">
            <div className="cf-dica-t">💡 Dica do estúdio</div>
            <div className="cf-dica-b">
              Caso a modelagem ou gramatura desejada seja diferente, selecione outra opção e especifique no atendimento final.
            </div>
          </div>

        </div>{/* /cf-sidebar */}

      </div>{/* /cf-layout */}
    </div>
  )
}
