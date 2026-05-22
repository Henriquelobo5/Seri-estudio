import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

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
  'preto': '#1a1a1a',
  'branco': '#f5f5f5',
  'cinza': '#888888',
  'cinza mescla': '#a8a8a8',
  'azul': '#2563eb',
  'azul marinho': '#1e3a5f',
  'azul royal': '#4169e1',
  'azul claro': '#7ab8f5',
  'vermelho': '#dc2626',
  'verde': '#16a34a',
  'verde militar': '#4a5240',
  'verde musgo': '#606b3a',
  'amarelo': '#eab308',
  'laranja': '#ea580c',
  'rosa': '#ec4899',
  'rosa claro': '#f9a8d4',
  'roxo': '#7c3aed',
  'lilÃ¡s': '#c084fc',
  'bordÃ´': '#7f1d1d',
  'caramelo': '#b45309',
  'caqui': '#a08040',
  'off-white': '#f0ece4',
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
        mat.normalMap = null
        mat.roughnessMap = null
        mat.metalnessMap = null
        mat.aoMap = null
        mat.emissiveMap = null
        mat.metalness = 0
        mat.roughness = 0.8
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
  const animRef = useRef<number>(0)
  const viewAnimRef = useRef<number>(0)
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
    textureRef.current.forEach(texture => texture.dispose())
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

  const renderArt = useCallback((art: ViewerArt) => {
    const scene = sceneRef.current
    const texture = textureRef.current.get(art.id)
    const placement = placementRef.current.get(art.id)
    if (!scene || !texture || !placement) return

    disposeDecal(art.id)

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

    const geom = new DecalGeometry(placement.mesh, placement.point, orient, size)
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -20,
    })
    const decal = new THREE.Mesh(geom, mat)
    decal.userData.isArtDecal = true
    decal.userData.artId = art.id
    scene.add(decal)
    decalsRef.current.set(art.id, decal)
  }, [disposeDecal])

  const renderAllArts = useCallback(() => {
    artsRef.current.forEach(renderArt)
  }, [renderArt])

  const animateViewToPos = useCallback((targetPos: PosKey) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    cancelAnimationFrame(viewAnimRef.current)

    const target = controls.target.clone()
    const start = camera.position.clone()
    const currentDistance = start.distanceTo(target)
    const distance = THREE.MathUtils.clamp(currentDistance || 3, 2.5, 4.2)
    const dir = new THREE.Vector3(...VIEW_DIRECTION[targetPos]).normalize()
    const end = target.clone().add(dir.multiplyScalar(distance))
    end.y = Math.max(end.y, 0.15)

    const duration = 1050
    const startedAt = performance.now()

    const tick = (now: number) => {
      const rawT = Math.min(1, (now - startedAt) / duration)
      const t = 1 - Math.pow(1 - rawT, 3)
      camera.position.lerpVectors(start, end, t)
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

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d0f0c)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.01, 100)
    camera.position.set(0, 0.2, 3)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

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
      applyColorToScene(scene, colorRef.current)
      setModelReady(true)
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
      cancelAnimationFrame(viewAnimRef.current)
      disposed = true
      ro.disconnect()
      controls.dispose()
      disposeAllDecals()
      disposeAllTextures()
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
  }, [disposeAllDecals, disposeAllTextures, modelUrl])

  useEffect(() => {
    if (sceneRef.current) applyColorToScene(sceneRef.current, color)
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
    const onUp = () => { isDraggingRef.current = false }
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !moveMode) return
      const hit = rayCastFromScreen(e.clientX, e.clientY)
      if (!hit?.face) return

      const activeId = activeArtIdRef.current ?? artsRef.current[0]?.id
      const activeArt = artsRef.current.find(art => art.id === activeId)
      if (!activeArt) return

      const hitMesh = hit.object as THREE.Mesh
      const normal = hit.face.normal.clone().transformDirection(hitMesh.matrixWorld)
      placementRef.current.set(activeArt.id, {
        point: hit.point.clone(),
        normal,
        mesh: hitMesh,
      })
      renderArt(activeArt)
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
    }
  }, [moveMode, rayCastDecalFromScreen, rayCastFromScreen, renderArt])

  useEffect(() => {
    const currentArts = artsRef.current

    if (!currentArts.length) {
      disposeAllDecals()
      disposeAllTextures()
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
        textureRef.current.get(id)?.dispose()
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

    if (!modelReady) return

    currentArts.forEach((art) => {
      if (!placementRef.current.has(art.id) || posByIdRef.current.get(art.id) !== art.pos) {
        const placement = defaultPlacementFor(art)
        if (placement) {
          placementRef.current.set(art.id, placement)
          posByIdRef.current.set(art.id, art.pos)
        }
      }
    })

    let cancelled = false
    const loader = new THREE.TextureLoader()
    const texturesToLoad = currentArts.filter(art => textureUrlRef.current.get(art.id) !== art.url)

    Promise.all(texturesToLoad.map(art => new Promise<{ art: ViewerArt; texture: THREE.Texture }>((resolve) => {
      loader.load(art.url, texture => resolve({ art, texture }))
    }))).then((loaded) => {
      if (cancelled) {
        loaded.forEach(({ texture }) => texture.dispose())
        return
      }

      loaded.forEach(({ art, texture }) => {
        textureRef.current.get(art.id)?.dispose()
        texture.colorSpace = THREE.SRGBColorSpace
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
