import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

// Builds a proxy mesh containing only triangles within `radiusWorld` of `hitWorld`.
// Used to feed DecalGeometry with a small subset of triangles instead of the full mesh.
function buildProxyMesh(sourceMesh: THREE.Mesh, hitWorld: THREE.Vector3, radiusWorld: number): THREE.Mesh {
  const geo = sourceMesh.geometry
  const pos = geo.attributes.position as THREE.BufferAttribute
  const nor = geo.attributes.normal as THREE.BufferAttribute | undefined
  const uv  = geo.attributes.uv  as THREE.BufferAttribute | undefined
  const idx = geo.index

  const worldScale = new THREE.Vector3().setFromMatrixScale(sourceMesh.matrixWorld).x || 1
  const invMat = new THREE.Matrix4().copy(sourceMesh.matrixWorld).invert()
  const hitLocal = hitWorld.clone().applyMatrix4(invMat)
  const r2 = (radiusWorld / worldScale) ** 2

  const newPos: number[] = []
  const newNor: number[] = []
  const newUV:  number[] = []

  const triCount = idx ? idx.count / 3 : pos.count / 3
  for (let t = 0; t < triCount; t++) {
    const a = idx ? idx.getX(t * 3)     : t * 3
    const b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2

    const dax = pos.getX(a) - hitLocal.x, day = pos.getY(a) - hitLocal.y, daz = pos.getZ(a) - hitLocal.z
    const dbx = pos.getX(b) - hitLocal.x, dby = pos.getY(b) - hitLocal.y, dbz = pos.getZ(b) - hitLocal.z
    const dcx = pos.getX(c) - hitLocal.x, dcy = pos.getY(c) - hitLocal.y, dcz = pos.getZ(c) - hitLocal.z

    if (dax*dax+day*day+daz*daz > r2 && dbx*dbx+dby*dby+dbz*dbz > r2 && dcx*dcx+dcy*dcy+dcz*dcz > r2) continue

    for (const vi of [a, b, c]) {
      newPos.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi))
      if (nor) newNor.push(nor.getX(vi), nor.getY(vi), nor.getZ(vi))
      if (uv)  newUV.push(uv.getX(vi), uv.getY(vi))
    }
  }

  const proxyGeo = new THREE.BufferGeometry()
  proxyGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3))
  if (newNor.length) proxyGeo.setAttribute('normal', new THREE.Float32BufferAttribute(newNor, 3))
  if (newUV.length)  proxyGeo.setAttribute('uv',     new THREE.Float32BufferAttribute(newUV,  2))

  const proxy = new THREE.Mesh(proxyGeo)
  proxy.matrixWorld.copy(sourceMesh.matrixWorld)
  proxy.matrixAutoUpdate = false
  return proxy
}

export type PosKey = 'fc' | 'fe' | 'fd' | 'cc' | 'me' | 'md'

export type ViewerArt = {
  id: string
  url: string
  pos: PosKey
  rotation: number
  scale: number
  flipH: boolean
  flipV: boolean
}

type DecalPlacement = {
  point: THREE.Vector3
  normal: THREE.Vector3
  mesh: THREE.Mesh
}

const PT_COLOR_MAP: Record<string, string> = {
  'preto': '#181818',
  'branco': '#f5f5f5',
  'natural': '#f0ece4',
  'off-white': '#f0ece4',
  'cinza': '#888888',
  'cinza claro': '#c0c0c0',
  'cinza escuro': '#555555',
  'cinza mescla': '#a8a8a8',
  'azul': '#2563eb',
  'azul marinho': '#1e3a5f',
  'azul royal': '#4169e1',
  'azul claro': '#7ab8f5',
  'azul bebe': '#89cff0',
  'azul bebê': '#89cff0',
  'vermelho': '#dc2626',
  'verde': '#16a34a',
  'verde limao': '#84cc16',
  'verde limão': '#84cc16',
  'verde militar': '#4a5240',
  'verde musgo': '#606b3a',
  'amarelo': '#eab308',
  'laranja': '#ea580c',
  'rosa': '#ec4899',
  'rosa claro': '#f9a8d4',
  'roxo': '#7c3aed',
  'lilas': '#c084fc',
  'lilás': '#c084fc',
  'bordo': '#7f1d1d',
  'bordô': '#7f1d1d',
  'marrom': '#92400e',
  'caramelo': '#b45309',
  'caqui': '#a08040',
  'areia': '#d4b896',
}

const POS_RAY: Record<PosKey, { from: [number, number, number]; dir: [number, number, number] }> = {
  fc: { from: [0, 0.1, 10], dir: [0, 0, -1] },
  fe: { from: [-0.3, 0.2, 10], dir: [0, 0, -1] },
  fd: { from: [0.3, 0.2, 10], dir: [0, 0, -1] },
  cc: { from: [0, 0.1, -10], dir: [0, 0, 1] },
  me: { from: [-10, 0.1, 0], dir: [1, 0, 0] },
  md: { from: [10, 0.1, 0], dir: [-1, 0, 0] },
}

const DECAL_BASE = 0.45

const VIEW_DIRECTION: Record<PosKey, [number, number, number]> = {
  fc: [0, 0.18, 1],
  fe: [-0.42, 0.18, 0.9],
  fd: [0.42, 0.18, 0.9],
  cc: [0, 0.18, -1],
  me: [-1, 0.18, 0],
  md: [1, 0.18, 0],
}

interface Props {
  modelUrl: string
  artUrl: string | null
  artUrls?: string[]
  arts?: ViewerArt[]
  activeArtId?: string | null
  pos: PosKey
  moveMode: boolean
  color?: string
  artRotation: number
  artScale: number
  flipH: boolean
  flipV: boolean
  onLoad?: () => void
  onActiveArtChange?: (id: string) => void
  hideMeshMaterials?: string[]
  posRayOriginOffset?: Partial<Record<PosKey, [number, number, number]>>
  captureRef?: React.MutableRefObject<(() => string | null) | null>
  transparent?: boolean
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
    if (obj instanceof THREE.Mesh && !obj.userData.isArtDecal) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat?.color) continue
        mat.color.set(resolved)
        mat.map = null
        mat.metalnessMap = null
        mat.emissiveMap = null
        mat.metalness = 0
        mat.roughness = mat.roughnessMap ? mat.roughness : 0.85
        mat.side = THREE.DoubleSide
        mat.needsUpdate = true
      }
    }
  })
}

export default function ThreeViewer({
  modelUrl,
  artUrl,
  artUrls,
  arts,
  activeArtId,
  pos,
  moveMode,
  color,
  artRotation,
  artScale,
  flipH,
  flipV,
  onLoad,
  onActiveArtChange,
  hideMeshMaterials = [],
  posRayOriginOffset = {},
  captureRef,
  transparent = false,
}: Props) {
  const effectiveArts = useMemo<ViewerArt[]>(() => {
    if (arts?.length) return arts
    const fallbackUrls = artUrls?.length ? artUrls : artUrl ? [artUrl] : []
    return fallbackUrls.map((url, index) => ({
      id: `fallback-${index}`,
      url,
      pos,
      rotation: artRotation,
      scale: artScale,
      flipH,
      flipV,
    }))
  }, [artRotation, artScale, artUrl, artUrls, arts, flipH, flipV, pos])

  const effectiveArtsKey = effectiveArts
    .map(art => `${art.id}|${art.url}|${art.pos}|${art.rotation}|${art.scale}|${art.flipH}|${art.flipV}`)
    .join('\n')

  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const decalsRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const textureRef = useRef<Map<string, THREE.Texture>>(new Map())
  const textureUrlRef = useRef<Map<string, string>>(new Map())
  const urlTextureCacheRef = useRef<Map<string, THREE.Texture>>(new Map())
  const placementRef = useRef<Map<string, DecalPlacement>>(new Map())
  const posByIdRef = useRef<Map<string, PosKey>>(new Map())
  const artsRef = useRef<ViewerArt[]>(effectiveArts)
  const activeArtIdRef = useRef<string | null>(activeArtId ?? null)
  const onLoadRef = useRef(onLoad)
  const onActiveArtChangeRef = useRef(onActiveArtChange)
  const colorRef = useRef(color)
  const hideMeshMaterialsRef = useRef(hideMeshMaterials)
  const posRayOriginOffsetRef = useRef(posRayOriginOffset)
  const isDraggingRef = useRef(false)
  const lightsRef = useRef<{ hemi: THREE.HemisphereLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight; back: THREE.DirectionalLight } | null>(null)
  const animRef = useRef<number>(0)
  const viewAnimRef = useRef<number>(0)
  const moveRafRef = useRef<number>(0)
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null)
  const [modelReady, setModelReady] = useState(false)

  useEffect(() => { artsRef.current = effectiveArts }, [effectiveArtsKey])
  useEffect(() => { activeArtIdRef.current = activeArtId ?? null }, [activeArtId])
  useEffect(() => { onLoadRef.current = onLoad }, [onLoad])
  useEffect(() => { onActiveArtChangeRef.current = onActiveArtChange }, [onActiveArtChange])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { hideMeshMaterialsRef.current = hideMeshMaterials }, [hideMeshMaterials])
  useEffect(() => { posRayOriginOffsetRef.current = posRayOriginOffset }, [posRayOriginOffset])

  const disposeDecal = useCallback((id: string) => {
    const scene = sceneRef.current
    const decal = decalsRef.current.get(id)
    if (!scene || !decal) return
    scene.remove(decal)
    decal.geometry.dispose()
    ;(decal.material as THREE.Material).dispose()
    decalsRef.current.delete(id)
  }, [])

  const disposeAllDecals = useCallback(() => {
    Array.from(decalsRef.current.keys()).forEach(disposeDecal)
  }, [disposeDecal])

  const disposeAllTextures = useCallback(() => {
    urlTextureCacheRef.current.forEach(texture => texture.dispose())
    urlTextureCacheRef.current.clear()
    textureRef.current.clear()
    textureUrlRef.current.clear()
  }, [])

  const defaultPlacementFor = useCallback((art: ViewerArt): DecalPlacement | null => {
    const model = modelGroupRef.current
    if (!model) return null

    const ray = POS_RAY[art.pos]
    const offset = posRayOriginOffsetRef.current[art.pos] ?? [0, 0, 0]
    const origin = new THREE.Vector3(
      ray.from[0] + offset[0],
      ray.from[1] + offset[1],
      ray.from[2] + offset[2],
    )
    const dir = new THREE.Vector3(...ray.dir).normalize()
    const rc = new THREE.Raycaster(origin, dir)
    const hits = rc.intersectObject(model, true)

    if (!hits[0]?.face) return null
    return {
      point: hits[0].point.clone(),
      normal: dir.clone().negate(),
      mesh: hits[0].object as THREE.Mesh,
    }
  }, [])

  const renderArt = useCallback((art: ViewerArt, fastMode = false) => {
    const scene = sceneRef.current
    const texture = textureRef.current.get(art.id)
    const placement = placementRef.current.get(art.id)
    if (!scene || !texture || !placement) return

    texture.repeat.set(art.flipH ? -1 : 1, art.flipV ? -1 : 1)
    texture.offset.set(art.flipH ? 1 : 0, art.flipV ? 1 : 0)
    texture.needsUpdate = true

    const normalQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), placement.normal,
    )
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(
      placement.normal, (art.rotation * Math.PI) / 180,
    )
    const orient = new THREE.Euler().setFromQuaternion(spinQuat.multiply(normalQuat))
    const size = new THREE.Vector3(DECAL_BASE * art.scale, DECAL_BASE * art.scale, DECAL_BASE)

    // fastMode: filter only nearby triangles before feeding DecalGeometry
    // reduces input from O(n_mesh) to O(k_local) — ~150x fewer triangles during drag
    const targetMesh = fastMode
      ? buildProxyMesh(placement.mesh, placement.point, DECAL_BASE * art.scale * 2)
      : placement.mesh

    const newGeom = new DecalGeometry(targetMesh, placement.point, orient, size)
    if (fastMode) targetMesh.geometry.dispose()

    const existing = decalsRef.current.get(art.id)
    if (existing) {
      // Reuse mesh + material — only swap geometry to avoid GPU re-alloc
      existing.geometry.dispose()
      existing.geometry = newGeom
      const mat = existing.material as THREE.MeshStandardMaterial
      if (mat.map !== texture) { mat.map = texture; mat.needsUpdate = true }
    } else {
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -20,
      })
      const decal = new THREE.Mesh(newGeom, mat)
      decal.userData.isArtDecal = true
      decal.userData.artId = art.id
      scene.add(decal)
      decalsRef.current.set(art.id, decal)
    }
  }, [])

  const renderAllArts = useCallback(() => {
    artsRef.current.forEach(art => renderArt(art))
  }, [renderArt])

  const animateViewToPos = useCallback((targetPos: PosKey) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    cancelAnimationFrame(viewAnimRef.current)

    const target = controls.target.clone()
    const startOffset = camera.position.clone().sub(target)
    const currentDistance = startOffset.length()
    const distance = THREE.MathUtils.clamp(currentDistance || 3, 2.5, 3.2)

    const dir = new THREE.Vector3(...VIEW_DIRECTION[targetPos]).normalize()
    const endOffset = dir.multiplyScalar(distance)

    // Interpolate in spherical space so camera orbits around model
    const startSph = new THREE.Spherical().setFromVector3(startOffset)
    const endSph = new THREE.Spherical().setFromVector3(endOffset)

    // Shortest-path theta interpolation
    let dTheta = endSph.theta - startSph.theta
    if (dTheta > Math.PI) dTheta -= 2 * Math.PI
    if (dTheta < -Math.PI) dTheta += 2 * Math.PI

    const duration = 850
    const startedAt = performance.now()

    const tick = (now: number) => {
      const rawT = Math.min(1, (now - startedAt) / duration)
      // Ease in-out quad
      const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2

      const sph = new THREE.Spherical(
        THREE.MathUtils.lerp(startSph.radius, endSph.radius, t),
        THREE.MathUtils.lerp(startSph.phi, endSph.phi, t),
        startSph.theta + dTheta * t,
      )
      camera.position.setFromSpherical(sph).add(target)
      camera.lookAt(target)
      controls.update()
      if (rawT < 1) viewAnimRef.current = requestAnimationFrame(tick)
    }

    viewAnimRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    setModelReady(false)

    const w = mount.clientWidth || 300
    const h = mount.clientHeight || 300

    const scene = new THREE.Scene()
    if (!transparent) scene.background = new THREE.Color(0x0d0f0c)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100)
    camera.position.set(0, 0.2, 3)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: transparent, preserveDrawingBuffer: !!captureRef })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer
    if (captureRef) {
      captureRef.current = () => renderer.domElement.toDataURL('image/png')
    }

    const resolved = resolveColor(colorRef.current)
    const lum = 0.299 * resolved.r + 0.587 * resolved.g + 0.114 * resolved.b
    const isDark = lum < 0.15
    const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, isDark ? 5.0 : 1.4)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 2.5 : 0.7)
    key.position.set(2, 4, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, isDark ? 1.2 : 0.3)
    fill.position.set(-3, 1, -5)
    scene.add(fill)
    const back = new THREE.DirectionalLight(0xffffff, isDark ? 0.8 : 0.2)
    back.position.set(0, 2, -6)
    scene.add(back)
    lightsRef.current = { hemi, key, fill, back }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 1.5
    controls.maxDistance = 6
    controls.target.set(0, 0, 0)
    controls.enabled = !moveMode
    controlsRef.current = controls

    const loader = new GLTFLoader()
    loader.load(modelUrl, (gltf) => {
      if (disposed) return

      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const scale = 2 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(scale)
      model.position.copy(center).multiplyScalar(-scale)

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
      // Force world-matrix update on the whole hierarchy before setModelReady(true)
      // so that defaultPlacementFor's raycast uses correct transforms (renderer.render
      // hasn't run yet at this point, so matrixWorld is still stale from the loader).
      model.updateMatrixWorld(true)
      applyColorToScene(scene, colorRef.current)
      setModelReady(true)
      onLoadRef.current?.()
    }, undefined, () => {
      if (!disposed) console.error('[ThreeViewer] Failed to load model:', modelUrl)
    })

    const ro = new ResizeObserver(() => {
      const rw = mount.clientWidth || 300
      const rh = mount.clientHeight || 300
      camera.aspect = rw / rh
      camera.updateProjectionMatrix()
      renderer.setSize(rw, rh)
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
      cancelAnimationFrame(viewAnimRef.current)
      disposed = true
      ro.disconnect()
      controls.dispose()
      disposeAllDecals()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      modelGroupRef.current = null
      sceneRef.current = null
      rendererRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      placementRef.current.clear()
      posByIdRef.current.clear()
    }
  }, [disposeAllDecals, disposeAllTextures, modelUrl, transparent])

  // Dispose textures only on unmount — keeps them cached across model/piece changes
  // so switching pieces never has an async window where art disappears
  useEffect(() => () => disposeAllTextures(), [disposeAllTextures])

  useEffect(() => {
    if (sceneRef.current) applyColorToScene(sceneRef.current, color)
    const l = lightsRef.current
    if (!l) return
    const resolved = resolveColor(color)
    const lum = 0.299 * resolved.r + 0.587 * resolved.g + 0.114 * resolved.b
    const dark = lum < 0.15
    l.hemi.intensity = dark ? 5.0 : 1.4
    l.key.intensity  = dark ? 2.5 : 0.7
    l.fill.intensity = dark ? 1.2 : 0.3
    l.back.intensity = dark ? 0.8 : 0.2
  }, [color])

  useEffect(() => {
    if (!controlsRef.current) return
    controlsRef.current.enabled = !moveMode
  }, [moveMode])

  useEffect(() => {
    if (!modelReady) return
    animateViewToPos(pos)
  }, [animateViewToPos, modelReady, pos])

  const rayCastFromScreen = useCallback((clientX: number, clientY: number): THREE.Intersection | null => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const model = modelGroupRef.current
    if (!renderer || !camera || !model) return null

    const rect = renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    const rc = new THREE.Raycaster()
    rc.setFromCamera(ndc, camera)
    const hits = rc.intersectObject(model, true)
    return hits[0] ?? null
  }, [])

  const rayCastDecalFromScreen = useCallback((clientX: number, clientY: number): string | null => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    if (!renderer || !camera || decalsRef.current.size === 0) return null

    const rect = renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    const rc = new THREE.Raycaster()
    rc.setFromCamera(ndc, camera)
    const decalMeshes = Array.from(decalsRef.current.values())
    const hits = rc.intersectObjects(decalMeshes, false)
    const hitMesh = hits[0]?.object as THREE.Mesh | undefined
    return typeof hitMesh?.userData.artId === 'string' ? hitMesh.userData.artId : null
  }, [])

  useEffect(() => {
    const canvas = rendererRef.current?.domElement
    if (!canvas) return

    const onDown = (e: PointerEvent) => {
      const clickedArtId = rayCastDecalFromScreen(e.clientX, e.clientY)
      if (clickedArtId) {
        activeArtIdRef.current = clickedArtId
        onActiveArtChangeRef.current?.(clickedArtId)
      }
      isDraggingRef.current = true
    }
    const onUp = () => {
      isDraggingRef.current = false
      cancelAnimationFrame(moveRafRef.current)
      moveRafRef.current = 0
      pendingMoveRef.current = null
      // Re-render final decal at full quality
      const activeId = activeArtIdRef.current ?? artsRef.current[0]?.id
      const art = artsRef.current.find(a => a.id === activeId)
      if (art && placementRef.current.has(art.id)) renderArt(art, false)
    }
    const flushMove = () => {
      moveRafRef.current = 0
      const pending = pendingMoveRef.current
      pendingMoveRef.current = null
      if (!pending || !isDraggingRef.current) return

      const hit = rayCastFromScreen(pending.x, pending.y)
      if (!hit?.face) return

      const activeId = activeArtIdRef.current ?? artsRef.current[0]?.id
      const activeArt = artsRef.current.find(art => art.id === activeId)
      if (!activeArt) return

      const hitMesh = hit.object as THREE.Mesh
      const normal = hit.face.normal.clone().transformDirection(hitMesh.matrixWorld)
      placementRef.current.set(activeArt.id, { point: hit.point.clone(), normal, mesh: hitMesh })
      renderArt(activeArt, true)
    }
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !moveMode) return
      pendingMoveRef.current = { x: e.clientX, y: e.clientY }
      if (!moveRafRef.current) moveRafRef.current = requestAnimationFrame(flushMove)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onUp)
    canvas.addEventListener('pointermove', onMove)

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onUp)
      canvas.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(moveRafRef.current)
      moveRafRef.current = 0
    }
  }, [moveMode, rayCastDecalFromScreen, rayCastFromScreen, renderArt])

  useEffect(() => {
    const currentArts = artsRef.current

    if (!currentArts.length) {
      disposeAllDecals()
      // Do NOT clear urlTextureCacheRef here — it must survive piece switches
      textureRef.current.clear()
      textureUrlRef.current.clear()
      placementRef.current.clear()
      posByIdRef.current.clear()
      return
    }

    const activeIds = new Set(currentArts.map(art => art.id))
    Array.from(decalsRef.current.keys()).forEach(id => {
      if (!activeIds.has(id)) disposeDecal(id)
    })
    Array.from(textureRef.current.keys()).forEach(id => {
      if (!activeIds.has(id)) {
        // Do NOT dispose — texture lives in urlTextureCacheRef (shared reference)
        textureRef.current.delete(id)
        textureUrlRef.current.delete(id)
      }
    })
    Array.from(placementRef.current.keys()).forEach(id => {
      if (!activeIds.has(id)) placementRef.current.delete(id)
    })
    Array.from(posByIdRef.current.keys()).forEach(id => {
      if (!activeIds.has(id)) posByIdRef.current.delete(id)
    })

    // modelReady can still be true from the previous model while the new one is loading
    // (model cleanup nulls modelGroupRef before setModelReady(false) batches).
    // Skip this run — the next run after setModelReady(true) will have a valid model.
    if (!modelReady || !modelGroupRef.current) return

    currentArts.forEach((art) => {
      if (!placementRef.current.has(art.id) || posByIdRef.current.get(art.id) !== art.pos) {
        const placement = defaultPlacementFor(art)
        if (placement) {
          placementRef.current.set(art.id, placement)
          posByIdRef.current.set(art.id, art.pos)
        }
      }
    })

    // Sync textureRef with URL-keyed cache for the current arts
    currentArts.forEach(art => {
      const cached = urlTextureCacheRef.current.get(art.url)
      if (cached) {
        textureRef.current.set(art.id, cached)
        textureUrlRef.current.set(art.id, art.url)
      }
    })

    let cancelled = false
    const texturesToLoad = currentArts.filter(art => !urlTextureCacheRef.current.has(art.url))

    // All textures already cached — render synchronously (no async cancellation window)
    if (!texturesToLoad.length) {
      renderAllArts()
      return () => { cancelled = true }
    }

    async function loadTextureSafe(url: string): Promise<THREE.Texture | null> {
      // Primary: fetch → blob URL (evita bloqueio CORS no TextureLoader)
      try {
        const res = await fetch(url, { mode: 'cors', credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        try {
          return await new Promise<THREE.Texture>((resolve, reject) => {
            new THREE.TextureLoader().load(blobUrl, resolve, undefined, reject)
          })
        } finally {
          URL.revokeObjectURL(blobUrl)
        }
      } catch {
        // Fallback: URL direta com cache-buster
        return new Promise<THREE.Texture | null>((resolve) => {
          const bust = url.includes('?') ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`
          new THREE.TextureLoader().load(bust, resolve, undefined, () => resolve(null))
        })
      }
    }

    Promise.all(
      texturesToLoad.map(art =>
        loadTextureSafe(art.url)
          .then(texture => (texture ? { art, texture } : null))
          .catch(() => null)
      )
    ).then((results) => {
      const loaded = results.filter((r): r is { art: ViewerArt; texture: THREE.Texture } => r !== null)

      // Always cache by URL — even if cancelled so the next effect run finds it synchronously
      loaded.forEach(({ art, texture }) => {
        texture.colorSpace = THREE.SRGBColorSpace
        urlTextureCacheRef.current.set(art.url, texture)
      })

      if (cancelled) return

      loaded.forEach(({ art, texture }) => {
        textureRef.current.set(art.id, texture)
        textureUrlRef.current.set(art.id, art.url)
      })
      renderAllArts()
    })

    return () => { cancelled = true }
  }, [
    defaultPlacementFor,
    disposeAllDecals,
    disposeAllTextures,
    disposeDecal,
    effectiveArtsKey,
    modelReady,
    renderAllArts,
  ])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: moveMode ? 'grab' : 'default' }}
    />
  )
}
