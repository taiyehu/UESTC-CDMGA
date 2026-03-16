<template>
  <div class="profile-page mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="PROFILE">
        PROFILE
      </h1>
    </header>

    <NeonCard v-if="user.id !== null" class="box-card">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div class="flex flex-col items-center lg:mr-8">
          <button
            type="button"
            class="avatar-btn"
            :title="isSelf ? '点击修改资料' : '点击查看大图'"
            @click="isSelf ? goToSettings('avatar') : previewAvatar()"
          >
            <img
              class="avatar-image"
              :src="profileStatus === 1 ? getImageUrl(profile.avatar) : defaultAvatar"
              alt="用户头像"
            />
          </button>
        </div>

        <div class="flex flex-1 flex-col items-center pt-4">
          <div class="mb-4">
            <h2 class="profile-name">{{ profile.account || user.account }}</h2>
          </div>

          <div class="profile-signature" :title="getStatusText()">
            <div class="signature-box">
              {{ profile.description || '暂无个性签名' }}
            </div>
          </div>

          <div v-if="profileStatus !== 1" class="mt-2 text-cyan-100/85">
            资料审核通过后才会显示头像和签名
          </div>

          <div v-if="isSelf" class="mt-3">
            <NeonActionButton variant="profile-outline" @click="goToSettings()">设置个人资料</NeonActionButton>
          </div>
        </div>
      </div>

      <div class="section-divider" />
    </NeonCard>

    <NeonCard v-else class="box-card">
      <h2>加载用户信息失败</h2>
      <div class="mt-3">
        <NeonActionButton variant="profile-outline" @click="redirectToLogin">重新登录</NeonActionButton>
      </div>
    </NeonCard>

    <NeonCard v-if="scoredScores.length > 0" class="box-card mt-5">
      <h3 class="section-title mb-3">已完成课题及分数</h3>

      <NeonRankTable min-width-class="min-w-220" text-size-class="text-base">
          <template #head>
            <tr>
              <th class="px-4 py-3 text-center">课题名称</th>
              <th class="w-30 px-3 py-3 text-center">课题图片</th>
              <th class="w-44 px-4 py-3 text-center">完成时间</th>
              <th class="w-30 px-3 py-3 text-center">成绩图片</th>
              <th class="w-24 px-3 py-3 text-center">分数</th>
              <th class="px-4 py-3 text-center">备注</th>
            </tr>
          </template>
            <tr
              v-for="row in pagedScoredScores"
              :key="row.id"
              class="border-t border-white/12"
            >
              <td class="px-3 py-3">{{ row.course?.title || '-' }}</td>
              <td class="px-3 py-3 text-center">
                <img
                  v-if="row.course?.image"
                  :src="getImageUrl(row.course.image)"
                  alt="课题图片"
                  class="thumb mx-auto"
                  @click="previewImage(row.course.image)"
                />
                <span v-else>-</span>
              </td>
              <td class="px-3 py-3">{{ formatUploadTime(row.uploadTime) }}</td>
              <td class="px-3 py-3 text-center">
                <img
                  v-if="row.image"
                  :src="getImageUrl(row.image)"
                  alt="成绩图片"
                  class="thumb mx-auto"
                  @click="previewImage(row.image)"
                />
                <span v-else>-</span>
              </td>
              <td class="px-3 py-3 text-center">{{ row.score ?? '-' }}</td>
              <td class="px-3 py-3">{{ row.remark || '-' }}</td>
            </tr>
      </NeonRankTable>

      <div class="mt-4 flex items-center justify-center gap-2">
        <NeonActionButton
          variant="profile-outline"
          :disabled="scoredPage <= 1"
          @click="goScoredPage(scoredPage - 1)"
        >
          上一页
        </NeonActionButton>
        <span class="text-cyan-100/85">{{ scoredPage }} / {{ scoredTotalPages }}</span>
        <NeonActionButton
          variant="profile-outline"
          :disabled="scoredPage >= scoredTotalPages"
          @click="goScoredPage(scoredPage + 1)"
        >
          下一页
        </NeonActionButton>
      </div>
    </NeonCard>

    <NeonCard v-if="RatedActivities.length > 0" class="box-card mt-5" padding-class="p-4">
      <h3 class="section-title mb-3">已参与的活动与分数详情</h3>

      <div class="space-y-3">
        <section
          v-for="activity in RatedActivities"
          :key="activity.id"
          class="activity-panel rounded-xl border border-white/15 bg-slate-900/35 p-3"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between text-left text-cyan-50 transition-colors hover:text-white"
            @click="toggleActivity(activity.id)"
          >
            <span class="text-lg font-medium">{{ activity.title || activity.name }}</span>
            <span class="text-sm text-cyan-100/80">
              <template v-if="loadingMap[String(activity.id)]">加载中...</template>
              <template v-else-if="errorMap[String(activity.id)]">加载失败</template>
              <template v-else>{{ isExpanded(activity.id) ? '收起' : '展开' }}</template>
            </span>
          </button>

          <div v-if="isExpanded(activity.id)" class="pt-3">
            <div v-if="loadingMap[String(activity.id)]" class="py-3 text-center text-cyan-100/85">加载中...</div>

            <div v-else-if="errorMap[String(activity.id)]" class="py-3 text-center text-cyan-100/85">
              加载失败：{{ errorMap[String(activity.id)] }}
              <button type="button" class="ml-2 text-cyan-200 underline" @click="fetchContestScores(activity.id)">重试</button>
            </div>

            <template v-else>
              <NeonRankTable min-width-class="min-w-220" text-size-class="text-base">
                  <template #head>
                    <tr>
                      <th class="px-4 py-3 text-center">课题名称</th>
                      <th class="w-30 px-3 py-3 text-center">课题图片</th>
                      <th class="w-44 px-4 py-3 text-center">完成时间</th>
                      <th class="w-30 px-3 py-3 text-center">成绩图片</th>
                      <th class="w-24 px-3 py-3 text-center">分数</th>
                      <th class="px-4 py-3 text-center">备注</th>
                    </tr>
                  </template>
                    <tr
                      v-for="row in pagedActivityScores(activity.id)"
                      :key="row.id"
                      class="border-t border-white/12"
                    >
                      <td class="px-3 py-3">{{ row.course?.title || '-' }}</td>
                      <td class="px-3 py-3 text-center">
                        <img
                          v-if="row.course?.image"
                          :src="getImageUrl(row.course.image)"
                          alt="课题图片"
                          class="thumb mx-auto"
                          @click="previewImage(row.course.image)"
                        />
                        <span v-else>-</span>
                      </td>
                      <td class="px-3 py-3">{{ formatUploadTime(row.uploadTime) }}</td>
                      <td class="px-3 py-3 text-center">
                        <img
                          v-if="row.image"
                          :src="getImageUrl(row.image)"
                          alt="成绩图片"
                          class="thumb mx-auto"
                          @click="previewImage(row.image)"
                        />
                        <span v-else>-</span>
                      </td>
                      <td class="px-3 py-3 text-center">{{ row.score ?? '-' }}</td>
                      <td class="px-3 py-3">{{ row.remark || '-' }}</td>
                    </tr>
              </NeonRankTable>

              <div v-if="(activityScoresMap[String(activity.id)] || []).length" class="mt-3 flex items-center justify-center gap-2">
                <NeonActionButton
                  variant="profile-outline"
                  :disabled="activityCurrentPage(activity.id) <= 1"
                  @click="setActivityPage(activity.id, activityCurrentPage(activity.id) - 1)"
                >
                  上一页
                </NeonActionButton>
                <span class="text-cyan-100/85">{{ activityCurrentPage(activity.id) }} / {{ activityTotalPages(activity.id) }}</span>
                <NeonActionButton
                  variant="profile-outline"
                  :disabled="activityCurrentPage(activity.id) >= activityTotalPages(activity.id)"
                  @click="setActivityPage(activity.id, activityCurrentPage(activity.id) + 1)"
                >
                  下一页
                </NeonActionButton>
              </div>

              <div v-if="!(activityScoresMap[String(activity.id)] || []).length" class="py-3 text-center text-cyan-100/85">暂无成绩</div>
            </template>
          </div>
        </section>
      </div>
    </NeonCard>

    <div
      v-if="avatarPreviewVisible"
      class="fixed inset-0 z-120 flex items-center justify-center bg-black/70 px-4"
      @click="avatarPreviewVisible = false"
    >
      <NeonActionButton type="button" variant="gray" size="sm" class="close-btn" @click.stop="avatarPreviewVisible = false">关闭</NeonActionButton>
      <img :src="avatarPreviewUrl" alt="头像大图" class="preview-image" @click.stop />
    </div>

    <div
      v-if="imagePreviewVisible"
      class="fixed inset-0 z-120 flex items-center justify-center bg-black/70 px-4"
      @click="imagePreviewVisible = false"
    >
      <NeonActionButton type="button" variant="gray" size="sm" class="close-btn" @click.stop="imagePreviewVisible = false">关闭</NeonActionButton>
      <img :src="imagePreviewUrl" alt="图片预览" class="preview-image" @click.stop />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import defaultAvatar from '@/assets/default-avatar.png'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

const route = useRoute()
const router = useRouter()

const user = reactive<{ account: string; id: number | null; role: string }>({ account: '', id: null, role: '' })
const profile = reactive<any>({ avatar: '', description: '', status: -1, account: '' })
const profileStatus = ref<number>(-1)
const defaultAvatarRef = defaultAvatar
const scoredScores = ref<any[]>([])
const RatedActivities = ref<any[]>([])
const viewUserId = ref<number | null>(null)
const isSelf = ref(false)
const avatarPreviewVisible = ref(false)
const avatarPreviewUrl = ref('')

// 缓存每个 activity 的分数数据
const activityScoresMap = reactive<Record<string, any[]>>({})
const loadingMap = reactive<Record<string, boolean>>({})
const errorMap = reactive<Record<string, string | null>>({})
const activityPageMap = reactive<Record<string, number>>({})
const expandedActivityId = ref<string | null>(null)

const tablePageSize = 5
const scoredPage = ref(1)

const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref('')

const scoredTotalPages = computed(() => {
  return Math.max(1, Math.ceil(scoredScores.value.length / tablePageSize))
})

const pagedScoredScores = computed(() => {
  const start = (scoredPage.value - 1) * tablePageSize
  return scoredScores.value.slice(start, start + tablePageSize)
})

// 方法实现
function previewImage(url: string) {
  imagePreviewUrl.value = getImageUrl(url)
  imagePreviewVisible.value = true
}

function goToSettings(tab?: string) {
  const query: any = {}
  if (tab) query.tab = tab
  router.push({ path: '/profile-setting', query })
}

function loadProfile() {
  const routeId = route.params.id
  const userInfo = sessionStorage.getItem('userInfo')

  if (routeId) {
    viewUserId.value = parseInt(String(routeId))
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      user.account = parsed.account
      user.id = parsed.id
      user.role = parsed.role
      isSelf.value = user.id == Number(routeId)
    } else {
      isSelf.value = false
    }
  } else if (userInfo) {
    const parsed = JSON.parse(userInfo)
    user.account = parsed.account
    user.id = parsed.id
    user.role = parsed.role
    viewUserId.value = parsed.id
    isSelf.value = true
  } else {
    viewUserId.value = null
    isSelf.value = false
  }

  if (viewUserId.value) {
    fetchProfile()
    fetchScoredScores()
    fetchRatedActivity()
  }
}

function getStatusText() {
  if (profileStatus.value === 0) return '审核中'
  if (profileStatus.value === 1) return '已通过'
  return '未提交'
}

function formatUploadTime(uploadTime?: string) {
  return uploadTime ? uploadTime.replace('T', ' ') : '-'
}

function getImageUrl(imagePath?: string) {
  if (!imagePath) return defaultAvatarRef
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function previewAvatar() {
  avatarPreviewUrl.value = getImageUrl(profile.avatar)
  avatarPreviewVisible.value = true
}



function redirectToLogin() {
  router.push('/login')
}

function fetchProfile() {
  if (!viewUserId.value) return
  axios.get(`/api/profile/identity/${viewUserId.value}`).then((res) => {
    if (!res.data || res.data.avatar === undefined) {
      profile.avatar = ''
      profile.description = ''
      profile.status = -1
      profile.account = ''
      profileStatus.value = -1
      ElMessage({ message: '该用户尚未完善个人资料', type: 'info' })
      return
    }
    Object.assign(profile, res.data)
    profileStatus.value = res.data.status
  })
}


function goScoredPage(page: number) {
  scoredPage.value = Math.min(scoredTotalPages.value, Math.max(1, page))
}

function toggleActivity(activityId: number | string) {
  const key = String(activityId)
  expandedActivityId.value = expandedActivityId.value === key ? null : key
  if (expandedActivityId.value === key && !activityScoresMap[key]) {
    fetchContestScores(Number(activityId))
  }
}

function isExpanded(activityId: number | string) {
  return expandedActivityId.value === String(activityId)
}

function activityCurrentPage(activityId: number | string) {
  return activityPageMap[String(activityId)] || 1
}

function activityTotalPages(activityId: number | string) {
  const key = String(activityId)
  const list = activityScoresMap[key] || []
  return Math.max(1, Math.ceil(list.length / tablePageSize))
}

function setActivityPage(activityId: number | string, page: number) {
  const key = String(activityId)
  const total = activityTotalPages(key)
  activityPageMap[key] = Math.min(total, Math.max(1, page))
}

function pagedActivityScores(activityId: number | string) {
  const key = String(activityId)
  const list = activityScoresMap[key] || []
  const page = activityCurrentPage(key)
  const start = (page - 1) * tablePageSize
  return list.slice(start, start + tablePageSize)
}

function fetchScoredScores() {
  if (!viewUserId.value) return
  axios.get(`/api/score/user-course-scores?identityId=${viewUserId.value}`).then((res) => {
    if (res.data && res.data.code === 0) {
      scoredScores.value = res.data.data || []
      scoredPage.value = 1
    }
  })
}

function fetchRatedActivity() {
  if (!viewUserId.value) return
  axios.get(`/api/activity/rated-activities/${viewUserId.value}`).then((res) => {
    if (res.data) {
      RatedActivities.value = res.data || []
    }
  })
}

async function fetchContestScores(activityId: number) {
  if (!viewUserId.value || !activityId) return
  loadingMap[activityId] = true
  errorMap[activityId] = null
  try {
    const res = await axios.get('/api/score/activity-scores', {
      params: { activityId: activityId, identityId: viewUserId.value },
    })
    let scores: any[] = []
    if (res.data) {
      scores = Array.isArray(res.data) ? res.data : res.data.data || []
    }
    for (let i = 0; i < scores.length; i++) {
      const courseId = scores[i].course && scores[i].course.id
      if (!courseId) continue
      try {
        const ruleRes = await axios.get('/api/activity/rule', {
          params: { activityId: activityId, courseId },
        })
        const rule = ruleRes.data && (ruleRes.data.rule || ruleRes.data)
        if (rule === 'arcaea计分方式') {
          scores[i].score = (scores[i].score || 0) + 10000000
        }
      } catch (e) {
        console.warn('获取计分规则失败，courseId=', courseId, e)
      }
    }
    activityScoresMap[String(activityId)] = scores
    activityPageMap[String(activityId)] = 1
  } catch (err: any) {
    const msg = err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message || '加载失败'
    errorMap[activityId] = msg
    activityScoresMap[String(activityId)] = []
    console.error('fetchContestScores 错误:', err)
  } finally {
    loadingMap[activityId] = false
  }
}

onMounted(() => {
  loadProfile()
})

watch(() => route.params.id, () => {
  loadProfile()
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

.profile-page {
  font-size: 16px;
}

.profile-name {
  margin: 0;
  color: #f5fbff;
  text-shadow: 0 0 10px rgba(125, 211, 252, 0.25);
}

.profile-signature {
  width: min(92vw, 520px);
}

.signature-box {
  min-height: 88px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(7, 24, 46, 0.58);
  color: #e0f7ff;
  padding: 10px 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.avatar-btn {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(7, 24, 46, 0.45);
}

.avatar-image {
  width: 128px;
  height: 128px;
  border-radius: 999px;
  object-fit: cover;
}

.section-divider {
  margin-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.close-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  padding: 6px 12px;
}

.preview-image {
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 12px;
}

.box-card h2 {
  font-size: 1.5rem;
}

.box-card h3 {
  font-size: 1.25rem;
}

.section-title {
  color: rgba(224, 247, 255, 0.95);
  font-weight: 600;
  letter-spacing: 0.04em;
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

.activity-panel {
  font-size: 15px;
}
</style>

