<template>
  <section class="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <div v-if="loading" class="hud-shell p-8 text-cyan-100/80">Bingo 题目加载中...</div>
    <div v-else-if="error" class="hud-shell p-8 text-rose-300">{{ error }}</div>

    <article v-else-if="course" class="hud-shell p-6 text-left md:p-8">
      <div class="top-wrap">
        <div class="top-main">
          <div class="mission-head">
            <p class="mission-label">bingo mission</p>
            <button type="button" class="neon-back neon-back-mini" @click="goBingo">返回 Bingo 面板</button>
          </div>
          <div class="title-row">
            <h1 class="text-2xl font-semibold text-cyan-100 md:text-3xl">{{ selectedItem.title }}</h1>
            <span v-if="selectedItem.songName" class="song-mark">{{ selectedItem.songName }}</span>
          </div>
          <p class="mt-2 text-sm text-cyan-100/75">所属课题：{{ course.title }}</p>
          <p class="mt-1 text-sm text-cyan-100/75">持续时间：{{ duration }}</p>
        </div>

        <div class="nav-card rounded-xl border border-cyan-300/25 bg-slate-900/45 p-3">
          <p class="mb-2 text-sm text-cyan-100/85">team: {{ teamSummary }}</p>
          <div class="issue-nav-grid">
            <button
              v-for="n in issueNavIds"
              :key="n"
              type="button"
              class="issue-nav-btn"
              :class="getNavCellClass(n)"
              @click="jumpTo(n)"
            >
              {{ getNavCellText(n) }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedItem.image" class="mt-5 bingo-image-wrap overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-900/45">
        <img :src="toUrl(selectedItem.image)" alt="bingo题目图片" class="bingo-image" />
      </div>

      <div class="mt-5 rounded-xl border border-cyan-300/25 bg-slate-900/45 p-4 text-cyan-50/85">
        <p class="bingo-desc">{{ selectedItem.description }}</p>
      </div>

      <div v-if="selectedItem.file" class="mt-5 rounded-xl border border-cyan-300/25 bg-slate-900/45 p-4 text-cyan-50/85">
        <audio v-if="isAudioFile(selectedItem.file)" :src="toUrl(selectedItem.file)" controls class="bingo-audio" preload="none" />
        <a v-else :href="toUrl(selectedItem.file)" target="_blank" class="bingo-file-link">查看附件文件</a>
      </div>

      <div class="mt-5">
        <TaskScoreAction :key="`${course.id}-${cellId}`" :course="course" :bingo-cell="cellId" />
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3">
        <button type="button" class="neon-op" :disabled="cellId <= 1" @click="jumpTo(cellId - 1)">
          上一题
        </button>
        <button type="button" class="neon-op" :disabled="cellId >= 25" @click="jumpTo(cellId + 1)">
          下一题
        </button>
      </div>
    </article>、

    <div class="mt-6 flex justify-end">
      <button type="button" class="neon-back" @click="goList">返回课题列表</button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Course } from '@/api/types'
import { loadCourseById } from './course-loader'
import { formatDuration, parseBingoItems, toImageUrl } from './task-utils'
import type { BingoTaskItem } from './task-utils'
import TaskScoreAction from '@/components/TaskScoreAction.vue'
import { fetchCourseIssues } from '@/api/issue'
import { fetchBingoBoardState, fetchMyTeamPanel, fetchMyTeamScore } from '@/api/team'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const course = ref<Course | null>(null)
const issueMap = ref<Map<number, { text?: string; image?: string; file?: string; songName?: string }>>(new Map())
const myTeamId = ref<number | null>(null)
const myTeamScore = ref(0)
const boardStateMap = ref<Map<number, { maxScore: 2 | 3 | 5; myCompleted: boolean; myScore: number }>>(new Map())

const courseId = computed(() => Number(route.params.id))
const cellId = computed(() => {
  const value = Number(route.params.cellId)
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(25, value))
})

const duration = computed(() => {
  if (!course.value) return ''
  return formatDuration(course.value.startTime, course.value.endTime)
})

const issueNavIds = computed(() => Array.from({ length: 25 }, (_, index) => index + 1))
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

const teamSummary = computed(() => {
  if (!myTeamId.value) return '- | 0.00'
  return `#${myTeamId.value} | ${Number(myTeamScore.value || 0).toFixed(2)}`
})

const selectedItem = computed<BingoTaskItem & { image?: string; file?: string; songName?: string }>(() => {
  if (!course.value) {
    return {
      id: cellId.value,
      title: '',
      description: '',
      image: '',
      file: '',
      songName: '',
    }
  }
  const items = parseBingoItems(course.value)
  const base =
    items[cellId.value - 1] ?? {
      id: cellId.value,
      title: `${course.value.title} Bingo ${cellId.value}`,
      description: '该 Bingo 题目暂未配置具体内容。',
    }
  const issue = issueMap.value.get(cellId.value)
  return (
    {
      ...base,
      description: issue?.text?.trim() ? String(issue.text) : base.description,
      image: issue?.image || '',
      file: issue?.file || '',
      songName: issue?.songName || '',
    }
  )
})

async function loadIssues() {
  try {
    if (!Number.isFinite(courseId.value) || courseId.value <= 0) {
      issueMap.value = new Map()
      return
    }
    const res = await fetchCourseIssues(courseId.value, 1, 25)
    const list = Array.isArray(res.data?.list) ? res.data.list : []
    const map = new Map<number, { text?: string; image?: string; file?: string; songName?: string }>()
    for (const item of list) {
      const issueId = Number(item?.issueId)
      if (Number.isFinite(issueId) && issueId > 0) {
        map.set(issueId, {
          text: item?.text || '',
          image: item?.image || '',
          file: item?.file || '',
          songName: item?.songName || '',
        })
      }
    }
    issueMap.value = map
  } catch {
    issueMap.value = new Map()
  }
}

function parseSessionValue(raw: string | null): any {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const currentUser = computed(() => parseSessionValue(sessionStorage.getItem('userInfo')))
const currentIdentityId = computed<number | null>(() => {
  const value = Number(currentUser.value?.id ?? currentUser.value?.identityId ?? currentUser.value?.userId)
  return Number.isFinite(value) && value > 0 ? value : null
})

function getCellState(cellId: number) {
  return boardStateMap.value.get(cellId) || { maxScore: 5 as 2 | 3 | 5, myCompleted: false, myScore: 0 }
}

function getCellColorLevel(cellId: number): 2 | 3 | 5 {
  const state = getCellState(cellId)
  const myScore = Number(state.myScore)
  if (state.myCompleted && (myScore === 2 || myScore === 3 || myScore === 5)) {
    return myScore as 2 | 3 | 5
  }
  return state.maxScore
}

function getNavCellClass(issueId: number) {
  const level = getCellColorLevel(issueId)
  return {
    active: issueId === cellId.value,
    'cell-score-2': level === 2,
    'cell-score-3': level === 3,
    'cell-score-5': level === 5,
    'cell-completed': getCellState(issueId).myCompleted,
    'cell-line-scored': lineScoredCells.value.has(issueId),
  }
}

function getNavCellText(cellId: number) {
  const state = getCellState(cellId)
  if (state.myCompleted) {
    const mark = String(issueMap.value.get(cellId)?.songName || '').trim()
    if (mark) return mark
  }
  return String(getCellColorLevel(cellId))
}

async function loadTeamAndBoard() {
  if (!currentIdentityId.value || !Number.isFinite(courseId.value) || courseId.value <= 0) {
    myTeamId.value = null
    myTeamScore.value = 0
    boardStateMap.value = new Map()
    return
  }

  try {
    const panel = await fetchMyTeamPanel(courseId.value, currentIdentityId.value)
    myTeamId.value = panel?.teamId || null
    myTeamScore.value = myTeamId.value ? await fetchMyTeamScore(courseId.value, currentIdentityId.value) : 0
  } catch {
    myTeamId.value = null
    myTeamScore.value = 0
  }

  try {
    const data = await fetchBingoBoardState(courseId.value, currentIdentityId.value)
    const list = Array.isArray(data?.cells) ? data.cells : []
    const map = new Map<number, { maxScore: 2 | 3 | 5; myCompleted: boolean; myScore: number }>()
    for (const item of list) {
      const issueId = Number(item?.issueId)
      const maxScore = Number(item?.maxScore)
      if (!Number.isFinite(issueId) || issueId < 1 || issueId > 25) continue
      if (maxScore !== 2 && maxScore !== 3 && maxScore !== 5) continue
      map.set(issueId, {
        maxScore: maxScore as 2 | 3 | 5,
        myCompleted: Boolean(item?.myCompleted),
        myScore: Number(item?.myScore || 0),
      })
    }
    boardStateMap.value = map
  } catch {
    boardStateMap.value = new Map()
  }
}

async function loadData() {
  loading.value = true
  error.value = null

  if (!Number.isFinite(courseId.value) || courseId.value <= 0) {
    error.value = '课题 id 无效'
    loading.value = false
    return
  }

  try {
    const data = await loadCourseById(courseId.value)
    course.value = data
    if (!data) {
      error.value = '未找到对应课题数据'
      issueMap.value = new Map()
      return
    }
    await loadIssues()
    await loadTeamAndBoard()
  } catch (err: any) {
    error.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
}

function toUrl(path?: string) {
  return toImageUrl(path)
}

function isAudioFile(path?: string) {
  const url = ((path || '').split('?')[0] || '').toLowerCase()
  return /\.(mp3|wav|ogg|m4a|flac|aac)$/.test(url)
}

function jumpTo(nextCell: number) {
  router.push(`/task/${courseId.value}/bingo/${nextCell}`)
}

function goBingo() {
  router.push(`/task/${courseId.value}`)
}

function goList() {
  router.push('/task')
}

watch(
  () => route.params.id,
  () => {
    loadData()
  },
  { immediate: true }
)
</script>

<style scoped>
.hud-shell {
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}

.neon-back,
.neon-op {
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-radius: 10px;
  padding: 8px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease;
}

.neon-back:hover,
.neon-op:hover {
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 18px rgba(217, 70, 239, 0.18);
}

.neon-op:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.mission-head {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-wrap {
  display: grid;
  gap: 12px;
}

.top-main {
  min-width: 0;
}

.nav-card {
  align-self: start;
}

.mission-label {
  margin: 0;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(34, 211, 238, 0.92);
}

.neon-back-mini {
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1.2;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-mark {
  display: inline-flex;
  min-width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(110, 231, 183, 0.6);
  background: rgba(6, 78, 59, 0.35);
  color: #d1fae5;
  font-size: 18px;
  font-weight: 700;
}

.issue-nav-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.issue-nav-btn {
  aspect-ratio: 1 / 1;
  border: 2px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 0;
  color: #d1fae5;
  background: rgba(8, 47, 73, 0.45);
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.issue-nav-btn.active {
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.24);
}

.issue-nav-btn.cell-score-2 {
  border-color: rgba(74, 222, 128, 0.9);
  color: #86efac;
}

.issue-nav-btn.cell-score-3 {
  border-color: rgba(244, 114, 182, 0.9);
  color: #f9a8d4;
}

.issue-nav-btn.cell-score-5 {
  border-color: rgba(251, 191, 36, 0.9);
  color: #fde68a;
}

.issue-nav-btn.cell-completed.cell-score-2 {
  background: linear-gradient(145deg, rgba(22, 101, 52, 0.78), rgba(21, 128, 61, 0.66));
}

.issue-nav-btn.cell-completed.cell-score-3 {
  background: linear-gradient(145deg, rgba(131, 24, 67, 0.8), rgba(157, 23, 77, 0.68));
}

.issue-nav-btn.cell-completed.cell-score-5 {
  background: linear-gradient(145deg, rgba(120, 53, 15, 0.8), rgba(146, 64, 14, 0.72));
}

.issue-nav-btn.cell-line-scored {
  border-width: 3px;
  background: linear-gradient(120deg, rgba(250, 255, 0, 0.8), rgba(125, 211, 252, 0.76), rgba(167, 139, 250, 0.74), rgba(255, 62, 191, 0.78));
}

@media (min-width: 1024px) {
  .top-wrap {
    grid-template-columns: minmax(0, 1fr) 290px;
    align-items: start;
  }
}

.bingo-desc {
  font-size: 18px;
  line-height: 1.9;
}

.bingo-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bingo-image-wrap {
  width: min(100%, 560px);
  aspect-ratio: 1 / 1;
}

.bingo-audio {
  width: 100%;
}

.bingo-file-link {
  color: #67e8f9;
  text-decoration: underline;
}
</style>
