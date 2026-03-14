<template>
  <section class="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="ACTIVITY">
        ACTIVITY
      </h1>
    </header>

    <div v-if="loading" class="hud-card p-8 text-cyan-100/80">活动数据加载中...</div>
    <div v-else-if="error" class="hud-card p-8 text-rose-300">{{ error }}</div>

    <template v-else-if="activityCourse">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button class="neon-button" @click="router.push('/activity')">返回活动列表</button>
        <div class="flex flex-wrap gap-2">
          <button class="neon-button" @click="scrollToAssocCourses">查看关联课题</button>
          <button v-if="currentActivity?.activityFile" class="neon-button" @click="downloadFile(currentActivity.activityFile)">
            下载活动文件
          </button>
        </div>
      </div>
      <TaskLegacyView :course="activityCourse" :show-score-action="false" category-label="activity" />

      <section id="assoc-courses" class="task-panel mt-5">
        <h3 class="section-title mb-3">关联课题</h3>
        <div v-if="assocLoading" class="text-cyan-100/75">关联课题加载中...</div>
        <div v-else-if="assocError" class="text-rose-300">{{ assocError }}</div>
        <template v-else>
          <NeonRankTable min-width-class="min-w-220" text-size-class="text-base">
            <template #head>
              <tr>
                <th class="px-4 py-3 text-center">课题名称</th>
                <th class="px-4 py-3 text-center">类别</th>
                <th class="px-4 py-3 text-center">开始时间</th>
                <th class="px-4 py-3 text-center">结束时间</th>
                <th class="px-4 py-3 text-center">计分规则</th>
                <th class="px-4 py-3 text-center">图片</th>
                <th class="px-4 py-3 text-center">操作</th>
              </tr>
            </template>
            <tr v-for="course in assocCourses" :key="course.id" class="border-t border-white/12">
              <td class="px-3 py-3">
                <button class="text-cyan-100 hover:text-cyan-200 hover:underline" @click="goTaskDetail(course.id)">
                  {{ course.title || '-' }}
                </button>
              </td>
              <td class="px-3 py-3 text-center">{{ course.category || '-' }}</td>
              <td class="px-3 py-3 text-center">{{ formatDateTime(course.startTime) }}</td>
              <td class="px-3 py-3 text-center">{{ formatDateTime(course.endTime) }}</td>
              <td class="px-3 py-3 text-center">{{ course.rule || '-' }}</td>
              <td class="px-3 py-3 text-center">
                <img v-if="course.image" :src="getImageUrl(course.image)" alt="课题图片" class="thumb mx-auto" />
                <span v-else>-</span>
              </td>
              <td class="px-3 py-3 text-center">
                <button class="neon-button text-xs" @click="goTaskDetail(course.id)">进入课题</button>
              </td>
            </tr>
          </NeonRankTable>
          <p v-if="!assocCourses.length" class="mt-3 text-center text-cyan-100/75">暂无关联课题</p>
        </template>
      </section>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import type { Course } from '@/api/types'
import TaskLegacyView from '@/views/task/TaskLegacyView.vue'
import NeonRankTable from '@/components/NeonRankTable.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const currentActivity = ref<any | null>(null)
const assocCourses = ref<any[]>([])
const assocLoading = ref(false)
const assocError = ref<string | null>(null)

const activityCourse = computed<Course | null>(() => {
  if (!currentActivity.value) return null
  return {
    id: Number(currentActivity.value.id),
    title: String(currentActivity.value.name || '未命名活动'),
    category: 'legacy',
    description: String(currentActivity.value.description || ''),
    startTime: currentActivity.value.startTime,
    endTime: currentActivity.value.endTime,
    image: currentActivity.value.activityBanner || '',
  } as Course
})

async function fetchActivityById() {
  const id = Number(route.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    error.value = '活动ID无效'
    loading.value = false
    return
  }

  try {
    const res = await axios.get(`/api/activity/${id}`)
    if (res.data?.data) {
      currentActivity.value = res.data.data
    } else if (res.data && !Array.isArray(res.data)) {
      currentActivity.value = res.data
    }

    if (!currentActivity.value) {
      const listRes = await axios.get('/api/activity/list')
      const list = listRes.data?.list || (Array.isArray(listRes.data) ? listRes.data : [])
      currentActivity.value = list.find((item: any) => Number(item.id) === id) || null
    }

    if (!currentActivity.value) {
      error.value = '未找到对应活动'
    } else {
      await fetchAssocCourses(id)
    }
  } catch (e: any) {
    error.value = e?.message || '活动加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchAssocCourses(activityId: number): Promise<void> {
  assocLoading.value = true
  assocError.value = null
  try {
    const response = await axios.get(`/api/activity/assoc-activity-courses/${activityId}`)
    if (response.data?.list) {
      assocCourses.value = response.data.list
    } else if (Array.isArray(response.data)) {
      assocCourses.value = response.data
    } else {
      assocCourses.value = []
    }
  } catch (e: any) {
    assocCourses.value = []
    assocError.value = e?.message || '关联课题加载失败'
  } finally {
    assocLoading.value = false
  }
}

function scrollToAssocCourses(): void {
  const section = document.getElementById('assoc-courses')
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function formatDateTime(date: any): string {
  if (!date) return '-'
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  return d.toLocaleString('zh-CN', options)
}

function goTaskDetail(courseId: string | number): void {
  const id = Number(courseId)
  if (!Number.isFinite(id) || id <= 0) return
  router.push(`/task/${id}`)
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function getFileName(filePath?: string): string {
  if (!filePath) return ''
  return filePath.split('/').pop() || ''
}

function downloadFile(filePath?: string): void {
  if (!filePath) return
  const url = getImageUrl(filePath)
  const a = document.createElement('a')
  a.href = url
  a.download = getFileName(filePath)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onMounted(fetchActivityById)
</script>

<style scoped>
.glitch-title {
  position: relative;
  display: inline-block;
  letter-spacing: 0.12em;
  line-height: 1;
  background-image: linear-gradient(135deg, #22d3ee 0%, #9333ea 40%, #c026d3 62%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 16px rgba(139, 92, 246, 0.38);
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glitch-title::before {
  color: rgba(34, 211, 238, 0.45);
  transform: translateX(1px);
  clip-path: polygon(0 4%, 100% 0, 100% 38%, 0 42%);
}

.glitch-title::after {
  color: rgba(192, 38, 211, 0.82);
  transform: translateX(-1px);
  clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 96%);
}

.hud-card {
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.5), rgba(76, 29, 149, 0.22));
}

.neon-button {
  border: 1px solid rgba(34, 211, 238, 0.7);
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 600;
  color: #cffafe;
  background: linear-gradient(90deg, rgba(8, 47, 73, 0.7), rgba(88, 28, 135, 0.62));
}

.task-panel {
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 16px;
  padding: 18px;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.5), rgba(76, 29, 149, 0.22));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 20px rgba(34, 211, 238, 0.12);
}

.section-title {
  color: rgba(224, 247, 255, 0.95);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
