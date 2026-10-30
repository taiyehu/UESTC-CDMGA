<template>
  <div class="profile-page mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="PROFILE">
        PROFILE
      </h1>
    </header>

    <div class="profile-top-grid">
    <NeonCard v-if="user.id !== null" class="box-card">
      <h3 class="section-title">个人资料</h3>
      <div class="profile-head">
        <button
          type="button"
          class="avatar-btn"
          :title="isSelf ? '点击修改资料' : '点击查看大图'"
          @click="isSelf ? goToSettings('avatar') : previewAvatar()"
        >
          <img
            class="avatar-image"
            :src="profileStatus === 1 ? mediaThumbnailUrl(getImageUrl(profile.avatar), 256) : defaultAvatar"
            @error="restoreOriginalImage($event, getImageUrl(profile.avatar))"
            alt="用户头像"
          />
        </button>

        <div class="profile-head-main">
          <div class="profile-name-row">
            <h2 class="profile-name">
              {{ profile.account || (isSelf ? user.account : '未知用户') }}
            </h2>
            <span
              v-if="onlineStatus !== null"
              class="status-pill"
              :class="onlineStatus ? 'status-online' : 'status-offline'"
            >
              {{ onlineStatus ? '在线' : '离线' }}
            </span>
            <TitleBadge
              v-if="equippedTitle"
              :name="equippedTitle.name"
              :tier="equippedTitle.tier"
              :acquisition-method="equippedTitle.acquisitionMethod"
            />
            <span class="university-pill" :class="{ 'university-unset': !university }">{{ universityName }}</span>
          </div>

          <div class="profile-signature" :title="getStatusText()">
            <div class="signature-box">
              {{ profile.description || '暂无个性签名' }}
            </div>
          </div>

          <div class="profile-head-foot">
            <span v-if="profileStatus !== 1" class="profile-hint">
              资料审核通过后才会显示头像和签名
            </span>
            <NeonActionButton v-if="isSelf" variant="profile-outline" @click="goToSettings()">
              设置个人资料
            </NeonActionButton>
          </div>
        </div>
      </div>
    </NeonCard>

    <NeonCard v-if="isSelf || publicTitles.length" class="box-card">
      <div class="section-head">
        <h3 class="section-title">{{ isSelf ? '我的称号' : '获得的称号' }}</h3>
        <NeonActionButton v-if="isSelf" variant="profile-outline" size="sm" @click="goToSettings('titles')">申请称号</NeonActionButton>
      </div>
      <div class="title-filters">
        <label>称号等级
          <select v-model="titleTierFilter" class="title-select" aria-label="按称号等级筛选">
            <option value="all">全部等级</option>
            <option value="color">彩色</option>
            <option value="gold">金色</option>
            <option value="silver">银色</option>
            <option value="normal">普通</option>
          </select>
        </label>
        <label>获得类别
          <select v-model="titleSourceFilter" class="title-select" aria-label="按称号获得类别筛选">
            <option value="all">全部类别</option>
            <option value="registration">注册获得</option>
            <option value="admin_created">管理员颁发</option>
            <option value="user_application">用户申请</option>
          </select>
        </label>
        <label>获得时间
          <select v-model="titleTimeOrder" class="title-select" aria-label="按称号获得时间排序">
            <option value="newest">最新在前</option>
            <option value="oldest">最早在前</option>
          </select>
        </label>
      </div>
      <div v-if="pagedTitles.length" class="title-grid">
        <div v-for="item in pagedTitles" :key="item.id" class="title-item">
          <TitleBadge :name="item.name" :tier="item.tier" :acquisition-method="item.acquisitionMethod" />
          <span v-if="isSelf" class="text-xs text-cyan-100/75">{{ titleStatusText(item.status) }}</span>
          <span class="text-xs text-cyan-100/60">{{ formatUploadTime(item.grantedAt || item.createdAt) }}</span>
          <NeonActionButton v-if="isSelf && item.status === 'approved' && !item.isEquipped" size="sm" @click="equipTitle(item.id)">佩戴</NeonActionButton>
          <NeonActionButton v-if="isSelf && item.isEquipped" size="sm" variant="gray" @click="unequipTitle">取消佩戴</NeonActionButton>
          <span v-if="isSelf && item.status === 'rejected' && item.reviewNote" class="text-xs text-rose-200">{{ item.reviewNote }}</span>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-cyan-100/70">{{ availableTitles.length ? '没有符合筛选条件的称号' : '还没有称号记录' }}</p>
      <div v-if="titleTotalPages > 1" class="mt-4 flex items-center justify-center gap-2">
        <NeonActionButton variant="profile-outline" size="sm" :disabled="titlePage <= 1" @click="titlePage--">上一页</NeonActionButton>
        <span class="text-sm text-cyan-100/85">{{ titlePage }} / {{ titleTotalPages }}</span>
        <NeonActionButton variant="profile-outline" size="sm" :disabled="titlePage >= titleTotalPages" @click="titlePage++">下一页</NeonActionButton>
      </div>
    </NeonCard>
    </div>

    <NeonCard v-if="scoredScores.length > 0" class="box-card mt-5">
      <h3 class="section-title">已完成课题及分数</h3>

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
                  loading="lazy"
                  v-if="row.course?.image"
                  :src="mediaThumbnailUrl(getImageUrl(row.course.image), 160)"
                  @error="restoreOriginalImage($event, getImageUrl(row.course.image))"
                  alt="课题图片"
                  class="thumb mx-auto"
                  @click="previewImage(row.course.image)"
                />
                <span v-else>-</span>
              </td>
              <td class="px-3 py-3">{{ formatUploadTime(row.uploadTime) }}</td>
              <td class="px-3 py-3 text-center">
                <img
                  loading="lazy"
                  v-if="row.image"
                  :src="mediaThumbnailUrl(getImageUrl(row.image), 160)"
                  @error="restoreOriginalImage($event, getImageUrl(row.image))"
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

    <NeonCard v-if="viewUserId && awardRedemptions.length > 0" class="box-card mt-5">
      <h3 class="section-title">兑换记录</h3>

      <NeonRankTable min-width-class="min-w-180" text-size-class="text-base">
        <template #head>
          <tr>
            <th class="px-4 py-3 text-center">奖品名称</th>
            <th class="w-30 px-3 py-3 text-center">奖品图片</th>
            <th class="w-28 px-3 py-3 text-center">消耗积分</th>
            <th class="w-44 px-4 py-3 text-center">申请时间</th>
            <th class="w-44 px-4 py-3 text-center">兑换时间</th>
            <th class="px-4 py-3 text-center">备注</th>
          </tr>
        </template>
        <tr v-for="row in pagedAwardRedemptions" :key="row.id" class="border-t border-white/12">
          <td class="px-3 py-3">{{ row.course?.title || '-' }}</td>
          <td class="px-3 py-3 text-center">
            <img
              loading="lazy"
              v-if="row.course?.image"
              :src="mediaThumbnailUrl(getImageUrl(row.course.image), 160)"
              @error="restoreOriginalImage($event, getImageUrl(row.course.image))"
              alt="奖品图片"
              class="thumb mx-auto"
              @click="previewImage(row.course.image)"
            />
            <span v-else>-</span>
          </td>
          <td class="px-3 py-3 text-center">{{ Math.abs(Number(row.score || 0)) }}</td>
          <td class="px-3 py-3 text-center">{{ formatUploadTime(row.uploadTime) }}</td>
          <td class="px-3 py-3 text-center">{{ formatUploadTime(row.updatedAt) }}</td>
          <td class="px-3 py-3">{{ row.remark || '-' }}</td>
        </tr>
      </NeonRankTable>

      <div v-if="awardRedemptions.length > tablePageSize" class="mt-4 flex items-center justify-center gap-2">
        <NeonActionButton variant="profile-outline" :disabled="awardPage <= 1" @click="goAwardPage(awardPage - 1)">上一页</NeonActionButton>
        <span class="text-cyan-100/85">{{ awardPage }} / {{ awardTotalPages }}</span>
        <NeonActionButton variant="profile-outline" :disabled="awardPage >= awardTotalPages" @click="goAwardPage(awardPage + 1)">下一页</NeonActionButton>
      </div>
    </NeonCard>

    <NeonCard v-if="RatedActivities.length > 0" class="box-card mt-5" padding-class="p-4">
      <h3 class="section-title">已参与的活动与分数详情</h3>

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
                          loading="lazy"
                          v-if="row.course?.image"
                          :src="mediaThumbnailUrl(getImageUrl(row.course.image), 160)"
                          @error="restoreOriginalImage($event, getImageUrl(row.course.image))"
                          alt="课题图片"
                          class="thumb mx-auto"
                          @click="previewImage(row.course.image)"
                        />
                        <span v-else>-</span>
                      </td>
                      <td class="px-3 py-3">{{ formatUploadTime(row.uploadTime) }}</td>
                      <td class="px-3 py-3 text-center">
                        <img
                          loading="lazy"
                          v-if="row.image"
                          :src="mediaThumbnailUrl(getImageUrl(row.image), 160)"
                          @error="restoreOriginalImage($event, getImageUrl(row.image))"
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
import { mediaThumbnailUrl, restoreOriginalImage } from '@/utils/mediaThumbnail'
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import defaultAvatar from '@/assets/default-avatar.png'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import TitleBadge from '@/components/TitleBadge.vue'

const route = useRoute()
const router = useRouter()

const user = reactive<{ account: string; id: number | null; role: string }>({ account: '', id: null, role: '' })
const profile = reactive<any>({ avatar: '', description: '', status: -1, account: '' })
const profileStatus = ref<number>(-1)
const university = ref('')
const universityName = computed(() => university.value === 'UESTC' ? '电子科技大学' : university.value === 'SWJTU' ? '西南交通大学' : '暂未设置学校')
type TitleRecord = { id: number; name: string; tier: string; source?: string; status: string; isEquipped: boolean; acquisitionMethod?: string; reviewNote?: string; grantedAt?: string; createdAt?: string }
const myTitles = ref<TitleRecord[]>([])
const visibleMyTitles = computed(() => myTitles.value.filter((item) => item.status !== 'revoked'))
const publicTitles = ref<TitleRecord[]>([])
const isSelf = ref(false)
const titleTierFilter = ref('all')
const titleSourceFilter = ref('all')
const titleTimeOrder = ref<'newest' | 'oldest'>('newest')
const titlePage = ref(1)
const titlePageSize = 4
const availableTitles = computed(() => isSelf.value ? visibleMyTitles.value : publicTitles.value)
const displayTitles = computed(() => availableTitles.value
  .filter((item) => titleTierFilter.value === 'all' || item.tier === titleTierFilter.value)
  .filter((item) => titleSourceFilter.value === 'all' || item.source === titleSourceFilter.value)
  .sort((a, b) => {
    const aTime = Date.parse(a.grantedAt || a.createdAt || '') || 0
    const bTime = Date.parse(b.grantedAt || b.createdAt || '') || 0
    return titleTimeOrder.value === 'newest' ? bTime - aTime || b.id - a.id : aTime - bTime || a.id - b.id
  }))
const titleTotalPages = computed(() => Math.max(1, Math.ceil(displayTitles.value.length / titlePageSize)))
const pagedTitles = computed(() => displayTitles.value.slice((titlePage.value - 1) * titlePageSize, titlePage.value * titlePageSize))
watch([titleTierFilter, titleSourceFilter, titleTimeOrder], () => { titlePage.value = 1 })
watch(titleTotalPages, (total) => { titlePage.value = Math.min(titlePage.value, total) })
const equippedTitle = computed(() => (isSelf.value ? visibleMyTitles.value : publicTitles.value).find((item) => item.isEquipped))
const defaultAvatarRef = defaultAvatar
const scoredScores = ref<any[]>([])
const awardRedemptions = ref<any[]>([])
const RatedActivities = ref<any[]>([])
const viewUserId = ref<number | null>(null)
const onlineStatus = ref<boolean | null>(null)
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
const awardPage = ref(1)

const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref('')

const scoredTotalPages = computed(() => {
  return Math.max(1, Math.ceil(scoredScores.value.length / tablePageSize))
})

const pagedScoredScores = computed(() => {
  const start = (scoredPage.value - 1) * tablePageSize
  return scoredScores.value.slice(start, start + tablePageSize)
})

const awardTotalPages = computed(() => {
  return Math.max(1, Math.ceil(awardRedemptions.value.length / tablePageSize))
})

const pagedAwardRedemptions = computed(() => {
  const start = (awardPage.value - 1) * tablePageSize
  return awardRedemptions.value.slice(start, start + tablePageSize)
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
    onlineStatus.value = null
    axios.get(`/api/identity/online/${viewUserId.value}`).then((response) => {
      if (response.data?.code === 0) onlineStatus.value = Boolean(response.data.data)
    }).catch(() => {})
    fetchProfile()
    fetchUniversity()
    fetchTitles()
    fetchScoredScores()
    fetchAwardRedemptions()
    fetchRatedActivity()
  }
}

function titleStatusText(status: string): string {
  if (status === 'pending') return '审核中'
  if (status === 'approved') return '已通过'
  if (status === 'revoked') return '已撤销'
  return '已驳回'
}

async function fetchTitles(): Promise<void> {
  if (!viewUserId.value) return
  try {
    const url = isSelf.value ? '/api/title/mine' : `/api/title/user/${viewUserId.value}`
    const response = await axios.get(url)
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    const rows = response.data.data || []
    if (isSelf.value) myTitles.value = rows
    else publicTitles.value = rows
  } catch {
    myTitles.value = []
    publicTitles.value = []
  }
}

async function equipTitle(awardId: number): Promise<void> {
  try {
    const response = await axios.post(`/api/title/equip/${awardId}`)
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    await fetchTitles()
  } catch (error: any) {
    ElMessage.error(error.message || '佩戴失败')
  }
}

async function unequipTitle(): Promise<void> {
  try {
    const response = await axios.post('/api/title/unequip')
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    await fetchTitles()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
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



async function fetchUniversity() {
  const identityId = viewUserId.value
  university.value = ''
  if (!identityId) return
  try {
    const { data } = await axios.get(`/api/identity-extra-profile/user/${identityId}/school`)
    if (viewUserId.value === identityId) university.value = data.university || ''
  } catch {
    university.value = ''
  }
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

function goAwardPage(page: number) {
  awardPage.value = Math.min(awardTotalPages.value, Math.max(1, page))
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

function fetchAwardRedemptions() {
  if (!viewUserId.value) return
  axios.get(`/api/score/user-award-redemptions?identityId=${viewUserId.value}`).then((res) => {
    if (res.data && res.data.code === 0) {
      awardRedemptions.value = res.data.data || []
      awardPage.value = 1
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
/* ===== 页面容器 ===== */
.profile-page {
  font-size: 16px;
}

.profile-top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  align-items: stretch;
  gap: 20px;
}

.profile-top-grid > :only-child { grid-column: 1 / -1; }

@media (max-width: 900px) {
  .profile-top-grid { grid-template-columns: minmax(0, 1fr); }
}

/* ===== 头部卡片：头像 + 信息两栏，信息左对齐 ===== */
.profile-head {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.profile-head-main {
  flex: 1;
  min-width: 0;          /* 允许内部文本收缩，避免撑破卡片 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 姓名 / 在线状态 / 佩戴称号 同一行，重点信息集中 */
.profile-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-head-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 32px;
}

.profile-hint {
  font-size: 13px;
  color: rgba(224, 247, 255, 0.72);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.university-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  color: #a5f3fc;
  border: 1px solid rgba(103, 232, 249, 0.4);
  background: rgba(8, 145, 178, 0.14);
}

.university-unset {
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.28);
  background: rgba(100, 116, 139, 0.12);
}
.status-online {
  color: #6ee7b7;
  border-color: rgba(110, 231, 183, 0.35);
  background: rgba(16, 185, 129, 0.12);
}

.status-offline {
  color: rgba(207, 250, 254, 0.6);
  border-color: rgba(207, 250, 254, 0.18);
  background: rgba(148, 163, 184, 0.1);
}

/* 签名：随内容增高，不再固定 88px 造成大片空白 */
.signature-box {
  min-height: 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(7, 24, 46, 0.5);
  color: #e0f7ff;
  padding: 10px 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.profile-signature {
  width: 100%;
  max-width: 720px;
  text-align: left;
}

/* ===== 区块：标题左对齐 + 与表格对齐 ===== */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  text-align: left;
}

.section-title {
  color: rgba(224, 247, 255, 0.95);
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0 0 12px;
  text-align: left;      /* 抵消全局 #app 居中 */
}

.section-head .section-title {
  margin-bottom: 0;
}

/* 卡片内一律左对齐，与表格列对齐 */
.box-card {
  text-align: left;
}

.box-card h2 {
  font-size: 1.5rem;
}

.box-card h3 {
  font-size: 1.25rem;
}

/* ===== 头像 ===== */
.avatar-btn {
  display: inline-flex;
  flex: none;
  border-radius: 999px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(7, 24, 46, 0.45);
}

.avatar-image {
  width: 112px;
  height: 112px;
  border-radius: 999px;
  object-fit: cover;
  display: block;
}

/* ===== 称号列表：紧凑网格，避免竖着堆成一列 ===== */
.title-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(103, 232, 249, 0.18);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.4);
  text-align: left;
  min-width: 0;
  align-content: start;
}

.title-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.title-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px;
}

.title-filters label {
  display: grid;
  gap: 5px;
  color: rgba(224, 247, 255, 0.76);
  font-size: 12px;
}

.title-select {
  max-width: 150px;
  border: 1px solid rgba(103, 232, 249, 0.35);
  border-radius: 8px;
  padding: 6px 8px;
  color: #e0f7ff;
  background: #102039;
}

/* ===== 页标题 ===== */
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

.profile-name {
  margin: 0;
  color: #f5fbff;
  text-shadow: 0 0 10px rgba(125, 211, 252, 0.25);
  font-size: 1.5rem;
  line-height: 1.3;
}

/* ===== 表格缩略图 ===== */
.thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

/* ===== 弹层 ===== */
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

/* ===== 活动面板 ===== */
.activity-panel {
  font-size: 15px;
  text-align: left;
}

.activity-panel button {
  text-align: left;
}

/* ===== 窄屏：头像居中、信息占满整宽 ===== */
@media (max-width: 640px) {
  .title-grid { grid-template-columns: minmax(0, 1fr); }
  .profile-head {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .profile-head-main {
    width: 100%;
    align-items: stretch;
  }

  .profile-name-row {
    justify-content: center;
  }

  .profile-head-foot {
    justify-content: center;
  }

  .profile-signature {
    max-width: 100%;
  }
}
</style>

