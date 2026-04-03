<template>
  <section class="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="RANK-NEW">
        RANK-NEW
      </h1>
    </header>

    <div class="hud-card p-4 md:p-6">
      <h2 class="mb-5 text-center text-xl font-semibold text-cyan-100 md:text-2xl">一⭐起⭐打⭐榜</h2>

      <div class="mb-6 rounded-xl border border-cyan-300/30 bg-slate-900/35 p-4">
        <div class="mb-3 flex flex-wrap gap-2">
          <NeonActionButton :class="mode === 'active' ? 'is-active' : ''" @click="switchMode('active')">进行中</NeonActionButton>
          <NeonActionButton :class="mode === 'history' ? 'is-active' : ''" @click="switchMode('history')">历史</NeonActionButton>
        </div>

        <div class="mb-3 flex flex-wrap gap-2">
          <NeonActionButton :class="category === 'ranking' ? 'is-active' : ''" @click="switchCategory('ranking')">打榜排行</NeonActionButton>
          <NeonActionButton :class="category === 'contest' ? 'is-active' : ''" @click="switchCategory('contest')">比赛成绩记录</NeonActionButton>
        </div>

        <div v-if="mode === 'history'" class="flex flex-wrap items-center gap-2">
          <label class="text-sm text-cyan-50/90">历史课题：</label>
          <select v-model.number="selectedCourseId" class="select-input" @change="fetchRankData">
            <option :value="0">全部课题</option>
            <option v-for="course in historyCourses" :key="course.id" :value="course.id">
              {{ course.title }}（{{ formatTime(course.startTime) }} - {{ formatTime(course.endTime) }}）
            </option>
          </select>
        </div>

        <p class="mt-3 text-sm text-cyan-50/85">
          {{ mode === 'active' ? '当前排行榜仅统计在进行中的的课题成绩。' : '历史模式可查看该类别全部课题，并支持按课题筛选。' }}
        </p>
      </div>

      <div v-if="showActiveRankingCourses" class="mb-6 rounded-xl border border-cyan-300/30 bg-slate-900/35 p-4">
        <h3 class="mb-3 text-lg font-semibold text-cyan-100">进行中的 ranking 课题</h3>
        <div v-if="activeRankingCourses.length" class="active-course-wrap">
          <article
            v-for="course in activeRankingCourses"
            :key="course.id"
            class="course-card"
          >
            <img
              v-if="course.image"
              :src="getImageUrl(course.image)"
              :alt="course.title"
              class="course-image"
            />
            <div class="course-body">
              <h4 class="course-title">{{ course.title }}</h4>
              <p class="course-desc">{{ course.description || '暂无描述' }}</p>
            </div>
          </article>
        </div>
        <p v-else class="text-sm text-cyan-50/85">当前没有进行中的 ranking 课题。</p>
      </div>

      <NeonRankTable min-width-class="min-w-180" text-size-class="text-lg">
        <template #head>
          <tr>
            <th class="w-20 px-4 py-3 text-center">展开</th>
            <th class="px-4 py-3 text-center">排名</th>
            <th class="px-4 py-3 text-center">头像</th>
            <th class="px-4 py-3 text-center">用户名</th>
            <th class="px-4 py-3 text-center">总分</th>
          </tr>
        </template>
        <template v-for="row in pagedRankData" :key="row.identityId">
          <tr class="border-t border-white/12 transition hover:bg-cyan-300/8">
            <td class="px-4 py-3 text-center">
              <NeonActionButton size="sm" @click="toggleExpanded(row.identityId)">
                {{ isExpanded(row.identityId) ? '收起' : '展开' }}
              </NeonActionButton>
            </td>
            <td class="px-4 py-3 text-center font-semibold text-fuchsia-100">
              {{ getDisplayRank(row) }}
            </td>
            <td class="px-4 py-3">
              <button type="button" class="mx-auto block" @click="goToProfile(row.identityId)">
                <img
                  :src="getImageUrl(row.avatar)"
                  alt="头像"
                  class="h-10 w-10 rounded-full border border-cyan-300/45 object-cover"
                />
              </button>
            </td>
            <td class="px-4 py-3 text-center">{{ row.account }}</td>
            <td class="px-4 py-3 text-center font-semibold text-cyan-100">{{ row.totalScoreText || row.totalScore }}</td>
          </tr>

          <tr v-if="isExpanded(row.identityId)" class="border-t border-white/12 bg-slate-900/35">
            <td colspan="5" class="px-4 py-4">
              <div v-if="row.submissions && row.submissions.length" class="flex flex-wrap justify-center gap-5">
                <div
                  v-for="(submission, idx) in row.submissions"
                  :key="submission.scoreId || idx"
                  class="score-chip rounded-xl bg-slate-900/45 px-4 py-3 text-center backdrop-blur-lg"
                >
                  <p class="text-xs font-semibold tracking-wide text-cyan-50">{{ submission.courseTitle || '课题' }}</p>
                  <p class="my-2 text-sm font-semibold text-fuchsia-100">{{ submission.displayScoreText || submission.displayScore }}</p>
                  <img
                    :src="getImageUrl(submission.image)"
                    alt="课题图片"
                    class="h-15 w-15 cursor-pointer rounded-md border border-white/50 object-cover transition hover:scale-105"
                    @click="handleImageClick(getImageUrl(submission.image))"
                  />
                </div>
              </div>
              <p v-else class="text-center text-cyan-50/90">无课题成绩</p>
            </td>
          </tr>
        </template>
      </NeonRankTable>

      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        <NeonActionButton :disabled="rankCurrentPage <= 1" @click="goPage(rankCurrentPage - 1)">上一页</NeonActionButton>
        <NeonActionButton
          v-for="page in visiblePages"
          :key="page"
          variant="neon"
          :class="page === rankCurrentPage ? 'is-active' : ''"
          @click="goPage(page)"
        >
          {{ page }}
        </NeonActionButton>
        <NeonActionButton :disabled="rankCurrentPage >= totalPages" @click="goPage(rankCurrentPage + 1)">下一页</NeonActionButton>
      </div>
    </div>

    <div class="fixed bottom-5 right-5 flex flex-col gap-2">
      <NeonActionButton @click="router.push('/ranking')">回到常规课题排行榜</NeonActionButton>
      <NeonActionButton @click="router.push('/contest-ranking')">查看旧版比赛榜</NeonActionButton>
    </div>

    <div
      v-if="previewVisible"
      class="fixed inset-0 z-120 flex items-center justify-center bg-black/70 px-4"
      @click="previewVisible = false"
    >
      <NeonActionButton
        type="button"
        variant="gray"
        size="sm"
        class="absolute right-4 top-4"
        @click.stop="previewVisible = false"
      >
        关闭
      </NeonActionButton>
      <img
        :src="previewImage"
        alt="预览图片"
        class="max-h-[80vh] max-w-[90vw] rounded-xl border border-white/30 object-contain"
        @click.stop
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

interface CourseOption {
  id: number
  title: string
  category: string
  startTime?: string
  endTime?: string
  description?: string
  image?: string
}

const rankAllData = ref<any[]>([])
const rankSortedData = ref<any[]>([])
const rankPageSize = ref<number>(10)
const rankCurrentPage = ref<number>(1)
const previewVisible = ref<boolean>(false)
const previewImage = ref<string>('')
const expandedKeys = ref<string[]>([])
const mode = ref<'active' | 'history'>('active')
const category = ref<'ranking' | 'contest'>('ranking')
const historyCourses = ref<CourseOption[]>([])
const activeRankingCourses = ref<CourseOption[]>([])
const selectedCourseId = ref<number>(0)

const showActiveRankingCourses = computed(() => {
  return mode.value === 'active' && category.value === 'ranking'
})

const totalPages = computed<number>(() => Math.max(1, Math.ceil(rankSortedData.value.length / rankPageSize.value)))

const visiblePages = computed<number[]>(() => {
  const total = totalPages.value
  const current = rankCurrentPage.value
  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + windowSize - 1)

  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const pagedRankData = computed<any[]>(() => {
  const start = (rankCurrentPage.value - 1) * rankPageSize.value
  return rankSortedData.value.slice(start, start + rankPageSize.value)
})

const rankByIdentityId = computed<Record<string, number>>(() => {
  const rankMap: Record<string, number> = {}
  let lastScore: number | null = null
  let currentRank = 0

  rankSortedData.value.forEach((row: any, index: number) => {
    const score = Number(row?.totalScore ?? 0)
    if (lastScore === null || Math.abs(score - lastScore) > 1e-9) {
      currentRank = index + 1
      lastScore = score
    }
    rankMap[String(row?.identityId)] = currentRank
  })

  return rankMap
})

const router = useRouter()

function goToProfile(id: string | number): void {
  router.push(`/profile/${id}`)
}

async function fetchHistoryCourses(): Promise<void> {
  if (mode.value !== 'history') {
    historyCourses.value = []
    selectedCourseId.value = 0
    return
  }

  try {
    const res = await axios.get('/api/rank/courses', {
      params: { category: category.value },
    })
    historyCourses.value = res.data.data || []
  } catch (e) {
    ElMessage({ message: '获取历史课题失败', type: 'error' })
  }
}

async function fetchRankData(): Promise<void> {
  try {
    const params: Record<string, any> = {
      category: category.value,
      mode: mode.value,
    }
    if (mode.value === 'history' && selectedCourseId.value > 0) {
      params.courseId = selectedCourseId.value
    }

    const res = await axios.get('/api/rank/board', { params })
    const data = res.data.data || []
    data.sort((a: any, b: any) => b.totalScore - a.totalScore)
    rankAllData.value = data
    rankSortedData.value = data
    rankCurrentPage.value = 1
    expandedKeys.value = []
  } catch (e) {
    ElMessage({ message: '获取排行榜失败', type: 'error' })
  }
}

async function fetchActiveRankingCourses(): Promise<void> {
  if (!showActiveRankingCourses.value) {
    activeRankingCourses.value = []
    return
  }

  try {
    const res = await axios.get('/api/course/availablecourse-containing', {
      params: {
        excludePrefix: 'ranking',
        page: 0,
        size: 100,
      },
    })
    activeRankingCourses.value = res.data?.list || []
  } catch (e) {
    ElMessage({ message: '获取进行中 ranking 课题失败', type: 'error' })
  }
}

async function switchMode(nextMode: 'active' | 'history'): Promise<void> {
  mode.value = nextMode
  await fetchHistoryCourses()
  await fetchActiveRankingCourses()
  await fetchRankData()
}

async function switchCategory(nextCategory: 'ranking' | 'contest'): Promise<void> {
  category.value = nextCategory
  selectedCourseId.value = 0
  await fetchHistoryCourses()
  await fetchActiveRankingCourses()
  await fetchRankData()
}

function goPage(page: number): void {
  rankCurrentPage.value = Math.min(totalPages.value, Math.max(1, page))
}

function keyOf(identityId: string | number): string {
  return String(identityId)
}

function isExpanded(identityId: string | number): boolean {
  return expandedKeys.value.includes(keyOf(identityId))
}

function toggleExpanded(identityId: string | number): void {
  const key = keyOf(identityId)
  if (expandedKeys.value.includes(key)) {
    expandedKeys.value = expandedKeys.value.filter((k) => k !== key)
  } else {
    expandedKeys.value = [...expandedKeys.value, key]
  }
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function handleImageClick(imgUrl: string): void {
  previewImage.value = imgUrl
  previewVisible.value = true
}

function formatTime(time?: string): string {
  if (!time) return '-'
  return dayjs(time).format('MM-DD HH:mm')
}

function getDisplayRank(row: any): number {
  return rankByIdentityId.value[String(row?.identityId)] || 0
}

onMounted(async () => {
  await fetchHistoryCourses()
  await fetchActiveRankingCourses()
  await fetchRankData()
})
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
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}

.hud-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.9), rgba(168, 85, 247, 0.86), rgba(244, 114, 182, 0.9));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.score-chip {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.score-chip::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.66), rgba(168, 85, 247, 0.62), rgba(244, 114, 182, 0.66));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.course-card {
  width: min(760px, 100%);
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
}

.active-course-wrap {
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.course-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.course-body {
  padding: 12px;
  text-align: center;
}

.course-title {
  color: #cffafe;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.course-desc {
  color: rgba(224, 242, 254, 0.9);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 auto;
  max-width: 640px;
}

.select-input {
  min-width: 320px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.75);
  color: #e0f2fe;
  padding: 8px 10px;
}

.select-input:focus {
  outline: none;
  border-color: rgba(244, 114, 182, 0.65);
  box-shadow: 0 0 0 2px rgba(244, 114, 182, 0.2);
}

.neon-button {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.neon-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.86), rgba(168, 85, 247, 0.82), rgba(244, 114, 182, 0.88));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.neon-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 18px rgba(217, 70, 239, 0.18);
}

.is-active {
  background: rgba(34, 211, 238, 0.24);
  border-color: rgba(165, 243, 252, 0.75);
}
</style>
