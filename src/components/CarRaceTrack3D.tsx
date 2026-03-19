import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import racingCarUrl from '../rasm/racingcar.avif'

type Props = {
  leftLabel: string
  rightLabel: string
  leftProgress: number
  rightProgress: number
  leftMoving: boolean
  rightMoving: boolean
  started: boolean
  finished: boolean
  className?: string
}

type Car3DProps = {
  side: 'left' | 'right'
  progress: number
  moving: boolean
  started: boolean
}

const TRACK_PROGRESS_MAX = 88
const TRACK_START_Z = 5.9
const TRACK_END_Z = -5.9
const CAR_START_Z = TRACK_START_Z - 1.2
const CAR_END_Z = TRACK_END_Z + 1.2

const toTrackZ = (progress: number) =>
  CAR_START_Z + ((CAR_END_Z - CAR_START_Z) * Math.max(0, Math.min(progress, TRACK_PROGRESS_MAX))) / TRACK_PROGRESS_MAX

function RacingCar3D({ side, progress, moving, started }: Car3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const sourceTexture = useLoader(THREE.TextureLoader, racingCarUrl)
  const keyedTexture = useMemo(() => {
    const image = sourceTexture.image as HTMLImageElement | undefined
    if (!image?.width || !image?.height) return sourceTexture
    if (typeof document === 'undefined') return sourceTexture

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return sourceTexture

    ctx.drawImage(image, 0, 0)
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = frame.data
    const w = canvas.width
    const h = canvas.height

    const corners = [
      0,
      (w - 1) * 4,
      (w * (h - 1)) * 4,
      ((w * h) - 1) * 4,
    ]

    let bgR = 0
    let bgG = 0
    let bgB = 0
    for (const idx of corners) {
      bgR += data[idx] ?? 0
      bgG += data[idx + 1] ?? 0
      bgB += data[idx + 2] ?? 0
    }
    bgR /= corners.length
    bgG /= corners.length
    bgB /= corners.length

    const isBgCandidate = (px: number) => {
      const i = px * 4
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0

      const dr = r - bgR
      const dg = g - bgG
      const db = b - bgB
      const dist = Math.sqrt(dr * dr + dg * dg + db * db)
      const nearWhite = r > 238 && g > 238 && b > 238
      return dist < 58 || nearWhite
    }

    const visited = new Uint8Array(w * h)
    const queue: number[] = []
    const pushIfCandidate = (x: number, y: number) => {
      const px = y * w + x
      if (visited[px] || !isBgCandidate(px)) return
      visited[px] = 1
      queue.push(px)
    }

    for (let x = 0; x < w; x += 1) {
      pushIfCandidate(x, 0)
      pushIfCandidate(x, h - 1)
    }
    for (let y = 0; y < h; y += 1) {
      pushIfCandidate(0, y)
      pushIfCandidate(w - 1, y)
    }

    while (queue.length) {
      const px = queue.pop()
      if (px === undefined) continue
      const i = px * 4
      data[i + 3] = 0

      const x = px % w
      const y = (px - x) / w
      if (x > 0) pushIfCandidate(x - 1, y)
      if (x < w - 1) pushIfCandidate(x + 1, y)
      if (y > 0) pushIfCandidate(x, y - 1)
      if (y < h - 1) pushIfCandidate(x, y + 1)
    }

    // Mashina tanasi xira bo'lib qolmasligi uchun qolgan piksellarni to'liq opaque qilamiz.
    for (let i = 0; i < data.length; i += 4) {
      if ((data[i + 3] ?? 0) > 0) data[i + 3] = 255
    }

    ctx.putImageData(frame, 0, 0)

    // Foreground bounding-box ni olib, ortiqcha bo'sh joylarni kesamiz (aniqroq va tiniq ko'rinish).
    let minX = w
    let minY = h
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const a = data[(y * w + x) * 4 + 3] ?? 0
        if (a > 0) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    let texCanvas: HTMLCanvasElement = canvas
    if (maxX >= minX && maxY >= minY) {
      const pad = 2
      const cropX = Math.max(0, minX - pad)
      const cropY = Math.max(0, minY - pad)
      const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2)
      const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2)
      const cropped = document.createElement('canvas')
      cropped.width = Math.max(1, cropW)
      cropped.height = Math.max(1, cropH)
      const cctx = cropped.getContext('2d')
      if (cctx) cctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
      texCanvas = cropped
    }

    const tex = new THREE.CanvasTexture(texCanvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = false
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    tex.premultiplyAlpha = false
    tex.needsUpdate = true
    return tex
  }, [sourceTexture])
  const carAspect = useMemo(() => {
    const image = (keyedTexture as THREE.Texture).image as HTMLImageElement | HTMLCanvasElement | undefined
    if (!image?.width || !image?.height) return 1.72
    return image.width / image.height
  }, [keyedTexture])
  useMemo(() => {
    sourceTexture.colorSpace = THREE.SRGBColorSpace
    sourceTexture.needsUpdate = true
  }, [sourceTexture])
  useEffect(() => {
    return () => {
      if (keyedTexture !== sourceTexture) keyedTexture.dispose()
    }
  }, [keyedTexture, sourceTexture])

  const laneX = side === 'left' ? -1.05 : 1.05
  const glow = side === 'left' ? '#67e8f9' : '#fda4af'

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const targetZ = toTrackZ(progress)
    const lerpSpeed = moving ? 6.8 : 3.2
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, 1 - Math.exp(-lerpSpeed * delta))

    const t = state.clock.elapsedTime
    const idleBob = started ? Math.sin(t * 4.2 + (side === 'left' ? 0 : 1.2)) * 0.015 : 0
    const boostTilt = moving ? -0.055 : -0.012
    const sway = moving ? Math.sin(t * 11 + (side === 'left' ? 0 : 0.9)) * 0.02 : 0
    group.position.y = 0.26 + idleBob + (moving ? Math.sin(t * 18) * 0.006 : 0)
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, sway, 1 - Math.exp(-7 * delta))
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, 1 - Math.exp(-7 * delta))
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, boostTilt, 1 - Math.exp(-8 * delta))
  })

  return (
    <group ref={groupRef} position={[laneX, 0.26, toTrackZ(progress)]} scale={[1.42, 1.42, 1.42]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.35, 0.74]} />
        <meshBasicMaterial color={glow} transparent opacity={moving ? 0.08 : 0.03} />
      </mesh>

      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <planeGeometry args={[1.74, 1.74 / carAspect]} />
        <meshBasicMaterial map={keyedTexture} transparent alphaTest={0.38} side={THREE.DoubleSide} />
      </mesh>

      {moving ? (
        <>
          <mesh position={[0, 0.2, 0.42]}>
            <boxGeometry args={[0.16, 0.07, 0.2]} />
            <meshBasicMaterial color="#fde68a" transparent opacity={0.65} />
          </mesh>
          <mesh position={[0, 0.2, 0.56]}>
            <boxGeometry args={[0.12, 0.05, 0.15]} />
            <meshBasicMaterial color="#fb923c" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-0.08, 0.2, 0.48]}>
            <boxGeometry args={[0.08, 0.05, 0.12]} />
            <meshBasicMaterial color="#fde68a" transparent opacity={0.65} />
          </mesh>
          <mesh position={[0.08, 0.2, 0.48]}>
            <boxGeometry args={[0.08, 0.05, 0.12]} />
            <meshBasicMaterial color="#fb923c" transparent opacity={0.6} />
          </mesh>
        </>
      ) : null}

      <mesh position={[0, 0.12, 0]} receiveShadow>
        <shadowMaterial opacity={0.06} />
        <planeGeometry args={[1.05, 0.62]} />
      </mesh>
    </group>
  )
}

function RoadDashMarks({ started, finished }: { started: boolean; finished: boolean }) {
  const marks = useMemo(() => {
    const out: Array<[number, number, number]> = []
    for (let z = TRACK_END_Z + 0.55; z < TRACK_START_Z - 0.35; z += 1.05) {
      out.push([0, 0.018, z], [-2.15, 0.018, z], [2.15, 0.018, z])
    }
    return out
  }, [])

  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    if (!started || finished) {
      groupRef.current.position.z = 0
      return
    }
    groupRef.current.position.z = (state.clock.elapsedTime * 3.8) % 1.05
  })

  return (
    <group ref={groupRef}>
      {marks.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} receiveShadow>
          <boxGeometry args={[pos[0] === 0 ? 0.12 : 0.08, 0.04, 0.42]} />
          <meshStandardMaterial color={pos[0] === 0 ? '#ffffff' : '#cbd5e1'} emissive={pos[0] === 0 ? '#ffffff' : '#64748b'} emissiveIntensity={0.12} />
        </mesh>
      ))}
    </group>
  )
}

function RaceScene({
  leftProgress,
  rightProgress,
  leftMoving,
  rightMoving,
  started,
  finished,
}: Omit<Props, 'leftLabel' | 'rightLabel'>) {
  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[5, 8, 4]} intensity={1.15} castShadow />
      <pointLight position={[-5, 5, 0]} intensity={0.9} color="#93c5fd" />
      <pointLight position={[5, 5, 0]} intensity={0.9} color="#fda4af" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <planeGeometry args={[9.4, 16.2]} />
        <meshStandardMaterial color="#111827" roughness={0.85} metalness={0.08} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[6.5, 14.4]} />
        <meshStandardMaterial color="#263244" roughness={0.7} metalness={0.06} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[-1.15, 0.002, 0]}>
        <planeGeometry args={[2.02, 14.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[1.15, 0.002, 0]}>
        <planeGeometry args={[2.02, 14.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.62} metalness={0.08} />
      </mesh>

      <RoadDashMarks started={started} finished={finished} />

      <mesh position={[0, 0.4, TRACK_END_Z - 0.16]} castShadow receiveShadow>
        <boxGeometry args={[5.7, 0.8, 0.2]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.25} roughness={0.4} />
      </mesh>
      {[-2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5].map((x, i) => (
        <mesh key={`finish-${i}`} position={[x, 0.4, TRACK_END_Z - 0.12]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#111827' : '#f8fafc'} />
        </mesh>
      ))}

      <mesh position={[-3.22, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.06, 15.2]} />
        <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[3.22, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.06, 15.2]} />
        <meshStandardMaterial color="#fb7185" emissive="#e11d48" emissiveIntensity={0.2} />
      </mesh>

      <RacingCar3D side="left" progress={leftProgress} moving={leftMoving} started={started} />
      <RacingCar3D side="right" progress={rightProgress} moving={rightMoving} started={started} />
    </>
  )
}

const CarRaceTrack3D = memo(function CarRaceTrack3D({
  leftLabel,
  rightLabel,
  leftProgress,
  rightProgress,
  leftMoving,
  rightMoving,
  started,
  finished,
  className = '',
}: Props) {
  return (
    <div className={`relative h-full min-h-[15rem] overflow-hidden rounded-2xl bg-[#0b1220] ${className}`}>
      <div className="absolute inset-0 opacity-32" style={{ backgroundImage: 'radial-gradient(circle at 18% 15%, rgba(56,189,248,.12), transparent 42%), radial-gradient(circle at 82% 18%, rgba(251,113,133,.12), transparent 44%)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/3 via-transparent to-slate-950/10" />

      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.75]}
        shadows
        camera={{ position: [0, 15.4, 0], fov: 46, near: 0.1, far: 80 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0)
          camera.up.set(0, 0, -1)
          camera.lookAt(0, 0, 0)
        }}
      >
        <RaceScene
          leftProgress={leftProgress}
          rightProgress={rightProgress}
          leftMoving={leftMoving}
          rightMoving={rightMoving}
          started={started}
          finished={finished}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/25 to-transparent" />
    </div>
  )
})

export default CarRaceTrack3D
