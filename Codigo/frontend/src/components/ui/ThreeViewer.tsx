import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

export type PosKey = 'fc' | 'fe' | 'fd' | 'cc' | 'me' | 'md'

const PT_COLOR_MAP: Record<string, string> = {
  'preto':          '#1a1a1a',
  'branco':         '#f5f5f5',
  'cinza':          '#888888',
  'cinza mescla':   '#a8a8a8',
  'azul':           '#2563eb',
  'azul marinho':   '#1e3a5f',
  'azul royal':     '#4169e1',
  'azul claro':     '#7ab8f5',
  'vermelho':       '#dc2626',
  'verde':          '#16a34a',
  'verde militar':  '#4a5240',
  'verde musgo':    '#606b3a',
  'amarelo':        '#eab308',
  'laranja':        '#ea580c',
  'rosa':           '#ec4899',
  'rosa claro':     '#f9a8d4',
  'roxo':           '#7c3aed',
  'lilás':          '#c084fc',
  'bordô':          '#7f1d1d',
  'caramelo':       '#b45309',
  'caqui':          '#a08040',
  'off-white':      '#f0ece4',
  'areia':          '#d4b896',
}

function resolveColor(c: string | undefined): THREE.Color {
  if (!c) return new THREE.Color('#f5f5f5')
  const key = c.toLowerCase().trim()
  if (PT_COLOR_MAP[key]) return new THREE.Color(PT_COLOR_MAP[key])
  try { return new THREE.Color(c) } catch { return new THREE.Color(0xffffff) }
}

function applyColorToScene(scene: THREE.Scene, color: string | undefined) {
  const resolved = resolveColor(color)
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat?.color) continue
        mat.color.set(resolved)
        // Strip all baked maps so the garment renders as a plain colored surface.
        mat.map           = null
        mat.normalMap     = null
        mat.roughnessMap  = null
        mat.metalnessMap  = null
        mat.aoMap         = null
        mat.emissiveMap   = null
        // metalness=1 + no envMap = black. Force matte fabric look for all garments.
        mat.metalness     = 0
        mat.roughness     = 0.8
        mat.side          = THREE.DoubleSide
        mat.needsUpdate   = true
      }
    }
  })
}

// Ray origins & directions per stamp position.
// All rays shoot toward the model center from far away so they hit the
// closest visible surface first — which is exactly the mesh we want.
const POS_RAY: Record<PosKey, { from: [number, number, number]; dir: [number, number, number] }> = {
  fc: { from: [0,    0.1,  10], dir: [0,  0, -1] },
  fe: { from: [-0.3, 0.2,  10], dir: [0,  0, -1] },
  fd: { from: [ 0.3, 0.2,  10], dir: [0,  0, -1] },
  cc: { from: [0,    0.1, -10], dir: [0,  0,  1] },
  me: { from: [-10,  0.1,   0], dir: [1,  0,  0] },
  md: { from: [ 10,  0.1,   0], dir: [-1, 0,  0] },
}

const DECAL_BASE = 0.45

interface Props {
  modelUrl:           string
  artUrl:             string | null
  pos:                PosKey
  moveMode:           boolean
  color?:             string
  artRotation:        number
  artScale:           number
  flipH:              boolean
  flipV:              boolean
  onLoad?:            () => void
  hideMeshMaterials?:   string[]
  posRayOriginOffset?:  Partial<Record<PosKey, [number, number, number]>>
}

export default function ThreeViewer({
  modelUrl, artUrl, pos, moveMode, color,
  artRotation, artScale, flipH, flipV, onLoad,
  hideMeshMaterials = [],
  posRayOriginOffset = {},
}: Props) {
  const mountRef      = useRef<HTMLDivElement>(null)
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef      = useRef<THREE.Scene | null>(null)
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef   = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const decalRef      = useRef<THREE.Mesh | null>(null)
  const texRef        = useRef<THREE.Texture | null>(null)
  const lastHitRef    = useRef<{
    point:  THREE.Vector3
    normal: THREE.Vector3
    mesh:   THREE.Mesh
  } | null>(null)
  const animRef       = useRef<number>(0)

  const onLoadRef           = useRef(onLoad)
  const colorRef            = useRef(color)
  const rotationRef         = useRef(artRotation)
  const scaleRef            = useRef(artScale)
  const flipHRef            = useRef(flipH)
  const flipVRef            = useRef(flipV)
  const hideMeshMaterialsRef  = useRef(hideMeshMaterials)
  const posRayOriginOffsetRef = useRef(posRayOriginOffset)
  const isDraggingRef         = useRef(false)

  useEffect(() => { onLoadRef.current             = onLoad            }, [onLoad])
  useEffect(() => { colorRef.current              = color             }, [color])
  useEffect(() => { rotationRef.current           = artRotation       }, [artRotation])
  useEffect(() => { scaleRef.current              = artScale          }, [artScale])
  useEffect(() => { flipHRef.current              = flipH             }, [flipH])
  useEffect(() => { flipVRef.current              = flipV             }, [flipV])
  useEffect(() => { hideMeshMaterialsRef.current  = hideMeshMaterials  }, [hideMeshMaterials])
  useEffect(() => { posRayOriginOffsetRef.current = posRayOriginOffset }, [posRayOriginOffset])

  // ── Scene setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d0f0c)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.01, 100)
    camera.position.set(0, 0.2, 3)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace   = THREE.SRGBColorSpace
    // ACES tone-mapping compresses bright colors gracefully instead of clipping to
    // pure white, so we can use high-intensity lights without overexposure.
    renderer.toneMapping        = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Balanced lighting: hemisphere provides even coverage on all faces;
    // three mild directionals add subtle depth cues front, back, and side.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 2.5))
    const key = new THREE.DirectionalLight(0xffffff, 0.8)
    key.position.set(2, 4, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.6)
    fill.position.set(-3, 1, -5)
    scene.add(fill)
    const back = new THREE.DirectionalLight(0xffffff, 0.6)
    back.position.set(0, 2, -6)
    scene.add(back)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance   = 1.5
    controls.maxDistance   = 6
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    const loader = new GLTFLoader()
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene
      const box    = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size   = box.getSize(new THREE.Vector3())
      const scale  = 2 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(scale)
      model.position.copy(center).multiplyScalar(-scale)

      // Hide branded mesh patches (e.g. polo logos).
      const hidePrefixes = hideMeshMaterialsRef.current
      if (hidePrefixes.length > 0) {
        model.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
            const matName = (mats[0] as THREE.MeshStandardMaterial)?.name ?? ''
            if (hidePrefixes.some(p => matName.startsWith(p))) obj.visible = false
          }
        })
      }

      scene.add(model)
      modelGroupRef.current = model
      applyColorToScene(scene, colorRef.current)
      onLoadRef.current?.()
    })

    const ro = new ResizeObserver(() => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    })
    ro.observe(mount)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      modelGroupRef.current = null
    }
  }, [modelUrl])

  // ── Apply garment color ───────────────────────────────────────────────────
  useEffect(() => {
    if (sceneRef.current) applyColorToScene(sceneRef.current, color)
  }, [color])

  // ── Enable/disable orbit when moveMode changes ────────────────────────────
  useEffect(() => {
    if (!controlsRef.current) return
    controlsRef.current.enabled = !moveMode
  }, [moveMode])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const removeDecal = useCallback(() => {
    const scene = sceneRef.current
    if (!decalRef.current || !scene) return
    scene.remove(decalRef.current)
    decalRef.current.geometry.dispose()
    ;(decalRef.current.material as THREE.Material).dispose()
    decalRef.current = null
  }, [])

  const placeDecalAt = useCallback((
    point:      THREE.Vector3,
    faceNormal: THREE.Vector3,
    targetMesh: THREE.Mesh,
  ) => {
    const scene = sceneRef.current
    const tex   = texRef.current
    if (!scene || !tex) return

    lastHitRef.current = { point: point.clone(), normal: faceNormal.clone(), mesh: targetMesh }

    removeDecal()

    // Apply flip to texture UV
    tex.repeat.set(flipHRef.current ? -1 : 1, flipVRef.current ? -1 : 1)
    tex.offset.set(flipHRef.current ?  1 : 0, flipVRef.current ?  1 : 0)
    tex.needsUpdate = true

    // Orient: align (0,0,1) to face normal, then spin around that normal
    const normalQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), faceNormal
    )
    const rotRad   = (rotationRef.current * Math.PI) / 180
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(faceNormal, rotRad)
    const orient   = new THREE.Euler().setFromQuaternion(spinQuat.multiply(normalQuat))

    const s    = scaleRef.current
    const size = new THREE.Vector3(DECAL_BASE * s, DECAL_BASE * s, DECAL_BASE)

    const geom = new DecalGeometry(targetMesh, point, orient, size)
    const mat  = new THREE.MeshStandardMaterial({
      map:                 tex,
      transparent:         true,
      depthTest:           true,
      depthWrite:          false,
      polygonOffset:       true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits:  -20,  // units matters on flat surfaces where factor ≈ 0
    })
    const decal = new THREE.Mesh(geom, mat)
    scene.add(decal)
    decalRef.current = decal
  }, [removeDecal])

  // ── Re-place decal when art transforms change ─────────────────────────────
  useEffect(() => {
    const hit = lastHitRef.current
    if (hit) placeDecalAt(hit.point, hit.normal, hit.mesh)
  }, [artRotation, artScale, flipH, flipV, placeDecalAt])

  // ── Raycast against the whole model (any visible mesh) ────────────────────
  const rayCastFromScreen = useCallback((clientX: number, clientY: number): THREE.Intersection | null => {
    const renderer = rendererRef.current
    const camera   = cameraRef.current
    const model    = modelGroupRef.current
    if (!renderer || !camera || !model) return null

    const rect = renderer.domElement.getBoundingClientRect()
    const ndc  = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    const rc = new THREE.Raycaster()
    rc.setFromCamera(ndc, camera)
    const hits = rc.intersectObject(model, true)
    return hits[0] ?? null
  }, [])

  // ── Drag-to-move pointer events ───────────────────────────────────────────
  useEffect(() => {
    const canvas = rendererRef.current?.domElement
    if (!canvas) return

    const onDown = () => { isDraggingRef.current = true }
    const onUp   = () => { isDraggingRef.current = false }

    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !moveMode) return
      const hit = rayCastFromScreen(e.clientX, e.clientY)
      if (!hit || !hit.face) return

      const hitMesh  = hit.object as THREE.Mesh
      const normal   = hit.face.normal.clone().transformDirection(hitMesh.matrixWorld)
      placeDecalAt(hit.point, normal, hitMesh)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup',   onUp)
    canvas.addEventListener('pointermove', onMove)

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup',   onUp)
      canvas.removeEventListener('pointermove', onMove)
    }
  }, [moveMode, placeDecalAt, rayCastFromScreen])

  // ── React to artUrl / pos changes ─────────────────────────────────────────
  useEffect(() => {
    if (!artUrl) {
      texRef.current?.dispose()
      texRef.current = null
      removeDecal()
      return
    }

    new THREE.TextureLoader().load(artUrl, (tex) => {
      tex.colorSpace   = THREE.SRGBColorSpace
      texRef.current?.dispose()
      texRef.current   = tex

      const model = modelGroupRef.current
      if (!model) return

      const ray    = POS_RAY[pos]
      const offset = posRayOriginOffsetRef.current[pos] ?? [0, 0, 0]
      const origin = new THREE.Vector3(
        ray.from[0] + offset[0],
        ray.from[1] + offset[1],
        ray.from[2] + offset[2],
      )
      const dir    = new THREE.Vector3(...ray.dir).normalize()
      const rc     = new THREE.Raycaster(origin, dir)
      const hits   = rc.intersectObject(model, true)

      if (hits[0]?.face) {
        const hitMesh = hits[0].object as THREE.Mesh
        // Use the ray direction (negated) as the surface normal instead of the
        // actual face normal. This locks the decal to a predictable, upright
        // orientation regardless of local surface curvature or reliefs.
        const normal  = dir.clone().negate()
        placeDecalAt(hits[0].point, normal, hitMesh)
      }
    })
  }, [artUrl, pos, placeDecalAt, removeDecal])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: moveMode ? 'grab' : 'default' }}
    />
  )
}
