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

      <div class="mt-5 rounded-xl border border-cyan-300/25 bg-slate-900/45 p-4 text-cyan-50/85">
        <p class="leading-7">{{ selectedItem.description }}</p>
      </div>

      <div class="mt-5">
        <TaskScoreAction :course="course" :bingo-cell="cellId" />
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <button type="button" class="neon-op" :disabled="cellId <= 1" @click="jumpTo(cellId - 1)">
          上一题
        </button>
        <button type="button" class="neon-op" :disabled="cellId >= 25" @click="jumpTo(cellId + 1)">
          下一题
        </button>
        <button type="button" class="neon-op" @click="jumpToRandom">随机题目</button>
        <button type="button" class="neon-op" @click="goBingo">回到 5x5</button>
      </div>
    </article>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Course } from '@/api/types'
import { loadCourseById } from './course-loader'
import { formatDuration, parseBingoItems } from './task-utils'
import type { BingoTaskItem } from './task-utils'
import TaskScoreAction from '@/components/TaskScoreAction.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const course = ref<Course | null>(null)

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

const selectedItem = computed<BingoTaskItem>(() => {
  if (!course.value) {
    return {
      id: cellId.value,
      title: '',
      description: '',
    }
  }
  const items = parseBingoItems(course.value)
  return (
    items[cellId.value - 1] ?? {
      id: cellId.value,
      title: `${course.value.title} Bingo ${cellId.value}`,
      description: '该 Bingo 题目暂未配置具体内容。',
    }
  )
})

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
    }
  } catch (err: any) {
    error.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
}

function jumpTo(nextCell: number) {
  router.push(`/task/${courseId.value}/bingo/${nextCell}`)
}

function jumpToRandom() {
  const randomCell = Math.floor(Math.random() * 25) + 1
  jumpTo(randomCell)
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
</style>
