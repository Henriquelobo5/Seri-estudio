import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import ThreeViewer from '../../components/ui/ThreeViewer'
import logo from '../../assets/images/logo.png'
import './DetalhesProduto.css'

// ── Dados ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

type PosKey = 'fc' | 'fe' | 'fd' | 'cc' | 'me' | 'md'

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, [string, string]> = {
  png:  ['#DBEAFE', '#1E40AF'],
  jpg:  ['#DBEAFE', '#1E40AF'],
  jpeg: ['#DBEAFE', '#1E40AF'],
  pdf:  ['#FEE2E2', '#991B1B'],
  ai:   ['#FEF3C7', '#92400E'],
  svg:  ['#EDE9FE', '#5B21B6'],
}

function makePlaceholderDataUrl(ext: string): string {
  const oc = document.createElement('canvas')
  oc.width = 256; oc.height = 256
  const c = oc.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, 'rgba(80,50,200,.14)')
  g.addColorStop(1, 'rgba(50,80,200,.07)')
  c.fillStyle = g
  c.fillRect(0, 0, 256, 256)
  c.strokeStyle = 'rgba(80,50,200,.3)'
  c.lineWidth = 3
  c.strokeRect(10, 10, 236, 236)
  c.fillStyle = 'rgba(80,50,200,.8)'
  c.font = 'bold 52px DM Sans,sans-serif'
  c.textAlign = 'center'
  c.fillText(ext.toUpperCase(), 128, 120)
  c.fillStyle = 'rgba(80,50,200,.5)'
  c.font = '16px DM Sans,sans-serif'
  c.fillText('preview representativo', 128, 162)
  return oc.toDataURL()
}

type ProductConfig = {
  modelUrl:           string | null
  posicoes:           { key: PosKey; label: string }[]
  hideMeshMaterials?: string[]
  hidePosSelector?:   boolean
}

const TODAS_POSICOES: { key: PosKey; label: string }[] = [
  { key: 'fc', label: 'Frente central' },
  { key: 'fe', label: 'Frente esq.' },
  { key: 'fd', label: 'Frente dir.' },
  { key: 'cc', label: 'Costas' },
  { key: 'me', label: 'Manga esq.' },
  { key: 'md', label: 'Manga dir.' },
]

const PRODUCT_CONFIG: Record<string, ProductConfig> = {
  Camiseta: { modelUrl: '/models/tshirt.glb', posicoes: TODAS_POSICOES },
  Moletom:  { modelUrl: '/models/hoodie.glb', posicoes: TODAS_POSICOES },
  Regata: {
    modelUrl: '/models/regata.glb',
    posicoes: [
      { key: 'fc', label: 'Frente central' },
      { key: 'fe', label: 'Frente esq.' },
      { key: 'fd', label: 'Frente dir.' },
      { key: 'cc', label: 'Costas' },
    ],
  },
  Polo: {
    modelUrl:          '/models/polo.glb',
    hideMeshMaterials: ['PT_FABRIC'],
    posicoes:          TODAS_POSICOES,
  },
  Ecobag: {
    modelUrl:        '/models/ecobag.glb',
    hidePosSelector: true,
    posicoes:        [{ key: 'fc', label: 'Frente' }],
  },
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DetalhesProduto() {
  const navigate = useNavigate()
  const location = useLocation()
  const locState = (location.state ?? {}) as { fichaId?: number; fichaData?: any }
  const tipo     = locState.fichaData?.tipo ?? 'Camiseta'
  const config   = PRODUCT_CONFIG[tipo] ?? PRODUCT_CONFIG['Camiseta']

  const artObjUrlRef = useRef<string | null>(null)

  const [modelLoaded, setModelLoaded] = useState(false)
  const [file,    setFile]    = useState<File | null>(null)
  const [artUrl,  setArtUrl]  = useState<string | null>(null)
  const [pos,     setPos]     = useState<PosKey>('fc')
  const [largura, setLargura] = useState(20)
  const [altura,  setAltura]  = useState(25)
  const [obs,     setObs]     = useState('')
  const [toast,   setToast]   = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [hintGone,    setHintGone]    = useState(false)
  const [moveMode,    setMoveMode]    = useState(false)
  const [artRotation, setArtRotation] = useState(0)
  const [artScale,    setArtScale]    = useState(1)
  const [flipH,       setFlipH]       = useState(false)
  const [flipV,       setFlipV]       = useState(false)

  const btnNextOn = file !== null

  const handleModelLoad = useCallback(() => setModelLoaded(true), [])

  useEffect(() => {
    return () => { if (artObjUrlRef.current) URL.revokeObjectURL(artObjUrlRef.current) }
  }, [])

  // ── Handle file upload ─────────────────────────────────────────────────────
  function handleFile(f: File) {
    const ext   = f.name.split('.').pop()?.toLowerCase() ?? ''
    const isImg = ['png', 'jpg', 'jpeg', 'svg'].includes(ext)
    setFile(f)
    if (!hintGone) setHintGone(true)

    if (isImg) {
      if (artObjUrlRef.current) URL.revokeObjectURL(artObjUrlRef.current)
      const url = URL.createObjectURL(f)
      artObjUrlRef.current = url
      setArtUrl(url)
      showToast('Arte aplicada! Gire para ver.')
    } else {
      if (artObjUrlRef.current) { URL.revokeObjectURL(artObjUrlRef.current); artObjUrlRef.current = null }
      setArtUrl(makePlaceholderDataUrl(ext))
      showToast('Vetorial: preview representativo')
    }
  }

  function removeFile() {
    if (artObjUrlRef.current) { URL.revokeObjectURL(artObjUrlRef.current); artObjUrlRef.current = null }
    setFile(null)
    setArtUrl(null)
    setArtRotation(0)
    setArtScale(1)
    setFlipH(false)
    setFlipV(false)
    const inp = document.getElementById('dp-fi') as HTMLInputElement
    if (inp) inp.value = ''
  }

  function handlePosChange(p: PosKey) { setPos(p) }

  // ── Drag-and-drop global ────────────────────────────────────────────────────
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer?.files[0]
      if (f) handleFile(f)
    }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setToastOn(true)
    setTimeout(() => setToastOn(false), 3200)
  }

  // ── ExtChip ────────────────────────────────────────────────────────────────
  function ExtChip() {
    if (!file) return null
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const [bg, fg] = EXT_COLORS[ext] ?? ['#333', '#aaa']
    return (
      <div className="dp-fchip">
        <span className="dp-fext" style={{ background: bg, color: fg }}>
          {ext.toUpperCase()}
        </span>
        <span className="dp-fname">{file.name}</span>
        <button className="dp-fdel" onClick={removeFile}>×</button>
      </div>
    )
  }

  const posLabel = config.posicoes.find(p => p.key === pos)?.label ?? ''

  return (
    <div className="dp-page">
      <div className="dp-grain" aria-hidden="true" />

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="dp-nav">
        <Link to={ROUTES.HOME} className="dp-nav-brand">
          <div className="dp-nav-logo"><img src={logo} alt="Seri." /></div>
          <span className="dp-nav-name">Seri.</span>
        </Link>
        <div className="dp-nav-center">
          <Link to={ROUTES.HOME}>Home</Link>
          <Link to={ROUTES.CATALOGO}>Portfólio</Link>
          <a href={`${ROUTES.HOME}#como-funciona`}>Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`}>Contato</a>
          <MyOrdersLink hideForAdmin>Meus pedidos</MyOrdersLink>
        </div>
        <div className="dp-nav-right">
          <AuthNavCta className="dp-nav-cta" />
        </div>
      </nav>

      {/* ── STEPPER ─────────────────────────────────────────────────────────── */}
      <div className="dp-sbar">
        {STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`dp-step ${step.id === 2 ? 'active' : step.id < 2 ? 'done' : ''}`}>
              <div className="dp-snum">
                {step.id < 2 ? (
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : step.id}
              </div>
              <div className="dp-slabel">{step.label}</div>
            </div>
            {i < STEPS.length - 1 && <div className={`dp-sline ${step.id < 2 ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      {/* ── STAGE ───────────────────────────────────────────────────────────── */}
      <div className="dp-stage">

        {/* ESQUERDO */}
        <div className="dp-side">
          <div className="dp-side-scroll">

            <div className="dp-blk">
              <div className="dp-bh">Arte da estampa</div>
              <div className="dp-bb">
                <label className="dp-btn-up">
                  <input
                    id="dp-fi"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf,.ai"
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                  />
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Selecionar arquivo
                </label>
                {file && <ExtChip />}
                <div className="dp-aviso">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p>PDF e AI não exibem fundo. Use <strong>PNG transparente</strong> para melhor resultado.</p>
                </div>
              </div>
            </div>

            {!config.hidePosSelector && (
              <div className="dp-blk">
                <div className="dp-bh">Posição da estampa</div>
                <div className="dp-bb">
                  <div className="dp-pgrid">
                    {config.posicoes.map(({ key, label }) => (
                      <button
                        key={key}
                        className={`dp-pbtn ${pos === key ? 'sel' : ''}`}
                        onClick={() => handlePosChange(key as PosKey)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {artUrl && (
              <div className="dp-blk">
                <div className="dp-bh">Transformações da arte</div>
                <div className="dp-bb" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  <div className="dp-df">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Rotação</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="dp-tf-val">{artRotation}°</span>
                        {artRotation !== 0 && (
                          <button className="dp-tf-reset" onClick={() => setArtRotation(0)}>↺</button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range" min={-180} max={180} step={1}
                      value={artRotation}
                      className="dp-range"
                      onChange={e => setArtRotation(Number(e.target.value))}
                    />
                  </div>

                  <div className="dp-df">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Tamanho</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="dp-tf-val">{Math.round(artScale * 100)}%</span>
                        {artScale !== 1 && (
                          <button className="dp-tf-reset" onClick={() => setArtScale(1)}>↺</button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range" min={30} max={250} step={5}
                      value={Math.round(artScale * 100)}
                      className="dp-range"
                      onChange={e => setArtScale(Number(e.target.value) / 100)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      className={`dp-tf-flip ${flipH ? 'active' : ''}`}
                      onClick={() => setFlipH(f => !f)}
                    >
                      ⇄ Flip horizontal
                    </button>
                    <button
                      className={`dp-tf-flip ${flipV ? 'active' : ''}`}
                      onClick={() => setFlipV(f => !f)}
                    >
                      ⇅ Flip vertical
                    </button>
                  </div>

                </div>
              </div>
            )}

            <div className="dp-blk">
              <div className="dp-bh">Medidas da estampa</div>
              <div className="dp-bb" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="dp-drow">
                  <div className="dp-df">
                    <label>Largura</label>
                    <div className="dp-diw">
                      <input type="number" min={1} max={60} value={largura} onChange={e => setLargura(Number(e.target.value))} />
                      <span>cm</span>
                    </div>
                  </div>
                  <div className="dp-df">
                    <label>Altura</label>
                    <div className="dp-diw">
                      <input type="number" min={1} max={60} value={altura} onChange={e => setAltura(Number(e.target.value))} />
                      <span>cm</span>
                    </div>
                  </div>
                </div>
                <div className="dp-df">
                  <label>Observações</label>
                  <textarea
                    className="dp-obs"
                    placeholder="Ex: manter proporção, fundo transparente..."
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="dp-side-footer">
            <button className="dp-btn-back" onClick={() => navigate(ROUTES.CRIAR_FICHA)}>
              ← Voltar
            </button>
          </div>
        </div>

        {/* VIEWER */}
        <div className="dp-viewer" id="dp-vw">
          {config.modelUrl ? (
            <>
              {!modelLoaded && (
                <div className="dp-v-loading">
                  <div className="dp-spinner" />
                  <p>Carregando {tipo.toLowerCase()} 3D...</p>
                </div>
              )}
              <ThreeViewer
                modelUrl={config.modelUrl}
                artUrl={artUrl}
                pos={pos}
                moveMode={moveMode}
                color={locState.fichaData?.cor}
                artRotation={artRotation}
                artScale={artScale}
                flipH={flipH}
                flipV={flipV}
                hideMeshMaterials={config.hideMeshMaterials}
                onLoad={handleModelLoad}
              />
            </>
          ) : (
            <div className="dp-v-loading">
              <p style={{ opacity: 0.5, textAlign: 'center', padding: '0 2rem' }}>
                Visualização 3D não disponível<br />para este tipo de produto.
              </p>
            </div>
          )}

          {config.modelUrl && artUrl && (
            <button
              className={`dp-move-toggle ${moveMode ? 'active' : ''}`}
              onClick={() => setMoveMode(m => !m)}
              title={moveMode ? 'Clique para girar modelo' : 'Clique para mover arte'}
            >
              {moveMode ? (
                <>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
                  </svg>
                  Girar modelo
                </>
              ) : (
                <>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Mover arte
                </>
              )}
            </button>
          )}

          {config.modelUrl && !file && (
            <div className="dp-noart">
              <div className="dp-noart-ring">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p>Envie uma arte para<br />visualizar no {tipo.toLowerCase()}</p>
            </div>
          )}

          {config.modelUrl && file && (
            <div className="dp-art-badge">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Arte aplicada · Gire para ver
            </div>
          )}

          {config.modelUrl && !hintGone && (
            <div className="dp-v-hint">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
              </svg>
              Arraste para girar · Scroll para zoom
            </div>
          )}
        </div>

        {/* DIREITO */}
        <div className="dp-side">
          <div className="dp-side-scroll">
            <div className="dp-blk">
              <div className="dp-bh">Progresso</div>
              <div className="dp-bb">
                <div className="dp-pb-wrap">
                  <div className="dp-pb-fill" style={{ width: file ? '70%' : '50%' }} />
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot done">
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div className="dp-pname done">Produto</div>
                    <div className="dp-pdet">{locState.fichaData ? `${locState.fichaData.tipo} · ${locState.fichaData.cor} · ${(locState.fichaData.tamanhos ?? []).join(', ')}` : 'Concluído'}</div>
                  </div>
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot active">2</div>
                  <div>
                    <div className="dp-pname active">Detalhes do produto</div>
                    <div className="dp-pdet">{file ? `1 arquivo · ${posLabel}` : 'Aguardando arquivo...'}</div>
                  </div>
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot">3</div>
                  <div>
                    <div className="dp-pname">Detalhes do pedido</div>
                    <div className="dp-pdet">Aguardando...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dp-dica">
            <div className="dp-dica-t">💡 Dica do estúdio</div>
            <div className="dp-dica-b">
              Prefira AI ou PDF vetorial para estampas nítidas em qualquer tamanho.
            </div>
          </div>

          <div className="dp-side-footer">
            <button
              className={`dp-btn-next ${btnNextOn ? 'on' : ''}`}
              disabled={!btnNextOn}
              onClick={() => btnNextOn && navigate(ROUTES.DETALHES_PEDIDO, {
                state: {
                  fichaId: locState.fichaId,
                  fichaData: { ...locState.fichaData, posicao: config.posicoes.find(p => p.key === pos)?.label ?? '', arquivos: file ? 1 : 0, larguraEstampa: largura, alturaEstampa: altura, obsEstampa: obs },
                },
              })}
            >
              Próximo: Detalhes →
            </button>
          </div>
        </div>

      </div>

      <div className={`dp-toast ${toastOn ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
