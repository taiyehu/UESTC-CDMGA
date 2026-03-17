<template>
  <section class="pentagon-shell" aria-label="Pentagon Puzzle">
    <svg class="star-svg" viewBox="0 0 100 100" role="img" aria-label="三层边框五角星">
      <polygon class="star-layer layer-1" :points="starPointsOuter" />
      <polygon class="star-layer layer-2" :points="starPointsMid" />
      <polygon class="star-layer layer-3" :points="starPointsInner" />
    </svg>

    <svg class="arrow-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <marker id="pentagon-arrow-head" markerWidth="6" markerHeight="6" refX="4.6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="rgba(148, 163, 184, 0.9)" />
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

const starPointsOuter = computed(() => starPolygon(50, 50, 29, 12.4))
const starPointsMid = computed(() => starPolygon(50, 50, 24.6, 10.4))
const starPointsInner = computed(() => starPolygon(50, 50, 20.2, 8.4))

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
  const clusters: Array<{ id: number; hint: Point; mode: Point; issue: Point }> = []
  for (let i = 0; i < 5; i += 1) {
    const item = puzzleNodes.value[i]
    const vertex = pointOnRing(i, 35)
    const direction = { x: vertex.x - 50, y: vertex.y - 50 }
    const length = Math.hypot(direction.x, direction.y) || 1
    const unit = { x: direction.x / length, y: direction.y / length }
    const tangent = { x: unit.y, y: -unit.x }

    const hint = offset(vertex, unit, 6.4)
    const baseCenter = offset(hint, unit, 11.6)
    const mode = offset(baseCenter, tangent, -7.6)
    const issue = offset(baseCenter, tangent, 7.6)

    clusters.push({
      id: item?.id ?? i + 1,
      hint,
      mode,
      issue,
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
  const points = clusterPoints.value.map((c) => c.hint)
  if (points.length < 5) return paths
  for (let i = 0; i < points.length; i += 1) {
    const from = points[i]
    const to = points[(i + 4) % points.length]
    if (!from || !to) continue
    const control = {
      x: (from.x + to.x) / 2 + (50 - (from.x + to.x) / 2) * 0.1,
      y: (from.y + to.y) / 2 + (50 - (from.y + to.y) / 2) * 0.1,
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
  width: min(100%, 760px);
  margin: 14px auto 0;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  border: 1px solid rgba(34, 211, 238, 0.25);
  background:
    radial-gradient(circle at 50% 42%, rgba(14, 116, 144, 0.24), transparent 40%),
    radial-gradient(circle at 15% 10%, rgba(236, 72, 153, 0.2), transparent 35%),
    linear-gradient(140deg, rgba(15, 23, 42, 0.86), rgba(17, 24, 39, 0.92));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 18px 40px rgba(2, 6, 23, 0.5);
  overflow: hidden;
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
}

.layer-1 {
  stroke: rgba(56, 189, 248, 0.82);
  stroke-width: 1.25;
}

.layer-2 {
  stroke: rgba(236, 72, 153, 0.72);
  stroke-width: 1;
}

.layer-3 {
  stroke: rgba(250, 204, 21, 0.76);
  stroke-width: 0.92;
}

.flow-arrow-path {
  fill: none;
  stroke: rgba(148, 163, 184, 0.72);
  stroke-width: 0.55;
  stroke-linecap: round;
  stroke-dasharray: 1.2 1.2;
}

.info-circle {
  position: absolute;
  transform: translate(-50%, -50%);
  width: clamp(72px, 10vw, 96px);
  height: clamp(72px, 10vw, 96px);
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
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
    width: clamp(58px, 18vw, 78px);
    height: clamp(58px, 18vw, 78px);
    padding: 6px;
    font-size: clamp(10px, 2.8vw, 12px);
  }
}
</style>
