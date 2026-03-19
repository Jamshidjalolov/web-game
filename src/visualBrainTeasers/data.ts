import type {
  VisualBrainTeaserCategory,
  VisualBrainTeaserDifficulty,
  VisualBrainTeaserPuzzle,
} from './types.ts'

export const VISUAL_BRAIN_TEASER_DIFFICULTY_LABELS: Record<VisualBrainTeaserDifficulty, string> = {
  easy: 'Oson',
  medium: "O'rta",
  hard: 'Qiyin',
}

export const VISUAL_BRAIN_TEASER_DIFFICULTY_CONFIG: Record<
  VisualBrainTeaserDifficulty,
  {
    timerSeconds: number
    points: number
    rounds: number[]
  }
> = {
  easy: {
    timerSeconds: 35,
    points: 10,
    rounds: [10],
  },
  medium: {
    timerSeconds: 30,
    points: 15,
    rounds: [10],
  },
  hard: {
    timerSeconds: 25,
    points: 20,
    rounds: [10],
  },
}

export const VISUAL_BRAIN_TEASER_CATEGORY_LABELS: Record<VisualBrainTeaserCategory, string> = {
  'pattern logic': 'Naqsh mantiqi',
  'visual IQ puzzles': 'Vizual IQ',
  'missing number': "Yetishmayotgan son",
  'math visual puzzles': 'Matematik puzzle',
  'maze puzzles': 'Labirint puzzle',
  'sudoku & grid': 'Sudoku va grid',
  'tiling puzzles': 'Joylash puzzle',
  'chess visual puzzles': 'Shakl kombinatsiyasi',
  'logic classics': 'Klassik mantiq',
}

type TileShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'hex' | 'plus'
type TileFill = 'solid' | 'outline' | 'striped' | 'dot'

type TileSpec = {
  shape: TileShape
  color: string
  rotation: number
  count: number
  size: number
  fill: TileFill
}

type VisualIqOptionCard = {
  value: string
  label: string
  imageUrl: string
  alt: string
}

type RotationPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shape: TileShape
  color: string
  fill: TileFill
  baseRotation: number
  rowStep: number
  columnStep: number
  size: number
}

type CountPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shape: TileShape
  color: string
  fill: TileFill
  baseCount: number
  rowStep: number
  columnStep: number
  size: number
}

type ShapeCyclePuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shapes: TileShape[]
  color: string
  fill: TileFill
  offset: number
  rowStep: number
  columnStep: number
  size: number
  count: number
}

type FillPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shape: TileShape
  color: string
  fills: TileFill[]
  offset: number
  rowStep: number
  columnStep: number
  size: number
  count: number
}

type ColorPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shape: TileShape
  colors: string[]
  fill: TileFill
  offset: number
  rowStep: number
  columnStep: number
  size: number
  count: number
  rotation: number
}

type SizePuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shape: TileShape
  color: string
  fill: TileFill
  baseSize: number
  rowStep: number
  columnStep: number
  count: number
  rotation: number
}

type HybridPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shapes: TileShape[]
  colors: string[]
  fill: TileFill
  shapeOffset: number
  rowShapeStep: number
  columnShapeStep: number
  colorOffset: number
  rowColorStep: number
  columnColorStep: number
  countBase: number
  rowCountStep: number
  columnCountStep: number
  size: number
  baseRotation: number
  rowRotationStep: number
  columnRotationStep: number
}

type LogicGridPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  operation: 'xor' | 'and' | 'or'
  rows: Array<readonly [number, number]>
  shape: TileShape
  color: string
  fill: TileFill
  size: number
  rotation: number
}

type ComboPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  shapes: TileShape[]
  colors: string[]
  fill: TileFill
  shapeOffset: number
  countBase: number
  countRowStep: number
  countColumnStep: number
  size: number
}

type AxisTriplet<T> = readonly [T, T, T]

type AxisBlendPuzzleConfig = {
  id: string
  difficulty: VisualBrainTeaserDifficulty
  category: VisualBrainTeaserCategory
  base: TileSpec
  rowShapes?: AxisTriplet<TileShape>
  rowColors?: AxisTriplet<string>
  rowFills?: AxisTriplet<TileFill>
  rowRotations?: AxisTriplet<number>
  rowSizes?: AxisTriplet<number>
  columnShapes?: AxisTriplet<TileShape>
  columnColors?: AxisTriplet<string>
  columnFills?: AxisTriplet<TileFill>
  columnRotations?: AxisTriplet<number>
  columnSizes?: AxisTriplet<number>
}

type MatrixTheme = {
  frameFrom: string
  frameTo: string
  frameStroke: string
  glow: string
  cellFill: string
  cellStroke: string
  markerColor: string
}

 type PuzzleFamily = 'rotation' | 'count' | 'shape' | 'fill' | 'color' | 'size' | 'axis' | 'hybrid' | 'logic' | 'combo'
type TileDifferenceKind = 'shape' | 'color' | 'rotation' | 'count' | 'size' | 'fill'

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const
const ALL_TILE_SHAPES: TileShape[] = ['circle', 'square', 'triangle', 'diamond', 'hex', 'plus']
const ALL_TILE_FILLS: TileFill[] = ['solid', 'outline', 'striped', 'dot']

const PALETTE = {
  blue: '#2563eb',
  teal: '#0891b2',
  emerald: '#16a34a',
  amber: '#d97706',
  rose: '#e11d48',
  violet: '#7c3aed',
} as const
const ALL_TILE_COLORS = Object.values(PALETTE)

const MATRIX_LAYOUT = {
  size: 520,
  padding: 18,
  gap: 12,
  cellSize: 153,
  canvasWidth: 880,

}
const LOGIC_MASK_LAYOUT: Array<[number, number]> = [
  [-42, -34],
  [0, -34],
  [42, -34],
  [-42, 34],
  [0, 34],
  [42, 34],
]

const MATRIX_THEMES: Record<string, MatrixTheme> = {
  sky: {
    frameFrom: '#eff6ff',
    frameTo: '#dbeafe',
    frameStroke: '#93c5fd',
    glow: '#60a5fa',
    cellFill: '#ffffff',
    cellStroke: '#bfdbfe',
    markerColor: '#1d4ed8',
  },
  amber: {
    frameFrom: '#fffbeb',
    frameTo: '#fde68a',
    frameStroke: '#f59e0b',
    glow: '#fbbf24',
    cellFill: '#fffef7',
    cellStroke: '#fcd34d',
    markerColor: '#b45309',
  },
  emerald: {
    frameFrom: '#ecfdf5',
    frameTo: '#d1fae5',
    frameStroke: '#34d399',
    glow: '#10b981',
    cellFill: '#f8fffc',
    cellStroke: '#6ee7b7',
    markerColor: '#047857',
  },
  rose: {
    frameFrom: '#fff1f2',
    frameTo: '#ffe4e6',
    frameStroke: '#fb7185',
    glow: '#f43f5e',
    cellFill: '#fffafb',
    cellStroke: '#fda4af',
    markerColor: '#be123c',
  },
  violet: {
    frameFrom: '#f5f3ff',
    frameTo: '#ede9fe',
    frameStroke: '#a78bfa',
    glow: '#8b5cf6',
    cellFill: '#fdfcff',
    cellStroke: '#c4b5fd',
    markerColor: '#6d28d9',
  },
  slate: {
    frameFrom: '#f8fafc',
    frameTo: '#e2e8f0',
    frameStroke: '#64748b',
    glow: '#475569',
    cellFill: '#ffffff',
    cellStroke: '#94a3b8',
    markerColor: '#0f172a',
  },
}

const OPTION_IMAGE_SIZE = 270
const STROKE_COLOR = '#0f172a'

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const toSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`

const normalizeRotation = (value: number) => ((value % 360) + 360) % 360

const rotateArray = <T,>(items: T[], offset: number) =>
  items.map((_, index) => items[(index + offset) % items.length] as T)

const darkenHex = (hex: string, amount: number) => {
  const normalized = hex.replace('#', '')
  const number = Number.parseInt(normalized, 16)
  const red = Math.max(0, Math.min(255, ((number >> 16) & 0xff) - amount))
  const green = Math.max(0, Math.min(255, ((number >> 8) & 0xff) - amount))
  const blue = Math.max(0, Math.min(255, (number & 0xff) - amount))

  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const buildTileKey = (tile: TileSpec) =>
  [tile.shape, tile.color, tile.rotation, tile.count, tile.size, tile.fill].join('|')

const normalizeShapeRotation = (shape: TileShape, rotation: number) =>
  shape === 'circle' ? 0 : normalizeRotation(rotation % getShapeRotationStep(shape))

const getShapeRotationStep = (shape: TileShape) => {
  if (shape === 'circle') return 360
  if (shape === 'triangle') return 120
  if (shape === 'hex') return 60
  if (shape === 'square' || shape === 'diamond' || shape === 'plus') return 90
  return 360
}

const buildTileVisualKey = (tile: TileSpec) => {
  const step = getShapeRotationStep(tile.shape)
  const canonicalRotation = tile.shape === 'circle' ? 0 : normalizeRotation(tile.rotation) % step

  return [tile.shape, tile.color, canonicalRotation, tile.count, tile.size, tile.fill].join('|')
}

const getTileDifferenceKinds = (left: TileSpec, right: TileSpec): TileDifferenceKind[] => {
  const differences: TileDifferenceKind[] = []
  const leftStep = getShapeRotationStep(left.shape)
  const rightStep = getShapeRotationStep(right.shape)
  const leftRotation = left.shape === 'circle' ? 0 : normalizeRotation(left.rotation) % leftStep
  const rightRotation = right.shape === 'circle' ? 0 : normalizeRotation(right.rotation) % rightStep

  if (left.shape !== right.shape) differences.push('shape')
  if (left.color !== right.color) differences.push('color')
  if (left.shape === right.shape && leftRotation !== rightRotation) {
    differences.push('rotation')
  }
  if (left.count !== right.count) differences.push('count')
  if (left.size !== right.size) differences.push('size')
  if (left.fill !== right.fill) differences.push('fill')

  return differences
}

const getTileDifferenceScore = (left: TileSpec, right: TileSpec) => {
  let score = 0

  if (left.shape !== right.shape) score += 14
  if (left.fill !== right.fill) score += 12
  if (left.color !== right.color) score += 10
  if (left.count !== right.count) score += Math.abs(left.count - right.count) * 8
  if (left.size !== right.size) score += Math.abs(left.size - right.size) * 1.5

  if (left.shape !== 'circle' || right.shape !== 'circle') {
    const leftStep = getShapeRotationStep(left.shape)
    const rightStep = getShapeRotationStep(right.shape)
    const leftRotation = normalizeRotation(left.rotation) % leftStep
    const rightRotation = normalizeRotation(right.rotation) % rightStep
    const delta = Math.abs(leftRotation - rightRotation)
    const wrappedDelta = Math.min(delta, 360 - delta)
    score += wrappedDelta / 6
  }

  return score
}

const clampTileCount = (count: number) => Math.max(1, Math.min(10, count))
const clampTileSize = (size: number) => Math.max(20, Math.min(44, size))
const clampLogicMask = (mask: number) => mask & 0b111111

const collectDistinctTiles = (tiles: TileSpec[]) => {
  const seen = new Set<string>()

  return tiles.filter((tile) => {
    const key = buildTileVisualKey(tile)
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const collectDistinctMasks = (masks: number[]) => {
  const seen = new Set<number>()

  return masks.filter((mask) => {
    const normalized = clampLogicMask(mask)
    if (normalized === 0 || seen.has(normalized)) {
      return false
    }

    seen.add(normalized)
    return true
  })
}

const createSeededRandom = (seed: number) => {
  let state = (seed >>> 0) || 0x6d2b79f5

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let next = Math.imul(state ^ (state >>> 15), 1 | state)
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

const deterministicShuffle = <T,>(items: T[], seed: number) => {
  const next = [...items]
  const random = createSeededRandom(seed)

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex] as T, next[index] as T]
  }

  return next
}

const COUNT_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-28, 0], [28, 0]],
  3: [[0, -28], [-32, 28], [32, 28]],
  4: [[-34, -34], [34, -34], [-34, 34], [34, 34]],
  5: [[-36, -36], [36, -36], [0, 0], [-36, 36], [36, 36]],
  6: [[-36, -30], [36, -30], [-36, 0], [36, 0], [-36, 30], [36, 30]],
  7: [[0, -38], [-34, -12], [34, -12], [-38, 26], [0, 26], [38, 26], [0, 6]],
  8: [[-36, -36], [0, -36], [36, -36], [-36, 0], [36, 0], [-36, 36], [0, 36], [36, 36]],
  9: [[-38, -38], [0, -38], [38, -38], [-38, 0], [0, 0], [38, 0], [-38, 38], [0, 38], [38, 38]],
  10: [[-40, -40], [0, -40], [40, -40], [-40, -10], [0, -10], [40, -10], [-40, 22], [0, 22], [40, 22], [0, 46]],
}

const OPTION_PREVIEW_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-38, 0], [38, 0]],
  3: [[-38, -24], [38, -24], [0, 34]],
  4: [[-40, -40], [40, -40], [-40, 40], [40, 40]],
  5: [[-42, -38], [42, -38], [0, 0], [-42, 38], [42, 38]],
  6: [[-44, -38], [0, -38], [44, -38], [-44, 38], [0, 38], [44, 38]],
  7: [[-44, -44], [0, -44], [44, -44], [-44, 0], [44, 0], [-22, 44], [22, 44]],
  8: [[-44, -44], [0, -44], [44, -44], [-44, 0], [44, 0], [-44, 44], [0, 44], [44, 44]],
  9: [[-44, -44], [0, -44], [44, -44], [-44, 0], [0, 0], [44, 0], [-44, 44], [0, 44], [44, 44]],
  10: [[-48, -40], [-16, -40], [16, -40], [48, -40], [-48, 0], [-16, 0], [16, 0], [48, 0], [-24, 40], [24, 40]],
}

const getTilePositions = (count: number) => COUNT_POSITIONS[Math.max(1, Math.min(10, count))] ?? COUNT_POSITIONS[1]
const getOptionPreviewPositions = (count: number) =>
  OPTION_PREVIEW_POSITIONS[Math.max(1, Math.min(10, count))] ?? OPTION_PREVIEW_POSITIONS[1]

const getSymbolScale = (count: number) => {
  if (count >= 10) return 0.38
  if (count === 9) return 0.42
  if (count >= 8) return 0.48
  if (count === 7) return 0.54
  if (count === 6) return 0.6
  if (count === 5) return 0.68
  if (count === 4) return 0.76
  if (count === 3) return 0.84
  if (count === 2) return 0.92
  return 1
}

const getSymbolFrameFillScale = (count: number) => {
  if (count === 1) return 1.34
  if (count === 2) return 1.22
  if (count === 3) return 1.16
  if (count === 4) return 1.12
  if (count <= 6) return 1.08
  if (count <= 8) return 1.04
  return 1.02
}

const getTileSpread = (count: number) => {
  if (count === 1) return 1
  if (count === 2) return 1.14
  if (count === 3) return 1.2
  if (count === 4) return 1.24
  if (count <= 6) return 1.22
  return 1.18
}

const getOptionPreviewSpread = (count: number) => {
  if (count === 1) return 1
  if (count === 2) return 1.38
  if (count === 3) return 1.48
  if (count === 4) return 1.44
  if (count <= 6) return 1.38
  if (count <= 8) return 1.32
  return 1.28
}

const getOptionPreviewSizeMultiplier = (count: number) => {
  // Make the symbols in option previews larger so they are easier to see.
  if (count === 1) return 4.2
  if (count === 2) return 3.1
  if (count <= 4) return 2.5
  if (count <= 6) return 1.9
  if (count <= 8) return 1.6
  return 1.4
}

const getMinimumPointDistance = (points: Array<[number, number]>) => {
  if (points.length < 2) return Number.POSITIVE_INFINITY

  let minimumDistance = Number.POSITIVE_INFINITY

  for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < points.length; rightIndex += 1) {
      const [leftX, leftY] = points[leftIndex] as [number, number]
      const [rightX, rightY] = points[rightIndex] as [number, number]
      const distance = Math.hypot(leftX - rightX, leftY - rightY)
      minimumDistance = Math.min(minimumDistance, distance)
    }
  }

  return minimumDistance
}

const getOptionPreviewSymbolSize = (tile: TileSpec) => {
  const positions = getOptionPreviewPositions(tile.count)
  const densityScale =
    tile.count >= 9 ? 0.38
      : tile.count >= 7 ? 0.44
        : tile.count >= 5 ? 0.52
          : tile.count === 4 ? 0.58
            : tile.count === 3 ? 0.68
              : tile.count === 2 ? 0.8
            : 1
  const maxSizeByCount =
    tile.count >= 9 ? 16
      : tile.count >= 7 ? 18
        : tile.count >= 5 ? 22
          : tile.count === 4 ? 26
            : tile.count === 3 ? 32
              : tile.count === 2 ? 40
                : 68
  const baseSize = Math.min(
    tile.size * getSymbolScale(tile.count) * getSymbolFrameFillScale(tile.count) * densityScale,
    maxSizeByCount,
  )
  const farthestOffset = positions.reduce(
    (maximum, [offsetX, offsetY]) => Math.max(maximum, Math.abs(offsetX), Math.abs(offsetY)),
    0,
  )
  const frameLimit = Math.max(10, 54 - farthestOffset)
  const minimumDistance = getMinimumPointDistance(positions)
  const separationLimit = Number.isFinite(minimumDistance)
    ? Math.max(9, (minimumDistance - 18) / 2)
    : frameLimit

  return Math.min(baseSize, frameLimit, separationLimit)
}

const createDenseDisplayTile = (tile: TileSpec, densityBoost = 2): TileSpec => {
  const boostedCount = clampTileCount(tile.count + densityBoost)
  const sizePenalty =
    boostedCount >= 10 ? 4
      : boostedCount >= 8 ? 3
        : boostedCount >= 6 ? 2
          : boostedCount >= 4 ? 2
            : 0

  return {
    ...tile,
    count: boostedCount,
    size: clampTileSize(tile.size - sizePenalty),
  }
}

const buildPatternFill = (fill: TileFill, color: string, id: string) => {
  if (fill === 'solid') {
    return { defs: '', fillValue: color }
  }

  if (fill === 'outline') {
    return { defs: '', fillValue: 'transparent' }
  }

  if (fill === 'striped') {
    return {
      defs: `
        <defs>
          <pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#ffffff" />
            <rect width="4" height="10" fill="${color}" />
          </pattern>
        </defs>
      `,
      fillValue: `url(#${id})`,
    }
  }

  return {
    defs: `
      <defs>
        <pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#ffffff" />
          <circle cx="3" cy="3" r="2.4" fill="${color}" />
          <circle cx="9" cy="9" r="2.4" fill="${color}" />
        </pattern>
      </defs>
    `,
    fillValue: `url(#${id})`,
  }
}

const buildPolygonPoints = (points: Array<[number, number]>) =>
  points.map(([x, y]) => `${x},${y}`).join(' ')

const createTrianglePoints = (cx: number, cy: number, size: number) =>
  buildPolygonPoints([
    [cx, cy - size],
    [cx + size * 0.9, cy + size * 0.9],
    [cx - size * 0.9, cy + size * 0.9],
  ])

const createDiamondPoints = (cx: number, cy: number, size: number) =>
  buildPolygonPoints([
    [cx, cy - size],
    [cx + size, cy],
    [cx, cy + size],
    [cx - size, cy],
  ])

const createHexPoints = (cx: number, cy: number, size: number) =>
  buildPolygonPoints([
    [cx - size * 0.88, cy - size * 0.5],
    [cx, cy - size],
    [cx + size * 0.88, cy - size * 0.5],
    [cx + size * 0.88, cy + size * 0.5],
    [cx, cy + size],
    [cx - size * 0.88, cy + size * 0.5],
  ])

const renderDirectionMarker = (tile: TileSpec, cx: number, cy: number, size: number, compact = false) => {
  if (tile.shape === 'circle' && tile.rotation === 0) {
    return ''
  }

  const markerStroke = darkenHex(tile.color, 125)
  const markerFill = tile.fill === 'outline' ? tile.color : '#ffffff'
  const rotation = tile.shape === 'circle' ? normalizeRotation(tile.rotation) : normalizeRotation(tile.rotation)
  const lineWidth = compact ? Math.max(1.05, Math.min(2.6, size * 0.1)) : Math.max(1.6, Math.min(4, size * 0.13))
  const dotRadius = compact ? Math.max(1.2, Math.min(3.2, size * 0.1)) : Math.max(1.8, Math.min(4.4, size * 0.14))
  const markerTop = compact ? size * 0.58 : size * 0.64
  const markerDotTop = compact ? size * 0.7 : size * 0.8
  const markerStart = compact ? size * 0.12 : size * 0.18
  const markerStrokeWidth = compact ? Math.max(0.9, Math.min(2.2, size * 0.065)) : Math.max(1.2, Math.min(3, size * 0.08))

  return `
    <g transform="rotate(${rotation} ${cx} ${cy})">
      <line
        x1="${cx}"
        y1="${cy + markerStart}"
        x2="${cx}"
        y2="${cy - markerTop}"
        stroke="${markerStroke}"
        stroke-width="${lineWidth}"
        stroke-linecap="round"
      />
      <circle
        cx="${cx}"
        cy="${cy - markerDotTop}"
        r="${dotRadius}"
        fill="${markerFill}"
        stroke="${markerStroke}"
        stroke-width="${markerStrokeWidth}"
      />
    </g>
  `
}

const renderSymbol = (
  tile: TileSpec,
  cx: number,
  cy: number,
  size: number,
  symbolId: string,
  compact = false,
) => {
  const patternId = `${symbolId}-fill`
  const { defs, fillValue } = buildPatternFill(tile.fill, tile.color, patternId)
  const stroke = darkenHex(tile.color, 90)
  const rotation = tile.shape === 'circle' ? 0 : normalizeRotation(tile.rotation)
  const strokeWidth = compact
    ? Math.max(1, Math.min(2.5, size * 0.11))
    : Math.max(1.5, Math.min(4, size * 0.16))
  const common = `fill="${fillValue}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`

  switch (tile.shape) {
    case 'circle':
      return `
        ${defs}
        <circle cx="${cx}" cy="${cy}" r="${size}" ${common} />
        ${renderDirectionMarker(tile, cx, cy, size, compact)}
      `
    case 'square':
      return `
        ${defs}
        <rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" rx="${size * 0.24}" ry="${size * 0.24}" transform="rotate(${rotation} ${cx} ${cy})" ${common} />
        ${renderDirectionMarker(tile, cx, cy, size, compact)}
      `
    case 'triangle':
      return `
        ${defs}
        <polygon points="${createTrianglePoints(cx, cy, size)}" transform="rotate(${rotation} ${cx} ${cy})" ${common} />
        ${renderDirectionMarker(tile, cx, cy, size, compact)}
      `
    case 'diamond':
      return `
        ${defs}
        <polygon points="${createDiamondPoints(cx, cy, size)}" transform="rotate(${rotation} ${cx} ${cy})" ${common} />
        ${renderDirectionMarker(tile, cx, cy, size, compact)}
      `
    case 'hex':
      return `
        ${defs}
        <polygon points="${createHexPoints(cx, cy, size)}" transform="rotate(${rotation} ${cx} ${cy})" ${common} />
        ${renderDirectionMarker(tile, cx, cy, size, compact)}
      `
    case 'plus':
      return `
        ${defs}
        <path
          d="M ${cx - size * 0.34} ${cy - size} L ${cx + size * 0.34} ${cy - size} L ${cx + size * 0.34} ${cy - size * 0.34} L ${cx + size} ${cy - size * 0.34} L ${cx + size} ${cy + size * 0.34} L ${cx + size * 0.34} ${cy + size * 0.34} L ${cx + size * 0.34} ${cy + size} L ${cx - size * 0.34} ${cy + size} L ${cx - size * 0.34} ${cy + size * 0.34} L ${cx - size} ${cy + size * 0.34} L ${cx - size} ${cy - size * 0.34} L ${cx - size * 0.34} ${cy - size * 0.34} Z"
          transform="rotate(${rotation} ${cx} ${cy})"
          ${common}
        />
        ${renderDirectionMarker(tile, cx, cy, size, compact)}
      `
  }
}

const renderTileSpec = (tile: TileSpec, cx: number, cy: number, scopeId: string, densityBoost = 0) => {
  const displayTile = createDenseDisplayTile(tile, densityBoost)
  const positions = getTilePositions(displayTile.count)
  const scale = getSymbolScale(displayTile.count)
  const spread = getTileSpread(displayTile.count)
  const farthestOffset = positions.reduce(
    (maximum, [offsetX, offsetY]) => Math.max(maximum, Math.abs(offsetX * spread), Math.abs(offsetY * spread)),
    0,
  )
  const frameLimit = Math.max(18, 68 - farthestOffset)
  const minimumDistance = getMinimumPointDistance(
    positions.map(([offsetX, offsetY]) => [offsetX * spread, offsetY * spread] as [number, number]),
  )
  const separationLimit = Number.isFinite(minimumDistance)
    ? Math.max(16, (minimumDistance - 12) / 2)
    : frameLimit
  const symbolSize = Math.min(
    displayTile.size * scale * getSymbolFrameFillScale(displayTile.count),
    58,
    frameLimit,
    separationLimit,
  )

  return positions
    .map(([offsetX, offsetY], index) =>
      renderSymbol(displayTile, cx + offsetX * spread, cy + offsetY * spread, symbolSize, `${scopeId}-${index}`),
    )
    .join('')
}

const createOptionPreviewTile = (tile: TileSpec): TileSpec => ({
  ...tile,
  size: Math.min(
    tile.size * getOptionPreviewSizeMultiplier(tile.count),
    tile.count >= 7 ? 26
      : tile.count >= 5 ? 30
        : tile.count === 4 ? 34
          : tile.count === 3 ? 40
            : tile.count === 2 ? 48
              : 62,
  ),
})

const renderOptionPreviewSpec = (tile: TileSpec, cx: number, cy: number, scopeId: string) => {
  const displayTile = createOptionPreviewTile(tile)
  const positions = getOptionPreviewPositions(displayTile.count)
  const symbolSize = getOptionPreviewSymbolSize(displayTile)

  return positions
    .map(([offsetX, offsetY], index) =>
      renderSymbol(displayTile, cx + offsetX, cy + offsetY, symbolSize, `${scopeId}-${index}`, true),
    )
    .join('')
}

const createOptionImage = (tile: TileSpec) =>
  toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${OPTION_IMAGE_SIZE}" height="${OPTION_IMAGE_SIZE}" viewBox="0 0 ${OPTION_IMAGE_SIZE} ${OPTION_IMAGE_SIZE}">
      <rect width="${OPTION_IMAGE_SIZE}" height="${OPTION_IMAGE_SIZE}" fill="#ffffff" />
      ${renderOptionPreviewSpec(tile, OPTION_IMAGE_SIZE / 2, OPTION_IMAGE_SIZE / 2, `opt-${escapeXml(buildTileKey(tile))}`)}
    </svg>
  `)

const buildAutoDistractors = (correctTile: TileSpec, seed: number) => {
  const alternateColors = ALL_TILE_COLORS.filter((color) => color !== correctTile.color)
  const alternateShapes = ALL_TILE_SHAPES.filter((shape) => shape !== correctTile.shape)
  const alternateFills = ALL_TILE_FILLS.filter((fill) => fill !== correctTile.fill)
  const rotationStep = Math.max(30, Math.min(90, getShapeRotationStep(correctTile.shape) / 2 || 45))
  const rotationCandidates = [rotationStep, -rotationStep, rotationStep * 2]
    .map((step) => ({
      ...correctTile,
      rotation: normalizeRotation(correctTile.rotation + step),
    }))

  const countCandidates = [-1, 1]
    .map((delta) => ({
      ...correctTile,
      count: clampTileCount(correctTile.count + delta),
    }))

  const shapeCandidates = ALL_TILE_SHAPES
    .filter((shape) => shape !== correctTile.shape)
    .map((shape) => ({
      ...correctTile,
      shape,
      rotation: normalizeShapeRotation(shape, correctTile.rotation),
    }))

  const fillCandidates = ALL_TILE_FILLS
    .filter((fill) => fill !== correctTile.fill)
    .map((fill) => ({
      ...correctTile,
      fill,
    }))

  const colorCandidates = ALL_TILE_COLORS
    .filter((color) => color !== correctTile.color)
    .map((color) => ({
      ...correctTile,
      color,
    }))

  const sizeCandidates = [-2, 2]
    .map((delta) => ({
      ...correctTile,
      size: clampTileSize(correctTile.size + delta),
    }))

  const comboCandidates = [
    {
      ...correctTile,
      shape: alternateShapes[0] ?? correctTile.shape,
      rotation: normalizeShapeRotation(alternateShapes[0] ?? correctTile.shape, correctTile.rotation + rotationStep),
    },
    {
      ...correctTile,
      fill: alternateFills[0] ?? correctTile.fill,
      count: clampTileCount(correctTile.count + 1),
    },
    {
      ...correctTile,
      color: alternateColors[0] ?? correctTile.color,
      size: clampTileSize(correctTile.size + 2),
    },
    {
      ...correctTile,
      fill: alternateFills[0] ?? correctTile.fill,
      rotation: normalizeRotation(correctTile.rotation + rotationStep),
    },
  ]

  const extraCandidates: TileSpec[] = []

  // Some tiles (like circles) are visually invariant to rotation, so ensure we add distinct distractors
  // by changing other visible properties (color, fill, count). This makes answer variants more clearly different.
  if (correctTile.shape === 'circle') {
    extraCandidates.push(
      {
        ...correctTile,
        fill: alternateFills[0] ?? correctTile.fill,
        count: clampTileCount(correctTile.count + 2),
      },
      {
        ...correctTile,
        color: alternateColors[0] ?? correctTile.color,
        count: clampTileCount(correctTile.count - 1),
      },
    )
  } else {
    extraCandidates.push(
      {
        ...correctTile,
        color: alternateColors[0] ?? correctTile.color,
        fill: alternateFills[0] ?? correctTile.fill,
      },
      {
        ...correctTile,
        size: clampTileSize(correctTile.size + 3),
        rotation: normalizeRotation(correctTile.rotation + rotationStep),
      },
    )
  }

  return deterministicShuffle(
    collectDistinctTiles([
      ...rotationCandidates,
      ...countCandidates,
      ...shapeCandidates,
      ...fillCandidates,
      ...colorCandidates,
      ...sizeCandidates,
      ...comboCandidates,
      ...extraCandidates,
    ]),
    seed + 17,
  )
}

const pickDistinctDistractors = (correctTile: TileSpec, candidates: TileSpec[], count: number, seed: number) => {
  const pool = deterministicShuffle(
    collectDistinctTiles(candidates).filter((tile) => buildTileVisualKey(tile) !== buildTileVisualKey(correctTile)),
    seed + 31,
  )
  const selected: TileSpec[] = []
  const usedPrimaryKinds = new Set<TileDifferenceKind>()

  while (selected.length < count && pool.length > 0) {
    let bestIndex = 0
    let bestScore = Number.NEGATIVE_INFINITY

    pool.forEach((candidate, index) => {
      const differenceKinds = getTileDifferenceKinds(correctTile, candidate)
      const primaryKind = differenceKinds[0] ?? 'shape'
      const baseDifference = getTileDifferenceScore(correctTile, candidate)
      const diversityScore = selected.reduce(
        (total, current) => total + getTileDifferenceScore(current, candidate),
        0,
      )
      const minimumSeparation = selected.reduce(
        (minimum, current) => Math.min(minimum, getTileDifferenceScore(current, candidate)),
        Number.POSITIVE_INFINITY,
      )

      // Prefer distractors that are visually distinct from the correct tile and from each other.
      const score =
        baseDifference * 1.3
        + diversityScore * 0.22
        + (differenceKinds.length === 1 ? 6 : differenceKinds.length === 2 ? 14 : 22)
        + (usedPrimaryKinds.has(primaryKind) ? -14 : 22)
        + (Number.isFinite(minimumSeparation) ? Math.min(minimumSeparation, 20) * 0.6 : 0)
        + (Number.isFinite(minimumSeparation) && minimumSeparation < 12 ? -56 : 0)
        - (baseDifference < 8 ? 18 : baseDifference < 14 ? 8 : 0)

      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    const [nextTile] = pool.splice(bestIndex, 1)

    if (!nextTile) {
      break
    }
    const primaryKind = getTileDifferenceKinds(correctTile, nextTile)[0]
    if (primaryKind) {
      usedPrimaryKinds.add(primaryKind)
    }
    selected.push(nextTile)
  }

  return selected
}

const countMaskBits = (mask: number) =>
  clampLogicMask(mask)
    .toString(2)
    .split('')
    .filter((bit) => bit === '1')
    .length

const getMaskDifferenceScore = (left: number, right: number) =>
  countMaskBits(clampLogicMask(left ^ right)) * 10 + Math.abs(countMaskBits(left) - countMaskBits(right)) * 4

const pickDistinctMasks = (correctMask: number, candidates: number[], count: number, seed: number) => {
  const pool = deterministicShuffle(
    collectDistinctMasks(candidates).filter((mask) => mask !== correctMask),
    seed + 71,
  )
  const selected: number[] = []

  while (selected.length < count && pool.length > 0) {
    let bestIndex = 0
    let bestScore = Number.NEGATIVE_INFINITY

    pool.forEach((candidate, index) => {
      const baseDifference = getMaskDifferenceScore(correctMask, candidate)
      const diversityScore = selected.reduce(
        (total, current) => total + getMaskDifferenceScore(current, candidate),
        0,
      )
      const minimumSeparation = selected.reduce(
        (minimum, current) => Math.min(minimum, getMaskDifferenceScore(current, candidate)),
        Number.POSITIVE_INFINITY,
      )
      const similarityScore = Math.max(0, 100 - baseDifference)
      const score =
        similarityScore * 1.28
        - diversityScore * 0.14
        + (baseDifference <= 18 ? 14 : baseDifference <= 26 ? 6 : -10)
        + (Number.isFinite(minimumSeparation) ? Math.min(minimumSeparation, 18) * 0.45 : 0)
        + (Number.isFinite(minimumSeparation) && minimumSeparation < 10 ? -42 : 0)

      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    const [nextMask] = pool.splice(bestIndex, 1)
    if (nextMask === undefined) break
    selected.push(nextMask)
  }

  return selected
}

const resolveMatrixTheme = (scopeId: string) => {
  if (scopeId.includes('-axis-')) return MATRIX_THEMES.slate
  if (scopeId.includes('-hybrid-')) return MATRIX_THEMES.violet
  if (scopeId.includes('-logic-')) return MATRIX_THEMES.slate
  if (scopeId.includes('-combo-')) return MATRIX_THEMES.slate
  if (scopeId.includes('-fill-')) return MATRIX_THEMES.rose
  if (scopeId.includes('-color-')) return MATRIX_THEMES.amber
  if (scopeId.includes('-size-')) return MATRIX_THEMES.emerald
  if (scopeId.includes('-count-')) return MATRIX_THEMES.emerald
  if (scopeId.includes('-shape-')) return MATRIX_THEMES.amber
  return MATRIX_THEMES.sky
}

const renderMatrixCellSubgrid = (x: number, y: number, cellSize: number, stroke: string) => {
  const step = cellSize / 4
  const lines = [1, 2, 3]
    .map(
      (index) => `
        <line x1="${x + step * index}" y1="${y + 12}" x2="${x + step * index}" y2="${y + cellSize - 12}" stroke="${stroke}" stroke-width="1.5" opacity="0.18" />
        <line x1="${x + 12}" y1="${y + step * index}" x2="${x + cellSize - 12}" y2="${y + step * index}" stroke="${stroke}" stroke-width="1.5" opacity="0.18" />
      `,
    )
    .join('')

  return `
    <rect x="${x + 8}" y="${y + 8}" width="${cellSize - 16}" height="${cellSize - 16}" rx="20" ry="20" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="0.14" />
    ${lines}
  `
}

const createMatrixImage = (cells: Array<TileSpec | null>, scopeId: string) => {
  const { size, padding, gap, cellSize, canvasWidth } = MATRIX_LAYOUT
  const theme = resolveMatrixTheme(scopeId)
  const offsetX = (canvasWidth - size) / 2

  const cellMarkup = cells
    .map((tile, index) => {
      const row = Math.floor(index / 3)
      const column = index % 3
      const x = offsetX + padding + column * (cellSize + gap)
      const y = padding + row * (cellSize + gap)
      const centerX = x + cellSize / 2
      const centerY = y + cellSize / 2

      return `
        <g>
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="24" ry="24" fill="${theme.cellFill}" stroke="${theme.cellStroke}" stroke-width="3" />
          ${renderMatrixCellSubgrid(x, y, cellSize, theme.cellStroke)}
          ${
            tile
              ? renderTileSpec(tile, centerX, centerY, `${scopeId}-cell-${index}`, 0)
              : `
                <text x="${centerX}" y="${centerY + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="900" fill="${theme.markerColor}">?</text>
              `
          }
        </g>
      `
    })
    .join('')

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${size}" viewBox="0 0 ${canvasWidth} ${size}">
      <defs>
        <linearGradient id="${scopeId}-bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${theme.frameFrom}" />
          <stop offset="100%" stop-color="${theme.frameTo}" />
        </linearGradient>
      </defs>
      <rect width="${canvasWidth}" height="${size}" rx="34" ry="34" fill="url(#${scopeId}-bg)" />
      <circle cx="78" cy="70" r="44" fill="${theme.glow}" opacity="0.12" />
      <circle cx="${canvasWidth - 64}" cy="${size - 62}" r="54" fill="${theme.glow}" opacity="0.08" />
      <rect x="10" y="10" width="${canvasWidth - 20}" height="${size - 20}" rx="28" ry="28" fill="none" stroke="${theme.frameStroke}" stroke-width="4" />
      ${cellMarkup}
    </svg>
  `)
}

const shiftLogicMask = (mask: number, step: number) => {
  const normalizedStep = ((step % LOGIC_MASK_LAYOUT.length) + LOGIC_MASK_LAYOUT.length) % LOGIC_MASK_LAYOUT.length
  if (normalizedStep === 0) return clampLogicMask(mask)
  return clampLogicMask((mask << normalizedStep) | (mask >> (LOGIC_MASK_LAYOUT.length - normalizedStep)))
}

const mirrorLogicMask = (mask: number) => {
  const mapping = [2, 1, 0, 5, 4, 3]
  let nextMask = 0

  mapping.forEach((targetIndex, sourceIndex) => {
    if (mask & (1 << sourceIndex)) {
      nextMask |= 1 << targetIndex
    }
  })

  return clampLogicMask(nextMask)
}

const flipLogicMask = (mask: number) => {
  const mapping = [3, 4, 5, 0, 1, 2]
  let nextMask = 0

  mapping.forEach((targetIndex, sourceIndex) => {
    if (mask & (1 << sourceIndex)) {
      nextMask |= 1 << targetIndex
    }
  })

  return clampLogicMask(nextMask)
}

const applyLogicMaskOperation = (leftMask: number, rightMask: number, operation: LogicGridPuzzleConfig['operation']) => {
  if (operation === 'and') return clampLogicMask(leftMask & rightMask)
  if (operation === 'or') return clampLogicMask(leftMask | rightMask)
  return clampLogicMask(leftMask ^ rightMask)
}

const renderLogicMask = (mask: number, tile: TileSpec, cx: number, cy: number, scopeId: string) => {
  const slotMarkup = LOGIC_MASK_LAYOUT.map(
    ([offsetX, offsetY], index) => `
      <g opacity="${mask & (1 << index) ? '0.26' : '0.14'}">
        <circle
          cx="${cx + offsetX}"
          cy="${cy + offsetY}"
          r="20"
          fill="#ffffff"
          stroke="${darkenHex(tile.color, 150)}"
          stroke-width="1.8"
        />
      </g>
    `,
  ).join('')

  const activeMarkup = LOGIC_MASK_LAYOUT.map(([offsetX, offsetY], index) =>
    mask & (1 << index)
      ? renderSymbol(
          {
            ...tile,
            count: 1,
          },
          cx + offsetX,
          cy + offsetY,
          Math.max(15, tile.size * 0.92),
          `${scopeId}-${index}`,
        )
      : '',
  ).join('')

  return `${slotMarkup}${activeMarkup}`
}

const createLogicMatrixImage = (masks: Array<number | null>, tile: TileSpec, scopeId: string) => {
  const { size, padding, gap, cellSize, canvasWidth } = MATRIX_LAYOUT
  const theme = resolveMatrixTheme(scopeId)
  const offsetX = (canvasWidth - size) / 2

  const cellMarkup = masks
    .map((mask, index) => {
      const row = Math.floor(index / 3)
      const column = index % 3
      const x = offsetX + padding + column * (cellSize + gap)
      const y = padding + row * (cellSize + gap)
      const centerX = x + cellSize / 2
      const centerY = y + cellSize / 2

      return `
        <g>
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="24" ry="24" fill="${theme.cellFill}" stroke="${theme.cellStroke}" stroke-width="3" />
          ${renderMatrixCellSubgrid(x, y, cellSize, theme.cellStroke)}
          ${
            mask === null
              ? `<text x="${centerX}" y="${centerY + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="900" fill="${theme.markerColor}">?</text>`
              : renderLogicMask(mask, tile, centerX, centerY, `${scopeId}-cell-${index}`)
          }
        </g>
      `
    })
    .join('')

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${size}" viewBox="0 0 ${canvasWidth} ${size}">
      <defs>
        <linearGradient id="${scopeId}-bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${theme.frameFrom}" />
          <stop offset="100%" stop-color="${theme.frameTo}" />
        </linearGradient>
      </defs>
      <rect width="${canvasWidth}" height="${size}" rx="34" ry="34" fill="url(#${scopeId}-bg)" />
      <circle cx="88" cy="68" r="44" fill="${theme.glow}" opacity="0.1" />
      <circle cx="${canvasWidth - 62}" cy="${size - 64}" r="56" fill="${theme.glow}" opacity="0.08" />
      <rect x="10" y="10" width="${canvasWidth - 20}" height="${size - 20}" rx="28" ry="28" fill="none" stroke="${theme.frameStroke}" stroke-width="4" />
      ${cellMarkup}
    </svg>
  `)
}

const createLogicOptionImage = (mask: number, tile: TileSpec, scopeId: string) =>
  toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${OPTION_IMAGE_SIZE}" height="${OPTION_IMAGE_SIZE}" viewBox="0 0 ${OPTION_IMAGE_SIZE} ${OPTION_IMAGE_SIZE}">
      <rect width="${OPTION_IMAGE_SIZE}" height="${OPTION_IMAGE_SIZE}" fill="#ffffff" />
      ${renderLogicMask(mask, createOptionPreviewTile(tile), OPTION_IMAGE_SIZE / 2, OPTION_IMAGE_SIZE / 2, scopeId)}
    </svg>
  `)

const buildLogicMaskOptionSet = (
  correctMask: number,
  distractorMasks: number[],
  tile: TileSpec,
  seed: number,
) => {
  const autoDistractors = collectDistinctMasks([
    clampLogicMask(correctMask ^ 0b000001),
    clampLogicMask(correctMask ^ 0b000010),
    clampLogicMask(correctMask ^ 0b000100),
    clampLogicMask(correctMask ^ 0b001000),
    clampLogicMask(correctMask ^ 0b010000),
    clampLogicMask(correctMask ^ 0b100000),
    shiftLogicMask(correctMask, 1),
    shiftLogicMask(correctMask, -1),
  ])
  const orderedSourceMasks = [
    correctMask,
    ...pickDistinctMasks(correctMask, [...distractorMasks, ...autoDistractors], OPTION_LABELS.length - 1, seed + 59),
  ]
  const orderedMasks = deterministicShuffle(orderedSourceMasks, seed + 91)
  const optionImageUrls: Record<string, string> = {}
  const optionLabels = orderedMasks.map((_, index) => OPTION_LABELS[index] as string)

  orderedMasks.forEach((mask, index) => {
    optionImageUrls[OPTION_LABELS[index] as string] = createLogicOptionImage(mask, tile, `logic-option-${seed}-${index}`)
  })

  return {
    options: optionLabels,
    correctAnswer: optionLabels[orderedMasks.findIndex((mask) => mask === correctMask)] as (typeof OPTION_LABELS)[number],
    optionImageUrls,
  }
}

const buildOptionSet = (correctTile: TileSpec, distractors: TileSpec[], seed: number) => {
  const correctVisualKey = buildTileVisualKey(correctTile)
  const candidateTiles = pickDistinctDistractors(
    correctTile,
    [...distractors, ...buildAutoDistractors(correctTile, seed)],
    OPTION_LABELS.length - 1,
    seed,
  )
  const orderedSourceTiles = [
    correctTile,
    ...candidateTiles.filter((tile) => buildTileVisualKey(tile) !== correctVisualKey),
  ].slice(0, OPTION_LABELS.length)
  const orderedTiles = deterministicShuffle(orderedSourceTiles, seed + 91)
  const optionImageUrls: Record<string, string> = {}
  const optionLabels = orderedTiles.map((_, index) => OPTION_LABELS[index] as string)

  orderedTiles.forEach((tile, index) => {
    optionImageUrls[OPTION_LABELS[index] as string] = createOptionImage(tile)
  })

  return {
    options: optionLabels,
    correctAnswer:
      optionLabels[
        orderedTiles.findIndex((tile) => buildTileVisualKey(tile) === correctVisualKey)
      ] as (typeof OPTION_LABELS)[number],
    optionImageUrls,
  }
}

const createRotationPuzzle = (config: RotationPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Matritsadagi burilish qonuniyatini toping va bo'sh katakka mos rasmni tanlang."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      cells.push({
        shape: config.shape,
        color: config.color,
        fill: config.fill,
        count: 1,
        size: config.size,
        rotation: normalizeRotation(config.baseRotation + row * config.rowStep + column * config.columnStep),
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = [
    { ...correctTile, rotation: normalizeRotation(correctTile.rotation + config.rowStep) },
    { ...correctTile, rotation: normalizeRotation(correctTile.rotation - config.columnStep) },
    { ...correctTile, rotation: normalizeRotation(correctTile.rotation + 180) },
  ]
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki shakl har qator va ustunda bir xil burchak bilan burilib boryapti.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createCountPuzzle = (config: CountPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Belgilar soni qanday o'zgarayotganini toping va yetishmayotgan rasmni tanlang."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      cells.push({
        shape: config.shape,
        color: config.color,
        fill: config.fill,
        count: config.baseCount + row * config.rowStep + column * config.columnStep,
        size: config.size,
        rotation: 0,
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = [
    { ...correctTile, count: clampTileCount(correctTile.count - 1) },
    { ...correctTile, count: clampTileCount(correctTile.count + 1) },
    { ...correctTile, count: clampTileCount(correctTile.count + config.rowStep - config.columnStep) },
  ]
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki belgilar soni qator va ustun bo'ylab izchil ortib boryapti.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createShapeCyclePuzzle = (config: ShapeCyclePuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Matritsadagi shakllar ketma-ketligini toping va bo'sh katakka mos rasmni tanlang."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const shapeIndex = (config.offset + row * config.rowStep + column * config.columnStep) % config.shapes.length
      cells.push({
        shape: config.shapes[shapeIndex] as TileShape,
        color: config.color,
        fill: config.fill,
        count: config.count,
        size: config.size,
        rotation: 0,
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = config.shapes
    .filter((shape) => shape !== correctTile.shape)
    .slice(0, 3)
    .map((shape) => ({ ...correctTile, shape }))
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki shakllar qator va ustunlarda bir xil tartib bilan aylanyapti.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createFillPuzzle = (config: FillPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Bo'yash usuli qanday takrorlanayotganini toping va to'g'ri variantni tanlang."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const fillIndex = (config.offset + row * config.rowStep + column * config.columnStep) % config.fills.length
      cells.push({
        shape: config.shape,
        color: config.color,
        fill: config.fills[fillIndex] as TileFill,
        count: config.count,
        size: config.size,
        rotation: 0,
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = config.fills
    .filter((fill) => fill !== correctTile.fill)
    .slice(0, 3)
    .map((fill) => ({ ...correctTile, fill }))
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki har katakdagi ichki bo'yoq usuli bir xil davriy qoida bilan almashmoqda.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createColorPuzzle = (config: ColorPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Ranglar qanday navbat bilan almashayotganini toping va bo'sh katakka mos rasmni tanlang."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const colorIndex = (config.offset + row * config.rowStep + column * config.columnStep) % config.colors.length
      cells.push({
        shape: config.shape,
        color: config.colors[colorIndex] as string,
        fill: config.fill,
        count: config.count,
        size: config.size,
        rotation: config.rotation,
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = config.colors
    .filter((color) => color !== correctTile.color)
    .slice(0, 4)
    .map((color, index) => ({
      ...correctTile,
      color,
      rotation: normalizeRotation(correctTile.rotation + index * 15),
    }))
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki ranglar qator va ustun bo'ylab bir xil ketma-ketlikda almashmoqda.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createSizePuzzle = (config: SizePuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Matritsadagi shakl hajmi qanday o'zgarayotganini toping va mos variantni tanlang."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      cells.push({
        shape: config.shape,
        color: config.color,
        fill: config.fill,
        count: config.count,
        size: clampTileSize(config.baseSize + row * config.rowStep + column * config.columnStep),
        rotation: config.rotation,
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = [
    { ...correctTile, size: clampTileSize(correctTile.size - 4) },
    { ...correctTile, size: clampTileSize(correctTile.size + 4) },
    { ...correctTile, size: clampTileSize(correctTile.size + config.rowStep - config.columnStep) },
    { ...correctTile, size: clampTileSize(correctTile.size - config.rowStep + config.columnStep) },
  ]
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki shakl o'lchami har qator va ustunda izchil kattalashib yoki kichrayib boryapti.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const joinUzbekLabels = (items: string[]) => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0] as string
  if (items.length === 2) return `${items[0]} va ${items[1]}`
  return `${items.slice(0, -1).join(', ')} va ${items[items.length - 1]}`
}

const resolveAxisBlendValue = <T,>(
  fallback: T,
  rowValues: AxisTriplet<T> | undefined,
  columnValues: AxisTriplet<T> | undefined,
  row: number,
  column: number,
) => rowValues?.[row] ?? columnValues?.[column] ?? fallback

const createAxisBlendTile = (config: AxisBlendPuzzleConfig, row: number, column: number): TileSpec => {
  const shape = resolveAxisBlendValue(config.base.shape, config.rowShapes, config.columnShapes, row, column)
  const color = resolveAxisBlendValue(config.base.color, config.rowColors, config.columnColors, row, column)
  const fill = resolveAxisBlendValue(config.base.fill, config.rowFills, config.columnFills, row, column)
  const rawRotation = resolveAxisBlendValue(
    config.base.rotation,
    config.rowRotations,
    config.columnRotations,
    row,
    column,
  )
  const size = resolveAxisBlendValue(config.base.size, config.rowSizes, config.columnSizes, row, column)

  return {
    shape,
    color,
    fill,
    count: config.base.count,
    size: clampTileSize(size),
    rotation: normalizeShapeRotation(shape, rawRotation),
  }
}

const getAxisBlendRuleLabels = (config: AxisBlendPuzzleConfig, axis: 'row' | 'column') => {
  const labels: string[] = []

  if (axis === 'row' ? config.rowShapes : config.columnShapes) labels.push('shakl')
  if (axis === 'row' ? config.rowColors : config.columnColors) labels.push('rang')
  if (axis === 'row' ? config.rowFills : config.columnFills) labels.push("bo'yash usuli")
  if (axis === 'row' ? config.rowRotations : config.columnRotations) labels.push('burilish')
  if (axis === 'row' ? config.rowSizes : config.columnSizes) labels.push('hajm')

  return labels
}

const buildAxisBlendQuestion = (config: AxisBlendPuzzleConfig) => {
  const rowLabels = getAxisBlendRuleLabels(config, 'row')
  const columnLabels = getAxisBlendRuleLabels(config, 'column')

  if (rowLabels.length > 0 && columnLabels.length > 0) {
    return `Har qatorda ${joinUzbekLabels(rowLabels)}, har ustunda ${joinUzbekLabels(columnLabels)} o'zgaradi. Bo'sh katakka mos rasmni tanlang.`
  }

  if (rowLabels.length > 0) {
    return `Qatorlar bo'yicha ${joinUzbekLabels(rowLabels)} qanday o'zgarayotganini toping va bo'sh katakka mos rasmni tanlang.`
  }

  if (columnLabels.length > 0) {
    return `Ustunlar bo'yicha ${joinUzbekLabels(columnLabels)} qanday o'zgarayotganini toping va bo'sh katakka mos rasmni tanlang.`
  }

  return "Qator va ustundagi qonuniyatni toping va bo'sh katakka mos rasmni tanlang."
}

const buildAxisBlendExplanation = (config: AxisBlendPuzzleConfig) => {
  const rowLabels = getAxisBlendRuleLabels(config, 'row')
  const columnLabels = getAxisBlendRuleLabels(config, 'column')

  if (rowLabels.length > 0 && columnLabels.length > 0) {
    return `To'g'ri javob, chunki ${joinUzbekLabels(rowLabels)} qator bo'ylab, ${joinUzbekLabels(columnLabels)} esa ustun bo'ylab izchil almashadi.`
  }

  if (rowLabels.length > 0) {
    return `To'g'ri javob, chunki ${joinUzbekLabels(rowLabels)} qator bo'ylab bir xil tartib bilan almashadi.`
  }

  if (columnLabels.length > 0) {
    return `To'g'ri javob, chunki ${joinUzbekLabels(columnLabels)} ustun bo'ylab bir xil tartib bilan almashadi.`
  }

  return "To'g'ri javob, chunki kataklar orasida izchil matritsa qonuniyati bor."
}

const buildAxisBlendDistractors = (config: AxisBlendPuzzleConfig, correctTile: TileSpec, seed: number) => {
  const descriptors: Array<{
    alternatives: Array<string | number>
    apply: (tile: TileSpec, value: string | number) => TileSpec
  }> = []

  const addDescriptor = (
    rowValues: readonly (string | number)[] | undefined,
    columnValues: readonly (string | number)[] | undefined,
    correctValue: string | number,
    apply: (tile: TileSpec, value: string | number) => TileSpec,
  ) => {
    const alternatives = Array.from(new Set([...(rowValues ?? []), ...(columnValues ?? [])])).filter(
      (value) => value !== correctValue,
    )

    if (alternatives.length > 0) {
      descriptors.push({ alternatives, apply })
    }
  }

  addDescriptor(config.rowShapes, config.columnShapes, correctTile.shape, (tile, value) => ({
    ...tile,
    shape: value as TileShape,
    rotation: normalizeShapeRotation(value as TileShape, tile.rotation),
  }))
  addDescriptor(config.rowColors, config.columnColors, correctTile.color, (tile, value) => ({
    ...tile,
    color: value as string,
  }))
  addDescriptor(config.rowFills, config.columnFills, correctTile.fill, (tile, value) => ({
    ...tile,
    fill: value as TileFill,
  }))
  addDescriptor(config.rowRotations, config.columnRotations, correctTile.rotation, (tile, value) => ({
    ...tile,
    rotation: normalizeShapeRotation(tile.shape, value as number),
  }))
  addDescriptor(config.rowSizes, config.columnSizes, correctTile.size, (tile, value) => ({
    ...tile,
    size: clampTileSize(value as number),
  }))

  const orderedDescriptors = deterministicShuffle(descriptors, seed + 13)
  const distractors: TileSpec[] = []

  orderedDescriptors.forEach((descriptor) => {
    const firstAlternative = descriptor.alternatives[0]
    if (firstAlternative !== undefined) {
      distractors.push(descriptor.apply(correctTile, firstAlternative))
    }
  })

  if (orderedDescriptors[0] && orderedDescriptors[1]) {
    const firstAlternative = orderedDescriptors[0].alternatives[0]
    const secondAlternative = orderedDescriptors[1].alternatives[0]

    if (firstAlternative !== undefined && secondAlternative !== undefined) {
      distractors.push(
        orderedDescriptors[1].apply(
          orderedDescriptors[0].apply(correctTile, firstAlternative),
          secondAlternative,
        ),
      )
    }
  }

  if (orderedDescriptors[0]?.alternatives[1] !== undefined) {
    distractors.push(orderedDescriptors[0].apply(correctTile, orderedDescriptors[0].alternatives[1] as string | number))
  }

  return collectDistinctTiles(distractors)
}

const createAxisBlendPuzzle = (config: AxisBlendPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = buildAxisBlendQuestion(config)
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      cells.push(createAxisBlendTile(config, row, column))
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const seed = Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1
  const optionSet = buildOptionSet(correctTile, buildAxisBlendDistractors(config, correctTile, seed), seed)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: buildAxisBlendExplanation(config),
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createHybridPuzzle = (config: HybridPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Bir vaqtning o'zida shakl, rang va burilish qoidalarini kuzating. Bo'sh joyga mos rasmni toping."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const shapeIndex = (config.shapeOffset + row * config.rowShapeStep + column * config.columnShapeStep) % config.shapes.length
      const colorIndex = (config.colorOffset + row * config.rowColorStep + column * config.columnColorStep) % config.colors.length
      cells.push({
        shape: config.shapes[shapeIndex] as TileShape,
        color: config.colors[colorIndex] as string,
        fill: config.fill,
        count: clampTileCount(config.countBase + row * config.rowCountStep + column * config.columnCountStep),
        size: config.size,
        rotation: normalizeRotation(config.baseRotation + row * config.rowRotationStep + column * config.columnRotationStep),
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = [
    {
      ...correctTile,
      shape: config.shapes[(config.shapes.indexOf(correctTile.shape) + 1) % config.shapes.length] as TileShape,
    },
    {
      ...correctTile,
      color: config.colors[(config.colors.indexOf(correctTile.color) + 1) % config.colors.length] as string,
    },
    {
      ...correctTile,
      count: clampTileCount(correctTile.count + 1),
    },
    {
      ...correctTile,
      rotation: normalizeRotation(correctTile.rotation + (config.columnRotationStep || config.rowRotationStep || 45)),
    },
  ]
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki bu savolda bir nechta qoida birga ishlaydi va to'g'ri variant ularning barchasiga mos keladi.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createLogicGridPuzzle = (config: LogicGridPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Har qatorda chapdagi ikki katak bir qoida bilan o'ngdagi katakni hosil qiladi. Bo'sh joyga mos rasmni toping."
  const tile: TileSpec = {
    shape: config.shape,
    color: config.color,
    fill: config.fill,
    count: 1,
    size: config.size,
    rotation: config.rotation,
  }

  const masks = config.rows.flatMap(([leftMask, rightMask]) => [
    clampLogicMask(leftMask),
    clampLogicMask(rightMask),
    applyLogicMaskOperation(leftMask, rightMask, config.operation),
  ])
  const correctMask = masks[8] as number
  const matrixMasks = [...masks]
  matrixMasks[8] = null as unknown as number

  const [lastLeftMask, lastRightMask] = config.rows[2] as readonly [number, number]
  const distractorMasks = collectDistinctMasks([
    applyLogicMaskOperation(lastLeftMask, lastRightMask, 'or'),
    applyLogicMaskOperation(lastLeftMask, lastRightMask, 'and'),
    applyLogicMaskOperation(lastLeftMask, lastRightMask, 'xor'),
    shiftLogicMask(correctMask, 1),
    mirrorLogicMask(correctMask),
    flipLogicMask(correctMask),
  ]).filter((mask) => mask !== correctMask)
  const optionSet = buildLogicMaskOptionSet(correctMask, distractorMasks, tile, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)
  const explanationMap: Record<LogicGridPuzzleConfig['operation'], string> = {
    or: "To'g'ri javob, chunki uchinchi katak birinchi ikkita katakdagi barcha belgilarni birlashtiradi.",
    and: "To'g'ri javob, chunki uchinchi katakda faqat ikkala katakda ham birga uchraydigan belgilar qoladi.",
    xor: "To'g'ri javob, chunki uchinchi katakda faqat bittasida bor bo'lgan belgilar qoladi.",
  }

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createLogicMatrixImage(matrixMasks, tile, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: explanationMap[config.operation],
    option_image_urls: optionSet.optionImageUrls,
  }
}

const createComboPuzzle = (config: ComboPuzzleConfig): VisualBrainTeaserPuzzle => {
  const questionText = "Shakl, rang va son mantiqini birga kuzating. Bo'sh joyga mos rasmni toping."
  const cells: TileSpec[] = []

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const shapeIndex = (config.shapeOffset + row + column) % config.shapes.length
      const colorIndex = (row + column * 2) % config.colors.length
      cells.push({
        shape: config.shapes[shapeIndex] as TileShape,
        color: config.colors[colorIndex] as string,
        fill: config.fill,
        count: config.countBase + row * config.countRowStep + column * config.countColumnStep,
        size: config.size,
        rotation: row * 45,
      })
    }
  }

  const correctTile = cells[8] as TileSpec
  const matrixCells = [...cells]
  matrixCells[8] = null as unknown as TileSpec
  const distractors = [
    { ...correctTile, shape: config.shapes[(config.shapes.indexOf(correctTile.shape) + 1) % config.shapes.length] as TileShape },
    { ...correctTile, count: clampTileCount(correctTile.count - 1) },
    { ...correctTile, color: config.colors[(config.colors.indexOf(correctTile.color) + 1) % config.colors.length] as string },
  ]
  const optionSet = buildOptionSet(correctTile, distractors, Number.parseInt(config.id.replace(/\D/g, ''), 10) || 1)

  return {
    id: config.id,
    question_uz: questionText,
    image_url: createMatrixImage(matrixCells, config.id),
    options: optionSet.options,
    correct_answer: optionSet.correctAnswer,
    difficulty: config.difficulty,
    category: config.category,
    explanation_uz: "To'g'ri javob, chunki bu savolda bir vaqtning o'zida shakl, rang va son qoidalari ishlayapti.",
    option_image_urls: optionSet.optionImageUrls,
  }
}

const rotationPuzzles: RotationPuzzleConfig[] = [
  { id: 'raven-rotation-01', difficulty: 'easy', category: 'pattern logic', shape: 'triangle', color: PALETTE.blue, fill: 'solid', baseRotation: 0, rowStep: 90, columnStep: 90, size: 26 },
  { id: 'raven-rotation-02', difficulty: 'easy', category: 'pattern logic', shape: 'square', color: PALETTE.emerald, fill: 'outline', baseRotation: 0, rowStep: 45, columnStep: 45, size: 24 },
  { id: 'raven-rotation-03', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'diamond', color: PALETTE.rose, fill: 'solid', baseRotation: 0, rowStep: 0, columnStep: 45, size: 26 },
  { id: 'raven-rotation-04', difficulty: 'medium', category: 'pattern logic', shape: 'plus', color: PALETTE.violet, fill: 'solid', baseRotation: 0, rowStep: 45, columnStep: 90, size: 22 },
  { id: 'raven-rotation-05', difficulty: 'medium', category: 'pattern logic', shape: 'triangle', color: PALETTE.amber, fill: 'striped', baseRotation: 30, rowStep: 60, columnStep: 30, size: 25 },
  { id: 'raven-rotation-06', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'hex', color: PALETTE.teal, fill: 'outline', baseRotation: 0, rowStep: 30, columnStep: 60, size: 24 },
  { id: 'raven-rotation-07', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'diamond', color: PALETTE.blue, fill: 'dot', baseRotation: 15, rowStep: 45, columnStep: 75, size: 24 },
  { id: 'raven-rotation-08', difficulty: 'hard', category: 'pattern logic', shape: 'plus', color: PALETTE.rose, fill: 'striped', baseRotation: 0, rowStep: 90, columnStep: 45, size: 22 },
  { id: 'raven-rotation-09', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'diamond', color: PALETTE.teal, fill: 'outline', baseRotation: 0, rowStep: 45, columnStep: 90, size: 24 },
  { id: 'raven-rotation-10', difficulty: 'medium', category: 'pattern logic', shape: 'square', color: PALETTE.blue, fill: 'dot', baseRotation: 15, rowStep: 45, columnStep: 45, size: 23 },
  { id: 'raven-rotation-11', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'hex', color: PALETTE.emerald, fill: 'striped', baseRotation: 0, rowStep: 60, columnStep: 60, size: 23 },
  { id: 'raven-rotation-12', difficulty: 'hard', category: 'pattern logic', shape: 'triangle', color: PALETTE.violet, fill: 'outline', baseRotation: 15, rowStep: 75, columnStep: 45, size: 24 },
]

const countPuzzles: CountPuzzleConfig[] = [
  { id: 'raven-count-01', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'circle', color: PALETTE.blue, fill: 'solid', baseCount: 1, rowStep: 1, columnStep: 1, size: 18 },
  { id: 'raven-count-02', difficulty: 'easy', category: 'pattern logic', shape: 'triangle', color: PALETTE.emerald, fill: 'solid', baseCount: 1, rowStep: 1, columnStep: 0, size: 16 },
  { id: 'raven-count-03', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'square', color: PALETTE.amber, fill: 'outline', baseCount: 2, rowStep: 0, columnStep: 1, size: 16 },
  { id: 'raven-count-04', difficulty: 'medium', category: 'math visual puzzles', shape: 'diamond', color: PALETTE.violet, fill: 'solid', baseCount: 2, rowStep: 1, columnStep: 1, size: 16 },
  { id: 'raven-count-05', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'circle', color: PALETTE.rose, fill: 'dot', baseCount: 1, rowStep: 2, columnStep: 1, size: 16 },
  { id: 'raven-count-06', difficulty: 'medium', category: 'math visual puzzles', shape: 'hex', color: PALETTE.teal, fill: 'outline', baseCount: 2, rowStep: 1, columnStep: 0, size: 16 },
  { id: 'raven-count-07', difficulty: 'hard', category: 'math visual puzzles', shape: 'plus', color: PALETTE.blue, fill: 'solid', baseCount: 1, rowStep: 1, columnStep: 2, size: 15 },
  { id: 'raven-count-08', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'triangle', color: PALETTE.emerald, fill: 'striped', baseCount: 2, rowStep: 0, columnStep: 2, size: 16 },
  { id: 'raven-count-09', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'circle', color: PALETTE.teal, fill: 'outline', baseCount: 1, rowStep: 0, columnStep: 2, size: 17 },
  { id: 'raven-count-10', difficulty: 'medium', category: 'math visual puzzles', shape: 'square', color: PALETTE.blue, fill: 'dot', baseCount: 2, rowStep: 1, columnStep: 1, size: 15 },
  { id: 'raven-count-11', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'diamond', color: PALETTE.amber, fill: 'striped', baseCount: 1, rowStep: 2, columnStep: 0, size: 16 },
  { id: 'raven-count-12', difficulty: 'hard', category: 'math visual puzzles', shape: 'hex', color: PALETTE.rose, fill: 'solid', baseCount: 2, rowStep: 1, columnStep: 1, size: 15 },
]

const shapeCyclePuzzles: ShapeCyclePuzzleConfig[] = [
  { id: 'raven-shape-01', difficulty: 'easy', category: 'visual IQ puzzles', shapes: ['circle', 'triangle', 'square', 'diamond'], color: PALETTE.blue, fill: 'solid', offset: 0, rowStep: 1, columnStep: 1, size: 24, count: 1 },
  { id: 'raven-shape-02', difficulty: 'easy', category: 'pattern logic', shapes: ['hex', 'circle', 'plus', 'triangle'], color: PALETTE.emerald, fill: 'outline', offset: 1, rowStep: 1, columnStep: 2, size: 22, count: 1 },
  { id: 'raven-shape-03', difficulty: 'medium', category: 'visual IQ puzzles', shapes: ['diamond', 'square', 'triangle', 'circle'], color: PALETTE.rose, fill: 'dot', offset: 2, rowStep: 2, columnStep: 1, size: 22, count: 1 },
  { id: 'raven-shape-04', difficulty: 'medium', category: 'pattern logic', shapes: ['plus', 'hex', 'diamond', 'circle'], color: PALETTE.violet, fill: 'solid', offset: 0, rowStep: 1, columnStep: 1, size: 21, count: 2 },
  { id: 'raven-shape-05', difficulty: 'medium', category: 'visual IQ puzzles', shapes: ['triangle', 'plus', 'square', 'hex'], color: PALETTE.amber, fill: 'striped', offset: 1, rowStep: 2, columnStep: 1, size: 21, count: 1 },
  { id: 'raven-shape-06', difficulty: 'medium', category: 'pattern logic', shapes: ['square', 'circle', 'diamond', 'plus'], color: PALETTE.teal, fill: 'outline', offset: 3, rowStep: 1, columnStep: 2, size: 22, count: 2 },
  { id: 'raven-shape-07', difficulty: 'hard', category: 'visual IQ puzzles', shapes: ['hex', 'triangle', 'circle', 'diamond'], color: PALETTE.blue, fill: 'dot', offset: 2, rowStep: 1, columnStep: 1, size: 22, count: 2 },
  { id: 'raven-shape-08', difficulty: 'hard', category: 'pattern logic', shapes: ['plus', 'square', 'hex', 'triangle'], color: PALETTE.rose, fill: 'striped', offset: 0, rowStep: 2, columnStep: 1, size: 21, count: 2 },
  { id: 'raven-shape-09', difficulty: 'easy', category: 'visual IQ puzzles', shapes: ['diamond', 'circle', 'hex', 'triangle'], color: PALETTE.teal, fill: 'solid', offset: 1, rowStep: 1, columnStep: 1, size: 23, count: 1 },
  { id: 'raven-shape-10', difficulty: 'easy', category: 'pattern logic', shapes: ['square', 'plus', 'circle', 'diamond'], color: PALETTE.amber, fill: 'outline', offset: 2, rowStep: 1, columnStep: 2, size: 22, count: 1 },
  { id: 'raven-shape-11', difficulty: 'medium', category: 'visual IQ puzzles', shapes: ['triangle', 'hex', 'diamond', 'plus'], color: PALETTE.blue, fill: 'solid', offset: 0, rowStep: 2, columnStep: 1, size: 22, count: 2 },
  { id: 'raven-shape-12', difficulty: 'medium', category: 'pattern logic', shapes: ['circle', 'square', 'plus', 'triangle'], color: PALETTE.emerald, fill: 'dot', offset: 1, rowStep: 1, columnStep: 1, size: 21, count: 1 },
  { id: 'raven-shape-13', difficulty: 'hard', category: 'visual IQ puzzles', shapes: ['hex', 'square', 'circle', 'plus'], color: PALETTE.violet, fill: 'striped', offset: 3, rowStep: 1, columnStep: 2, size: 21, count: 2 },
  { id: 'raven-shape-14', difficulty: 'hard', category: 'pattern logic', shapes: ['triangle', 'diamond', 'hex', 'square'], color: PALETTE.teal, fill: 'outline', offset: 2, rowStep: 2, columnStep: 1, size: 22, count: 2 },
]

const fillPuzzles: FillPuzzleConfig[] = [
  { id: 'raven-fill-01', difficulty: 'medium', category: 'pattern logic', shape: 'circle', color: PALETTE.blue, fills: ['solid', 'outline', 'striped', 'dot'], offset: 0, rowStep: 1, columnStep: 1, size: 23, count: 1 },
  { id: 'raven-fill-02', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'triangle', color: PALETTE.emerald, fills: ['outline', 'solid', 'dot', 'striped'], offset: 1, rowStep: 1, columnStep: 2, size: 24, count: 1 },
  { id: 'raven-fill-03', difficulty: 'medium', category: 'pattern logic', shape: 'square', color: PALETTE.amber, fills: ['striped', 'dot', 'solid', 'outline'], offset: 2, rowStep: 2, columnStep: 1, size: 22, count: 1 },
  { id: 'raven-fill-04', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'diamond', color: PALETTE.violet, fills: ['dot', 'solid', 'outline', 'striped'], offset: 3, rowStep: 1, columnStep: 1, size: 22, count: 2 },
  { id: 'raven-fill-05', difficulty: 'hard', category: 'pattern logic', shape: 'hex', color: PALETTE.teal, fills: ['solid', 'dot', 'striped', 'outline'], offset: 2, rowStep: 1, columnStep: 2, size: 21, count: 2 },
  { id: 'raven-fill-06', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'plus', color: PALETTE.rose, fills: ['outline', 'striped', 'solid', 'dot'], offset: 1, rowStep: 2, columnStep: 1, size: 21, count: 1 },
  { id: 'raven-fill-07', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'hex', color: PALETTE.blue, fills: ['outline', 'dot', 'solid', 'striped'], offset: 0, rowStep: 1, columnStep: 2, size: 22, count: 1 },
  { id: 'raven-fill-08', difficulty: 'medium', category: 'pattern logic', shape: 'diamond', color: PALETTE.emerald, fills: ['solid', 'striped', 'outline', 'dot'], offset: 2, rowStep: 1, columnStep: 1, size: 22, count: 1 },
  { id: 'raven-fill-09', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'triangle', color: PALETTE.amber, fills: ['dot', 'outline', 'striped', 'solid'], offset: 1, rowStep: 2, columnStep: 1, size: 22, count: 2 },
  { id: 'raven-fill-10', difficulty: 'hard', category: 'pattern logic', shape: 'square', color: PALETTE.rose, fills: ['striped', 'solid', 'dot', 'outline'], offset: 3, rowStep: 1, columnStep: 2, size: 21, count: 2 },
]

const colorPuzzles: ColorPuzzleConfig[] = [
  { id: 'raven-color-01', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'circle', colors: [PALETTE.blue, PALETTE.emerald, PALETTE.amber], fill: 'solid', offset: 0, rowStep: 1, columnStep: 1, size: 22, count: 1, rotation: 0 },
  { id: 'raven-color-02', difficulty: 'easy', category: 'pattern logic', shape: 'triangle', colors: [PALETTE.rose, PALETTE.teal, PALETTE.violet], fill: 'outline', offset: 1, rowStep: 1, columnStep: 2, size: 23, count: 1, rotation: 0 },
  { id: 'raven-color-03', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'square', colors: [PALETTE.amber, PALETTE.blue, PALETTE.rose, PALETTE.emerald], fill: 'dot', offset: 2, rowStep: 2, columnStep: 1, size: 21, count: 1, rotation: 45 },
  { id: 'raven-color-04', difficulty: 'medium', category: 'pattern logic', shape: 'diamond', colors: [PALETTE.teal, PALETTE.violet, PALETTE.amber, PALETTE.blue], fill: 'solid', offset: 0, rowStep: 1, columnStep: 2, size: 22, count: 2, rotation: 0 },
  { id: 'raven-color-05', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'diamond', colors: [PALETTE.rose, PALETTE.amber, PALETTE.blue, PALETTE.teal], fill: 'outline', offset: 1, rowStep: 1, columnStep: 1, size: 22, count: 1, rotation: 45 },
  { id: 'raven-color-06', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'hex', colors: [PALETTE.blue, PALETTE.rose, PALETTE.emerald, PALETTE.amber], fill: 'striped', offset: 1, rowStep: 2, columnStep: 1, size: 21, count: 2, rotation: 0 },
  { id: 'raven-color-07', difficulty: 'hard', category: 'pattern logic', shape: 'plus', colors: [PALETTE.violet, PALETTE.teal, PALETTE.amber, PALETTE.rose], fill: 'outline', offset: 2, rowStep: 1, columnStep: 3, size: 20, count: 1, rotation: 45 },
  { id: 'raven-color-08', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'triangle', colors: [PALETTE.emerald, PALETTE.violet, PALETTE.blue, PALETTE.amber], fill: 'dot', offset: 3, rowStep: 2, columnStep: 1, size: 22, count: 2, rotation: 30 },
]

const sizePuzzles: SizePuzzleConfig[] = [
  { id: 'raven-size-01', difficulty: 'easy', category: 'visual IQ puzzles', shape: 'circle', color: PALETTE.blue, fill: 'solid', baseSize: 16, rowStep: 2, columnStep: 2, count: 1, rotation: 0 },
  { id: 'raven-size-02', difficulty: 'easy', category: 'pattern logic', shape: 'square', color: PALETTE.teal, fill: 'outline', baseSize: 15, rowStep: 3, columnStep: 1, count: 1, rotation: 45 },
  { id: 'raven-size-03', difficulty: 'medium', category: 'math visual puzzles', shape: 'diamond', color: PALETTE.amber, fill: 'solid', baseSize: 14, rowStep: 2, columnStep: 3, count: 2, rotation: 0 },
  { id: 'raven-size-04', difficulty: 'medium', category: 'visual IQ puzzles', shape: 'hex', color: PALETTE.violet, fill: 'dot', baseSize: 16, rowStep: 3, columnStep: 0, count: 1, rotation: 0 },
  { id: 'raven-size-05', difficulty: 'medium', category: 'pattern logic', shape: 'triangle', color: PALETTE.emerald, fill: 'striped', baseSize: 15, rowStep: 1, columnStep: 3, count: 1, rotation: 30 },
  { id: 'raven-size-06', difficulty: 'hard', category: 'visual IQ puzzles', shape: 'plus', color: PALETTE.rose, fill: 'solid', baseSize: 14, rowStep: 3, columnStep: 2, count: 2, rotation: 45 },
  { id: 'raven-size-07', difficulty: 'hard', category: 'pattern logic', shape: 'diamond', color: PALETTE.blue, fill: 'outline', baseSize: 16, rowStep: 4, columnStep: 1, count: 2, rotation: 45 },
  { id: 'raven-size-08', difficulty: 'hard', category: 'math visual puzzles', shape: 'hex', color: PALETTE.amber, fill: 'dot', baseSize: 15, rowStep: 2, columnStep: 4, count: 1, rotation: 0 },
]

const axisBlendPuzzles: AxisBlendPuzzleConfig[] = [
  {
    id: 'raven-axis-01',
    difficulty: 'medium',
    category: 'visual IQ puzzles',
    base: { shape: 'triangle', color: PALETTE.blue, fill: 'solid', count: 1, size: 24, rotation: 0 },
    rowShapes: ['triangle', 'square', 'hex'],
    columnRotations: [0, 45, 90],
  },
  {
    id: 'raven-axis-02',
    difficulty: 'medium',
    category: 'pattern logic',
    base: { shape: 'diamond', color: PALETTE.emerald, fill: 'outline', count: 1, size: 24, rotation: 45 },
    rowFills: ['solid', 'outline', 'dot'],
    columnSizes: [18, 24, 30],
  },
  {
    id: 'raven-axis-03',
    difficulty: 'medium',
    category: 'visual IQ puzzles',
    base: { shape: 'circle', color: PALETTE.blue, fill: 'solid', count: 1, size: 24, rotation: 0 },
    rowColors: [PALETTE.blue, PALETTE.emerald, PALETTE.amber],
    columnShapes: ['circle', 'triangle', 'diamond'],
  },
  {
    id: 'raven-axis-04',
    difficulty: 'medium',
    category: 'pattern logic',
    base: { shape: 'hex', color: PALETTE.violet, fill: 'outline', count: 1, size: 23, rotation: 0 },
    rowShapes: ['hex', 'diamond', 'plus'],
    columnColors: [PALETTE.violet, PALETTE.teal, PALETTE.amber],
  },
  {
    id: 'raven-axis-05',
    difficulty: 'medium',
    category: 'math visual puzzles',
    base: { shape: 'plus', color: PALETTE.rose, fill: 'solid', count: 1, size: 20, rotation: 45 },
    rowSizes: [18, 24, 30],
    columnRotations: [45, 90, 135],
  },
  {
    id: 'raven-axis-06',
    difficulty: 'hard',
    category: 'visual IQ puzzles',
    base: { shape: 'triangle', color: PALETTE.rose, fill: 'striped', count: 1, size: 22, rotation: 30 },
    rowShapes: ['triangle', 'plus', 'square'],
    columnRotations: [30, 90, 150],
  },
  {
    id: 'raven-axis-07',
    difficulty: 'hard',
    category: 'pattern logic',
    base: { shape: 'diamond', color: PALETTE.teal, fill: 'dot', count: 1, size: 22, rotation: 45 },
    rowColors: [PALETTE.teal, PALETTE.amber, PALETTE.violet],
    columnSizes: [18, 25, 32],
  },
  {
    id: 'raven-axis-08',
    difficulty: 'hard',
    category: 'visual IQ puzzles',
    base: { shape: 'square', color: PALETTE.emerald, fill: 'solid', count: 1, size: 24, rotation: 45 },
    rowFills: ['solid', 'dot', 'outline'],
    columnRotations: [45, 90, 135],
  },
  {
    id: 'raven-axis-09',
    difficulty: 'hard',
    category: 'pattern logic',
    base: { shape: 'hex', color: PALETTE.blue, fill: 'outline', count: 1, size: 22, rotation: 0 },
    rowShapes: ['hex', 'triangle', 'diamond'],
    columnColors: [PALETTE.blue, PALETTE.rose, PALETTE.amber],
  },
  {
    id: 'raven-axis-10',
    difficulty: 'hard',
    category: 'visual IQ puzzles',
    base: { shape: 'circle', color: PALETTE.amber, fill: 'solid', count: 1, size: 24, rotation: 0 },
    rowColors: [PALETTE.amber, PALETTE.blue, PALETTE.rose],
    columnFills: ['solid', 'outline', 'dot'],
  },
  {
    id: 'raven-axis-11',
    difficulty: 'hard',
    category: 'pattern logic',
    base: { shape: 'triangle', color: PALETTE.emerald, fill: 'outline', count: 1, size: 23, rotation: 30 },
    rowShapes: ['triangle', 'hex', 'plus'],
    columnSizes: [18, 25, 32],
  },
  {
    id: 'raven-axis-12',
    difficulty: 'hard',
    category: 'visual IQ puzzles',
    base: { shape: 'diamond', color: PALETTE.violet, fill: 'solid', count: 1, size: 24, rotation: 45 },
    rowFills: ['solid', 'striped', 'outline'],
    columnColors: [PALETTE.violet, PALETTE.teal, PALETTE.amber],
  },
  {
    id: 'raven-axis-13',
    difficulty: 'hard',
    category: 'pattern logic',
    base: { shape: 'plus', color: PALETTE.rose, fill: 'dot', count: 1, size: 22, rotation: 45 },
    rowSizes: [18, 24, 30],
    columnRotations: [45, 135, 225],
  },
]

const hybridPuzzles: HybridPuzzleConfig[] = [
  { id: 'raven-hybrid-01', difficulty: 'medium', category: 'visual IQ puzzles', shapes: ['circle', 'triangle', 'square', 'diamond'], colors: [PALETTE.blue, PALETTE.amber, PALETTE.emerald], fill: 'solid', shapeOffset: 0, rowShapeStep: 1, columnShapeStep: 2, colorOffset: 0, rowColorStep: 1, columnColorStep: 1, countBase: 1, rowCountStep: 1, columnCountStep: 0, size: 20, baseRotation: 0, rowRotationStep: 45, columnRotationStep: 0 },
  { id: 'raven-hybrid-02', difficulty: 'medium', category: 'pattern logic', shapes: ['hex', 'plus', 'diamond', 'circle'], colors: [PALETTE.teal, PALETTE.rose, PALETTE.violet], fill: 'outline', shapeOffset: 1, rowShapeStep: 1, columnShapeStep: 1, colorOffset: 0, rowColorStep: 0, columnColorStep: 1, countBase: 1, rowCountStep: 0, columnCountStep: 1, size: 20, baseRotation: 0, rowRotationStep: 0, columnRotationStep: 45 },
  { id: 'raven-hybrid-03', difficulty: 'medium', category: 'math visual puzzles', shapes: ['triangle', 'hex', 'square', 'plus'], colors: [PALETTE.amber, PALETTE.blue, PALETTE.teal], fill: 'dot', shapeOffset: 2, rowShapeStep: 2, columnShapeStep: 1, colorOffset: 1, rowColorStep: 1, columnColorStep: 0, countBase: 1, rowCountStep: 1, columnCountStep: 1, size: 19, baseRotation: 15, rowRotationStep: 30, columnRotationStep: 45 },
  { id: 'raven-hybrid-04', difficulty: 'hard', category: 'visual IQ puzzles', shapes: ['diamond', 'circle', 'triangle', 'hex'], colors: [PALETTE.rose, PALETTE.emerald, PALETTE.blue, PALETTE.violet], fill: 'striped', shapeOffset: 1, rowShapeStep: 1, columnShapeStep: 2, colorOffset: 2, rowColorStep: 1, columnColorStep: 2, countBase: 1, rowCountStep: 1, columnCountStep: 1, size: 20, baseRotation: 15, rowRotationStep: 45, columnRotationStep: 75 },
  { id: 'raven-hybrid-05', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['plus', 'square', 'hex', 'triangle'], colors: [PALETTE.amber, PALETTE.teal, PALETTE.rose], fill: 'solid', shapeOffset: 0, rowShapeStep: 2, columnShapeStep: 1, colorOffset: 0, rowColorStep: 1, columnColorStep: 1, countBase: 2, rowCountStep: 1, columnCountStep: 0, size: 19, baseRotation: 0, rowRotationStep: 90, columnRotationStep: 45 },
  { id: 'raven-hybrid-06', difficulty: 'hard', category: 'logic classics', shapes: ['circle', 'diamond', 'plus', 'square'], colors: [PALETTE.violet, PALETTE.emerald, PALETTE.amber, PALETTE.blue], fill: 'outline', shapeOffset: 3, rowShapeStep: 1, columnShapeStep: 1, colorOffset: 1, rowColorStep: 2, columnColorStep: 1, countBase: 1, rowCountStep: 0, columnCountStep: 2, size: 19, baseRotation: 30, rowRotationStep: 60, columnRotationStep: 30 },
  { id: 'raven-hybrid-07', difficulty: 'hard', category: 'visual IQ puzzles', shapes: ['triangle', 'plus', 'circle', 'diamond'], colors: [PALETTE.teal, PALETTE.blue, PALETTE.rose], fill: 'dot', shapeOffset: 2, rowShapeStep: 2, columnShapeStep: 1, colorOffset: 0, rowColorStep: 1, columnColorStep: 2, countBase: 1, rowCountStep: 1, columnCountStep: 2, size: 18, baseRotation: 0, rowRotationStep: 45, columnRotationStep: 45 },
  { id: 'raven-hybrid-08', difficulty: 'hard', category: 'logic classics', shapes: ['hex', 'triangle', 'square', 'plus'], colors: [PALETTE.amber, PALETTE.violet, PALETTE.teal, PALETTE.emerald], fill: 'striped', shapeOffset: 1, rowShapeStep: 1, columnShapeStep: 2, colorOffset: 3, rowColorStep: 1, columnColorStep: 1, countBase: 2, rowCountStep: 1, columnCountStep: 1, size: 19, baseRotation: 15, rowRotationStep: 75, columnRotationStep: 45 },
  { id: 'raven-hybrid-09', difficulty: 'medium', category: 'visual IQ puzzles', shapes: ['square', 'diamond', 'circle', 'triangle'], colors: [PALETTE.blue, PALETTE.rose, PALETTE.amber], fill: 'solid', shapeOffset: 0, rowShapeStep: 1, columnShapeStep: 2, colorOffset: 0, rowColorStep: 0, columnColorStep: 1, countBase: 1, rowCountStep: 2, columnCountStep: 0, size: 20, baseRotation: 45, rowRotationStep: 0, columnRotationStep: 45 },
  { id: 'raven-hybrid-10', difficulty: 'hard', category: 'pattern logic', shapes: ['hex', 'circle', 'diamond', 'triangle'], colors: [PALETTE.rose, PALETTE.teal, PALETTE.blue, PALETTE.amber], fill: 'outline', shapeOffset: 2, rowShapeStep: 1, columnShapeStep: 1, colorOffset: 2, rowColorStep: 1, columnColorStep: 2, countBase: 1, rowCountStep: 2, columnCountStep: 1, size: 19, baseRotation: 0, rowRotationStep: 60, columnRotationStep: 60 },
]

const logicGridPuzzles: LogicGridPuzzleConfig[] = [
  { id: 'raven-logic-01', difficulty: 'medium', category: 'logic classics', operation: 'or', rows: [[0b100101, 0b001110], [0b010011, 0b101100], [0b001101, 0b110010]], shape: 'circle', color: PALETTE.blue, fill: 'solid', size: 16, rotation: 0 },
  { id: 'raven-logic-02', difficulty: 'medium', category: 'visual IQ puzzles', operation: 'and', rows: [[0b111010, 0b101011], [0b110111, 0b011101], [0b101110, 0b111001]], shape: 'square', color: PALETTE.emerald, fill: 'outline', size: 15, rotation: 45 },
  { id: 'raven-logic-03', difficulty: 'medium', category: 'logic classics', operation: 'xor', rows: [[0b100111, 0b001101], [0b011110, 0b110011], [0b101011, 0b010110]], shape: 'triangle', color: PALETTE.amber, fill: 'solid', size: 16, rotation: 30 },
  { id: 'raven-logic-04', difficulty: 'hard', category: 'logic classics', operation: 'or', rows: [[0b101001, 0b010110], [0b011100, 0b100011], [0b001111, 0b110100]], shape: 'diamond', color: PALETTE.violet, fill: 'dot', size: 15, rotation: 45 },
  { id: 'raven-logic-05', difficulty: 'hard', category: 'visual IQ puzzles', operation: 'xor', rows: [[0b110101, 0b011011], [0b101110, 0b010101], [0b111000, 0b001111]], shape: 'hex', color: PALETTE.teal, fill: 'outline', size: 15, rotation: 0 },
  { id: 'raven-logic-06', difficulty: 'hard', category: 'logic classics', operation: 'and', rows: [[0b111011, 0b101110], [0b110111, 0b011110], [0b101101, 0b111100]], shape: 'plus', color: PALETTE.rose, fill: 'solid', size: 14, rotation: 45 },
  { id: 'raven-logic-07', difficulty: 'hard', category: 'visual IQ puzzles', operation: 'xor', rows: [[0b101111, 0b010101], [0b111001, 0b001110], [0b110110, 0b011011]], shape: 'circle', color: PALETTE.amber, fill: 'dot', size: 15, rotation: 0 },
  { id: 'raven-logic-08', difficulty: 'hard', category: 'logic classics', operation: 'or', rows: [[0b100110, 0b011001], [0b010111, 0b101100], [0b001011, 0b110101]], shape: 'triangle', color: PALETTE.blue, fill: 'striped', size: 16, rotation: 30 },
  { id: 'raven-logic-09', difficulty: 'hard', category: 'logic classics', operation: 'and', rows: [[0b111100, 0b110111], [0b101111, 0b111010], [0b011111, 0b111001]], shape: 'diamond', color: PALETTE.emerald, fill: 'solid', size: 15, rotation: 45 },
  { id: 'raven-logic-10', difficulty: 'hard', category: 'visual IQ puzzles', operation: 'xor', rows: [[0b101101, 0b010111], [0b111010, 0b001101], [0b110011, 0b011100]], shape: 'square', color: PALETTE.violet, fill: 'outline', size: 15, rotation: 45 },
  { id: 'raven-logic-11', difficulty: 'hard', category: 'logic classics', operation: 'or', rows: [[0b001111, 0b110100], [0b101001, 0b010111], [0b100011, 0b011110]], shape: 'hex', color: PALETTE.rose, fill: 'striped', size: 15, rotation: 0 },
  { id: 'raven-logic-12', difficulty: 'hard', category: 'logic classics', operation: 'and', rows: [[0b111101, 0b101111], [0b110111, 0b111011], [0b011111, 0b111110]], shape: 'plus', color: PALETTE.teal, fill: 'outline', size: 14, rotation: 45 },
]

const comboPuzzles: ComboPuzzleConfig[] = [
  { id: 'raven-combo-01', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['circle', 'triangle', 'square', 'diamond'], colors: [PALETTE.blue, PALETTE.emerald, PALETTE.amber], fill: 'solid', shapeOffset: 0, countBase: 1, countRowStep: 1, countColumnStep: 1, size: 18 },
  { id: 'raven-combo-02', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['hex', 'plus', 'circle', 'triangle'], colors: [PALETTE.rose, PALETTE.blue, PALETTE.teal], fill: 'outline', shapeOffset: 1, countBase: 2, countRowStep: 1, countColumnStep: 0, size: 18 },
  { id: 'raven-combo-03', difficulty: 'hard', category: 'logic classics', shapes: ['diamond', 'square', 'hex', 'plus'], colors: [PALETTE.violet, PALETTE.emerald, PALETTE.amber], fill: 'dot', shapeOffset: 2, countBase: 1, countRowStep: 0, countColumnStep: 1, size: 18 },
  { id: 'raven-combo-04', difficulty: 'hard', category: 'logic classics', shapes: ['triangle', 'circle', 'plus', 'square'], colors: [PALETTE.teal, PALETTE.rose, PALETTE.blue], fill: 'striped', shapeOffset: 3, countBase: 2, countRowStep: 1, countColumnStep: 1, size: 17 },
  { id: 'raven-combo-05', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['plus', 'diamond', 'triangle', 'hex'], colors: [PALETTE.amber, PALETTE.violet, PALETTE.teal], fill: 'solid', shapeOffset: 0, countBase: 1, countRowStep: 2, countColumnStep: 1, size: 17 },
  { id: 'raven-combo-06', difficulty: 'hard', category: 'logic classics', shapes: ['square', 'hex', 'circle', 'diamond'], colors: [PALETTE.emerald, PALETTE.blue, PALETTE.rose], fill: 'outline', shapeOffset: 1, countBase: 2, countRowStep: 0, countColumnStep: 2, size: 17 },
  { id: 'raven-combo-07', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['diamond', 'triangle', 'circle', 'plus'], colors: [PALETTE.teal, PALETTE.amber, PALETTE.blue], fill: 'dot', shapeOffset: 2, countBase: 1, countRowStep: 1, countColumnStep: 1, size: 17 },
  { id: 'raven-combo-08', difficulty: 'hard', category: 'logic classics', shapes: ['hex', 'square', 'triangle', 'circle'], colors: [PALETTE.rose, PALETTE.emerald, PALETTE.violet], fill: 'solid', shapeOffset: 0, countBase: 2, countRowStep: 1, countColumnStep: 0, size: 17 },
  { id: 'raven-combo-09', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['plus', 'hex', 'diamond', 'square'], colors: [PALETTE.blue, PALETTE.amber, PALETTE.teal], fill: 'striped', shapeOffset: 1, countBase: 1, countRowStep: 0, countColumnStep: 2, size: 17 },
  { id: 'raven-combo-10', difficulty: 'hard', category: 'logic classics', shapes: ['circle', 'plus', 'triangle', 'hex'], colors: [PALETTE.emerald, PALETTE.rose, PALETTE.blue], fill: 'outline', shapeOffset: 2, countBase: 2, countRowStep: 1, countColumnStep: 1, size: 17 },
  { id: 'raven-combo-11', difficulty: 'hard', category: 'chess visual puzzles', shapes: ['triangle', 'square', 'circle', 'diamond'], colors: [PALETTE.violet, PALETTE.teal, PALETTE.amber], fill: 'dot', shapeOffset: 3, countBase: 1, countRowStep: 1, countColumnStep: 1, size: 16 },
  { id: 'raven-combo-12', difficulty: 'hard', category: 'logic classics', shapes: ['square', 'diamond', 'plus', 'hex'], colors: [PALETTE.blue, PALETTE.emerald, PALETTE.rose], fill: 'solid', shapeOffset: 0, countBase: 2, countRowStep: 0, countColumnStep: 1, size: 17 },
]

const GENERATED_PROVIDED_PUZZLE_POOL: VisualBrainTeaserPuzzle[] = [
  ...rotationPuzzles.map(createRotationPuzzle),
  ...countPuzzles.map(createCountPuzzle),
  ...shapeCyclePuzzles.map(createShapeCyclePuzzle),
  ...fillPuzzles.map(createFillPuzzle),
  ...colorPuzzles.map(createColorPuzzle),
  ...sizePuzzles.map(createSizePuzzle),
  ...axisBlendPuzzles.map(createAxisBlendPuzzle),
  ...hybridPuzzles.map(createHybridPuzzle),
  ...logicGridPuzzles.map(createLogicGridPuzzle),
  ...comboPuzzles.map(createComboPuzzle),
]

const GENERATED_PROVIDED_PUZZLES_BY_DIFFICULTY: Record<VisualBrainTeaserDifficulty, VisualBrainTeaserPuzzle[]> = {
  easy: GENERATED_PROVIDED_PUZZLE_POOL.filter((item) => item.difficulty === 'easy'),
  medium: GENERATED_PROVIDED_PUZZLE_POOL.filter((item) => item.difficulty === 'medium'),
  hard: GENERATED_PROVIDED_PUZZLE_POOL.filter((item) => item.difficulty === 'hard'),
}

const RESTORED_HARD_PUZZLE_MARKERS = ['-logic-', '-combo-', '-hybrid-', '-axis-', '-count-', '-rotation-'] as const

const restoredHardPuzzles = GENERATED_PROVIDED_PUZZLE_POOL.filter(
  (item) =>
    item.difficulty === 'hard'
    || (item.difficulty === 'medium' && RESTORED_HARD_PUZZLE_MARKERS.some((marker) => item.id.includes(marker))),
)

export const visualBrainTeaserPuzzles: VisualBrainTeaserPuzzle[] = [
  ...restoredHardPuzzles,
  ...GENERATED_PROVIDED_PUZZLES_BY_DIFFICULTY.easy.slice(0, 10),
]

const getPuzzleFamily = (item: Pick<VisualBrainTeaserPuzzle, 'id'>): PuzzleFamily => {
  if (item.id.includes('-rotation-')) return 'rotation'
  if (item.id.includes('-count-')) return 'count'
  if (item.id.includes('-shape-')) return 'shape'
  if (item.id.includes('-fill-')) return 'fill'
  if (item.id.includes('-color-')) return 'color'
  if (item.id.includes('-size-')) return 'size'
  if (item.id.includes('-axis-')) return 'axis'
  if (item.id.includes('-hybrid-')) return 'hybrid'
  if (item.id.includes('-logic-')) return 'logic'
  return 'combo'
}

export const playableVisualBrainTeaserPuzzles = [...visualBrainTeaserPuzzles]

const getDifficultyQuestionPool = (difficulty: VisualBrainTeaserDifficulty) =>
  playableVisualBrainTeaserPuzzles.filter((item) => item.difficulty === difficulty)

export const getVisualBrainTeasersByDifficulty = (difficulty: VisualBrainTeaserDifficulty) =>
  getDifficultyQuestionPool(difficulty)

export const shuffleItems = <T,>(items: T[]) => {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex] as T, next[index] as T]
  }

  return next
}

const getPuzzleVarietyKey = (item: VisualBrainTeaserPuzzle) => `${getPuzzleFamily(item)}:${item.category}`

export const buildDiverseVisualBrainTeaserSet = (items: VisualBrainTeaserPuzzle[], count: number) => {
  const grouped = new Map<string, VisualBrainTeaserPuzzle[]>()

  for (const item of shuffleItems(items)) {
    const key = getPuzzleVarietyKey(item)
    const bucket = grouped.get(key)

    if (bucket) {
      bucket.push(item)
    } else {
      grouped.set(key, [item])
    }
  }

  let groupOrder = shuffleItems(Array.from(grouped.keys()))
  const selected: VisualBrainTeaserPuzzle[] = []

  while (selected.length < count && groupOrder.length > 0) {
    const nextRound: string[] = []

    for (const key of groupOrder) {
      const bucket = grouped.get(key)
      const nextItem = bucket?.shift()

      if (nextItem) {
        selected.push(nextItem)
      }

      if (bucket && bucket.length > 0) {
        nextRound.push(key)
      }

      if (selected.length >= count) {
        break
      }
    }

    groupOrder = shuffleItems(nextRound)
  }

  return selected
}

export const buildPlayableVisualBrainTeaserSet = (
  difficulty: VisualBrainTeaserDifficulty,
  count: number,
  excludeIds: Iterable<string> = [],
) => {
  const priorityMap: Record<VisualBrainTeaserDifficulty, VisualBrainTeaserDifficulty[]> = {
    easy: ['easy', 'medium', 'hard'],
    medium: ['medium', 'easy', 'hard'],
    hard: ['hard', 'medium', 'easy'],
  }

  const selected: VisualBrainTeaserPuzzle[] = []
  const usedIds = new Set<string>()
  const blockedIds = new Set<string>(excludeIds)

  for (const level of priorityMap[difficulty]) {
    const remainingCount = count - selected.length
    if (remainingCount <= 0) break

    const candidates = getDifficultyQuestionPool(level).filter((item) => !usedIds.has(item.id) && !blockedIds.has(item.id))
    const selection = buildDiverseVisualBrainTeaserSet(candidates, remainingCount)

    selection.forEach((item) => usedIds.add(item.id))
    selected.push(...selection)
  }

  return selected.slice(0, count)
}

const createFallbackOptionImage = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines =
    words.length <= 1
      ? [value]
      : words.length === 2
        ? words
        : [`${words[0]} ${words[1]}`, words.slice(2).join(' ')]
  const longestLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const fontSize = longestLineLength > 12 ? 22 : longestLineLength > 8 ? 26 : 32
  const startY = lines.length === 1 ? 96 : 80

  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${OPTION_IMAGE_SIZE}" height="${OPTION_IMAGE_SIZE}" viewBox="0 0 ${OPTION_IMAGE_SIZE} ${OPTION_IMAGE_SIZE}">
      <rect width="${OPTION_IMAGE_SIZE}" height="${OPTION_IMAGE_SIZE}" fill="#ffffff" />
      ${lines
        .map(
          (line, index) => `
            <text
              x="${OPTION_IMAGE_SIZE / 2}"
              y="${startY + index * (fontSize + 12)}"
              text-anchor="middle"
              font-family="Arial, sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              fill="${STROKE_COLOR}"
            >${escapeXml(line)}</text>
          `,
        )
        .join('')}
    </svg>
  `)
}

export type VisualBrainTeaserOptionCard = VisualIqOptionCard

export const getVisualBrainTeaserOptionCards = (
  options: string[],
  optionImageUrls?: Record<string, string>,
): VisualBrainTeaserOptionCard[] =>
  options.map((value, index) => ({
    value,
    label: OPTION_LABELS[index] ?? String(index + 1),
    imageUrl: optionImageUrls?.[value] ?? createFallbackOptionImage(value),
    alt: `${value} varianti`,
  }))
