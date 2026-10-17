<template>
  <section class="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 md:px-8 md:pt-6">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-[clamp(1.8rem,6vw,4.5rem)] font-semibold" data-text="UESTC CDMGA">UESTC CDMGA</h1>
    </header>

    <div class="grid grid-cols-[1.65fr_1fr] gap-5 max-lg:grid-cols-1">
      <NeonCard
        class="group relative rounded-3xl p-6 md:p-8"
        @mouseenter="pauseCourseCarousel"
        @mouseleave="resumeCourseCarousel"
      >
        <div class="absolute -left-20 -top-16 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />
        <div class="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

        <div class="relative z-10 mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.22em] text-cyan-100/65">课题区域</p>
            <h2 class="mt-1 text-2xl font-semibold text-cyan-50">
              {{ activeCourseMode === 'running' ? '当前进行课题' : '即将开始课题' }}
            </h2>
          </div>
          <span class="rounded-full border border-cyan-200/35 bg-cyan-100/10 px-3 py-1 text-xs text-cyan-50/85">
            {{ displayCourses.length }} 个
          </span>
        </div>

        <div v-if="loading" class="relative z-10 rounded-2xl border border-cyan-100/20 bg-cyan-100/5 p-8 text-center text-cyan-100/80">
          主页数据加载中...
        </div>

        <div v-else-if="error" class="relative z-10 rounded-2xl border border-rose-300/35 bg-rose-400/10 p-8 text-center text-rose-100">
          {{ error }}
        </div>

        <div v-else-if="!displayCourses.length" class="relative z-10 rounded-2xl border border-cyan-100/20 bg-cyan-100/5 p-10 text-center text-cyan-100/75">
          暂无可展示课题
        </div>

        <div v-else class="relative z-10">
          <transition name="course-fade" mode="out-in">
            <article
              :key="currentCourse?.id"
              class="grid grid-cols-[1.12fr_1fr] items-center gap-7 rounded-2xl border border-cyan-100/20 bg-cyan-100/5 p-6 md:p-7 max-md:grid-cols-1"
            >
              <div class="text-left">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-full border border-cyan-200/40 bg-cyan-100/10 px-2.5 py-1 text-xs text-cyan-50/90">
                    {{ activeCourseMode === 'running' ? '进行中' : '即将开始' }}
                  </span>
                  <span class="inline-flex rounded-full border border-cyan-200/30 px-2.5 py-1 text-xs text-cyan-100/80">
                    {{ currentCourse?.category || '未分类' }}
                  </span>
                </div>

                <h3 class="line-clamp-2 text-2xl font-bold leading-tight text-cyan-50 md:text-[32px]">
                  {{ currentCourse?.title || '未命名课题' }}
                </h3>

                <p class="mt-3 text-sm text-cyan-100/85">开始：{{ formatDateTime(currentCourse?.startTime) }}</p>
                <p class="mt-1 text-sm text-cyan-100/85">结束：{{ formatDateTime(currentCourse?.endTime) }}</p>

                <p class="mt-5 line-clamp-4 min-h-24 text-base leading-8 text-cyan-50/85">
                  {{ currentCourse?.description || '暂无课题描述' }}
                </p>

                <div class="mt-6 flex flex-wrap items-center gap-2">
                  <button class="home-btn" @click="goTaskDetail(currentCourse?.id)">进入课题</button>
                </div>
              </div>

              <div>
                <img
                  v-if="hasImage(currentCourse?.image)"
                  :src="getImageUrl(currentCourse?.image)"
                  alt="课题宣传图"
                  class="h-auto w-full rounded-2xl border border-cyan-100/20 object-contain object-center shadow-[0_12px_28px_rgba(2,6,23,0.35)]"
                />
                <div v-else class="rhythm-booth min-h-84 rounded-2xl border border-cyan-100/20">
                  <MaimaiRing :size="220" />
                  <p class="rhythm-title">音游元素展位</p>
                  <p class="rhythm-subtitle">课题暂未上传宣传图</p>
                </div>
              </div>
            </article>
          </transition>

          <div v-if="displayCourses.length > 1" class="mt-4 flex items-center justify-center gap-2">
            <button
              v-for="(_, idx) in displayCourses"
              :key="`course-dot-${idx}`"
              type="button"
              class="h-2.5 w-2.5 rounded-full border border-cyan-100/30 transition"
              :class="idx === currentCourseIndex ? 'bg-cyan-200' : 'bg-cyan-100/20 hover:bg-cyan-100/50'"
              @click="jumpCourse(idx)"
            />
          </div>
        </div>
      </NeonCard>

      <NeonCard class="rounded-3xl p-4 md:p-5">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.22em] text-cyan-100/65">活动区域</p>
            <h2 class="mt-1 text-xl font-semibold text-cyan-50">活动时间窗</h2>
          </div>
          <span class="rounded-full border border-cyan-200/35 bg-cyan-100/10 px-3 py-1 text-xs text-cyan-50/85">
            {{ visibleActivities.length }} 个
          </span>
        </div>

        <div v-if="visibleActivities.length" class="space-y-3 max-lg:grid max-lg:grid-cols-2 max-lg:gap-3 max-lg:space-y-0 max-md:grid-cols-1">
          <article
            v-for="activity in visibleActivities"
            :key="activity.id"
            class="overflow-hidden rounded-2xl border border-cyan-100/20 bg-cyan-100/6"
          >
            <img
              loading="lazy"
              v-if="hasImage(activity.activityBanner)"
              :src="getImageUrl(activity.activityBanner)"
              alt="活动宣传图"
              class="h-90 w-full object-cover object-center max-xl:h-77.5 max-lg:h-70"
            />
            <div v-else class="rhythm-booth h-90 max-xl:h-77.5 max-lg:h-70 border-b border-cyan-100/20">
              <MaimaiRing :size="180" />
              <p class="rhythm-title">音游元素展位</p>
              <p class="rhythm-subtitle">活动暂未上传宣传图</p>
            </div>
            <div class="p-3 text-left">
              <h3 class="line-clamp-2 text-lg font-semibold text-cyan-50">{{ activity.name || '未命名活动' }}</h3>
              <p class="mt-2 text-xs text-cyan-100/80">开始：{{ formatDateTime(activity.startTime) }}</p>
              <p class="mt-1 text-xs text-cyan-100/80">结束：{{ formatDateTime(activity.endTime) }}</p>
              <p class="mt-3 line-clamp-4 min-h-21 text-sm leading-6 text-cyan-50/85">
                {{ activity.description || '暂无活动描述' }}
              </p>
              <button class="home-btn mt-3 w-full" @click="goActivityDetail(activity.id)">进入活动</button>
            </div>
          </article>
        </div>

        <div v-else class="metronome-wrap">
          <div class="metronome-title">当前活动空窗期</div>
          <div class="metronome-subtitle">右侧暂时没有处于展示时间窗的活动</div>
          <div class="metronome-body">
            <div class="metronome-arm" />
            <div class="metronome-base" />
            <div class="metronome-pulse" />
          </div>
          <p class="mt-4 text-center text-xs text-cyan-100/70">节拍保持中，等待下一场活动</p>
        </div>
      </NeonCard>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <NeonCard class="rounded-3xl p-5 md:p-6">
        <div class="flex h-full flex-wrap items-center gap-5">
          <div class="min-w-0 flex-1">
            <p class="text-xs uppercase tracking-[0.22em] text-cyan-100/65">每日群友</p>
            <h2 class="mt-1 text-xl font-semibold text-cyan-50">每天认识一名群友</h2>
            <p v-if="dailyMemberLoading" class="mt-3 text-sm text-cyan-100/75">正在寻找今天的群友...</p>
            <p v-else-if="!dailyMember" class="mt-3 text-sm text-cyan-100/75">今天暂时没有可介绍的群友</p>
            <div v-else class="mt-4 flex items-center gap-4">
              <img :src="getImageUrl(dailyMember.avatar) || defaultAvatar" alt="今日群友头像" class="h-16 w-16 rounded-full border border-cyan-300/50 object-cover" />
              <div class="min-w-0">
                <p class="text-lg font-semibold text-cyan-50">{{ dailyMember.account }}</p>
                <p class="mt-1 break-words text-sm text-cyan-100/80">{{ dailyMember.description || '这位群友还没有填写个性签名' }}</p>
              </div>
            </div>
          </div>
          <button v-if="dailyMember" class="home-btn" @click="router.push(`/profile/${dailyMember.identityId}`)">认识 TA</button>
        </div>
      </NeonCard>

      <NeonCard class="rounded-3xl p-5 md:p-6">
        <div class="flex h-full flex-wrap items-center justify-between gap-5">
          <div>
            <p class="text-xs uppercase tracking-[0.22em] text-cyan-100/65">每日签到 · {{ checkin?.date || shanghaiDay() }}</p>
            <h2 class="mt-1 text-xl font-semibold text-cyan-50">{{ checkin?.checkedIn ? '今天已签到' : '抽取今日运势' }}</h2>
            <p v-if="checkin?.fortune" class="mt-3 text-lg font-bold text-amber-200">{{ checkin.fortune.fortuneLevel }} · {{ checkin.fortune.fortuneText }}</p>
            <div v-if="checkinFortuneDetail" class="mt-2 flex flex-wrap gap-4 text-sm text-cyan-100/85">
              <span>宜：{{ checkinFortuneDetail.good }}</span>
              <span>忌：{{ checkinFortuneDetail.avoid }}</span>
            </div>
            <p v-if="checkinError" class="mt-2 text-sm text-rose-200">{{ checkinError }}</p>
          </div>
          <button class="home-btn" :disabled="checkinLoading || !!checkin?.checkedIn" @click="checkinToday">
            {{ checkinLoading ? '加载中...' : checkin?.checkedIn ? '明天再来' : '立即签到' }}
          </button>
        </div>
      </NeonCard>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { fetchStandaloneCourseData } from '@/api/course'
import NeonCard from '@/components/NeonCard.vue'
import { MaimaiRing } from '@/components/effects'
import defaultAvatar from '@/assets/default-avatar.png'
import { isMobileLite } from '@/utils/visualMode'
import { getTodayCheckin, submitCheckin, type CheckinToday } from '@/api/checkin'

type CourseLike = {
  id: number
  title: string
  category?: string
  startTime: string
  endTime: string
  description?: string
  image?: string
}

type ActivityLike = {
  id: number
  name: string
  startTime: string
  endTime: string
  description?: string
  activityBanner?: string
}

type DailyMember = {
  identityId: number
  account: string
  avatar?: string
  description?: string
}

const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const nowTick = ref(new Date())
const courses = ref<CourseLike[]>([])
const activities = ref<ActivityLike[]>([])
const dailyMember = ref<DailyMember | null>(null)
const dailyMemberLoading = ref(true)
const checkin = ref<CheckinToday | null>(null)
const checkinLoading = ref(false)
const checkinError = ref('')
const checkinFortuneDetail = computed<{ good: string; avoid: string } | null>(() => {
  if (!checkin.value?.fortune?.fortunePayload) return null
  try { return JSON.parse(checkin.value.fortune.fortunePayload) }
  catch { return null }
})
const currentCourseIndex = ref(0)

let clockTimer: number | null = null
let courseTimer: number | null = null
let displayedMemberDay = ''

function shanghaiDay(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

const nowMs = computed(() => nowTick.value.getTime())

const normalizedCourses = computed<CourseLike[]>(() => {
  return [...courses.value].filter((course: any) => String(course.category || '').trim().toLowerCase() !== 'award').map((course: any) => ({
    id: Number(course.id),
    title: String(course.title || ''),
    category: String(course.category || ''),
    startTime: String(course.startTime || course.start_time || ''),
    endTime: String(course.endTime || course.end_time || ''),
    description: String(course.description || ''),
    image: String(course.image || ''),
  }))
})

const runningCourses = computed(() => {
  return normalizedCourses.value.filter((course) => {
    const start = new Date(course.startTime).getTime()
    const end = new Date(course.endTime).getTime()
    return Number.isFinite(start) && Number.isFinite(end) && start <= nowMs.value && nowMs.value <= end
  })
})

const upcomingCourses = computed(() => {
  return normalizedCourses.value
    .filter((course) => {
      const start = new Date(course.startTime).getTime()
      return Number.isFinite(start) && start > nowMs.value
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const activeCourseMode = computed<'running' | 'upcoming'>(() => {
  return runningCourses.value.length ? 'running' : 'upcoming'
})

const displayCourses = computed(() => {
  if (runningCourses.value.length) {
    return [...runningCourses.value].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }
  return upcomingCourses.value
})

const currentCourse = computed(() => {
  if (!displayCourses.value.length) return null
  const safeIndex = currentCourseIndex.value % displayCourses.value.length
  return displayCourses.value[safeIndex]
})

const visibleActivities = computed(() => {
  const threeWeeksMs = 21 * 24 * 60 * 60 * 1000
  return [...activities.value]
    .filter((activity) => {
      const start = new Date(activity.startTime).getTime()
      const end = new Date(activity.endTime).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end)) return false
      return nowMs.value >= start - threeWeeksMs && nowMs.value <= end
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

function hasImage(imagePath?: string): boolean {
  return Boolean(imagePath && imagePath.trim())
}

function formatDateTime(input?: Date | string): string {
  if (!input) return '-'
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '-'
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  return date.toLocaleString('zh-CN', options)
}

function jumpCourse(index: number): void {
  currentCourseIndex.value = index
}

function nextCourse(): void {
  if (displayCourses.value.length <= 1) return
  currentCourseIndex.value = (currentCourseIndex.value + 1) % displayCourses.value.length
}

function stopCourseTimer(): void {
  if (courseTimer) {
    window.clearInterval(courseTimer)
    courseTimer = null
  }
}

function startCourseTimer(): void {
  stopCourseTimer()
  if (isMobileLite.value) return
  if (displayCourses.value.length > 1) {
    courseTimer = window.setInterval(() => {
      nextCourse()
    }, 4200)
  }
}

function pauseCourseCarousel(): void {
  stopCourseTimer()
}

function resumeCourseCarousel(): void {
  startCourseTimer()
}

function goTaskDetail(id?: number): void {
  if (!id) return
  router.push(`/task/${id}`)
}

function goActivityDetail(id: number): void {
  router.push(`/activity/${id}`)
}

async function fetchDailyMember(): Promise<void> {
  displayedMemberDay = shanghaiDay()
  dailyMemberLoading.value = true
  try {
    const response = await axios.get<DailyMember | null>('/api/profile/daily')
    dailyMember.value = response.data?.identityId ? response.data : null
  } catch {
    dailyMember.value = null
  } finally {
    dailyMemberLoading.value = false
  }
}

async function fetchCheckin(): Promise<void> {
  checkinLoading.value = true
  try {
    checkin.value = await getTodayCheckin()
    checkinError.value = ''
  } catch (e: any) {
    checkinError.value = e?.message || '签到状态加载失败'
  } finally {
    checkinLoading.value = false
  }
}

async function checkinToday(): Promise<void> {
  if (checkinLoading.value || checkin.value?.checkedIn) return
  checkinLoading.value = true
  try {
    checkin.value = await submitCheckin()
    checkinError.value = ''
  } catch (e: any) {
    checkinError.value = e?.message || '签到失败'
  } finally {
    checkinLoading.value = false
  }
}

async function fetchHomeData(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const [courseRes, activityRes] = await Promise.all([
      fetchStandaloneCourseData(),
      axios.get('/api/activity/list'),
    ])

    const courseList = Array.isArray(courseRes.data) ? courseRes.data : []
    const activityRaw = activityRes.data?.list ?? activityRes.data
    const activityList = Array.isArray(activityRaw) ? activityRaw : []

    courses.value = courseList
    activities.value = activityList.map((item: any) => ({
      id: Number(item.id),
      name: String(item.name || ''),
      startTime: String(item.startTime || ''),
      endTime: String(item.endTime || ''),
      description: String(item.description || ''),
      activityBanner: String(item.activityBanner || ''),
    }))

    currentCourseIndex.value = 0
    startCourseTimer()
  } catch (e: any) {
    error.value = e?.message || '主页数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHomeData()
  fetchDailyMember()
  fetchCheckin()
  clockTimer = window.setInterval(() => {
    nowTick.value = new Date()
    if (shanghaiDay() !== displayedMemberDay) {
      fetchDailyMember()
      fetchCheckin()
    }
  }, 1000)
})

watch(isMobileLite, (lite) => {
  if (lite) stopCourseTimer()
  else startCourseTimer()
})

onBeforeUnmount(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer)
    clockTimer = null
  }
  stopCourseTimer()
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
  color: rgba(34, 211, 238, 0.45);
  transform: translateX(1px);
  clip-path: polygon(0 4%, 100% 0, 100% 38%, 0 42%);
}

.glitch-title::after {
  color: rgba(192, 38, 211, 0.82);
  transform: translateX(-1px);
  clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 96%);
}

.home-btn {
  border: 1px solid rgba(125, 220, 255, 0.58);
  border-radius: 10px;
  padding: 8px 14px;
  color: #e0f8ff;
  background: linear-gradient(110deg, rgba(11, 69, 96, 0.78), rgba(15, 102, 148, 0.58));
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.home-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.3);
}

.home-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.course-fade-enter-active,
.course-fade-leave-active {
  transition: opacity 0.35s ease;
}

.course-fade-enter-from,
.course-fade-leave-to {
  opacity: 0;
}

.metronome-wrap {
  border: 1px dashed rgba(125, 220, 255, 0.35);
  border-radius: 18px;
  padding: 18px 14px;
  min-height: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.rhythm-booth {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 36%, rgba(34, 211, 238, 0.14), transparent 58%),
    linear-gradient(160deg, rgba(6, 22, 44, 0.72), rgba(10, 34, 61, 0.56));
}

.rhythm-title {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #e5f6ff;
}

.rhythm-subtitle {
  margin-top: 2px;
  font-size: 13px;
  color: rgba(186, 230, 253, 0.76);
}

.metronome-title {
  font-size: 20px;
  color: #e6f7ff;
  font-weight: 700;
  margin-bottom: 4px;
}

.metronome-subtitle {
  font-size: 13px;
  color: rgba(186, 230, 253, 0.78);
  text-align: center;
}

.metronome-body {
  position: relative;
  margin-top: 18px;
  width: 178px;
  height: 260px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.metronome-base {
  width: 138px;
  height: 180px;
  clip-path: polygon(18% 100%, 82% 100%, 62% 0, 38% 0);
  background: linear-gradient(160deg, rgba(14, 116, 144, 0.95), rgba(8, 47, 73, 0.86));
  box-shadow: inset 0 0 0 1px rgba(165, 243, 252, 0.3);
}

.metronome-arm {
  position: absolute;
  bottom: 104px;
  width: 4px;
  height: 124px;
  background: linear-gradient(to bottom, #dbeafe, #38bdf8);
  transform-origin: bottom center;
  animation: metronome-swing 1.1s ease-in-out infinite;
  border-radius: 999px;
}

.metronome-arm::before {
  content: '';
  position: absolute;
  top: 28px;
  left: 50%;
  width: 28px;
  height: 12px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(165, 243, 252, 0.92);
}

.metronome-pulse {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #7dd3fc;
  animation: pulse-dot 1.1s ease-in-out infinite;
}

@keyframes metronome-swing {
  0% {
    transform: rotate(-18deg);
  }
  50% {
    transform: rotate(18deg);
  }
  100% {
    transform: rotate(-18deg);
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(125, 211, 252, 0.4);
  }
  50% {
    box-shadow: 0 0 0 16px rgba(125, 211, 252, 0);
  }
}

@media (max-width: 1024px) {
  .metronome-wrap {
    min-height: 360px;
  }
}
</style>
