<template>
  <div class="issue-grid" :class="{ compact: compact }">
    <button
      v-for="cellId in cells"
      :key="cellId"
      type="button"
      class="issue-cell"
      :class="getCellClass(cellId)"
      :disabled="!clickable"
      @click="onSelect(cellId)"
    >
      <span class="cell-score">{{ getCellScoreText(cellId) }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { fetchCourseIssues } from '@/api/issue'
import { fetchBingoBoardState } from '@/api/team'

const props = withDefaults(
  defineProps<{
    courseId: number | string
    identityId?: number | null
    activeCellId?: number | null
    compact?: boolean
    clickable?: boolean
    refreshToken?: number | string
  }>(),
  {
    identityId: null,
    activeCellId: null,
    compact: false,
    clickable: true,
    refreshToken: 0,
  }
)

const emit = defineEmits<{
  (event: 'select', issueId: number): void
}>()

const cells = Array.from({ length: 25 }, (_, index) => index + 1)
const issueMarks = ref<Map<number, string>>(new Map())
const boardStateMap = ref<Map<number, { maxScore: 2 | 3 | 5 | 10 | 15; myCompleted: boolean; myScore: number }>>(new Map())

const lineScoredCells = computed(() => {
  const result = new Set<number>()
  const lines: number[][] = []

  for (let i = 0; i < 5; i += 1) {
    const start = 5 * i + 1
    lines.push([start, start + 1, start + 2, start + 3, start + 4])
  }
  for (let i = 1; i <= 5; i += 1) {
    lines.push([i, i + 5, i + 10, i + 15, i + 20])
  }
  lines.push([1, 7, 13, 19, 25])
  lines.push([5, 9, 13, 17, 21])

  for (const line of lines) {
    const completed = line.every((id) => getCellState(id).myCompleted)
    if (completed) {
      for (const id of line) result.add(id)
    }
  }

  return result
})

function onSelect(issueId: number) {
  if (!props.clickable) return
  emit('select', issueId)
}

function getCellState(cellId: number) {
  return boardStateMap.value.get(cellId) || { maxScore: 5 as 2 | 3 | 5 | 10 | 15, myCompleted: false, myScore: 0 }
}

function getCellColorLevel(cellId: number): 2 | 3 | 5 | 10 | 15 {
  const state = getCellState(cellId)
  const myScore = Number(state.myScore)
  if (state.myCompleted && (myScore === 2 || myScore === 3 || myScore === 5 || myScore === 10 || myScore === 15)) {
    return myScore as 2 | 3 | 5 | 10 | 15
  }
  return state.maxScore
}

function getCellClass(cellId: number) {
  const level = getCellColorLevel(cellId)
  return {
    active: props.activeCellId === cellId,
    'cell-score-2': level === 2,
    'cell-score-3': level === 3,
    'cell-score-5': level === 5,
    'cell-score-10': level === 10,
    'cell-score-15': level === 15,
    'cell-completed': getCellState(cellId).myCompleted,
    'cell-line-scored': lineScoredCells.value.has(cellId),
  }
}

function getCellScoreText(cellId: number) {
  const state = getCellState(cellId)
  if (state.myCompleted) {
    const mark = String(issueMarks.value.get(cellId) || '').trim()
    if (mark) return mark
  }
  return String(getCellColorLevel(cellId))
}

async function loadIssueMarks() {
  if (!Number.isFinite(Number(props.courseId)) || Number(props.courseId) <= 0) {
    issueMarks.value = new Map()
    return
  }
  try {
    const res = await fetchCourseIssues(props.courseId, 1, 25)
    const list = Array.isArray(res.data?.list) ? res.data.list : []
    const map = new Map<number, string>()
    for (const item of list) {
      const issueId = Number(item?.issueId)
      const mark = String(item?.songName || '').trim()
      if (Number.isFinite(issueId) && issueId > 0 && mark) {
        map.set(issueId, mark)
      }
    }
    issueMarks.value = map
  } catch {
    issueMarks.value = new Map()
  }
}

async function loadBoardState() {
  if (!props.identityId || !Number.isFinite(Number(props.courseId)) || Number(props.courseId) <= 0) {
    boardStateMap.value = new Map()
    return
  }
  try {
    const data = await fetchBingoBoardState(props.courseId, props.identityId)
    const list = Array.isArray(data?.cells) ? data.cells : []
    const map = new Map<number, { maxScore: 2 | 3 | 5 | 10 | 15; myCompleted: boolean; myScore: number }>()
    for (const item of list) {
      const issueId = Number(item?.issueId)
      const maxScore = Number(item?.maxScore)
      if (!Number.isFinite(issueId) || issueId < 1 || issueId > 25) continue
      if (maxScore !== 2 && maxScore !== 3 && maxScore !== 5 && maxScore !== 10 && maxScore !== 15) continue
      map.set(issueId, {
        maxScore: maxScore as 2 | 3 | 5 | 10 | 15,
        myCompleted: Boolean(item?.myCompleted),
        myScore: Number(item?.myScore || 0),
      })
    }
    boardStateMap.value = map
  } catch {
    boardStateMap.value = new Map()
  }
}

watch(
  () => [props.courseId, props.identityId, props.refreshToken],
  () => {
    loadIssueMarks()
    loadBoardState()
  },
  { immediate: true }
)
</script>

<style scoped>
.issue-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  width: min(100%, min(68vh, 520px));
  margin: 0 auto;
}

.issue-grid.compact {
  width: min(100%, 300px);
  gap: 7px;
}

.issue-cell {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  min-height: 0;
  border-radius: 10px;
  border: 2px solid rgba(34, 211, 238, 0.55);
  background: linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55));
  color: #cffafe;
  font-weight: 700;
  letter-spacing: 0.06em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.issue-cell:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 16px rgba(34, 211, 238, 0.45),
    0 0 22px rgba(217, 70, 239, 0.22);
}

.issue-cell:disabled {
  cursor: default;
}

.cell-score {
  position: relative;
  z-index: 1;
  font-size: clamp(22px, 6.4vw, 42px);
  font-weight: 800;
  line-height: 0.95;
}

.compact .cell-score {
  font-size: clamp(16px, 3.4vw, 24px);
}

.issue-cell.cell-score-2 {
  border-color: rgba(74, 222, 128, 0.9);
}

.issue-cell.cell-score-3 {
  border-color: rgba(244, 114, 182, 0.9);
}

.issue-cell.cell-score-5 {
  border-color: rgba(251, 191, 36, 0.9);
}

.issue-cell.cell-score-2 .cell-score {
  color: #86efac;
}

.issue-cell.cell-score-3 .cell-score {
  color: #f9a8d4;
}

.issue-cell.cell-score-5 .cell-score {
  color: #fde68a;
}

.issue-cell.cell-score-10 {
  border-color: transparent;
  background:
    linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55)) padding-box,
    linear-gradient(120deg, rgba(34, 211, 238, 0.87), rgb(136, 11, 238), rgb(247, 7, 155)) border-box;
}

.issue-cell.cell-score-10 .cell-score {
  color: #e5e7eb;
}

.issue-cell.cell-score-15 {
  border-color: transparent;
  background:
    linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55)) padding-box,
    linear-gradient(120deg, rgba(59, 246, 221, 0.9), rgba(34, 211, 238, 0.86), rgba(251, 191, 36, 0.9)) border-box;
}

.issue-cell.cell-score-15 .cell-score {
  color: #fbbf24;
}

.issue-cell.cell-completed.cell-score-2 {
  background: linear-gradient(145deg, rgba(22, 101, 52, 0.78), rgba(21, 128, 61, 0.66));
}

.issue-cell.cell-completed.cell-score-3 {
  background: linear-gradient(145deg, rgba(131, 24, 67, 0.8), rgba(157, 23, 77, 0.68));
}

.issue-cell.cell-completed.cell-score-5 {
  background: linear-gradient(145deg, rgba(245, 193, 49, 0.74), rgba(213, 154, 18, 0.62));
}

.issue-cell.cell-completed.cell-score-10::after,
.issue-cell.cell-completed.cell-score-15::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 7px;
  z-index: 0;
  pointer-events: none;
}

.issue-cell.cell-completed.cell-score-10::after {
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.64), rgba(147, 51, 234, 0.58), rgba(244, 114, 182, 0.64));
}

.issue-cell.cell-completed.cell-score-15::after {
  background: linear-gradient(120deg, rgba(59, 130, 246, 0.9), rgba(34, 211, 238, 0.86), rgba(251, 191, 36, 0.9));
}

.issue-cell.cell-line-scored {
  border-width: 3px;
  background: linear-gradient(120deg, rgba(250, 255, 0, 0.8), rgba(125, 211, 252, 0.76), rgba(255, 62, 191, 0.78));
  box-shadow:
    0 0 16px rgba(34, 211, 238, 0.24),
    0 0 24px rgba(255, 225, 80, 0.24);
}

.issue-cell.cell-line-scored::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -45%;
  width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
  transform: skewX(-18deg);
  animation: line-sheen 2.6s ease-in-out infinite;
  pointer-events: none;
}

.issue-cell.cell-line-scored.cell-completed {
  background: linear-gradient(120deg, rgba(250, 255, 0, 0.8), rgba(125, 211, 252, 0.76), rgba(255, 62, 191, 0.78));
  box-shadow:
    0 0 16px rgba(34, 211, 238, 0.24),
    0 0 24px rgba(255, 225, 80, 0.24);
}

.issue-cell.cell-line-scored:not(.cell-score-10):not(.cell-score-15)::after {
  display: none;
}

.issue-cell.cell-line-scored.cell-score-10 {
  border-color: transparent;
  background:
    linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55)) padding-box,
    linear-gradient(120deg, rgba(34, 211, 238, 0.87), rgb(136, 11, 238), rgb(247, 7, 155)) border-box;
}

.issue-cell.cell-line-scored.cell-score-15 {
  border-color: transparent;
  background:
    linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55)) padding-box,
    linear-gradient(120deg, rgba(59, 246, 221, 0.9), rgba(34, 211, 238, 0.86), rgba(251, 191, 36, 0.9)) border-box;
}

.issue-cell.cell-line-scored.cell-score-10::after,
.issue-cell.cell-line-scored.cell-score-15::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 7px;
  z-index: 0;
  pointer-events: none;
  display: block;
  background: linear-gradient(120deg, rgba(250, 255, 0, 0.8), rgba(125, 211, 252, 0.76), rgba(255, 62, 191, 0.78));
}

.issue-cell.cell-line-scored.cell-score-10::before,
.issue-cell.cell-line-scored.cell-score-15::before {
  display: block;
}

.issue-cell.active {
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.24);
}

@keyframes line-sheen {
  0% {
    left: -45%;
    opacity: 0;
  }
  14% {
    opacity: 0.8;
  }
  48% {
    left: 112%;
    opacity: 0;
  }
  100% {
    left: 112%;
    opacity: 0;
  }
}
</style>
