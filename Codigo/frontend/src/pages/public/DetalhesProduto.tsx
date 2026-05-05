import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
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

type PosCfg = {
  topPct:   number
  localX:   number
  widthPct: number
  hPct:     number
  front:    boolean
}

type Product3DConfig = {
  splineUrl: string
  posicoes:  { key: PosKey; label: string }[]
  posCfg:    Record<string, PosCfg>
}

const BASE_POS_CFG: Record<string, PosCfg> = {
  fc: { topPct: 42, localX:  0,    widthPct: 30, hPct: 28, front: true  },
  fe: { topPct: 40, localX: -0.28, widthPct: 16, hPct: 18, front: true  },
  fd: { topPct: 40, localX:  0.28, widthPct: 16, hPct: 18, front: true  },
  cc: { topPct: 42, localX:  0,    widthPct: 30, hPct: 28, front: false },
  me: { topPct: 44, localX: -0.60, widthPct: 13, hPct: 13, front: true  },
  md: { topPct: 44, localX:  0.60, widthPct: 13, hPct: 13, front: true  },
}

const TODAS_POSICOES: { key: PosKey; label: string }[] = [
  { key: 'fc', label: 'Frente central' },
  { key: 'fe', label: 'Frente esq.' },
  { key: 'fd', label: 'Frente dir.' },
  { key: 'cc', label: 'Costas' },
  { key: 'me', label: 'Manga esq.' },
  { key: 'md', label: 'Manga dir.' },
]

const PRODUCT_3D_CONFIG: Record<string, Product3DConfig> = {
  Camiseta: {
    splineUrl: 'https://prod.spline.design/rfUuD0pkFEL3StiT/scene.splinecode',
    posicoes:  TODAS_POSICOES,
    posCfg:    BASE_POS_CFG,
  },
  Moletom: {
    splineUrl: 'https://prod.spline.design/MOLETOM_PLACEHOLDER/scene.splinecode',
    posicoes:  TODAS_POSICOES,
    posCfg:    BASE_POS_CFG,
  },
  Regata: {
    splineUrl: 'https://prod.spline.design/REGATA_PLACEHOLDER/scene.splinecode',
    posicoes:  [
      { key: 'fc', label: 'Frente central' },
      { key: 'fe', label: 'Frente esq.' },
      { key: 'fd', label: 'Frente dir.' },
      { key: 'cc', label: 'Costas' },
    ],
    posCfg: BASE_POS_CFG,
  },
  Polo: {
    splineUrl: 'https://prod.spline.design/POLO_PLACEHOLDER/scene.splinecode',
    posicoes:  TODAS_POSICOES,
    posCfg:    BASE_POS_CFG,
  },
  Ecobag: {
    splineUrl: 'https://prod.spline.design/ECOBAG_PLACEHOLDER/scene.splinecode',
    posicoes:  [
      { key: 'fc', label: 'Frente' },
      { key: 'cc', label: 'Costas' },
    ],
    posCfg: {
      fc: { topPct: 45, localX: 0, widthPct: 40, hPct: 35, front: true  },
      cc: { topPct: 45, localX: 0, widthPct: 40, hPct: 35, front: false },
    },
  },
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DetalhesProduto() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const locState  = (location.state ?? {}) as { fichaId?: number; fichaData?: any }
  const tipo      = locState.fichaData?.tipo ?? 'Camiseta'
  const config    = PRODUCT_3D_CONFIG[tipo] ?? PRODUCT_3D_CONFIG['Camiseta']

  const splineRef      = useRef<HTMLElement>(null)
  const [splineLoaded, setSplineLoaded] = useState(false)

  const artOverlayRef  = useRef<HTMLDivElement>(null)
  const cameraRef      = useRef<any>(null)
  const initialDistRef = useRef<number>(0)
  const rafRef         = useRef<number>(0)
  const posRef         = useRef<PosKey>('fc')
  const posCfgRef      = useRef(config.posCfg)
  const artUrlRef      = useRef<string | null>(null)
  const artObjUrlRef   = useRef<string | null>(null) // object URL para revogar

  // Estado
  const [file,    setFile]    = useState<File | null>(null)
  const [artUrl,  setArtUrl]  = useState<string | null>(null)
  const [pos,     setPos]     = useState<PosKey>('fc')
  const [largura, setLargura] = useState(20)
  const [altura,  setAltura]  = useState(25)
  const [obs,     setObs]     = useState('')
  const [toast,   setToast]   = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [hintGone,setHintGone]= useState(false)

  const btnNextOn = file !== null

  // Mantém refs sincronizados com estado
  useEffect(() => { posRef.current = pos },    [pos])
  useEffect(() => { artUrlRef.current = artUrl }, [artUrl])

  // ── RAF: lê posição real da câmera → aplica CSS transform no overlay ────────
  const startRaf = useCallback(() => {
    const loop = () => {
      const cam     = cameraRef.current
      const overlay = artOverlayRef.current

      if (cam?.position && overlay && artUrlRef.current) {
        const cx   = cam.position.x as number
        const cy   = cam.position.y as number
        const cz   = cam.position.z as number
        const dist = Math.sqrt(cx*cx + cy*cy + cz*cz) || 1

        // Azimute (ângulo horizontal da câmera)
        const az = Math.atan2(cx, cz)
        // Elevação (ângulo vertical da câmera)
        const ev = Math.atan2(-cy, Math.sqrt(cx*cx + cz*cz))

        const cfg = posCfgRef.current[posRef.current]
        if (!cfg) { rafRef.current = requestAnimationFrame(loop); return }

        // Visibilidade: fade suave ao girar para o lado oposto da arte
        let vis: number
        if (posRef.current === 'cc') {
          // Costas: visível quando câmera está atrás (az ≈ ±π)
          vis = Math.max(0, -Math.cos(az))
        } else if (posRef.current === 'me') {
          // Manga esq. (do usuário = direita da câmera): visible quando az > 0
          vis = Math.max(0, Math.sin(az))
        } else if (posRef.current === 'md') {
          // Manga dir. (do usuário = esquerda da câmera): visible quando az < 0
          vis = Math.max(0, -Math.sin(az))
        } else {
          // Frente: visível quando câmera está na frente (az ≈ 0)
          vis = Math.max(0, Math.cos(az))
        }

        // Compensação de zoom: mantém a arte no mesmo tamanho visual
        const zoom = initialDistRef.current > 0 ? initialDistRef.current / dist : 1

        // Deslocamento X em pixels para posições fora do centro.
        // À medida que a camisa gira, o ponto localX acompanha: localX * cos(az)
        const viewerW    = overlay.parentElement?.clientWidth ?? 800
        const shirtHalfW = viewerW * 0.20 // estimativa de metade da largura da camisa em px
        const xPx        = cfg.localX * shirtHalfW * Math.cos(az)

        // Rotação Y: para frente, -az (camisa gira junto com câmera).
        // Para costas, espelha: a face traseira aponta na direção oposta.
        const rotY = cfg.front ? -az : (Math.PI - az)

        overlay.style.top     = `${cfg.topPct}%`
        overlay.style.width   = `${cfg.widthPct}%`
        overlay.style.height  = `${cfg.hPct}%`
        overlay.style.opacity = String(vis)
        overlay.style.transform =
          `translate(calc(-50% + ${xPx.toFixed(1)}px), -50%) ` +
          `perspective(900px) ` +
          `rotateY(${rotY.toFixed(4)}rad) ` +
          `rotateX(${(ev * 0.5).toFixed(4)}rad) ` +
          `scale(${zoom.toFixed(4)})`
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  // ── Spline: aguarda carregamento e captura câmera ───────────────────────────
  useEffect(() => {
    const el = splineRef.current
    if (!el) return

    let initialized = false

    const initScene = () => {
      if (initialized) return
      const anyEl = el as any

      // Spline@1.9.x expõe a Application em el._spline
      const app = anyEl._spline ?? anyEl.spline
      if (!app) return

      // Câmera Three.js interna do viewer
      const cam =
        (app as any)._camera ??
        (app as any).camera  ??
        null

      if (!cam?.position) {
        console.warn('[Arte3D] Câmera não encontrada — props do app:', Object.keys(app as object).slice(0, 20))
        return
      }

      initialized = true
      cameraRef.current = cam
      const { x, y, z } = cam.position
      initialDistRef.current = Math.sqrt(x*x + y*y + z*z)

      // Esconde logo do Spline
      const sh = el.shadowRoot as ShadowRoot | null
      if (sh && !sh.querySelector('#_hsl')) {
        const s = document.createElement('style')
        s.id = '_hsl'
        s.textContent = '#logo,a[href*="spline"],[id*="logo"]{display:none!important;opacity:0!important}'
        sh.appendChild(s)
      }

      startRaf()
    }

    const onLoadComplete = () => {
      setSplineLoaded(true)
      setTimeout(initScene, 200)
    }

    el.addEventListener('load-complete', onLoadComplete)

    // Fallback: polling caso o evento já tenha disparado
    const poll = setInterval(() => {
      if ((el as any)._loaded) {
        setSplineLoaded(true)
        initScene()
        if (initialized) clearInterval(poll)
      }
    }, 500)

    // Timeout de segurança
    const timeout = setTimeout(() => {
      setSplineLoaded(true)
      initScene()
    }, 10000)

    return () => {
      el.removeEventListener('load-complete', onLoadComplete)
      clearInterval(poll)
      clearTimeout(timeout)
      cancelAnimationFrame(rafRef.current)
    }
  }, [startRaf])

  // Libera object URL ao desmontar
  useEffect(() => {
    return () => {
      if (artObjUrlRef.current) URL.revokeObjectURL(artObjUrlRef.current)
    }
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
      artUrlRef.current = url
      showToast('Arte aplicada! Gire para ver.')
    } else {
      if (artObjUrlRef.current) { URL.revokeObjectURL(artObjUrlRef.current); artObjUrlRef.current = null }
      const dataUrl = makePlaceholderDataUrl(ext)
      setArtUrl(dataUrl)
      artUrlRef.current = dataUrl
      showToast('Vetorial: preview representativo')
    }
  }

  function removeFile() {
    if (artObjUrlRef.current) { URL.revokeObjectURL(artObjUrlRef.current); artObjUrlRef.current = null }
    setFile(null)
    setArtUrl(null)
    artUrlRef.current = null
    const inp = document.getElementById('dp-fi') as HTMLInputElement
    if (inp) inp.value = ''
  }

  function handlePosChange(p: PosKey) {
    setPos(p)
    posRef.current = p
  }

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

            <div className="dp-blk">
              <div className="dp-bh">Dimensões e observações</div>
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
          {!splineLoaded && (
            <div className="dp-v-loading">
              <div className="dp-spinner" />
              <p>Carregando {tipo.toLowerCase()} 3D...</p>
            </div>
          )}

          <spline-viewer
            key={tipo}
            ref={splineRef as React.RefObject<HTMLElement>}
            url={config.splineUrl}
            loading-anim-type="none"
          />

          {/* Arte sobreposta — rastreada pela posição real da câmera Spline via RAF */}
          {artUrl && (
            <div
              ref={artOverlayRef}
              className="dp-art-overlay"
              style={{ backgroundImage: `url(${artUrl})` }}
            />
          )}

          {!file && (
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

          {file && (
            <div className="dp-art-badge">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Arte aplicada · Gire para ver
            </div>
          )}

          {!hintGone && (
            <div className="dp-v-hint">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
              </svg>
              Arraste para girar · Scroll para zoom
            </div>
          )}

          <div className="dp-zbtns">
            <div className="dp-zb" title="Zoom in"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
            <div className="dp-zb" title="Zoom out"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
            <div className="dp-zb" title="Resetar"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div>
          </div>
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
                  fichaData: { ...locState.fichaData, posicao: config.posicoes.find(p => p.key === pos)?.label ?? '', arquivos: file ? 1 : 0 },
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
