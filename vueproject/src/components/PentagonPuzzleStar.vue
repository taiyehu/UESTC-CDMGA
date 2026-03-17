<template>
  <section class="pentagon-shell" aria-label="Pentagon Puzzle">
    <svg class="arrow-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22d3ee" />
          <stop offset="52%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#f472b6" />
        </linearGradient>
        <filter id="ribbon-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.45" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path v-for="(shape, idx) in arrowShapes" :key="`ribbon-${idx}`" :d="shape" class="ribbon-arrow" />
    </svg>

    <svg class="star-svg" viewBox="0 0 100 100" role="img" aria-label="三层边框五角星">
      <defs>
        <linearGradient id="star-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#67e8f9" />
          <stop offset="100%" stop-color="#22d3ee" />
        </linearGradient>
        <linearGradient id="star-purple" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c084fc" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
        <linearGradient id="star-pink" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f9a8d4" />
          <stop offset="100%" stop-color="#f472b6" />
        </linearGradient>
        <filter id="star-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.34" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon class="star-layer layer-1" :points="starPointsOuter" />
      <polygon class="star-layer layer-2" :points="starPointsMid" />
      <polygon class="star-layer layer-3" :points="starPointsInner" />
    </svg>

    <a
      v-for="node in nodes"
      :key="`hint-${node.id}`"
      class="info-circle hint-circle"
      :style="at(node.hint)"
      :href="node.url"
      target="_blank"
      rel="noopener noreferrer"
      role="button"
      tabindex="0"
    >
      <span class="hint-link">点击得到线索</span>
    </a>

    <div v-for="node in nodes" :key="`mode-${node.id}`" class="info-circle mode-circle" :style="at(node.mode)">
      {{ node.position || '游玩方式' }}
    </div>

    <div v-for="node in nodes" :key="`id-${node.id}`" class="info-circle id-circle" :style="at(node.issue)">
      第 ? 题
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'

type Point = { x: number; y: number }
type PuzzleLinkItem = { id: number; url: string; position?: string }
type PuzzleJson = { 'Pentagon Puzzle'?: PuzzleLinkItem[] }

type RenderNode = {
  id: number
  url: string
  position?: string
  groupCenter: Point
  hint: Point
  mode: Point
  issue: Point
}

const props = withDefaults(
  defineProps<{
    dataUrl?: string
  }>(),
  {
    dataUrl: '/pentagon-puzzle-links.json',
  }
)

const puzzleNodes = ref<PuzzleLinkItem[]>([])

const fallbackNodes: PuzzleLinkItem[] = [
  { id: 1, url: 'https://b23.tv/KHfV4nz' },
  { id: 2, url: 'https://www.bilibili.com/' },
  { id: 3, url: 'https://www.bilibili.com/', position: 'Bottom Right' },
  { id: 4, url: 'https://www.bilibili.com/' },
  { id: 5, url: 'https://b23.tv/R7mSynS' },
]

const center: Point = { x: 50, y: 50 }

function starPolygon(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: Point[] = []
  for (let i = 0; i < 10; i += 1) {
    const angleDeg = -90 + i * 36
    const angle = (angleDeg * Math.PI) / 180
    const radius = i % 2 === 0 ? outerR : innerR
    points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

const starPointsOuter = computed(() => starPolygon(center.x, center.y, 34.2, 14.6))
const starPointsMid = computed(() => starPolygon(center.x, center.y, 25.2, 9.8))
const starPointsInner = computed(() => starPolygon(center.x, center.y, 16.8, 6.1))

function normalizeVector(x: number, y: number): Point {
  const len = Math.hypot(x, y) || 1
  return { x: x / len, y: y / len }
}

function offset(base: Point, unit: Point, distance: number): Point {
  return { x: base.x + unit.x * distance, y: base.y + unit.y * distance }
}

function pointOnRing(index: number, radius: number): Point {
  const angleDeg = -90 + index * 72
  const angle = (angleDeg * Math.PI) / 180
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
}

function normalize(nodesInput: PuzzleLinkItem[]): PuzzleLinkItem[] {
  const map = new Map<number, PuzzleLinkItem>()
  for (const item of nodesInput) {
    const id = Number(item?.id)
    if (!Number.isFinite(id) || id < 1 || id > 5) continue
    map.set(id, {
      id,
      url: String(item?.url || '').trim(),
      position: item?.position ? String(item.position) : undefined,
    })
  }

  const list: PuzzleLinkItem[] = []
  for (let id = 1; id <= 5; id += 1) {
    const item = map.get(id)
    if (item?.url) {
      list.push(item)
    } else {
      list.push({ ...(fallbackNodes[id - 1] ?? { id, url: '#' }) })
    }
  }
  return list
}

async function loadPuzzleLinks() {
  try {
    const res = await fetch(props.dataUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error('load-failed')
    const data = (await res.json()) as PuzzleJson
    puzzleNodes.value = normalize(Array.isArray(data?.['Pentagon Puzzle']) ? data['Pentagon Puzzle'] : [])
  } catch {
    puzzleNodes.value = normalize(fallbackNodes)
  }
}

const nodes = computed<RenderNode[]>(() => {
  return Array.from({ length: 5 }, (_, i) => {
    const item = puzzleNodes.value[i] ?? fallbackNodes[i] ?? { id: i + 1, url: '#', position: undefined }
    const vertex = pointOnRing(i, 32.6)
    const radial = normalizeVector(vertex.x - center.x, vertex.y - center.y)
    const tangent = { x: radial.y, y: -radial.x }

    const hint = offset(vertex, radial, 2)
    const triangleSide = 9.8
    const triangleHeight = triangleSide * 0.8660254
    const baseCenter = offset(hint, radial, triangleHeight)
    const mode = offset(baseCenter, tangent, -triangleSide / 2)
    const issue = offset(baseCenter, tangent, triangleSide / 2)
    const groupCenter = baseCenter

    return {
      id: item.id,
      url: item.url,
      position: item.position,
      groupCenter,
      hint,
      mode,
      issue,
    }
  })
})

function buildRibbonArrowPath(from: Point, to: Point): string {
  const width = 8.7
  const headLength = 3.2
  const tailNotch = 2.2
  const bend = 8.2

  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const outward = normalizeVector(mid.x - center.x, mid.y - center.y)
  const control = { x: mid.x + outward.x * bend, y: mid.y + outward.y * bend }

  const tangentStart = normalizeVector(control.x - from.x, control.y - from.y)
  const tangentEnd = normalizeVector(to.x - control.x, to.y - control.y)
  const normalStart = { x: -tangentStart.y, y: tangentStart.x }
  const normalEnd = { x: -tangentEnd.y, y: tangentEnd.x }
  const avgNormal = normalizeVector(normalStart.x + normalEnd.x, normalStart.y + normalEnd.y)

  const half = width / 2
  const startTop = offset(from, normalStart, half)
  const startBottom = offset(from, normalStart, -half)
  const endTop = offset(to, normalEnd, half)
  const endBottom = offset(to, normalEnd, -half)

  const controlTop = offset(control, avgNormal, half)
  const controlBottom = offset(control, avgNormal, -half)

  const tip = offset(to, tangentEnd, headLength)
  const notch = offset(from, tangentStart, tailNotch)

  return [
    `M ${startTop.x.toFixed(2)} ${startTop.y.toFixed(2)}`,
    `Q ${controlTop.x.toFixed(2)} ${controlTop.y.toFixed(2)} ${endTop.x.toFixed(2)} ${endTop.y.toFixed(2)}`,
    `L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    `L ${endBottom.x.toFixed(2)} ${endBottom.y.toFixed(2)}`,
    `Q ${controlBottom.x.toFixed(2)} ${controlBottom.y.toFixed(2)} ${startBottom.x.toFixed(2)} ${startBottom.y.toFixed(2)}`,
    `L ${notch.x.toFixed(2)} ${notch.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

const arrowShapes = computed(() => {
  const points = nodes.value.map((n) => n.groupCenter)
  const shapes: string[] = []
  if (points.length < 5) return shapes

  for (let i = 0; i < points.length; i += 1) {
    const from = points[i]
    const to = points[(i + 4) % points.length]
    if (!from || !to) continue

    const unit = normalizeVector(to.x - from.x, to.y - from.y)
    const start = offset(from, unit, 11.2)
    const end = offset(to, unit, -13)
    shapes.push(buildRibbonArrowPath(start, end))
  }
  return shapes
})

function at(point: Point): CSSProperties {
  return { left: `${point.x}%`, top: `${point.y}%` }
}

onMounted(() => {
  loadPuzzleLinks()
})
</script>

<style scoped>
.pentagon-shell {
  position: relative;
  width: min(100%, 820px);
  margin: 18px auto 4px;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  border: 2px solid rgba(103, 232, 249, 0.58);
  background:
    radial-gradient(circle at 50% 45%, rgba(34, 211, 238, 0.2), rgba(17, 24, 39, 0.08) 48%, transparent 68%),
    radial-gradient(circle at 18% 18%, rgba(168, 85, 247, 0.22), transparent 34%),
    radial-gradient(circle at 82% 78%, rgba(244, 114, 182, 0.2), transparent 34%),
    linear-gradient(140deg, rgba(7, 14, 28, 0.96), rgba(18, 12, 35, 0.95));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 24px rgba(34, 211, 238, 0.22),
    0 0 36px rgba(168, 85, 247, 0.17),
    0 0 28px rgba(244, 114, 182, 0.12);
  overflow: hidden;
}

.arrow-svg,
.star-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ribbon-arrow {
  fill: url(#ribbon-grad);
  filter: url(#ribbon-glow);
  opacity: 0.96;
}

.star-layer {
  fill: transparent;
  stroke-linejoin: round;
  filter: url(#star-glow);
}

.layer-1 {
  stroke: url(#star-cyan);
  stroke-width: 0.98;
}

.layer-2 {
  stroke: url(#star-purple);
  stroke-width: 0.78;
}

.layer-3 {
  stroke: url(#star-pink);
  stroke-width: 0.62;
}

.info-circle {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(62px, 8.4vw, 78px);
  height: clamp(62px, 8.4vw, 78px);
  border-radius: 999px;
  border: 1px solid rgba(186, 230, 253, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  font-size: clamp(11px, 1.35vw, 13px);
  line-height: 1.24;
  color: #f8fafc;
  backdrop-filter: blur(6px);
  z-index: 10;
}

.hint-circle {
  text-decoration: none;
  cursor: pointer;
  background: linear-gradient(140deg, rgba(6, 95, 115, 0.86), rgba(147, 51, 234, 0.78), rgba(236, 72, 153, 0.74));
  border-color: rgba(103, 232, 249, 0.86);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.44),
    0 0 14px rgba(236, 72, 153, 0.26);
}

.hint-circle:hover {
  transform: translate(-50%, -50%) scale(1.03);
}

.mode-circle {
  background: linear-gradient(135deg, rgba(12, 74, 110, 0.8), rgba(126, 34, 206, 0.74));
}

.id-circle {
  background: linear-gradient(135deg, rgba(91, 33, 182, 0.74), rgba(190, 24, 93, 0.66));
}

.hint-link {
  color: #ecfeff;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 780px) {
  .info-circle {
    width: clamp(50px, 14.5vw, 68px);
    height: clamp(50px, 14.5vw, 68px);
    padding: 6px;
    font-size: clamp(10px, 2.7vw, 12px);
  }
}
</style>
