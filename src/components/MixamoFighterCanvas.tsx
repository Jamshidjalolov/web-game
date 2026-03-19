import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  AnimationMixer,
  AnimationClip,
  Bone,
  Box3,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  Mesh,
  Object3D,
  Texture,
  TextureLoader,
  Vector3,
} from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import boxingFbxUrl from '../assets/box/urushi.fbx?url'
import boxDefaultFbxUrl from '../assets/box/urushi.fbx?url'
import ch09BoxingFbxUrl from '../assets/box/urushi.fbx?url'
import urishiFbxUrl from '../assets/box/urushi.fbx?url'
import urganPaytiFbxUrl from '../assets/box/urgan payti.fbx?url'
import winnerFbxUrl from '../assets/box/winner.fbx?url'
import nakauntFbxUrl from '../assets/box/nakaunt.fbx?url'
import boxArenaBgUrl from '../rasm/arenaa.png?url'
import humanPngUrl from '../rasm/human.png?url'

useLoader.preload(FBXLoader, boxingFbxUrl)
useLoader.preload(FBXLoader, boxDefaultFbxUrl)
useLoader.preload(FBXLoader, ch09BoxingFbxUrl)
useLoader.preload(FBXLoader, urishiFbxUrl)
useLoader.preload(FBXLoader, urganPaytiFbxUrl)
useLoader.preload(FBXLoader, winnerFbxUrl)
useLoader.preload(FBXLoader, nakauntFbxUrl)
useLoader.preload(TextureLoader, boxArenaBgUrl)
useLoader.preload(TextureLoader, humanPngUrl)

export type MotionState = 'idle' | 'attack' | 'hit' | 'ko' | 'winner'

const SHOW_ARENA_FIGHTERS = true
const isImpactMotion = (mode: MotionState) => mode === 'hit'

type MixamoFighterCanvasProps = {
  side: 'left' | 'right'
  mode: MotionState
  className?: string
}

function pickBestClip(clips: AnimationClip[] | undefined) {
  if (!clips || clips.length === 0) return null
  return [...clips].sort((a, b) => {
    const aScore = (a.tracks?.length ?? 0) * Math.max(a.duration || 0, 0.001)
    const bScore = (b.tracks?.length ?? 0) * Math.max(b.duration || 0, 0.001)
    return bScore - aScore
  })[0] ?? null
}

function fitModelToStage(model: Group, targetHeight = 1.7) {
  model.position.set(0, 0, 0)
  const box = new Box3().setFromObject(model)
  const size = new Vector3()
  box.getSize(size)

  const safeHeight = size.y > 0 ? size.y : 160
  const safeWidth = size.x > 0 ? size.x : safeHeight
  const safeDepth = size.z > 0 ? size.z : safeHeight
  const maxSpan = targetHeight * 1.28
  const scale = Math.min(targetHeight / safeHeight, maxSpan / safeWidth, maxSpan / safeDepth)
  model.scale.setScalar(scale)

  const scaledBox = new Box3().setFromObject(model)
  const scaledCenter = new Vector3()
  scaledBox.getCenter(scaledCenter)

  model.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z)
}

function getFighterBasePosition(side: 'left' | 'right', compact: boolean) {
  const duelBaseX = 0.55
  const duelBaseY = -1.8
  const duelBaseZ = 0.06

  return {
    x: compact
      ? (side === 'left' ? -0.92 : 0.92)
      : (side === 'left' ? -duelBaseX : duelBaseX),
    y: compact ? -0.97 : duelBaseY,
    z: compact ? 0 : (side === 'left' ? duelBaseZ : -duelBaseZ),
  }
}

function createCutoutTexture(rawTexture: Texture) {
  if (typeof document === 'undefined') return rawTexture
  const img = (rawTexture.image ?? null) as HTMLImageElement | null
  if (!img) return rawTexture

  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
  if (!width || !height) return rawTexture

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return rawTexture

  ctx.drawImage(img, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  const idxOf = (x: number, y: number) => (y * width + x) * 4
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const cornerSamples: Array<[number, number]> = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width * 0.08), Math.floor(height * 0.08)],
    [Math.floor(width * 0.92), Math.floor(height * 0.08)],
  ]

  let bgR = 0
  let bgG = 0
  let bgB = 0
  let bgCount = 0
  for (const [sx, sy] of cornerSamples) {
    const x = clamp(sx, 0, width - 1)
    const y = clamp(sy, 0, height - 1)
    const i = idxOf(x, y)
    bgR += pixels[i]
    bgG += pixels[i + 1]
    bgB += pixels[i + 2]
    bgCount += 1
  }
  bgR /= Math.max(bgCount, 1)
  bgG /= Math.max(bgCount, 1)
  bgB /= Math.max(bgCount, 1)

  const isDarkBackgroundLike = (x: number, y: number) => {
    const i = idxOf(x, y)
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const brightness = (r + g + b) / 3
    const spread = Math.max(r, g, b) - Math.min(r, g, b)
    const bgDist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB)
    // Border-connected near-black backgroundni kesamiz, lekin soch detallarini saqlash uchun threshold qattiqroq.
    return brightness < 28 && spread < 30 && bgDist < 48
  }

  const markTransparentFlood = (seedList: Array<[number, number]>, predicate: (x: number, y: number) => boolean) => {
    const visited = new Uint8Array(width * height)
    const stack: number[] = []
    for (const [sx, sy] of seedList) {
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue
      if (!predicate(sx, sy)) continue
      const start = sy * width + sx
      if (visited[start]) continue
      visited[start] = 1
      stack.push(sx, sy)
    }

    while (stack.length) {
      const y = stack.pop() as number
      const x = stack.pop() as number
      const i = idxOf(x, y)
      pixels[i + 3] = 0

      const neighbors: Array<[number, number]> = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ]

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const vi = ny * width + nx
        if (visited[vi]) continue
        if (!predicate(nx, ny)) continue
        visited[vi] = 1
        stack.push(nx, ny)
      }
    }
  }

  const borderSeeds: Array<[number, number]> = []
  for (let x = 0; x < width; x += 1) {
    borderSeeds.push([x, 0], [x, height - 1])
  }
  for (let y = 1; y < height - 1; y += 1) {
    borderSeeds.push([0, y], [width - 1, y])
  }
  markTransparentFlood(borderSeeds, isDarkBackgroundLike)

  // Qora fon qoldiqlarini va podiumni yumshatish.
  for (let i = 0; i < pixels.length; i += 4) {
    const pixelIndex = i >> 2
    const py = Math.floor(pixelIndex / width)
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const brightness = (r + g + b) / 3
    const spread = Math.max(r, g, b) - Math.min(r, g, b)

    // Oyoq tagidagi oq podiumni olib tashlash.
    if (py > height * 0.76 && brightness > 150 && spread < 80) {
      pixels[i + 3] = 0
      continue
    }
    if (py > height * 0.7 && brightness > 185 && spread < 95) {
      pixels[i + 3] = Math.min(pixels[i + 3], 20)
    }

    if (brightness < 8 && spread < 12) {
      pixels[i + 3] = 0
      continue
    }
    if (brightness < 16 && spread < 18) {
      pixels[i + 3] = Math.min(pixels[i + 3], 30)
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const cutout = new CanvasTexture(canvas)
  cutout.flipY = rawTexture.flipY
  ;(cutout as Texture & { colorSpace?: unknown }).colorSpace = (rawTexture as Texture & { colorSpace?: unknown }).colorSpace
  cutout.needsUpdate = true
  return cutout
}

function HumanFighterBillboard({
  side,
  mode,
  compact = false,
}: {
  side: 'left' | 'right'
  mode: MotionState
  compact?: boolean
}) {
  const rawHumanTexture = useLoader(TextureLoader, humanPngUrl)
  const humanTexture = useMemo(() => createCutoutTexture(rawHumanTexture), [rawHumanTexture])
  const isLeft = side === 'left'
  const planeWidth = compact ? 1.15 : 1.95
  const planeHeight = compact ? 1.65 : 2.95
  const yOffset = compact ? 0.78 : 3.05
  const zOffset = compact ? 0.02 : 0.06
  const xOffset = compact ? 0 : isLeft ? 2.05 : -2.05
  const mirroredRef = useRef<Group | null>(null)
  const guardGloveRef = useRef<Group | null>(null)
  const punchGloveRef = useRef<Group | null>(null)
  const localModeStartRef = useRef(0)

  useEffect(() => {
    localModeStartRef.current = performance.now()
  }, [mode])

  useFrame((state) => {
    const mirrored = mirroredRef.current
    const guard = guardGloveRef.current
    const punch = punchGloveRef.current
    if (!mirrored || !guard || !punch) return

    const t = state.clock.elapsedTime
    const elapsed = (performance.now() - localModeStartRef.current) / 1000

    const baseRot = isLeft ? Math.PI : 0
    mirrored.rotation.y = baseRot

    const idleBob = Math.sin(t * 2.2) * (compact ? 0.008 : 0.012)
    mirrored.position.y = idleBob
    mirrored.rotation.z = Math.sin(t * 1.5) * (compact ? 0.008 : 0.014)

    const guardBase = new Vector3(-0.34, 0.55, 0.03)
    const punchBase = new Vector3(0.27, 0.57, 0.05)

    guard.position.copy(guardBase)
    punch.position.copy(punchBase)

    if (mode === 'attack') {
      const windup = 0.18
      if (elapsed < windup) {
        const p = elapsed / windup
        punch.position.x -= 0.06 * p
        punch.position.y -= 0.02 * p
        punch.rotation.z = -0.18 * p
      } else {
        const p = Math.min((elapsed - windup) / 0.42, 1)
        const hitCurve = Math.sin(Math.min(p * Math.PI, Math.PI))
        punch.position.x += 0.2 * hitCurve
        punch.position.z += 0.1 * hitCurve
        punch.position.y += 0.015 * hitCurve
        punch.rotation.z = 0.24 * hitCurve
        guard.position.x -= 0.03 * hitCurve
        guard.rotation.z = -0.08 * hitCurve
      }
    } else if (mode === 'hit') {
      const s = Math.sin(elapsed * 28) * Math.exp(-elapsed * 2.2) * 0.07
      guard.position.x += s
      punch.position.x += s * 0.6
    } else if (mode === 'ko') {
      mirrored.rotation.z = 0.16
      guard.position.y -= 0.06
      punch.position.y -= 0.06
    } else {
      // idle guard stance hands
      const sway = Math.sin(t * 3.1) * 0.012
      guard.position.y += sway
      punch.position.y -= sway * 0.8
      guard.rotation.z = Math.sin(t * 2.4) * 0.06
      punch.rotation.z = -Math.sin(t * 2.6) * 0.06
    }
  })

  return (
    <group position={[xOffset, yOffset, zOffset]}>
      <group ref={mirroredRef}>
        {/* Soch/qora detallar fon bilan qo'shilib ketmasin */}
        <mesh position={[0, compact ? 1.28 : 1.78, -0.03]} frustumCulled={false}>
          <circleGeometry args={[compact ? 0.22 : 0.34, 24]} />
          <meshBasicMaterial
            color={side === 'left' ? '#60a5fa' : '#fb7185'}
            transparent
            opacity={0.14}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>

        <mesh castShadow receiveShadow={false} frustumCulled={false}>
          <planeGeometry args={[planeWidth, planeHeight]} />
          <meshBasicMaterial
            map={humanTexture}
            transparent
            alphaTest={0.03}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Qo'l qimirlagani ko'rinsin: glove overlay */}
        <group ref={guardGloveRef}>
          <mesh castShadow frustumCulled={false}>
            <sphereGeometry args={[compact ? 0.06 : 0.082, 14, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.7} metalness={0.04} emissive="#7f1d1d" emissiveIntensity={0.08} transparent opacity={0.9} />
          </mesh>
        </group>
        <group ref={punchGloveRef}>
          <mesh castShadow frustumCulled={false}>
            <sphereGeometry args={[compact ? 0.062 : 0.086, 14, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.7} metalness={0.04} emissive="#7f1d1d" emissiveIntensity={0.08} transparent opacity={0.92} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function PunchOverlay({
  side,
  mode,
  compact = false,
}: {
  side: 'left' | 'right'
  mode: MotionState
  compact?: boolean
}) {
  const rootRef = useRef<Group | null>(null)
  const trailRef = useRef<Mesh | null>(null)
  const glowRef = useRef<Mesh | null>(null)
  const ringRef = useRef<Mesh | null>(null)
  const fistRef = useRef<Group | null>(null)
  const armRef = useRef<Group | null>(null)
  const modeStartRef = useRef(0)

  useEffect(() => {
    modeStartRef.current = performance.now()
  }, [mode])

  useFrame((state) => {
    const root = rootRef.current
    const trail = trailRef.current
    const glow = glowRef.current
    const ring = ringRef.current
    const fist = fistRef.current
    const arm = armRef.current
    if (!root || !trail || !glow || !ring || !fist || !arm) return

    const dir = side === 'left' ? 1 : -1
    const t = state.clock.elapsedTime
    const elapsed = (performance.now() - modeStartRef.current) / 1000

    const baseX = compact ? 0.14 * dir : 0.34 * dir
    const baseY = compact ? 0.28 : 0.48
    const baseZ = compact ? 0.08 : 0.16

    root.visible = mode === 'attack'
    if (!root.visible) return

    const windup = compact ? 0.08 : 0.18
    const strike = compact ? 0.22 : 0.4
    const recover = compact ? 0.16 : 0.26

    let punch = 0
    let lift = 0
    let rot = 0
    let glowAlpha = 0
    let trailAlpha = 0
    let ringAlpha = 0
    let strikePower = 0

    if (elapsed <= windup) {
      const p = elapsed / Math.max(windup, 0.001)
      punch = -0.06 * p
      lift = -0.015 * p
      rot = -0.35 * p * dir
    } else if (elapsed <= windup + strike) {
      const p = (elapsed - windup) / Math.max(strike, 0.001)
      const curve = Math.sin(Math.min(p * Math.PI, Math.PI))
      punch = -0.06 + curve * (compact ? 0.28 : 0.74)
      lift = -0.015 + curve * (compact ? 0.012 : 0.02)
      rot = (compact ? 0.48 : 0.62) * curve * dir
      glowAlpha = curve
      trailAlpha = curve * 0.9
      ringAlpha = curve > 0.25 ? (curve - 0.25) / 0.75 : 0
      strikePower = curve
    } else if (elapsed <= windup + strike + recover) {
      const p = (elapsed - windup - strike) / Math.max(recover, 0.001)
      punch = MathUtils.lerp(compact ? 0.2 : 0.44, 0, p)
      lift = MathUtils.lerp(compact ? 0.01 : 0.015, 0, p)
      rot = MathUtils.lerp((compact ? 0.3 : 0.38) * dir, 0, p)
      glowAlpha = (1 - p) * 0.45
      trailAlpha = (1 - p) * 0.3
      ringAlpha = (1 - p) * 0.35
      strikePower = (1 - p) * 0.45
    }

    root.position.set(baseX + punch * dir, baseY + lift + Math.sin(t * 10) * 0.004, baseZ)
    root.rotation.set(0.12, 0, rot)

    const gloveScale = compact ? 0.9 : 1
    root.scale.setScalar(gloveScale)

    arm.position.set(-0.06 * dir, -0.005, -0.01)
    arm.rotation.z = -0.12 * dir + rot * 0.35
    arm.scale.set(1 + strikePower * 0.2, 1, 1)

    fist.position.set(0.02 * dir, 0.005 + strikePower * 0.01, 0.02 + strikePower * 0.015)
    fist.rotation.z = rot * 0.6
    fist.scale.setScalar(1 + strikePower * 0.12)

    trail.position.x = -(compact ? 0.05 : 0.09) * dir
    trail.scale.set(1 + Math.abs(punch) * 3.6, 1 + strikePower * 0.2, 1)
    ;(trail.material as { opacity?: number }).opacity = trailAlpha

    ring.visible = ringAlpha > 0.02
    ring.position.x = (compact ? 0.2 : 0.52) * dir
    ring.scale.setScalar(0.7 + ringAlpha * (compact ? 0.8 : 1.46))
    ring.rotation.y = t * 5.4 * dir
    ;(ring.material as { opacity?: number }).opacity = ringAlpha * 0.7

    glow.position.x = (compact ? 0.05 : 0.08) * dir
    glow.scale.setScalar(1 + Math.abs(punch) * 2.5 + strikePower * 0.4)
    ;(glow.material as { opacity?: number }).opacity = glowAlpha * 0.7
  })

  return (
    <group ref={rootRef} visible={false}>
      <mesh ref={ringRef} visible={false} position={[0.18, 0, 0.02]} frustumCulled={false}>
        <torusGeometry args={[0.14, 0.014, 10, 18]} />
        <meshBasicMaterial
          color={side === 'left' ? '#93c5fd' : '#fda4af'}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <mesh ref={trailRef} position={[-0.06, 0, -0.02]} rotation={[0, 0, Math.PI / 2]} frustumCulled={false}>
        <cylinderGeometry args={[0.026, 0.06, 0.34, 18]} />
        <meshBasicMaterial
          color={side === 'left' ? '#60a5fa' : '#fb7185'}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <mesh ref={glowRef} position={[0.02, 0, -0.02]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshBasicMaterial
          color={side === 'left' ? '#93c5fd' : '#fda4af'}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <group ref={armRef}>
        <mesh castShadow frustumCulled={false} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.024, 0.14, 14]} />
          <meshStandardMaterial color="#1f2937" roughness={0.88} metalness={0.04} />
        </mesh>
        <mesh position={[0.07, 0, 0]} castShadow frustumCulled={false}>
          <sphereGeometry args={[0.028, 12, 10]} />
          <meshStandardMaterial color="#fca5a5" roughness={0.8} metalness={0.02} />
        </mesh>
      </group>

      <group ref={fistRef}>
        <mesh castShadow frustumCulled={false}>
          <sphereGeometry args={[0.082, 18, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            roughness={0.62}
            metalness={0.05}
            emissive="#7f1d1d"
            emissiveIntensity={0.12}
          />
        </mesh>
        <mesh position={[-0.06, -0.012, -0.018]} castShadow frustumCulled={false}>
          <boxGeometry args={[0.07, 0.045, 0.06]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.78} metalness={0.03} />
        </mesh>
      </group>
    </group>
  )
}

function FighterRig({
  side,
  mode,
  compact = false,
  preview = false,
}: {
  side: 'left' | 'right'
  mode: MotionState
  compact?: boolean
  preview?: boolean
}) {
  const boxingSource = useLoader(FBXLoader, boxingFbxUrl)
  const boxDefaultSource = useLoader(FBXLoader, boxDefaultFbxUrl)
  const ch09Source = useLoader(FBXLoader, ch09BoxingFbxUrl)
  const urishiSource = useLoader(FBXLoader, urishiFbxUrl)
  const urganPaytiSource = useLoader(FBXLoader, urganPaytiFbxUrl)
  const winnerSource = useLoader(FBXLoader, winnerFbxUrl)
  const nakauntSource = useLoader(FBXLoader, nakauntFbxUrl)
  const isDuelPreview = preview && !compact
  const isAttackDisplay = mode === 'attack' && !isDuelPreview
  const isOverlayDisplay = false
  const meshSource = mode === 'winner' ? winnerSource : mode === 'ko' ? nakauntSource : ch09Source
  const hasCh09Clip = ch09Source.animations.length > 0
  const hasBoxDefaultClip = boxDefaultSource.animations.length > 0
  const hasUrishiClip = urishiSource.animations.length > 0
  const hasUrilganPaytiClip = urganPaytiSource.animations.length > 0
  const hasWinnerClip = winnerSource.animations.length > 0
  const hasNakauntClip = nakauntSource.animations.length > 0
  const clipSource =
    mode === 'winner'
      ? (hasWinnerClip ? winnerSource : hasUrishiClip ? urishiSource : ch09Source)
      : mode === 'ko'
        ? (hasNakauntClip ? nakauntSource : hasUrilganPaytiClip ? urganPaytiSource : hasUrishiClip ? urishiSource : ch09Source)
        : mode === 'hit'
      ? (hasUrilganPaytiClip ? urganPaytiSource : hasUrishiClip ? urishiSource : ch09Source)
      : hasUrishiClip
        ? urishiSource
        : hasCh09Clip
          ? ch09Source
          : boxDefaultSource
  const overlayModelSource =
    mode === 'hit' ? urganPaytiSource : urishiSource
  const overlayClipSource =
    mode === 'hit'
      ? hasUrilganPaytiClip
        ? urganPaytiSource
        : hasUrishiClip
          ? urishiSource
          : boxingSource
      : hasUrishiClip
        ? urishiSource
        : boxingSource
  const usingOwnBoxClip = mode === 'winner' || mode === 'ko'
  const usingCh09BaseClip = !usingOwnBoxClip && (mode === 'idle' || isDuelPreview)
  // Yangi urushi/urgan payti assetlarida oldingi ch09 kabi +PI offset kerak emas.
  const sideFacingY = side === 'left' ? Math.PI / 2.15 : -Math.PI / 2.15

  const model = useMemo(() => cloneSkinned(meshSource) as Group, [meshSource, side])
  const attackOverlayModel = useMemo(() => cloneSkinned(overlayModelSource) as Group, [overlayModelSource, side])
  const wrapperRef = useRef<Group | null>(null)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const attackMixerRef = useRef<AnimationMixer | null>(null)
  const baseActionRef = useRef<ReturnType<AnimationMixer['clipAction']> | null>(null)
  const attackActionRef = useRef<ReturnType<AnimationMixer['clipAction']> | null>(null)
  const anchorPosRef = useRef(new Vector3())
  const anchorScaleRef = useRef(1)
  const attackAnchorPosRef = useRef(new Vector3())
  const attackAnchorScaleRef = useRef(1)
  const fitKeyRef = useRef<string | null>(null)
  const attackFitKeyRef = useRef<string | null>(null)
  const hipsRef = useRef<Bone | null>(null)
  const hipsPosRef = useRef(new Vector3())
  const hipsRotRef = useRef(new Vector3())
  const hipsScaleRef = useRef(new Vector3(1, 1, 1))
  const modeStartRef = useRef(0)
  const seed = useRef(Math.random() * 10)

  useEffect(() => {
    modeStartRef.current = performance.now()
  }, [mode])

  useLayoutEffect(() => {
    if (!wrapperRef.current) return
    const basePose = getFighterBasePosition(side, compact)
    wrapperRef.current.position.set(basePose.x, basePose.y, basePose.z)
    wrapperRef.current.rotation.y = sideFacingY
    wrapperRef.current.rotation.z = 0
  }, [compact, side, sideFacingY])

  useLayoutEffect(() => {
    const palette =
      side === 'left'
        ? {
            skin: '#d7a07a',
            shirt: '#2563eb',
            shorts: '#1d4ed8',
            glove: '#ef4444',
            shoe: '#111827',
            emissive: '#0f172a',
          }
        : {
            skin: '#c98e69',
            shirt: '#dc2626',
            shorts: '#b91c1c',
            glove: '#ef4444',
            shoe: '#111827',
            emissive: '#0f172a',
          }

    const tintMaterial = (material: unknown, partName = '') => {
      const mat = material as {
        clone?: () => unknown
        color?: { set: (value: string) => void }
        emissive?: { set: (value: string) => void }
        emissiveIntensity?: number
        metalness?: number
        roughness?: number
      } | null
      if (!mat) return material

      const cloned = (mat.clone ? (mat.clone() as typeof mat) : mat) ?? mat
      const n = partName.toLowerCase()
      const looksLikeHead = /head|neck/.test(n)
      const looksLikeHand = /hand|forearm|wrist/.test(n)
      const looksLikeLeg = /upleg|leg|calf|thigh/.test(n)
      const looksLikeFoot = /foot|toe|shoe/.test(n)
      const looksLikeTorso = /spine|chest|torso/.test(n)
      const looksLikeHip = /hips|pelvis/.test(n)

      let baseColor = palette.skin
      if (looksLikeTorso) baseColor = palette.shirt
      else if (looksLikeHip || looksLikeLeg) baseColor = palette.shorts
      else if (looksLikeHand) baseColor = palette.glove
      else if (looksLikeFoot) baseColor = palette.shoe
      else if (looksLikeHead) baseColor = palette.skin

      cloned.color?.set(baseColor)
      cloned.emissive?.set(palette.emissive)
      if (typeof cloned.emissiveIntensity === 'number') cloned.emissiveIntensity = 0.02
      if (typeof cloned.metalness === 'number') cloned.metalness = 0.04
      if (typeof cloned.roughness === 'number') cloned.roughness = 0.95
      return cloned
    }

    model.traverse((child: Object3D) => {
      const mesh = child as Mesh
      if (!('isMesh' in mesh) || !(mesh as Mesh & { isMesh?: boolean }).isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      // Animated/skinned mesh zarba payti frustumdan noto'g'ri chiqib, yo'qolib qolmasin.
      mesh.frustumCulled = false
      const partName = `${mesh.name ?? ''} ${child.name ?? ''}`
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => tintMaterial(material, partName)) as Mesh['material']
        : (tintMaterial(mesh.material, partName) as Mesh['material'])
    })

    attackOverlayModel.traverse((child: Object3D) => {
      const mesh = child as Mesh
      if (!('isMesh' in mesh) || !(mesh as Mesh & { isMesh?: boolean }).isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      const partName = `${mesh.name ?? ''} ${child.name ?? ''}`
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => tintMaterial(material, partName)) as Mesh['material']
        : (tintMaterial(mesh.material, partName) as Mesh['material'])
    })

    const bones: Bone[] = []
    model.traverse((child) => {
      if ((child as Bone).isBone) bones.push(child as Bone)
    })
    hipsRef.current =
      bones.find((b) => /hips/i.test(b.name)) ??
      bones.find((b) => /pelvis/i.test(b.name)) ??
      bones[0] ??
      null

    // Qarash yo'nalishini faqat wrapper boshqaradi (double-rotation bo'lmasin).
    model.rotation.y = 0

    const preferredClip = pickBestClip(clipSource.animations)
    if (preferredClip) {
      const mixer = new AnimationMixer(model)
      mixerRef.current = mixer
      const clip = preferredClip.clone()
      // Base animatsiyada ham root drift bo'lmasin: faqat lokal rotatsiyalar qolsin.
      const originalTracks = [...clip.tracks]
      let filteredTracks = originalTracks
      if (!usingOwnBoxClip) {
        filteredTracks = originalTracks.filter((track) => {
          if (track.name.endsWith('.scale')) return false
          if (track.name.endsWith('.position')) return false
          if (!track.name.endsWith('.quaternion')) return false
          const n = track.name.toLowerCase()
          const isRootLike =
            n.includes('hips') ||
            n.includes('pelvis') ||
            n.includes('root') ||
            n.includes('reference') ||
            n.includes('armature') ||
            n.endsWith('scene.quaternion') ||
            n.endsWith('scene.rotation')
          return !isRootLike
        })
        if (filteredTracks.length === 0) {
          filteredTracks = originalTracks.filter((track) => !track.name.endsWith('.scale'))
        }
      }
      clip.tracks = filteredTracks
      const action = mixer.clipAction(clip)
      baseActionRef.current = action
      action.reset()
      action.setLoop(LoopRepeat, Infinity)
      action.play()

      if (!isDuelPreview && mode === 'attack') {
        // Zarba birdan urib yubormasin: aniq ko'rinishi uchun sekinroq.
        action.timeScale = usingOwnBoxClip ? (compact ? 0.88 : 0.64) : compact ? 0.72 : 0.58
        mixer.update(0.04)
      } else if (mode === 'idle' || isDuelPreview) {
        // Qo'llar sekin qimirlab tursin, lekin fighter joyidan ketmasin (root drift pastda bosiladi).
        action.timeScale = usingOwnBoxClip ? (compact ? 0.7 : 0.85) : compact ? 0.42 : 0.28
        mixer.update(side === 'left' ? 0.04 : 0.06)
        action.paused = false
      } else {
        // hit/ko uchun safe pose.
        if (usingOwnBoxClip) {
          action.time = 0
          action.paused = true
        } else {
          const sampleTime = mode === 'hit' ? 0.32 : 0.42
          mixer.update(sampleTime)
          action.paused = true
        }
      }
    } else {
      mixerRef.current = null
    }

    const fitKey = `${compact ? 'compact' : 'duel'}:base`
    if (fitKeyRef.current !== fitKey) {
      const duelFitTarget = compact ? 1.35 : 2.05
      fitModelToStage(model, duelFitTarget)
      anchorPosRef.current.copy(model.position)
      anchorScaleRef.current = model.scale.x
      fitKeyRef.current = fitKey
      if (hipsRef.current) {
        hipsPosRef.current.copy(hipsRef.current.position)
        hipsRotRef.current.set(
          hipsRef.current.rotation.x,
          hipsRef.current.rotation.y,
          hipsRef.current.rotation.z,
        )
        hipsScaleRef.current.copy(hipsRef.current.scale)
      }
    } else if (hipsRef.current && !usingOwnBoxClip) {
      // Mode o'zgarganda base pose saqlanib qolsin.
      hipsRef.current.position.copy(hipsPosRef.current)
      hipsRef.current.rotation.x = hipsRotRef.current.x
      hipsRef.current.rotation.y = hipsRotRef.current.y
      hipsRef.current.rotation.z = hipsRotRef.current.z
      hipsRef.current.scale.copy(hipsScaleRef.current)
    }

    const attackFitKey = `${compact ? 'compact' : 'duel'}:${mode === 'hit' ? 'hit-overlay' : 'attack-overlay'}`
    if (attackFitKeyRef.current !== attackFitKey) {
      const overlayFitTarget = compact ? 1.35 : mode === 'hit' ? 1.68 : 1.82
      fitModelToStage(attackOverlayModel, overlayFitTarget)
      attackAnchorPosRef.current.copy(attackOverlayModel.position)
      attackAnchorScaleRef.current = attackOverlayModel.scale.x
      attackFitKeyRef.current = attackFitKey
    }

    const boxingClip = pickBestClip(overlayClipSource.animations)
    if (boxingClip) {
      const mixer = new AnimationMixer(attackOverlayModel)
      attackMixerRef.current = mixer
      const clip = boxingClip.clone()
      const originalTracks = [...clip.tracks]
      let overlayTracks = originalTracks.filter((track) => {
        if (track.name.endsWith('.scale')) return false
        if (track.name.endsWith('.position')) return false
        if (!track.name.endsWith('.quaternion')) return false
        const n = track.name.toLowerCase()
        if (
          n.includes('hips') ||
          n.includes('pelvis') ||
          n.includes('root') ||
          n.includes('reference') ||
          n.includes('armature') ||
          n.endsWith('scene.quaternion') ||
            n.endsWith('scene.rotation')
        ) {
          return false
        }
        // Rig nomlari har xil bo'lishi mumkin; rootni kesib, qolgan quaternionlarni qoldiramiz.
        return true
      })
      if (overlayTracks.length === 0) {
        overlayTracks = originalTracks.filter((track) => {
          if (!track.name.endsWith('.quaternion')) return false
          const n = track.name.toLowerCase()
          return !(
            n.includes('hips') ||
            n.includes('pelvis') ||
            n.includes('root') ||
            n.includes('reference') ||
            n.includes('armature') ||
            n.endsWith('scene.quaternion') ||
            n.endsWith('scene.rotation')
          )
        })
      }
      clip.tracks = overlayTracks

      const action = mixer.clipAction(clip)
      attackActionRef.current = action
      action.reset()
      action.setLoop(LoopRepeat, Infinity)
      action.paused = false
      action.play()
      if (isOverlayDisplay) {
        action.timeScale = mode === 'hit' ? (compact ? 0.72 : 0.68) : compact ? 0.72 : 0.62
        mixer.update(0.03)
      } else {
        action.time = 0
        action.paused = true
      }
    } else {
      attackMixerRef.current = null
      attackActionRef.current = null
    }

    return () => {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      baseActionRef.current = null
      attackMixerRef.current?.stopAllAction()
      attackMixerRef.current = null
      attackActionRef.current = null
      hipsRef.current = null
    }
  }, [
    attackOverlayModel,
    clipSource,
    compact,
    boxingSource,
    ch09Source,
    mode,
    nakauntSource,
    overlayClipSource,
    overlayModelSource,
    urganPaytiSource,
    urishiSource,
    winnerSource,
    isDuelPreview,
    model,
    side,
    usingOwnBoxClip,
  ])

  useEffect(() => {
    const baseAction = baseActionRef.current
    const baseMixer = mixerRef.current
    if (baseAction && baseMixer) {
      if (mode === 'idle' || isDuelPreview) {
        baseAction.setLoop(LoopRepeat, Infinity)
        baseAction.clampWhenFinished = false
        if (usingCh09BaseClip) {
          // ch09 default holatda qotib tursin, faqat attack payti qimirlasin.
          baseAction.time = 0
          baseAction.paused = true
          baseAction.play()
        } else {
          baseAction.paused = false
          baseAction.enabled = true
          baseAction.play()
          baseAction.timeScale = usingOwnBoxClip ? (compact ? 0.7 : 0.85) : compact ? 0.42 : 0.28
          baseMixer.setTime(side === 'left' ? 0.04 : 0.06)
        }
      } else if (mode === 'attack') {
        baseAction.reset()
        baseAction.paused = false
        baseAction.enabled = true
        baseAction.setLoop(LoopOnce, 1)
        baseAction.clampWhenFinished = true
        baseAction.play()
        baseAction.timeScale = compact ? 0.74 : 0.66
        baseMixer.setTime(0.02)
      } else if (mode === 'hit') {
        baseAction.reset()
        baseAction.time = 0
        baseAction.paused = false
        baseAction.enabled = true
        baseAction.setLoop(LoopOnce, 1)
        baseAction.clampWhenFinished = true
        baseAction.play()
        baseAction.timeScale = compact ? 0.74 : 0.7
      } else if (mode === 'winner') {
        baseAction.reset()
        baseAction.time = 0
        baseAction.paused = false
        baseAction.enabled = true
        baseAction.setLoop(LoopRepeat, Infinity)
        baseAction.clampWhenFinished = false
        baseAction.play()
        baseAction.timeScale = compact ? 0.72 : 0.66
      } else if (mode === 'ko') {
        baseAction.reset()
        baseAction.time = 0
        baseAction.paused = false
        baseAction.enabled = true
        baseAction.setLoop(LoopOnce, 1)
        baseAction.clampWhenFinished = true
        baseAction.play()
        baseAction.timeScale = compact ? 0.68 : 0.62
      }
    }

    const attackAction = attackActionRef.current
    const attackMixer = attackMixerRef.current
    if (attackAction && attackMixer) {
      if (isOverlayDisplay) {
        attackAction.reset()
        attackAction.paused = false
        attackAction.enabled = true
        attackAction.play()
        if (mode === 'hit') {
          attackAction.timeScale = compact ? 0.74 : 0.7
          attackMixer.setTime(0.01)
        } else {
          // Zarba ko'rinsin: attack animatsiya sekinroq va ravshanroq.
          attackAction.timeScale = compact ? 0.74 : 0.66
          attackMixer.setTime(0.02)
        }
      } else {
        attackAction.time = 0
        attackAction.paused = true
      }
    }
  }, [compact, isDuelPreview, isOverlayDisplay, mode, side, usingCh09BaseClip, usingOwnBoxClip])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + seed.current
    const elapsed = (performance.now() - modeStartRef.current) / 1000

    if (!wrapperRef.current) return

    if (mixerRef.current && (!isDuelPreview ? mode === 'attack' || mode === 'idle' || mode === 'hit' || mode === 'ko' || mode === 'winner' : true)) {
      const step = Math.min(delta, 0.04)
      const hitContactDelay = 0
      const allowHitMotion = mode !== 'hit' || elapsed >= hitContactDelay
      if (mode === 'hit' && !allowHitMotion) {
        // Zarba ko'rinib ulgursin, keyin urilgan animatsiya ishga tushsin.
        const baseAction = baseActionRef.current
        if (baseAction) {
          baseAction.time = 0
        }
      }
      if (!allowHitMotion) {
        // hit delay vaqtida mixer update qilmaymiz
      } else if (usingOwnBoxClip) {
        mixerRef.current.update(step * 0.8)
      } else {
        mixerRef.current.update(mode === 'attack' && !isDuelPreview ? step : step * 0.45)
      }
    }

    if (mode === 'ko') {
      const baseAction = baseActionRef.current
      if (baseAction) {
        const clipEnd = baseAction.getClip().duration
        if (baseAction.time >= clipEnd - 0.01) {
          baseAction.time = clipEnd
          baseAction.paused = true
        }
      }
    }
    if (attackMixerRef.current && isOverlayDisplay) {
      attackMixerRef.current.update(Math.min(delta, 0.04) * (mode === 'hit' ? 0.78 : 0.72))
    }

    // Ishlaydigan Mixamo cliplar uchun root driftni bosamiz.
    if (!usingOwnBoxClip) {
      model.position.copy(anchorPosRef.current)
      model.scale.setScalar(anchorScaleRef.current)
      model.rotation.x = 0
      model.rotation.y = 0
      model.rotation.z = 0
      if (hipsRef.current) {
        hipsRef.current.position.copy(hipsPosRef.current)
        hipsRef.current.rotation.x = hipsRotRef.current.x
        hipsRef.current.rotation.y = hipsRotRef.current.y
        hipsRef.current.rotation.z = hipsRotRef.current.z
        hipsRef.current.scale.copy(hipsScaleRef.current)
      }
    } else {
      // O'z animatsiyasi ishlasin, lekin model kadrdan chiqib ketmasin.
      model.position.copy(anchorPosRef.current)
      model.scale.setScalar(anchorScaleRef.current)
      model.rotation.x = 0
      model.rotation.y = 0
      model.rotation.z = 0
    }
    attackOverlayModel.position.copy(attackAnchorPosRef.current)
    attackOverlayModel.scale.setScalar(attackAnchorScaleRef.current)
    attackOverlayModel.rotation.x = 0
    attackOverlayModel.rotation.y = 0
    attackOverlayModel.rotation.z = 0
    const wrapper = wrapperRef.current
    const dir = side === 'left' ? 1 : -1
    wrapper.rotation.y = sideFacingY
    const basePose = getFighterBasePosition(side, compact)
    const baseX = basePose.x
    const baseY = basePose.y
    const baseZ = basePose.z
    const idleBob = compact ? Math.sin(t * 2.1) * 0.02 : Math.sin(t * 1.45) * 0.0025
    const idleTilt = compact ? Math.sin(t * 1.8) * 0.022 : Math.sin(t * 1.35) * 0.012

    let x = baseX
    let y = baseY + idleBob
    let zRot = idleTilt * dir

    if (mode === 'attack') {
      // Urayotgan odamcha joyida tursin, faqat "urushi" animatsiyasi ishlasin.
      x = baseX
      y = baseY
      zRot = 0
    } else if (mode === 'winner') {
      x = baseX
      y = baseY + (compact ? 0.02 : 0.03)
      zRot = 0
    } else if (mode === 'hit') {
      // Faqat "urgan payti" animatsiyasi ishlasin, wrapper joyidan siljimasin.
      x = baseX
      y = baseY
      zRot = 0
    } else if (mode === 'ko') {
      x -= dir * 0.14
      y -= 0.08
      zRot = 0
    }

    // Hech qachon markazdan o'tib ketmasin (joyi almashib qolmasin).
    if (!compact) {
      x = side === 'left' ? Math.min(x, -0.14) : Math.max(x, 0.14)
    }

    const settle = !compact && mode === 'idle' ? 0.46 : 0.22
    const activeStrike = false
    wrapper.position.x = MathUtils.lerp(wrapper.position.x, x, activeStrike ? 0.32 : settle)
    wrapper.position.y = MathUtils.lerp(wrapper.position.y, y, activeStrike ? 0.28 : settle)
    wrapper.position.z = MathUtils.lerp(wrapper.position.z, baseZ, activeStrike ? 0.24 : settle)
    wrapper.rotation.z = MathUtils.lerp(wrapper.rotation.z, zRot, activeStrike ? 0.3 : settle)
  })

  return (
    <group
      ref={wrapperRef}
      position={[
        getFighterBasePosition(side, compact).x,
        getFighterBasePosition(side, compact).y,
        getFighterBasePosition(side, compact).z,
      ]}
    >
      <primitive object={model} visible={!isOverlayDisplay} />
      <primitive object={attackOverlayModel} visible={false} />
    </group>
  )
}

function FighterStage({
  side,
  mode,
  compact = false,
}: {
  side: 'left' | 'right'
  mode: MotionState
  compact?: boolean
}) {
  return (
    <>
      <color attach="background" args={['#ffffff']} />
      <hemisphereLight args={['#e0f2fe', '#dbeafe', 1.15]} />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[2.5, 5, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.45} color={new Color('#fbcfe8')} />

      {SHOW_ARENA_FIGHTERS ? (
        <Suspense fallback={null}>
          <FighterRig side={side} mode={mode} compact={compact} />
        </Suspense>
      ) : null}
    </>
  )
}

function DuelStage({
  leftMode,
  rightMode,
  preview = false,
}: {
  leftMode: MotionState
  rightMode: MotionState
  preview?: boolean
}) {
  return (
    <>
      <hemisphereLight args={['#e0f2fe', '#dbeafe', 1.2]} />
      <ambientLight intensity={0.95} />
      <directionalLight
        position={[3.2, 5.5, 4.2]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3.2, 3.2, -2.5]} intensity={0.5} color={new Color('#fde68a')} />




      <mesh position={[0, 0.3, -0.45]}>
        <planeGeometry args={[6.2, 3.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {null}

      {SHOW_ARENA_FIGHTERS ? (
        <Suspense fallback={null}>
          <FighterRig side="left" mode={leftMode} preview={preview} />
          <FighterRig side="right" mode={rightMode} preview={preview} />
        </Suspense>
      ) : null}
    </>
  )
}

function DuelCameraShake({
  leftMode,
  rightMode,
}: {
  leftMode: MotionState
  rightMode: MotionState
}) {
  const { camera } = useThree()
  const shakeRef = useRef(0)
  const prevHitActiveRef = useRef(false)
  const phaseSeedRef = useRef(Math.random() * 100)
  const basePosRef = useRef({ x: 0, y: 0.12, z: 7.35 })

  useEffect(() => {
    camera.position.set(basePosRef.current.x, basePosRef.current.y, basePosRef.current.z)
    camera.lookAt(0, -0.7, 0)
  }, [camera])

  useEffect(() => {
    const impactActive = isImpactMotion(leftMode) || isImpactMotion(rightMode)

    if (impactActive && !prevHitActiveRef.current) {
      shakeRef.current = 0.18
      phaseSeedRef.current = Math.random() * 1000
    }
    prevHitActiveRef.current = impactActive
  }, [leftMode, rightMode])

  useFrame((state, delta) => {
    shakeRef.current = Math.max(0, shakeRef.current - delta)
    const power = Math.pow(shakeRef.current / 0.18, 2)
    const amount = power * 0.06
    const t = state.clock.elapsedTime * 48 + phaseSeedRef.current

    camera.position.x = basePosRef.current.x + Math.sin(t * 1.13) * amount
    camera.position.y = basePosRef.current.y + Math.cos(t * 0.97) * amount * 0.55
    camera.position.z = basePosRef.current.z + Math.sin(t * 0.73) * amount * 0.2
    camera.lookAt(0, -0.7, 0)
  })

  return null
}

function MixamoFighterCanvas({ side, mode, className = '' }: MixamoFighterCanvasProps) {
  return (
    <div
      className={`relative mt-3 h-44 w-full overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:h-48 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(56,189,248,0.12),transparent_45%),radial-gradient(circle_at_78%_22%,rgba(244,114,182,0.1),transparent_40%)]" />
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.5, 4.8], fov: 28 }}
      >
        <FighterStage side={side} mode={mode} compact />
      </Canvas>

      {mode === 'attack' ? (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow">
          Hit
        </div>
      ) : mode === 'winner' ? (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-emerald-600/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow">
          WIN
        </div>
      ) : mode === 'hit' ? (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-amber-500/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow">
          Dodge
        </div>
      ) : mode === 'ko' ? (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-slate-900/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow">
          KO
        </div>
      ) : null}
    </div>
  )
}

export function MixamoDuelCanvas({
  leftMode,
  rightMode,
  className = '',
  showReadyHint = false,
  preview = false,
}: {
  leftMode: MotionState
  rightMode: MotionState
  className?: string
  showReadyHint?: boolean
  preview?: boolean
}) {
  const [hitFlash, setHitFlash] = useState(false)
  const [impactSide, setImpactSide] = useState<'left' | 'right'>('right')
  const prevImpactRef = useRef(false)
  const flashTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const impactActive = isImpactMotion(leftMode) || isImpactMotion(rightMode)

    if (impactActive && !prevImpactRef.current) {
      const hitSide = leftMode === 'hit' ? 'left' : 'right'
      setImpactSide(hitSide)
      setHitFlash(true)
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
      flashTimerRef.current = window.setTimeout(() => {
        setHitFlash(false)
        flashTimerRef.current = null
      }, 190)
    }

    prevImpactRef.current = impactActive
  }, [leftMode, rightMode])

  useEffect(
    () => () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
    },
    [],
  )

  return (
    <div
      className={`relative h-[20rem] w-full overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] sm:h-[24rem] lg:h-[28rem] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${boxArenaBgUrl})`,
          backgroundPosition: 'center 58%',
          filter: 'contrast(1.12) saturate(1.16) brightness(0.98)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(8,15,28,0.10)_0%,rgba(8,15,28,0.04)_40%,rgba(8,15,28,0.08)_100%),radial-gradient(circle_at_14%_15%,rgba(56,189,248,0.04),transparent_33%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,0.04),transparent_33%)]" />
      <Canvas
        className="absolute inset-0 z-[2] translate-y-4 scale-[1.06] sm:translate-y-5 sm:scale-[1.08]"
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.12, 7.35], fov: 32 }}
      >
        <DuelCameraShake leftMode={leftMode} rightMode={rightMode} />
        <DuelStage leftMode={leftMode} rightMode={rightMode} preview={preview} />
      </Canvas>
      {false && SHOW_ARENA_FIGHTERS ? (
        <>
          <div
            className={`pointer-events-none absolute inset-y-0 z-[1] transition-opacity duration-150 ${hitFlash ? 'opacity-100' : 'opacity-0'} ${
              impactSide === 'left' ? 'left-0 w-28 sm:w-36' : 'right-0 w-28 sm:w-36'
            }`}
          >
            <div
              className={`absolute inset-y-0 w-full ${
                impactSide === 'left'
                  ? 'bg-gradient-to-r from-cyan-300/35 via-cyan-200/12 to-transparent'
                  : 'bg-gradient-to-l from-rose-300/35 via-rose-200/12 to-transparent'
              }`}
            />
          </div>
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${hitFlash ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.92),rgba(255,255,255,0.22)_24%,transparent_56%)]" />
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-400/15 via-cyan-200/8 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-rose-400/15 via-orange-200/8 to-transparent" />
          </div>
        </>
      ) : null}
      <div className="pointer-events-none absolute left-1/2 top-3 z-[3] -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 shadow">
        Duel Arena
      </div>
      {showReadyHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] flex justify-center">
          <div className="rounded-2xl border border-cyan-200 bg-white/90 px-4 py-2 text-center shadow">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Tayyor holat</p>
            <p className="mt-0.5 text-xs font-extrabold text-slate-700">Boshlashni bosing, duel boshlanadi</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MixamoFighterCanvas
