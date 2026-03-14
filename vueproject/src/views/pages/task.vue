<template>
  <section class="relative mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <header class="mb-8 text-left">
      <h1 class="glitch-title text-3xl font-semibold text-cyan-100 md:text-4xl" data-text="TASK MATRIX">
        TASK MATRIX
      </h1>
    </header>

    <div v-if="loading" class="hud-card p-8 text-cyan-100/80">载入课题数据中...</div>
    <div v-else-if="error" class="hud-card p-8 text-rose-300">{{ error }}</div>

    <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <Motion
        v-for="(course, index) in courses"
        :key="course.id"
        :initial="{ opacity: 0, y: 18 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.35, delay: index * 0.06 }"
        class="hud-card group overflow-hidden"
      >
        <div
          class="holo-image"
          :style="{ backgroundImage: getImageBackground(course.image) }"
          role="img"
          :aria-label="`${course.title} 配图`"
        />

        <div class="p-4 text-left">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="line-clamp-1 text-lg font-semibold text-cyan-100">{{ course.title }}</h2>
            <span class="neon-chip">{{ normalizeCategory(course.category) }}</span>
          </div>

          <p class="mb-2 text-xs text-cyan-100/70">
            {{ formatDate(course.startTime) }} - {{ formatDate(course.endTime) }}
          </p>

          <p class="line-clamp-3 min-h-16 text-sm text-cyan-50/80">
            {{ course.description || '暂无课题描述' }}
          </p>

          <button class="neon-button mt-4 w-full" @click="goTaskDetail(course.id)">
            进入课题
          </button>
        </div>
      </Motion>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Motion } from 'motion-v'
import { fetchCourseData } from '@/api/course'
import type { Course } from '@/api/types'

const router = useRouter()

const courses = ref<Course[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchCourses() {
  try {
    const response = await fetchCourseData()
    const data = (response?.data || []) as Course[]
    courses.value = [...data].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  } catch (err: any) {
    error.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
}

function goTaskDetail(id: number) {
  router.push(`/task/${id}`)
}

function formatDate(date: string | number | Date) {
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

function normalizeCategory(category?: string) {
  const value = (category || '').toLowerCase()
  if (value === 'typical') return 'typical'
  if (value === 'bingo') return 'bingo'
  return 'legacy'
}

function getImageBackground(imagePath?: string) {
  if (!imagePath) {
    return 'linear-gradient(135deg, rgba(34,211,238,0.20), rgba(217,70,239,0.18))'
  }
  if (/^https?:\/\//.test(imagePath)) return `url(${imagePath})`
  const path = imagePath.startsWith('/') ? imagePath : '/' + imagePath
  return `url(${path})`
}

onMounted(fetchCourses)
</script>

<style scoped>
.glitch-title {
  position: relative;
  letter-spacing: 0.08em;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.5);
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glitch-title::before {
  color: rgba(34, 211, 238, 0.8);
  transform: translateX(1px);
  clip-path: polygon(0 4%, 100% 0, 100% 38%, 0 42%);
}

.glitch-title::after {
  color: rgba(217, 70, 239, 0.8);
  transform: translateX(-1px);
  clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 96%);
}

.hud-card {
  border: 1px solid rgba(103, 232, 249, 0.25);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}

.holo-image {
  height: 180px;
  background-size: cover;
  background-position: center;
  filter: saturate(1.1) contrast(1.06);
  position: relative;
}

.holo-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(34, 211, 238, 0.06), rgba(217, 70, 239, 0.13)),
    repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.04) 1px,
      transparent 2px,
      transparent 4px
    );
}

.neon-chip {
  border-radius: 999px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  padding: 2px 9px;
  font-size: 11px;
  text-transform: uppercase;
  color: rgb(165, 243, 252);
  background: rgba(8, 27, 40, 0.55);
}

.neon-button {
  border: 1px solid rgba(34, 211, 238, 0.7);
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  color: #cffafe;
  background: linear-gradient(90deg, rgba(8, 47, 73, 0.7), rgba(88, 28, 135, 0.62));
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.neon-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.4),
    0 0 24px rgba(217, 70, 239, 0.2);
}
</style>
