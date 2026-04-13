import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import './ConstrutorFichaTecnica.css'

// ── Dados ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

const TIPOS = [
  { nome: 'Camiseta', emoji: '👕', desc: 'Careca / V' },
  { nome: 'Moletom',  emoji: '🧥', desc: 'Canguru / Raglan' },
  { nome: 'Regata',   emoji: '🎽', desc: 'Básica / Dry Fit' },
  { nome: 'Polo',     emoji: '👔', desc: 'Piquê / Malha' },
  { nome: 'Ecobag',   emoji: '👜', desc: 'Algodão reforçado' },
]

const TECIDOS = [
  '100% Algodão',
  'Algodão + Poliéster (50/50)',
  'Dry-fit / Poliéster',
  'Piquet / Malha',
  'Moletom Fleece',
  'Moletom Plush',
  'Ribana',
  'TNT (ecobag)',
  'Lona (ecobag)',
]

const GRAMATURAS = [
  '100g/m² — Levíssima',
  '120g/m² — Leve',
  '140g/m² — Intermediária',
  '160g/m² — Standard',
  '180g/m² — Pesada (recomendada)',
  '200g/m² — Extra pesada',
  '220g/m² — Premium',
  '280g/m² — Moletom leve',
  '300g/m² — Moletom standard',
  '350g/m² — Moletom pesado',
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

const TAM_ADULTO    = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']
const TAM_BABYLOOK  = ['Babylook P', 'Babylook M', 'Babylook G', 'Inf. 2', 'Inf. 4', 'Inf. 6', 'Inf. 8', 'Inf. 10', 'Inf. 12']
const TAM_OUTROS    = ['Único', 'Over P', 'Over M', 'Over G']

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return (email ?? 'U').slice(0, 2).toUpperCase()
}

function gramShort(gram: string) {
  return gram.split(' ')[0]
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function ConstrutorFichaTecnica() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [tipo,        setTipo]        = useState('Camiseta')
  const [tecido,      setTecido]      = useState('100% Algodão')
  const [gramatura,   setGramatura]   = useState('180g/m² — Pesada (recomendada)')
  const [cor,         setCor]         = useState('Preto')
  const [tamanhos,    setTamanhos]    = useState<string[]>(['M', 'G'])
  const [identificacao, setIdentificacao] = useState('')

  const toggleTam = (tam: string) =>
    setTamanhos(prev => prev.includes(tam) ? prev.filter(t => t !== tam) : [...prev, tam])

  // progresso
  const score = [
    true,                        // tipo sempre selecionado
    true,                        // cor sempre selecionada
    tamanhos.length > 0,
    identificacao.length > 2,
  ].filter(Boolean).length
  const progressPct = Math.max(15, Math.round((score / 4) * 75))

  const btnNextOn = tamanhos.length > 0 && identificacao.length > 2

  // step detail no sidebar
  const stepDetail = `${tipo} · ${cor}` + (tamanhos.length ? ` · ${tamanhos.join(', ')}` : '')

  const initials = getInitials(user?.name, user?.email)

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
          <Link to={ROUTES.MEUS_PEDIDOS}>Meus pedidos</Link>
        </div>

        <div className="cf-nav-right">
          <div className="cf-nav-cta" style={{ cursor: 'default' }}>
            <div className="cf-nav-avatar">{initials}</div>
            Minha conta
          </div>
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
                    {TIPOS.map(({ nome, emoji, desc }) => (
                      <button
                        key={nome}
                        className={`cf-tipo-btn ${tipo === nome ? 'sel' : ''}`}
                        onClick={() => setTipo(nome)}
                      >
                        <div className="cf-tipo-check">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <span className="cf-tipo-emoji">{emoji}</span>
                        <span className="cf-tipo-nome">{nome}</span>
                        <span className="cf-tipo-desc">{desc}</span>
                      </button>
                    ))}
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
                    <div className="cf-ch-title">Especificações do tecido</div>
                    <div className="cf-ch-sub">Composição, gramatura, cor e tamanhos</div>
                  </div>
                </div>
                <div className="cf-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

                  {/* Tecido + Gramatura */}
                  <div className="cf-spec-row">
                    <div className="cf-fld">
                      <label>Tecido</label>
                      <select className="cf-select" value={tecido} onChange={e => setTecido(e.target.value)}>
                        {TECIDOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="cf-fld">
                      <label>Gramatura</label>
                      <select className="cf-select" value={gramatura} onChange={e => setGramatura(e.target.value)}>
                        {GRAMATURAS.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Cor */}
                  <div className="cf-fld">
                    <label>Cor da peça</label>
                    <div className="cf-cores-grid">
                      {CORES.map(({ nome, hex, borda }) => (
                        <div
                          key={nome}
                          title={nome}
                          className={`cf-cor-dot ${cor === nome ? 'sel' : ''}`}
                          style={{
                            background: hex,
                            border: borda ? '2px solid rgba(255,255,255,.25)' : undefined,
                          }}
                          onClick={() => setCor(nome)}
                        />
                      ))}
                    </div>
                    <div className="cf-cor-label">
                      Selecionado: <strong>{cor}</strong>
                    </div>
                  </div>

                  {/* Tamanhos */}
                  <div className="cf-fld">
                    <label>
                      Tamanhos{' '}
                      <span style={{ fontSize: 10, color: 'rgba(250,250,248,.22)', textTransform: 'none', letterSpacing: 0 }}>
                        (selecione um ou mais)
                      </span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <div className="cf-tam-group-label">Adulto</div>
                        <div className="cf-tam-row">
                          {TAM_ADULTO.map(t => (
                            <button
                              key={t}
                              className={`cf-tam-btn ${tamanhos.includes(t) ? 'sel' : ''}`}
                              onClick={() => toggleTam(t)}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="cf-tam-group-label">Infantil / Babylook</div>
                        <div className="cf-tam-row">
                          {TAM_BABYLOOK.map(t => (
                            <button
                              key={t}
                              className={`cf-tam-btn ${tamanhos.includes(t) ? 'sel' : ''}`}
                              onClick={() => toggleTam(t)}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="cf-tam-group-label">Outros</div>
                        <div className="cf-tam-row">
                          {TAM_OUTROS.map(t => (
                            <button
                              key={t}
                              className={`cf-tam-btn ${tamanhos.includes(t) ? 'sel' : ''}`}
                              onClick={() => toggleTam(t)}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

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
              <button
                className={`cf-btn-next ${btnNextOn || currentStep > 1 ? 'on' : ''}`}
                onClick={() => {
                  if (currentStep === 1) {
                    navigate(ROUTES.DETALHES_PRODUTO)
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
              <span className="cf-rv">{tipo}</span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Tecido</span>
              <span className="cf-rv">{tecido.split(' (')[0]}</span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Gramatura</span>
              <span className="cf-rv">{gramShort(gramatura)}</span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Cor</span>
              <span className="cf-rv">{cor}</span>
            </div>
            <div className="cf-ri">
              <span className="cf-rk">Tamanhos</span>
              <span className={`cf-rv ${tamanhos.length === 0 ? 'empty' : ''}`}>
                {tamanhos.length ? tamanhos.join(', ') : '—'}
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
              Para estampas em silk, preferimos algodão 180g/m² — melhor absorção de tinta e acabamento duradouro.
            </div>
          </div>

        </div>{/* /cf-sidebar */}

      </div>{/* /cf-layout */}
    </div>
  )
}
