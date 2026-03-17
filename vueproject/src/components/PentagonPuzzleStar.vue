<template>
  <section class="pentagon-shell" aria-label="Pentagon Puzzle">
    <svg class="star-svg" viewBox="0 0 100 100" role="img" aria-label="三层边框五角星">
      <defs>
        <linearGradient id="star-neon-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#67e8f9" />
          <stop offset="100%" stop-color="#22d3ee" />
        </linearGradient>
        <linearGradient id="star-neon-pink" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f472b6" />
          <stop offset="100%" stop-color="#e879f9" />
        </linearGradient>
        <linearGradient id="star-neon-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fde68a" />
          <stop offset="100%" stop-color="#fbbf24" />
        </linearGradient>
        <filter id="star-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.45" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon class="star-layer layer-1" :points="starPointsOuter" />
      <polygon class="star-layer layer-2" :points="starPointsMid" />
      <polygon class="star-layer layer-3" :points="starPointsInner" />
    </svg>

    <svg class="arrow-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <marker id="pentagon-arrow-head" markerWidth="10" markerHeight="10" refX="8.4" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="rgba(103, 232, 249, 0.95)" />
        </marker>
      </defs>
      <path
        v-for="(pathDef, idx) in arrowPaths"
        :key="`arrow-${idx}`"
        :d="pathDef"
        class="flow-arrow-path"
        marker-end="url(#pentagon-arrow-head)"
      />
    </svg>

    <div
      v-for="node in nodes"
      :key="`hint-${node.id}`"
      class="info-circle hint-circle"
      :style="at(node.hint)"
    >
      <a class="hint-link" :href="node.url" target="_blank" rel="noopener noreferrer">点击得到线索</a>
    </div>

    <div
      v-for="node in nodes"
      :key="`mode-${node.id}`"
      class="info-circle mode-circle"
      :style="at(node.mode)"
    >
      {{ node.position || '游玩方式' }}
    </div>

    <div
      v-for="node in nodes"
      :key="`id-${node.id}`"
      class="info-circle id-circle"
      :style="at(node.issue)"
    >
      题号 {{ node.id }}
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'

type Point = { x: number; y: number }
type PuzzleLinkItem = { id: number; url: string; position?: string }

type PuzzleJson = {
  'Pentagon Puzzle'?: PuzzleLinkItem[]
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

function starPolygon(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: Point[] = []
  for (let i = 0; i < 10; i += 1) {
    const angleDeg = -90 + i * 36
    const angle = (angleDeg * Math.PI) / 180
    const radius = i % 2 === 0 ? outerR : innerR
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    })
  }
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

const starPointsOuter = computed(() => starPolygon(50, 50, 31.5, 13.4))
const starPointsMid = computed(() => starPolygon(50, 50, 23.4, 9.5))
const starPointsInner = computed(() => starPolygon(50, 50, 15.3, 5.9))

function pointOnRing(index: number, radius: number): Point {
  const angleDeg = -90 + index * 72
  const angle = (angleDeg * Math.PI) / 180
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  }
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
  const result: PuzzleLinkItem[] = []
  for (let id = 1; id <= 5; id += 1) {
    const item = map.get(id)
    if (item?.url) {
      result.push(item)
    } else {
      const fallback = fallbackNodes[id - 1] ?? { id, url: '#' }
      result.push({ ...fallback })
    }
  }
  return result
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

function at(point: Point) {
  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
  }
}

function offset(base: Point, unit: Point, distance: number): Point {
  return {
    x: base.x + unit.x * distance,
    y: base.y + unit.y * distance,
  }
}

const clusterPoints = computed(() => {
  const clusters: Array<{ id: number; hint: Point; mode: Point; issue: Point; groupCenter: Point }> = []
  for (let i = 0; i < 5; i += 1) {
    const item = puzzleNodes.value[i]
    const vertex = pointOnRing(i, 32)
    const direction = { x: vertex.x - 50, y: vertex.y - 50 }
    const length = Math.hypot(direction.x, direction.y) || 1
    const unit = { x: direction.x / length, y: direction.y / length }
    const tangent = { x: unit.y, y: -unit.x }

    const hint = offset(vertex, unit, 4.6)
    const groupCenter = offset(hint, unit, 8.8)
    const mode = offset(groupCenter, tangent, -6.2)
    const issue = offset(groupCenter, tangent, 6.2)

    clusters.push({
      id: item?.id ?? i + 1,
      hint,
      mode,
      issue,
      groupCenter,
    })
  }
  return clusters
})

const renderedNodes = computed(() => {
  return clusterPoints.value.map((cluster, index) => {
    const source = puzzleNodes.value[index] || fallbackNodes[index]
    return {
      id: cluster.id,
      url: source?.url || '#',
      position: source?.position,
      hint: cluster.hint,
      mode: cluster.mode,
      issue: cluster.issue,
    }
  })
})

const arrowPaths = computed(() => {
  const paths: string[] = []
  const points = clusterPoints.value.map((c) => c.groupCenter)
  if (points.length < 5) return paths
  for (let i = 0; i < points.length; i += 1) {
    const from = points[i]
    const to = points[(i + 4) % points.length]
    if (!from || !to) continue
    const mid = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
    }
    const radial = { x: mid.x - 50, y: mid.y - 50 }
    const radialLength = Math.hypot(radial.x, radial.y) || 1
    const control = {
      x: mid.x + (radial.x / radialLength) * 7.2,
      y: mid.y + (radial.y / radialLength) * 7.2,
    }
    paths.push(`M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${control.x.toFixed(2)} ${control.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`)
  }
  return paths
})

onMounted(() => {
  loadPuzzleLinks()
})

const nodes = computed(() => renderedNodes.value)
</script>

<style scoped>
.pentagon-shell {
  position: relative;
  width: min(100%, 820px);
  margin: 20px auto 4px;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  border: 2px solid rgba(34, 211, 238, 0.45);
  background:
    radial-gradient(circle at 50% 50%, rgba(14, 116, 144, 0.24), rgba(8, 47, 73, 0.06) 55%, transparent 72%),
    radial-gradient(circle at 20% 16%, rgba(236, 72, 153, 0.2), transparent 35%),
    linear-gradient(140deg, rgba(15, 23, 42, 0.86), rgba(17, 24, 39, 0.92));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 20px rgba(34, 211, 238, 0.28),
    0 0 42px rgba(168, 85, 247, 0.2);
  overflow: visible;
}

.star-svg,
.arrow-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.star-layer {
  fill: transparent;
  stroke-linejoin: round;
  filter: url(#star-neon-glow);
}

.layer-1 {
  stroke: url(#star-neon-cyan);
  stroke-width: 1.5;
}

.layer-2 {
  stroke: url(#star-neon-pink);
  stroke-width: 1.22;
}

.layer-3 {
  stroke: url(#star-neon-gold);
  stroke-width: 1.04;
}

.flow-arrow-path {
  fill: none;
  stroke: rgba(103, 232, 249, 0.95);
  stroke-width: 1.65;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.55));
}

.info-circle {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(68px, 9.2vw, 88px);
  height: clamp(68px, 9.2vw, 88px);
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  font-size: clamp(11px, 1.35vw, 13px);
  line-height: 1.25;
  color: #e2e8f0;
  backdrop-filter: blur(6px);
}

.hint-circle {
  background: linear-gradient(135deg, rgba(22, 78, 99, 0.8), rgba(99, 102, 241, 0.72));
  border-color: rgba(103, 232, 249, 0.64);
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.3);
}

.mode-circle {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.55), rgba(16, 185, 129, 0.45));
}

.id-circle {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.56), rgba(236, 72, 153, 0.45));
}

.hint-link {
  color: #ecfeff;
  font-weight: 700;
  text-decoration: none;
}

.hint-link:hover {
  text-decoration: underline;
}

@media (max-width: 780px) {
  .info-circle {
    width: clamp(54px, 16.4vw, 74px);
    height: clamp(54px, 16.4vw, 74px);
    padding: 6px;
    font-size: clamp(10px, 2.8vw, 12px);
  }
}
</style>
