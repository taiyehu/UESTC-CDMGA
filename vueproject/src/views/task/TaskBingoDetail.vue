<template>
  <section class="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <div class="mb-5 flex flex-wrap items-center gap-3">
      <button type="button" class="neon-back" @click="goBingo">返回 Bingo 面板</button>
      <button type="button" class="neon-back" @click="goList">返回课题列表</button>
    </div>

    <div v-if="loading" class="hud-shell p-8 text-cyan-100/80">Bingo 题目加载中...</div>
    <div v-else-if="error" class="hud-shell p-8 text-rose-300">{{ error }}</div>

    <article v-else-if="course" class="hud-shell p-6 text-left md:p-8">
      <p class="mb-2 text-xs uppercase tracking-widest text-cyan-300/90">bingo mission</p>
      <h1 class="text-2xl font-semibold text-cyan-100 md:text-3xl">{{ selectedItem.title }}</h1>
      <p class="mt-2 text-sm text-cyan-100/75">所属课题：{{ course.title }}</p>
      <p class="mt-1 text-sm text-cyan-100/75">持续时间：{{ duration }}</p>

      <div class="mt-5 rounded-xl border border-cyan-300/25 bg-slate-900/45 p-3">
        <p class="mb-2 text-sm text-cyan-100/80">题号导航（点击切换）</p>
        <div class="issue-nav-grid">
          <button
            v-for="n in issueNavIds"
            :key="n"
            type="button"
            class="issue-nav-btn"
            :class="{ active: n === cellId }"
            @click="jumpTo(n)"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <div v-if="selectedItem.image" class="mt-5 overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-900/45">
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
    </article>
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

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const course = ref<Course | null>(null)
const issueMap = ref<Map<number, { text?: string; image?: string; file?: string }>>(new Map())

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

const selectedItem = computed<BingoTaskItem & { image?: string; file?: string }>(() => {
  if (!course.value) {
    return {
      id: cellId.value,
      title: '',
      description: '',
      image: '',
      file: '',
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
    const map = new Map<number, { text?: string; image?: string; file?: string }>()
    for (const item of list) {
      const issueId = Number(item?.issueId)
      if (Number.isFinite(issueId) && issueId > 0) {
        map.set(issueId, {
          text: item?.text || '',
          image: item?.image || '',
          file: item?.file || '',
        })
      }
    }
    issueMap.value = map
  } catch {
    issueMap.value = new Map()
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

.issue-nav-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.issue-nav-btn {
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 6px 0;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.45);
  font-size: 13px;
}

.issue-nav-btn.active {
  border-color: rgba(110, 231, 183, 0.75);
  background: rgba(6, 78, 59, 0.5);
  color: #d1fae5;
  box-shadow: 0 0 10px rgba(110, 231, 183, 0.35);
}

.bingo-desc {
  font-size: 18px;
  line-height: 1.9;
}

.bingo-image {
  display: block;
  width: 100%;
  max-height: 340px;
  object-fit: cover;
}

.bingo-audio {
  width: 100%;
}

.bingo-file-link {
  color: #67e8f9;
  text-decoration: underline;
}
</style>
