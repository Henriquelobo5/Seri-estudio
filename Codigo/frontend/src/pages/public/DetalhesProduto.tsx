import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import AuthNavCta from '../../components/ui/AuthNavCta'
import MyOrdersLink from '../../components/ui/MyOrdersLink'
import ThreeViewer from '../../components/ui/ThreeViewer'
import logo from '../../assets/images/logo.png'
import { apiRequest } from '../../services/api'
import {
  buildEspecificacoesFicha,
  getTiposSelecionadosFromDetails,
  resolveModelagemGramaturaFromDetails,
} from '../../utils/fichaEspecificacoes'
import './DetalhesProduto.css'

// ── Dados ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Produto' },
  { id: 2, label: 'Detalhes do produto' },
  { id: 3, label: 'Detalhes do pedido' },
]

type PosKey = 'fc' | 'fe' | 'fd' | 'cc' | 'me' | 'md'

type UploadedArt = {
  id: string
  produtoTipo: string
  file: File
  previewUrl: string
  isObjectUrl: boolean
  pos: PosKey
  rotation: number
  scale: number
  flipH: boolean
  flipV: boolean
  largura: string
  altura: string
  obsMedidas: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, [string, string]> = {
  png:  ['#DBEAFE', '#1E40AF'],
  jpg:  ['#DBEAFE', '#1E40AF'],
  jpeg: ['#DBEAFE', '#1E40AF'],
  pdf:  ['#FEE2E2', '#991B1B'],
  ai:   ['#FEF3C7', '#92400E'],
  svg:  ['#EDE9FE', '#5B21B6'],
}

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
  hidePosSelector?:    boolean
  posRayOriginOffset?: Partial<Record<PosKey, [number, number, number]>>
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
    modelUrl:           '/models/ecobag.glb',
    posicoes:           [
      { key: 'fc', label: 'Frente' },
      { key: 'cc', label: 'Costas' },
    ],
    // The bounding box includes the handles at the top, shifting the centroid up.
    // Lower the ray origin so it hits the center of the bag body, not the handle area.
    posRayOriginOffset: { fc: [0, -0.45, 0], cc: [0, -0.45, 0] },
  },
}

// ── Componente ────────────────────────────────────────────────────────────────

const PREVIEW_MODEL_TYPES = ['Camiseta', 'Moletom', 'Regata', 'Polo', 'Ecobag']

function getProductConfig(tipoProduto: string) {
  return PRODUCT_CONFIG[tipoProduto] ?? PRODUCT_CONFIG['Camiseta']
}

export default function DetalhesProduto() {
  const navigate = useNavigate()
  const location = useLocation()
  const locState = (location.state ?? {}) as { fichaId?: number; fichaData?: any }
  const tipo = locState.fichaData?.tipo ?? 'Camiseta'
  const tiposSelecionados = useMemo(
    () => getTiposSelecionadosFromDetails(locState.fichaData, tipo),
    [locState.fichaData, tipo],
  )
  const previewOptions = useMemo(
    () => tiposSelecionados.filter((option) => PREVIEW_MODEL_TYPES.includes(option)),
    [tiposSelecionados],
  )
  const fallbackPreviewTipo = previewOptions[0] ?? (PREVIEW_MODEL_TYPES.includes(tipo) ? tipo : 'Camiseta')
  const canSwitchPreview = previewOptions.length > 0
  const [previewTipo, setPreviewTipo] = useState(fallbackPreviewTipo)
  const previewProduto = canSwitchPreview ? previewTipo : (tiposSelecionados[0] ?? tipo)
  const previewLabel = previewProduto
  const config = getProductConfig(previewProduto)

  const artObjUrlRef = useRef<string[]>([])
  const captureRef = useRef<(() => string | null) | null>(null)

  const [modelLoaded, setModelLoaded] = useState(false)
  const [files,   setFiles]   = useState<UploadedArt[]>([])
  const [activeArtId, setActiveArtId] = useState<string | null>(null)
  const [toast,   setToast]   = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [hintGone,    setHintGone]    = useState(false)
  const [moveMode,    setMoveMode]    = useState(false)
  const [measureConfirmOpen, setMeasureConfirmOpen] = useState(false)
  const [corPorTipo, setCorPorTipo] = useState<Record<string, string>>(() => {
    const fromState = locState.fichaData?.corPorTipo as Record<string, string> | undefined
    if (fromState && Object.keys(fromState).length > 0) return fromState
    const defaultCor = locState.fichaData?.cor ?? CORES[0].nome
    const tipos = getTiposSelecionadosFromDetails(locState.fichaData, locState.fichaData?.tipo ?? 'Camiseta')
    return Object.fromEntries(tipos.map((t: string) => [t, defaultCor]))
  })
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState('')

  const visibleFiles = files.filter(art => art.produtoTipo === previewProduto)
  const activeArt = visibleFiles.find(art => art.id === activeArtId) ?? visibleFiles[0] ?? null
  const artUrl = activeArt?.previewUrl ?? null
  const activePos = activeArt && config.posicoes.some(pos => pos.key === activeArt.pos)
    ? activeArt.pos
    : config.posicoes[0]?.key ?? 'fc'
  const activeRotation = activeArt?.rotation ?? 0
  const activeScale = activeArt?.scale ?? 1
  const activeFlipH = activeArt?.flipH ?? false
  const activeFlipV = activeArt?.flipV ?? false
  const btnNextOn = files.length > 0
  const currentCor = corPorTipo[previewProduto] ?? CORES[0].nome
  const selectedColor = CORES.find(item => item.nome === currentCor) ?? CORES[0]

  useEffect(() => {
    if (!canSwitchPreview || previewOptions.includes(previewTipo)) return

    setPreviewTipo(fallbackPreviewTipo)
    setModelLoaded(false)
  }, [canSwitchPreview, fallbackPreviewTipo, previewOptions, previewTipo])

  useEffect(() => {
    if (visibleFiles.length > 0) return

    setActiveArtId(null)
    setMoveMode(false)
  }, [previewProduto, visibleFiles.length])

  const handleModelLoad = useCallback(() => setModelLoaded(true), [])

  function handlePreviewTypeChange(nextTipo: string) {
    if (nextTipo === previewTipo || !previewOptions.includes(nextTipo)) return

    setPreviewTipo(nextTipo)
    setModelLoaded(false)
    setActiveArtId(files.find(art => art.produtoTipo === nextTipo)?.id ?? null)
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, '')
  }

  useEffect(() => {
    return () => {
      artObjUrlRef.current.forEach(url => URL.revokeObjectURL(url))
      artObjUrlRef.current = []
    }
  }, [])

  // ── Handle file upload ─────────────────────────────────────────────────────
  function buildUploadedArt(f: File): UploadedArt {
    const ext   = f.name.split('.').pop()?.toLowerCase() ?? ''
    const isImg = ['png', 'jpg', 'jpeg', 'svg'].includes(ext)
    const id = `${f.name}-${f.size}-${f.lastModified}-${crypto.randomUUID()}`
    const baseArt = {
      id,
      produtoTipo: previewProduto,
      file: f,
      pos: config.posicoes[0]?.key ?? 'fc',
      rotation: 0,
      scale: 1,
      flipH: false,
      flipV: false,
      largura: '20',
      altura: '25',
      obsMedidas: '',
    }
    if (isImg) {
      const url = URL.createObjectURL(f)
      artObjUrlRef.current.push(url)
      return { ...baseArt, previewUrl: url, isObjectUrl: true }
    }
    return { ...baseArt, previewUrl: makePlaceholderDataUrl(ext), isObjectUrl: false }
  }

  function handleFiles(selectedFiles: File[]) {
    if (!selectedFiles.length) return
    const nextArts = selectedFiles.map(buildUploadedArt)
    setFiles(prev => [...prev, ...nextArts])
    setActiveArtId(nextArts[0].id)
    if (!hintGone) setHintGone(true)
    showToast(nextArts.length > 1 ? `${nextArts.length} artes adicionadas em ${previewLabel.toLowerCase()}` : `Arte aplicada em ${previewLabel.toLowerCase()}!`)
  }

  function removeFile(id: string) {
    const removed = files.find(art => art.id === id)
    if (removed?.isObjectUrl) {
      URL.revokeObjectURL(removed.previewUrl)
      artObjUrlRef.current = artObjUrlRef.current.filter(url => url !== removed.previewUrl)
    }

    const remaining = files.filter(art => art.id !== id)
    setFiles(remaining)
    if (activeArtId === id) {
      setActiveArtId(remaining.find(art => art.produtoTipo === removed?.produtoTipo)?.id ?? null)
    }

    if (!remaining.length) {
      setMoveMode(false)
      const inp = document.getElementById('dp-fi') as HTMLInputElement
      if (inp) inp.value = ''
    }
  }

  function updateArt(id: string, patch: Partial<Pick<UploadedArt, 'pos' | 'rotation' | 'scale' | 'flipH' | 'flipV' | 'largura' | 'altura' | 'obsMedidas'>>) {
    setFiles(prev => prev.map(art => art.id === id ? { ...art, ...patch } : art))
  }

  function updateActiveArt(patch: Partial<Pick<UploadedArt, 'pos' | 'rotation' | 'scale' | 'flipH' | 'flipV' | 'largura' | 'altura' | 'obsMedidas'>>) {
    const id = activeArt?.id
    if (!id) return
    updateArt(id, patch)
  }

  function handlePosChange(p: PosKey) { updateActiveArt({ pos: p }) }

  // ── Drag-and-drop global ────────────────────────────────────────────────────
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      handleFiles(Array.from(e.dataTransfer?.files ?? []))
    }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, hintGone, previewLabel, previewProduto])

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg)
    setToastOn(true)
    setTimeout(() => setToastOn(false), 3200)
  }

  // ── ExtChip ────────────────────────────────────────────────────────────────
  function ExtChip({ art }: { art: UploadedArt }) {
    const ext = art.file.name.split('.').pop()?.toLowerCase() ?? ''
    const [bg, fg] = EXT_COLORS[ext] ?? ['#333', '#aaa']
    return (
      <button
        type="button"
        className={`dp-fchip ${activeArt?.id === art.id ? 'active' : ''}`}
        onClick={() => setActiveArtId(art.id)}
      >
        <span className="dp-fext" style={{ background: bg, color: fg }}>
          {ext.toUpperCase()}
        </span>
        <span className="dp-fname">{art.file.name}</span>
        <span className="dp-fpos">
          {config.posicoes.find(p => p.key === art.pos)?.label ?? ''}
        </span>
        <span
          className="dp-fdel"
          role="button"
          tabIndex={0}
          onClick={e => {
            e.stopPropagation()
            removeFile(art.id)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              removeFile(art.id)
            }
          }}
        >
          ×
        </span>
      </button>
    )
  }

  const posLabel = config.posicoes.find(p => p.key === activePos)?.label ?? ''
  function getArtPosLabel(art: UploadedArt) {
    const artConfig = getProductConfig(art.produtoTipo)
    return artConfig.posicoes.find(p => p.key === art.pos)?.label ?? ''
  }

  const posSummary = files.length
    ? Array.from(new Set(files.map(art => {
        const label = getArtPosLabel(art)
        return label ? `${art.produtoTipo}: ${label}` : ''
      }).filter(Boolean))).join(', ')
    : ''
  const medidasEstampas = files.map((art, index) => ({
    indice: index + 1,
    produtoTipo: art.produtoTipo,
    arquivo: art.file.name,
    largura: art.largura,
    altura: art.altura,
    observacoes: art.obsMedidas,
  }))
  const primeiraMedida = medidasEstampas[0]
  const moveToggle = artUrl ? (
    <button
      type="button"
      className={`dp-side-move-toggle ${moveMode ? 'active' : ''}`}
      onClick={() => setMoveMode(m => !m)}
    >
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
        {!moveMode && <circle cx="12" cy="12" r="3"/>}
      </svg>
      {moveMode ? 'Girar modelo' : 'Mover arte'}
    </button>
  ) : null

  function scrollToMeasures() {
    document.querySelector('.dp-measures-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function continueToOrderDetails() {
    if (submitting) return

    const fichaDataAtualizada = {
      ...locState.fichaData,
      cor: corPorTipo[tiposSelecionados[0] ?? tipo] ?? CORES[0].nome,
      corPorTipo,
      modelagemGramatura: resolveModelagemGramaturaFromDetails(locState.fichaData, tipo),
      posicao: posSummary || posLabel,
      arquivos: files.length,
      larguraEstampa: primeiraMedida?.largura ?? '',
      alturaEstampa: primeiraMedida?.altura ?? '',
      obsEstampa: medidasEstampas
        .map(item => `${item.produtoTipo} - ${item.arquivo}: ${item.largura || '0'}x${item.altura || '0'}cm${item.observacoes ? ` - ${item.observacoes}` : ''}`)
        .join('\n'),
      medidasEstampas,
    }

    setSubmitting(true)
    setErro('')
    try {
      let fichaId = locState.fichaId

      if (!fichaId) {
        const especificacoes = buildEspecificacoesFicha({
          modelagemGramatura: fichaDataAtualizada.modelagemGramatura,
          cor: fichaDataAtualizada.cor,
          tamanhos: fichaDataAtualizada.tamanhos ?? [],
        })
        const corEntries = Object.entries(corPorTipo)
        const corStr = corEntries.length === 0
          ? (fichaDataAtualizada.cor ?? '')
          : corEntries.length === 1
            ? (corEntries[0][1] ?? '')
            : corEntries.map(([t, c]) => `${t}: ${c}`).join(', ')

        const ficha = await apiRequest<{ codUnico: number; codigoDisplay: string }>('/ficha-tecnica', {
          method: 'POST',
          body: JSON.stringify({
            identificacao: fichaDataAtualizada.identificacao,
            produtoTipo: tipo,
            especificacoes,
            urlArte: '',
            cor: corStr,
          }),
        })
        fichaId = ficha.codUnico

        const capturedFichaId = fichaId
        const token = localStorage.getItem('auth_token')
        const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

        // Captura os blobs ANTES de navegar — blob URLs são revogadas no unmount
        const dataUrl = captureRef.current?.()
        const primeiraArte = visibleFiles[0]
        const [previewBlob, arteBlob] = await Promise.all([
          dataUrl ? fetch(dataUrl).then(r => r.blob()).catch(() => null) : Promise.resolve(null),
          primeiraArte?.previewUrl ? fetch(primeiraArte.previewUrl).then(r => r.blob()).catch(() => null) : Promise.resolve(null),
        ])

        // Faz uploads em background usando os Blobs já capturados
        if (previewBlob) {
          const form = new FormData()
          form.append('file', previewBlob, 'preview.png')
          fetch(`${apiBase}/ficha-tecnica/${capturedFichaId}/preview`, {
            method: 'POST', headers: authHeaders, body: form,
          }).catch(() => {})
        }
        if (arteBlob) {
          const form = new FormData()
          form.append('file', arteBlob, 'arte.png')
          fetch(`${apiBase}/ficha-tecnica/${capturedFichaId}/arte`, {
            method: 'POST', headers: authHeaders, body: form,
          }).catch(() => {})
        }
      }

      setMeasureConfirmOpen(false)
      navigate(ROUTES.DETALHES_PEDIDO, {
        state: {
          fichaId,
          fichaData: fichaDataAtualizada,
        },
      })
    } catch (e: any) {
      setMeasureConfirmOpen(false)
      setErro(e.message ?? 'Erro ao salvar ficha. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNextClick() {
    if (!btnNextOn || submitting) return

    const hasMissingMeasure = files.some(art => !art.largura.trim() || !art.altura.trim())
    if (hasMissingMeasure) {
      showToast('Preencha largura e altura de todas as estampas.')
      scrollToMeasures()
      return
    }

    setMeasureConfirmOpen(true)
  }

  function handleBackToMeasures() {
    if (submitting) return
    setMeasureConfirmOpen(false)
    showToast('Altere as medidas da estampa antes de continuar.')
    setTimeout(scrollToMeasures, 0)
  }

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
                    multiple
                    accept=".png,.jpg,.jpeg,.svg,.pdf,.ai"
                    style={{ display: 'none' }}
                    onChange={e => {
                      handleFiles(Array.from(e.target.files ?? []))
                      e.currentTarget.value = ''
                    }}
                  />
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Selecionar arquivo
                </label>
                {visibleFiles.map(art => <ExtChip key={art.id} art={art} />)}
                <div className="dp-aviso">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p>PDF e JPEG não exibem fundo. Use <strong>PNG transparente</strong> para melhor resultado.</p>
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
                        className={`dp-pbtn ${activePos === key ? 'sel' : ''}`}
                        onClick={() => handlePosChange(key as PosKey)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {moveToggle}
                </div>
              </div>
            )}

            {config.hidePosSelector && artUrl && (
              <div className="dp-blk">
                <div className="dp-bh">Controle da estampa</div>
                <div className="dp-bb">
                  {moveToggle}
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
                        <span className="dp-tf-val">{activeRotation}°</span>
                        {activeRotation !== 0 && (
                          <button className="dp-tf-reset" onClick={() => updateActiveArt({ rotation: 0 })}>↺</button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range" min={-180} max={180} step={1}
                      value={activeRotation}
                      className="dp-range"
                      onChange={e => updateActiveArt({ rotation: Number(e.target.value) })}
                    />
                  </div>

                  <div className="dp-df">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Tamanho</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="dp-tf-val">{Math.round(activeScale * 100)}%</span>
                        {activeScale !== 1 && (
                          <button className="dp-tf-reset" onClick={() => updateActiveArt({ scale: 1 })}>↺</button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range" min={30} max={250} step={5}
                      value={Math.round(activeScale * 100)}
                      className="dp-range"
                      onChange={e => updateActiveArt({ scale: Number(e.target.value) / 100 })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      className={`dp-tf-flip ${activeFlipH ? 'active' : ''}`}
                      onClick={() => updateActiveArt({ flipH: !activeFlipH })}
                    >
                      ⇄ Virar na horizontal
                    </button>
                    <button
                      className={`dp-tf-flip ${activeFlipV ? 'active' : ''}`}
                      onClick={() => updateActiveArt({ flipV: !activeFlipV })}
                    >
                      ⇅ Virar na vertical
                    </button>
                  </div>

                </div>
              </div>
            )}

            {visibleFiles.length > 0 && (
              <div className="dp-blk">
                <div className="dp-bh">Medidas da estampa</div>
                <div className="dp-bb dp-measures-list">
                  {visibleFiles.map((art, index) => (
                    <div
                      key={art.id}
                      className={`dp-measure-card ${activeArt?.id === art.id ? 'active' : ''}`}
                    >
                      <button
                        type="button"
                        className="dp-measure-head"
                        onClick={() => setActiveArtId(art.id)}
                      >
                        <span>Medidas da estampa {index + 1}</span>
                        <strong>{art.file.name}</strong>
                      </button>
                      <div className="dp-drow">
                        <div className="dp-df">
                          <label>Largura</label>
                          <div className="dp-diw">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={art.largura}
                              onChange={e => updateArt(art.id, { largura: onlyDigits(e.target.value) })}
                            />
                            <span>cm</span>
                          </div>
                        </div>
                        <div className="dp-df">
                          <label>Altura</label>
                          <div className="dp-diw">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={art.altura}
                              onChange={e => updateArt(art.id, { altura: onlyDigits(e.target.value) })}
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
                          value={art.obsMedidas}
                          onChange={e => updateArt(art.id, { obsMedidas: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="dp-side-footer">
            <button className="dp-btn-back" onClick={() => navigate(ROUTES.CRIAR_FICHA)}>
              ← Voltar
            </button>
          </div>
        </div>

        <aside className="dp-color-rail" aria-label="Cor da peça">
          <div className="dp-color-head">
            <div className="dp-color-title">Cor da peça{canSwitchPreview ? ` — ${previewProduto}` : ''}</div>
            <div className="dp-color-selected">
              Selecionado: <strong>{currentCor}</strong>
            </div>
          </div>
          <div className="dp-color-grid">
            {CORES.map(({ nome, hex, borda }) => (
              <button
                key={nome}
                type="button"
                title={nome}
                aria-label={`Selecionar cor ${nome}`}
                className={`dp-color-dot ${currentCor === nome ? 'sel' : ''}`}
                style={{
                  background: hex,
                  borderColor: borda ? 'rgba(255,255,255,.34)' : undefined,
                }}
                onClick={() => setCorPorTipo(prev => ({ ...prev, [previewProduto]: nome }))}
              >
                {currentCor === nome && (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* VIEWER */}
        <div className="dp-viewer" id="dp-vw">
          {canSwitchPreview && (
            <div className="dp-preview-switch" aria-label="Selecionar preview 3D">
              <span>Preview 3D</span>
              <div className="dp-preview-options">
                {previewOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={previewTipo === option ? 'active' : ''}
                    onClick={() => handlePreviewTypeChange(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.modelUrl ? (
            <>
              {!modelLoaded && (
                <div className="dp-v-loading">
                  <div className="dp-spinner" />
                  <p>Carregando {previewLabel.toLowerCase()} 3D...</p>
                </div>
              )}
              <ThreeViewer
                key={previewLabel}
                modelUrl={config.modelUrl}
                artUrl={artUrl}
                activeArtId={activeArt?.id ?? null}
                arts={visibleFiles.map(art => ({
                  id: art.id,
                  url: art.previewUrl,
                  pos: art.pos,
                  rotation: art.rotation,
                  scale: art.scale,
                  flipH: art.flipH,
                  flipV: art.flipV,
                }))}
                pos={activePos}
                moveMode={moveMode}
                color={selectedColor.hex}
                artRotation={activeRotation}
                artScale={activeScale}
                flipH={activeFlipH}
                flipV={activeFlipV}
                hideMeshMaterials={config.hideMeshMaterials}
                posRayOriginOffset={config.posRayOriginOffset}
                onLoad={handleModelLoad}
                onActiveArtChange={setActiveArtId}
                captureRef={captureRef}
              />
            </>
          ) : (
            <div className="dp-v-loading">
              <p style={{ opacity: 0.5, textAlign: 'center', padding: '0 2rem' }}>
                Visualização 3D não disponível<br />para este tipo de produto.
              </p>
            </div>
          )}

          {config.modelUrl && !visibleFiles.length && (
            <div className="dp-noart" onClick={() => document.getElementById('dp-fi')?.click()}>
              <div className="dp-noart-ring">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p>Clique ou arraste uma arte<br />para visualizar no {previewLabel.toLowerCase()}</p>
            </div>
          )}

          {config.modelUrl && visibleFiles.length > 0 && (
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
                  <div className="dp-pb-fill" style={{ width: files.length ? '70%' : '50%' }} />
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot done">
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div className="dp-pname done">Produto</div>
                    <div className="dp-pdet">{locState.fichaData ? `${locState.fichaData.tipo} · ${[...new Set(Object.values(corPorTipo))].join(', ')} · ${(locState.fichaData.tamanhos ?? []).join(', ')}` : 'Concluído'}</div>
                  </div>
                </div>
                <div className="dp-pi">
                  <div className="dp-pidot active">2</div>
                  <div>
                    <div className="dp-pname active">Detalhes do produto</div>
                    <div className="dp-pdet">
                      {visibleFiles.length
                        ? `${visibleFiles.length} arquivo${visibleFiles.length !== 1 ? 's' : ''} em ${previewLabel} · ${posLabel}`
                        : files.length
                        ? `Sem arte em ${previewLabel}`
                        : 'Aguardando arquivo...'}
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


          <div className="dp-side-footer">
            {erro && <p className="dp-submit-error">{erro}</p>}
            <button
              className={`dp-btn-next ${btnNextOn ? 'on' : ''}`}
              disabled={!btnNextOn || submitting}
              onClick={handleNextClick}
            >
              {submitting ? 'Salvando...' : 'Próximo: Detalhes →'}
            </button>
          </div>
        </div>

      </div>

      {measureConfirmOpen && (
        <div className="dp-confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="dp-measure-confirm-title">
          <div className="dp-confirm-modal">
            <div className="dp-confirm-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 20h16"/>
                <path d="M6 16l10-10 2 2L8 18H6v-2z"/>
              </svg>
            </div>
            <h2 id="dp-measure-confirm-title">
              Você alterou as <span>medidas de largura e altura</span> da sua estampa?
            </h2>
            <p>Se as medidas ainda estiverem no padrão, volte e ajuste antes de continuar.</p>
            <div className="dp-confirm-actions">
              <button type="button" className="dp-confirm-secondary" onClick={handleBackToMeasures} disabled={submitting}>
                Voltar e alterar
              </button>
              <button type="button" className="dp-confirm-primary" onClick={continueToOrderDetails} disabled={submitting}>
                {submitting ? 'Salvando...' : 'Sim, continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`dp-toast ${toastOn ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
