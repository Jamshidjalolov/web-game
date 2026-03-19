import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, OrbitControls, Text, useTexture } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Side = 'left' | 'right'
type SpecialTone = 'emerald' | 'rose' | 'amber'

type BoardStep = {
  step: number
  x: number
  y: number
  special?: { delta: number; tone: SpecialTone }
}

type Coord = { x: number; y: number }

type Props = {
  imageUrl: string
  steps: BoardStep[]
  leftCoord: Coord
  rightCoord: Coord
  leftLabel: string
  rightLabel: string
  movingSide: Side | null
  started: boolean
}

const TOP_SIZE = 9.2
const BOARD_THICKNESS = 0.52
const MARKER_Y = BOARD_THICKNESS / 2 + 0.06
const TOKEN_Y = BOARD_THICKNESS / 2 + 0.2

const toLocal = (coord: Coord): [number, number] => [
  ((coord.x / 100) - 0.5) * TOP_SIZE,
  ((coord.y / 100) - 0.5) * TOP_SIZE,
]

const toneColor = (tone?: SpecialTone) =>
  tone === 'emerald' ? '#34d399' : tone === 'rose' ? '#fb7185' : tone === 'amber' ? '#f59e0b' : '#f8f0da'

function TokenPiece({
  coord,
  label,
  colorA,
  colorB,
  moving,
  phase,
}: {
  coord: Coord
  label: string
  colorA: string
  colorB: string
  moving: boolean
  phase: number
}) {
  const ref = useRef<THREE.Group>(null)
  const [x, z] = toLocal(coord)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() + phase
    const idle = Math.sin(t * 2.1) * 0.04
    const bounce = moving ? Math.abs(Math.sin(t * 12)) * 0.18 : idle
    ref.current.position.set(x, TOKEN_Y + bounce, z)
  })

  return (
    <group ref={ref} castShadow>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.12, 28]} />
        <meshStandardMaterial color={colorA} roughness={0.35} metalness={0.22} />
      </mesh>
      <mesh castShadow position={[0, 0.11, 0]}>
        <sphereGeometry args={[0.22, 28, 22]} />
        <meshStandardMaterial color={colorB} roughness={0.18} metalness={0.28} emissive={colorA} emissiveIntensity={0.1} />
      </mesh>
      <Text
        position={[0, 0.47, 0]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineColor="rgba(15,23,42,0.8)"
        outlineWidth={0.03}
      >
        {label.slice(0, 1).toUpperCase()}
      </Text>
    </group>
  )
}

function JumanjiBoardScene({
  imageUrl,
  steps,
  leftCoord,
  rightCoord,
  leftLabel,
  rightLabel,
  movingSide,
  started,
}: Props) {
  const boardRef = useRef<THREE.Group>(null)
  const woodTexture = useTexture(imageUrl)

  useEffect(() => {
    woodTexture.colorSpace = THREE.SRGBColorSpace
    woodTexture.wrapS = THREE.ClampToEdgeWrapping
    woodTexture.wrapT = THREE.ClampToEdgeWrapping
    woodTexture.anisotropy = 8
  }, [woodTexture])

  const pathPoints = useMemo(
    () =>
      steps
        .slice()
        .sort((a, b) => a.step - b.step)
        .map((s) => {
          const [x, z] = toLocal({ x: s.x, y: s.y })
          return new THREE.Vector3(x, MARKER_Y + 0.005, z)
        }),
    [steps],
  )

  useFrame(({ clock }) => {
    if (!boardRef.current) return
    const t = clock.getElapsedTime()
    boardRef.current.position.y = 0.35 + Math.sin(t * 0.55) * 0.03
    boardRef.current.rotation.x = -0.62 + Math.sin(t * 0.35) * 0.01
    boardRef.current.rotation.z = Math.sin(t * 0.42) * 0.008
  })

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00008}
      />
      <pointLight position={[-6, 5, -4]} intensity={0.5} color="#60a5fa" />
      <pointLight position={[5, 4, 6]} intensity={0.55} color="#f59e0b" />

      <group ref={boardRef} position={[0, 0.35, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[10.6, BOARD_THICKNESS, 10.6]} />
          <meshStandardMaterial color="#4a2f22" roughness={0.78} metalness={0.05} />
        </mesh>

        <mesh position={[0, BOARD_THICKNESS / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[TOP_SIZE, TOP_SIZE]} />
          <meshStandardMaterial map={woodTexture} roughness={0.6} metalness={0.04} />
        </mesh>

        <mesh position={[0, BOARD_THICKNESS / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.82, 1.42, 64]} />
          <meshStandardMaterial color="#365314" emissive="#22c55e" emissiveIntensity={0.28} transparent opacity={0.7} />
        </mesh>

        <Line points={pathPoints} color="#f8e4b7" transparent opacity={0.7} lineWidth={1.6} />
        <Line points={pathPoints} color="#2f2018" transparent opacity={0.4} lineWidth={0.5} dashed dashSize={0.14} gapSize={0.1} />

        {steps.map((step) => {
          const [x, z] = toLocal({ x: step.x, y: step.y })
          const isFinish = step.step === 30
          const markerColor = isFinish ? '#22c55e' : toneColor(step.special?.tone)
          return (
            <group key={step.step} position={[x, MARKER_Y, z]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[isFinish ? 0.23 : 0.17, isFinish ? 0.23 : 0.17, 0.05, 24]} />
                <meshStandardMaterial color={markerColor} roughness={0.32} metalness={0.16} emissive={isFinish ? '#16a34a' : '#000000'} emissiveIntensity={isFinish ? 0.14 : 0} />
              </mesh>
              {step.special && !isFinish ? (
                <mesh position={[0, 0.07, -0.28]} castShadow>
                  <sphereGeometry args={[0.06, 12, 12]} />
                  <meshStandardMaterial
                    color={step.special.delta > 0 ? '#22c55e' : '#f43f5e'}
                    emissive={step.special.delta > 0 ? '#16a34a' : '#e11d48'}
                    emissiveIntensity={0.35}
                  />
                </mesh>
              ) : null}
            </group>
          )
        })}

        <TokenPiece
          coord={leftCoord}
          label={leftLabel}
          colorA="#06b6d4"
          colorB="#2563eb"
          moving={movingSide === 'left' && started}
          phase={0}
        />
        <TokenPiece
          coord={rightCoord}
          label={rightLabel}
          colorA="#f43f5e"
          colorB="#dc2626"
          moving={movingSide === 'right' && started}
          phase={0.7}
        />
      </group>

      <Float floatIntensity={0.55} speed={1.1} rotationIntensity={0}>
        <mesh position={[0, 1.45, 0]}>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color="#86efac" emissive="#22c55e" emissiveIntensity={0.8} transparent opacity={0.82} />
        </mesh>
      </Float>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]} receiveShadow>
        <circleGeometry args={[7.9, 64]} />
        <meshStandardMaterial color="#05070f" transparent opacity={0.25} />
      </mesh>

      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  )
}

export default function JumanjiBoard3D(props: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 8.8, 6.6], fov: 34 }} gl={{ alpha: true, antialias: true }}>
        <JumanjiBoardScene {...props} />
      </Canvas>
    </div>
  )
}
