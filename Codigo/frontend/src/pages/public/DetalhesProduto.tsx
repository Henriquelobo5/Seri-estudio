import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/images/logo.png'
import './DetalhesProduto.css'

// ── Dados ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

const POSICOES = [
  { key: 'fc', label: 'Frente central' },
  { key: 'fe', label: 'Frente esq.' },
  { key: 'fd', label: 'Frente dir.' },
  { key: 'cc', label: 'Costas' },
  { key: 'me', label: 'Manga esq.' },
  { key: 'md', label: 'Manga dir.' },
]

type PosKey = 'fc' | 'fe' | 'fd' | 'cc' | 'me' | 'md'

interface PosConfig {
  left: string
  top: string
  w: number
  h: number
}

const POS_CONFIG: Record<PosKey, PosConfig> = {
  fc: { left: '50%', top: '42%', w: 120, h: 120 },
  fe: { left: '41%', top: '36%', w: 60,  h: 60  },
  fd: { left: '59%', top: '36%', w: 60,  h: 60  },
  cc: { left: '50%', top: '42%', w: 110, h: 110 },
  me: { left: '29%', top: '36%', w: 50,  h: 50  },
  md: { left: '71%', top: '36%', w: 50,  h: 50  },
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

const EXT_COLORS: Record<string, [string, string]> = {
  png:  ['#DBEAFE', '#1E40AF'],
  jpg:  ['#DBEAFE', '#1E40AF'],
  jpeg: ['#DBEAFE', '#1E40AF'],
  pdf:  ['#FEE2E2', '#991B1B'],
  ai:   ['#FEF3C7', '#92400E'],
  svg:  ['#EDE9FE', '#5B21B6'],
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function DetalhesProduto() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initials = getInitials(user?.name, user?.email)

  // Spline
  const splineRef   = useRef<HTMLElement>(null)
  const [splineLoaded, setSplineLoaded] = useState(false)

  // Canvas arte
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [artImg, setArtImg] = useState<HTMLImageElement | null>(null)

  // Estado
  const [file,      setFile]      = useState<File | null>(null)
  const [pos,       setPos]       = useState<PosKey>('fc')
  const [largura,   setLargura]   = useState(20)
  const [altura,    setAltura]    = useState(25)
  const [obs,       setObs]       = useState('')
  const [toast,     setToast]     = useState('')
  const [toastOn,   setToastOn]   = useState(false)
  const [hintGone,  setHintGone]  = useState(false)

  const btnNextOn = file !== null

  // ── Spline load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = splineRef.current
    if (!el) return

    const onLoad = () => {
      setSplineLoaded(true)
      setTimeout(() => {
        const sh = (el as HTMLElement & { shadowRoot: ShadowRoot | null }).shadowRoot
        if (!sh) return
        if (!sh.querySelector('#_hsl')) {
          const s = document.createElement('style')
          s.id = '_hsl'
          s.textContent =
            '#logo,a[href*="spline"],[id*="logo"]{display:none!important;opacity:0!important}'
          sh.appendChild(s)
        }
      }, 400)
    }

    el.addEventListener('load', onLoad)
    const timeout = setTimeout(() => setSplineLoaded(true), 8000)
    return () => {
      el.removeEventListener('load', onLoad)
      clearTimeout(timeout)
    }
  }, [])

  // ── Desenhar arte no canvas ────────────────────────────────────────────────
  function applyArt(img: HTMLImageElement, p: PosKey) {
    const canvas = canvasRef.current
    if (!canvas) return
    const cfg = POS_CONFIG[p]
    canvas.width  = cfg.w
    canvas.height = cfg.h
    canvas.style.left      = cfg.left
    canvas.style.top       = cfg.top
    canvas.style.marginLeft = `-${cfg.w / 2}px`
    canvas.style.marginTop  = `-${cfg.h / 2}px`
    canvas.style.width  = `${cfg.w}px`
    canvas.style.height = `${cfg.h}px`
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, cfg.w, cfg.h)
    ctx.drawImage(img, 0, 0, cfg.w, cfg.h)
    canvas.classList.add('dp-canvas-show')
  }

  // ── Handle file ────────────────────────────────────────────────────────────
  function handleFile(f: File) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    const isImg = ['png', 'jpg', 'jpeg', 'svg'].includes(ext)

    setFile(f)
    if (!hintGone) setHintGone(true)

    if (isImg) {
      const url = URL.createObjectURL(f)
      const img = new Image()
      img.onload = () => {
        setArtImg(img)
        applyArt(img, pos)
        showToast('Arte aplicada! Gire para ver.')
      }
      img.src = url
    } else {
      const oc  = document.createElement('canvas')
      oc.width  = 256
      oc.height = 256
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
      const img = new Image()
      img.src = oc.toDataURL()
      img.onload = () => {
        setArtImg(img)
        applyArt(img, pos)
      }
      showToast('Vetorial: preview sem fundo real')
    }
  }

  function removeFile() {
    setFile(null)
    setArtImg(null)
    const canvas = canvasRef.current
    if (canvas) {
      canvas.classList.remove('dp-canvas-show')
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    }
    const inp = document.getElementById('dp-fi') as HTMLInputElement
    if (inp) inp.value = ''
  }

  function handlePosChange(p: PosKey) {
    setPos(p)
    if (artImg) applyArt(artImg, p)
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
  }, [artImg, pos])

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setToastOn(true)
    setTimeout(() => setToastOn(false), 3200)
  }

  // ── Extensão chip ──────────────────────────────────────────────────────────
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

  // ── Posição label ──────────────────────────────────────────────────────────
  const posLabel = POSICOES.find(p => p.key === pos)?.label ?? ''

  return (
    <div className="dp-page">
      <div className="dp-grain" aria-hidden="true" />

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="dp-nav">
        <Link to={ROUTES.HOME} className="dp-nav-brand">
          <div className="dp-nav-logo">
            <img src={logo} alt="Seri." />
          </div>
          <span className="dp-nav-name">Seri.</span>
        </Link>

        <div className="dp-nav-center">
          <Link to={ROUTES.HOME}>Home</Link>
          <Link to={ROUTES.CATALOGO}>Portfólio</Link>
          <a href={`${ROUTES.HOME}#como-funciona`}>Como funciona</a>
          <a href={`${ROUTES.HOME}#contato`}>Contato</a>
          <Link to={ROUTES.MEUS_PEDIDOS}>Meus pedidos</Link>
        </div>

        <div className="dp-nav-right">
          <div className="dp-nav-cta" style={{ cursor: 'default' }}>
            <div className="dp-nav-avatar">{initials}</div>
            Minha conta
          </div>
        </div>
      </nav>

      {/* ── STEPPER ─────────────────────────────────────────────────────────── */}
      <div className="dp-sbar">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}
          >
            <div
              className={`dp-step ${
                step.id === 2 ? 'active' : step.id < 2 ? 'done' : ''
              }`}
            >
              <div className="dp-snum">
                {step.id < 2 ? (
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="dp-slabel">{step.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`dp-sline ${step.id < 2 ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STAGE ───────────────────────────────────────────────────────────── */}
      <div className="dp-stage">

        {/* ESQUERDO */}
        <div className="dp-side">
          <div className="dp-side-scroll">

            {/* Upload */}
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

            {/* Posição */}
            <div className="dp-blk">
              <div className="dp-bh">Posição da estampa</div>
              <div className="dp-bb">
                <div className="dp-pgrid">
                  {POSICOES.map(({ key, label }) => (
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

            {/* Dimensões + Obs */}
            <div className="dp-blk">
              <div className="dp-bh">Dimensões e observações</div>
              <div className="dp-bb" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="dp-drow">
                  <div className="dp-df">
                    <label>Largura</label>
                    <div className="dp-diw">
                      <input
                        type="number" min={1} max={60}
                        value={largura}
                        onChange={e => setLargura(Number(e.target.value))}
                      />
                      <span>cm</span>
                    </div>
                  </div>
                  <div className="dp-df">
                    <label>Altura</label>
                    <div className="dp-diw">
                      <input
                        type="number" min={1} max={60}
                        value={altura}
                        onChange={e => setAltura(Number(e.target.value))}
                      />
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

          {/* Loading */}
          {!splineLoaded && (
            <div className="dp-v-loading">
              <div className="dp-spinner" />
              <p>Carregando camiseta 3D...</p>
            </div>
          )}

          <spline-viewer
            ref={splineRef as React.RefObject<HTMLElement>}
            url="https://prod.spline.design/rfUuD0pkFEL3StiT/scene.splinecode"
            loading-anim-type="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Canvas arte */}
          <canvas
            ref={canvasRef}
            className="dp-art-canvas"
            width={256}
            height={256}
            style={{ mixBlendMode: 'multiply' }}
          />

          {/* No-art placeholder */}
          {!file && (
            <div className="dp-noart">
              <div className="dp-noart-ring">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p>Envie uma arte para<br />visualizar na camiseta</p>
            </div>
          )}

          {/* Badge arte aplicada */}
          {file && (
            <div className="dp-art-badge">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Arte aplicada
            </div>
          )}

          {/* Hint arraste */}
          {!hintGone && (
            <div className="dp-v-hint">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
              </svg>
              Arraste para girar · Scroll para zoom
            </div>
          )}

          {/* Zoom buttons */}
          <div className="dp-zbtns">
            <div className="dp-zb" title="Zoom in">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="dp-zb" title="Zoom out">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="dp-zb" title="Resetar">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* DIREITO */}
        <div className="dp-side">
          <div className="dp-side-scroll">

            {/* Progresso */}
            <div className="dp-blk">
              <div className="dp-bh">Progresso</div>
              <div className="dp-bb">
                <div className="dp-pb-wrap">
                  <div className="dp-pb-fill" style={{ width: file ? '70%' : '50%' }} />
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot done">
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="dp-pname done">Produto</div>
                    <div className="dp-pdet">Camiseta · Preto · M, G</div>
                  </div>
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot active">2</div>
                  <div>
                    <div className="dp-pname active">Detalhes do produto</div>
                    <div className="dp-pdet">
                      {file ? `1 arquivo · ${posLabel}` : 'Aguardando arquivo...'}
                    </div>
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
              onClick={() => btnNextOn && navigate(ROUTES.DETALHES_PEDIDO)}
            >
              Próximo: Detalhes →
            </button>
          </div>
        </div>

      </div>{/* /dp-stage */}

      {/* Toast */}
      <div className={`dp-toast ${toastOn ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
