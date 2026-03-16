<template>
  <section class="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <div v-if="loading" class="hud-shell p-8 text-cyan-100/80">课题加载中...</div>
    <div v-else-if="error" class="hud-shell p-8 text-rose-300">{{ error }}</div>

    <component v-else-if="course" :is="renderComponent" :course="course" />

    <article v-else class="hud-shell p-8 text-left text-cyan-100/75">
      课题不存在或已被删除。
    </article>

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
import { normalizeCategory } from './task-utils'
import TaskLegacyView from './TaskLegacyView.vue'
import TaskTypicalView from './TaskTypicalView.vue'
import TaskBingoView from './TaskBingoView.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const course = ref<Course | null>(null)

const renderComponent = computed(() => {
  if (!course.value) return TaskLegacyView
  const category = normalizeCategory(course.value.category)
  if (category === 'typical') return TaskTypicalView
  if (category === 'bingo') return TaskBingoView
  return TaskLegacyView
})

async function loadData() {
  loading.value = true
  error.value = null

  const id = Number(route.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    error.value = '课题 id 无效'
    loading.value = false
    return
  }

  try {
    const data = await loadCourseById(id)
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

.neon-back {
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-radius: 10px;
  padding: 8px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease;
}

.neon-back:hover {
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 18px rgba(217, 70, 239, 0.18);
}
</style>
