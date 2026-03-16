<template>
  <div class="task-score-action">
    <button
      type="button"
      :class="['submit-button', mainButtonStateClass]"
      :disabled="isActionDisabled"
      @click="handleMainAction"
    >
      {{ mainButtonText }}
    </button>

    <p v-if="feedback.message" :class="['mt-2 text-sm', feedback.type === 'error' ? 'text-rose-300' : 'text-cyan-100/80']">
      {{ feedback.message }}
    </p>

    <div v-if="isBingoMode" class="mt-4">
      <NeonRankTable min-width-class="min-w-220" text-size-class="text-sm">
        <template #head>
          <tr>
            <th class="px-3 py-2 text-center">提交时间</th>
            <th class="px-3 py-2 text-center">图片</th>
            <th class="px-3 py-2 text-center">说明</th>
            <th class="px-3 py-2 text-center">状态</th>
          </tr>
        </template>

        <tr v-if="!historyLoaded" class="border-t border-white/12">
          <td colspan="4" class="px-3 py-3 text-center text-cyan-100/70">等待连接</td>
        </tr>

        <tr v-else-if="historyRows.length === 0" class="border-t border-white/12">
          <td colspan="4" class="px-3 py-3 text-center text-cyan-100/70">暂无提交记录</td>
        </tr>

        <tr v-for="row in historyRows" :key="row.id" class="border-t border-white/12">
          <td class="px-3 py-3 text-center">{{ formatDateTime(row.uploadTime) }}</td>
          <td class="px-3 py-3 text-center">
            <img
              v-if="row.image"
              :src="getImageUrl(row.image)"
              alt="提交图片"
              class="history-thumb"
              @click="openPreview(getImageUrl(row.image))"
            />
            <span v-else>-</span>
          </td>
          <td class="px-3 py-3 text-center">{{ row.remark || '-' }}</td>
          <td class="px-3 py-3 text-center">
            <span class="score-tag" :class="scoreTagClass(row)">{{ scoreTagText(row) }}</span>
          </td>
        </tr>
      </NeonRankTable>
    </div>

    <teleport to="body">
      <div v-if="activeModal" class="score-modal-mask" @click.self="closeActiveModal">
        <div class="score-modal-panel">
          <div class="mb-4 flex items-center justify-between gap-3 border-b border-cyan-300/20 pb-3">
            <h3 class="text-lg font-semibold text-cyan-100">{{ modalTitle }}</h3>
            <button type="button" class="modal-close" @click="closeActiveModal">关闭</button>
          </div>

          <template v-if="activeModal === 'view'">
            <div class="info-grid">
              <div class="info-row">
                <span class="label">课题名称</span>
                <span class="value">{{ course.title || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">课题类别</span>
                <span class="value">{{ course.category || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">子题编号</span>
                <span class="value">{{ bingoCell ? `Bingo #${bingoCell}` : '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">成绩状态</span>
                <span class="value">{{ selectedScore && selectedScore.isScored ? '已评分' : '未评分' }}</span>
              </div>
              <div class="info-row">
                <span class="label">得分</span>
                <span class="value">{{ selectedScore && selectedScore.isScored ? selectedScore.score : '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">补充说明</span>
                <span class="value">{{ selectedScore?.remark || '-' }}</span>
              </div>
              <div class="info-row column">
                <span class="label">成绩图片</span>
                <div class="value">
                  <img
                    v-if="selectedScore?.image"
                    :src="getImageUrl(selectedScore.image)"
                    alt="成绩图片"
                    class="score-image"
                    @click="openPreview(getImageUrl(selectedScore.image))"
                  />
                  <span v-else>-</span>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="space-y-4">
              <div>
                <p class="mb-1 text-sm text-cyan-100/85">课题名称</p>
                <NeonInput :model-value="formCourseTitle" disabled />
              </div>

              <div>
                <p class="mb-1 text-sm text-cyan-100/85">课题ID</p>
                <NeonInput :model-value="formCourseId" disabled />
              </div>

              <div v-if="bingoCell">
                <p class="mb-1 text-sm text-cyan-100/85">Bingo子题</p>
                <NeonInput :model-value="`#${bingoCell}`" disabled />
              </div>

              <div>
                <p class="mb-1 text-sm text-cyan-100/85">补充说明</p>
                <NeonInput
                  v-if="activeModal === 'submit'"
                  v-model="submitForm.remark"
                  textarea
                  :rows="4"
                  :maxlength="500"
                  show-count
                  placeholder="可选，填写补充说明"
                />
                <NeonInput
                  v-else
                  v-model="updateForm.remark"
                  textarea
                  :rows="4"
                  :maxlength="500"
                  show-count
                  placeholder="可选，填写补充说明"
                />
              </div>

              <div>
                <p class="mb-1 text-sm text-cyan-100/85">上传图片</p>
                <ScoreImageUploader
                  v-if="activeModal === 'submit'"
                  ref="submitUploaderRef"
                  v-model="submitForm.image"
                  :upload-on-select="false"
                  @error="setFeedback('error', $event)"
                />
                <ScoreImageUploader
                  v-else
                  ref="updateUploaderRef"
                  v-model="updateForm.image"
                  :upload-on-select="false"
                  @error="setFeedback('error', $event)"
                />
              </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-3">
              <button type="button" class="modal-close" @click="closeActiveModal">取消</button>
              <button type="button" class="submit-button" @click="activeModal === 'submit' ? handleSubmit() : handleUpdate()">
                {{ activeModal === 'submit' ? '确认提交' : '确认更新' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="previewVisible" class="score-modal-mask" @click.self="previewVisible = false">
        <div class="preview-panel">
          <button type="button" class="modal-close mb-3" @click="previewVisible = false">关闭</button>
          <img :src="previewImage" alt="预览图片" class="preview-image" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { Course } from '@/api/types'
import { checkSubmitted, fetchScoreHistory, handleSubmitScore, handleUpdateScore } from '@/api/score'
import NeonInput from '@/components/NeonInput.vue'
import NeonRankTable from '@/components/NeonRankTable.vue'
import ScoreImageUploader from '@/components/ScoreImageUploader.vue'

type ActiveModal = 'view' | 'submit' | 'update' | null
type ScoreImageUploaderExpose = {
  uploadNow: () => Promise<string>
  clearSelection: () => void
}

const props = defineProps<{
  course: Course
  bingoCell?: number
}>()

const submitted = ref(false)
const scored = ref(false)
const scoreId = ref<number | null>(null)
const selectedScore = ref<Record<string, any> | null>(null)

const activeModal = ref<ActiveModal>(null)
const submitUploaderRef = ref<ScoreImageUploaderExpose | null>(null)
const updateUploaderRef = ref<ScoreImageUploaderExpose | null>(null)
const previewVisible = ref(false)
const previewImage = ref('')
const nowTimestamp = ref(Date.now())
const historyLoaded = ref(false)
const historyRows = ref<Record<string, any>[]>([])
const bingoActionState = ref<'connecting' | 'no-team' | 'pending' | 'ready' | 'done'>('connecting')
let timer: ReturnType<typeof setInterval> | null = null

const feedback = reactive<{ type: 'ok' | 'error'; message: string }>({
  type: 'ok',
  message: '',
})

const submitForm = reactive({
  course_id: '',
  course_title: '',
  upload_time: '',
  remark: '',
  image: '',
})

const updateForm = reactive({
  score_id: 0,
  course_id: '',
  course_title: '',
  create_at: '',
  upload_time: '',
  remark: '',
  image: '',
})

const modalTitle = computed(() => {
  if (activeModal.value === 'view') return '成绩详情'
  if (activeModal.value === 'update') return '更新成绩'
  return '提交成绩'
})

const isBingoMode = computed(() => currentIssueId.value !== undefined)

const mainButtonStateClass = computed(() => {
  if (!isBingoMode.value) return ''
  if (bingoActionState.value === 'done') return 'is-done'
  return ''
})

const mainButtonText = computed(() => {
  if (isBingoMode.value) {
    if (bingoActionState.value === 'connecting') return '等待连接'
    if (bingoActionState.value === 'no-team') return '请先加入队伍'
    if (bingoActionState.value === 'pending') return '成绩审核中'
    if (bingoActionState.value === 'done') return '已完成'
    const issueText = `第${props.bingoCell}题`
    return historyRows.value.length > 0 ? `重新提交${issueText}` : `提交${issueText}`
  }
  if (!isWithinCourseTime.value && !scored.value) return '不在课题时间'
  if (scored.value) return '查看已评分成绩'
  if (submitted.value) return '更新成绩'
  return props.bingoCell ? '提交该子题成绩' : '提交该课题成绩'
})

const isWithinCourseTime = computed(() => {
  const start = new Date(props.course.startTime).getTime()
  const end = new Date(props.course.endTime).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) return true
  return nowTimestamp.value >= start && nowTimestamp.value <= end
})

const isActionDisabled = computed(() => {
  if (isBingoMode.value) {
    return bingoActionState.value !== 'ready'
  }
  return !isWithinCourseTime.value && !scored.value
})

const currentIssueId = computed<number | undefined>(() => {
  if (props.bingoCell === undefined || props.bingoCell === null) return undefined
  const issueId = Number(props.bingoCell)
  if (!Number.isFinite(issueId)) return undefined
  return issueId
})

const formCourseTitle = computed(() => {
  if (activeModal.value === 'update') return updateForm.course_title
  return submitForm.course_title
})

const formCourseId = computed(() => {
  if (activeModal.value === 'update') return updateForm.course_id
  return submitForm.course_id
})

function setFeedback(type: 'ok' | 'error', message: string): void {
  feedback.type = type
  feedback.message = message
}

function clearFeedback(): void {
  feedback.message = ''
}

function getCurrentIdentityId(): number | null {
  try {
    const userInfo = sessionStorage.getItem('userInfo')
    if (!userInfo) return null
    const user = JSON.parse(userInfo)
    return user.id ? Number(user.id) : null
  } catch {
    return null
  }
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function openPreview(imgUrl: string): void {
  previewImage.value = imgUrl
  previewVisible.value = true
}

function buildBingoRemarkPrefix(): string {
  return props.bingoCell ? `[Bingo 子题 #${props.bingoCell}] ` : ''
}

async function refreshStatus(): Promise<void> {
  if (isBingoMode.value) {
    await refreshBingoStatus()
    return
  }

  const identityId = getCurrentIdentityId()
  if (!identityId) {
    submitted.value = false
    scored.value = false
    scoreId.value = null
    selectedScore.value = null
    return
  }

  const submittedRes = await checkSubmitted(identityId, props.course.id, currentIssueId.value)
  submitted.value = Boolean(submittedRes?.data)

  if (!submitted.value) {
    scored.value = false
    scoreId.value = null
    selectedScore.value = null
    return
  }

  const scoreIdRes = await axios.get('/api/score/find', {
    params: {
      identity_id: identityId,
      course_id: props.course.id,
      ...(currentIssueId.value !== undefined ? { issue_id: currentIssueId.value } : {}),
    },
  })

  const foundScoreId = Number(scoreIdRes.data)
  if (!Number.isFinite(foundScoreId) || foundScoreId <= 0) {
    scoreId.value = null
    scored.value = false
    selectedScore.value = null
    return
  }

  scoreId.value = foundScoreId
  const scoreRes = await axios.get(`/api/score/${foundScoreId}`)
  selectedScore.value = scoreRes.data
  scored.value = Boolean(scoreRes.data?.isScored) && !Boolean(scoreRes.data?.isDeleted)
}

async function refreshBingoStatus(): Promise<void> {
  const identityId = getCurrentIdentityId()
  historyLoaded.value = false
  historyRows.value = []
  bingoActionState.value = 'connecting'

  if (!identityId) {
    historyLoaded.value = true
    bingoActionState.value = 'no-team'
    setFeedback('error', '未获取到用户信息，请重新登录')
    return
  }

  const res = await fetchScoreHistory(identityId, props.course.id, currentIssueId.value)
  const payload = res?.data || {}
  const hasTeam = Boolean(payload?.hasTeam)
  const list = Array.isArray(payload?.list) ? payload.list : []
  historyRows.value = list
  historyLoaded.value = true

  if (!hasTeam) {
    bingoActionState.value = 'no-team'
    return
  }

  const hasPending = list.some((item: any) => !Boolean(item?.isScored))
  const hasPositive = list.some((item: any) => Number(item?.score) > 0)

  if (hasPending) {
    bingoActionState.value = 'pending'
  } else if (hasPositive) {
    bingoActionState.value = 'done'
  } else {
    bingoActionState.value = 'ready'
  }
}

async function handleMainAction(): Promise<void> {
  clearFeedback()
  try {
    await refreshStatus()

    if (isBingoMode.value) {
      if (bingoActionState.value !== 'ready') return
      openSubmitDialog()
      return
    }

    if (scored.value) {
      activeModal.value = 'view'
      return
    }

    if (submitted.value) {
      await openUpdateDialog()
      return
    }

    openSubmitDialog()
  } catch (error: any) {
    setFeedback('error', error?.message || '获取成绩状态失败')
  }
}

function openSubmitDialog(): void {
  submitForm.course_id = String(props.course.id)
  submitForm.course_title = props.course.title
  submitForm.upload_time = ''
  submitForm.remark = buildBingoRemarkPrefix()
  submitForm.image = ''
  activeModal.value = 'submit'
}

async function openUpdateDialog(): Promise<void> {
  const identityId = getCurrentIdentityId()
  if (!identityId) {
    setFeedback('error', '未获取到用户信息，请重新登录')
    return
  }

  if (!scoreId.value) {
    const response = await axios.get('/api/score/find', {
      params: {
        identity_id: identityId,
        course_id: props.course.id,
        ...(currentIssueId.value !== undefined ? { issue_id: currentIssueId.value } : {}),
      },
    })
    scoreId.value = Number(response.data)
  }

  updateForm.score_id = Number(scoreId.value || 0)
  updateForm.course_id = String(props.course.id)
  updateForm.course_title = props.course.title
  updateForm.create_at = props.course.createdAt || ''
  updateForm.upload_time = ''
  updateForm.image = selectedScore.value?.image || ''
  updateForm.remark = selectedScore.value?.remark || buildBingoRemarkPrefix()
  activeModal.value = 'update'
}

function closeActiveModal(): void {
  activeModal.value = null
}

async function handleSubmit(): Promise<void> {
  try {
    const identityId = getCurrentIdentityId()
    if (!identityId) {
      setFeedback('error', '未获取到用户信息，请重新登录')
      return
    }

    const imageUrl = await submitUploaderRef.value?.uploadNow()
    if (imageUrl) {
      submitForm.image = imageUrl
    }

    submitForm.upload_time = new Date().toISOString()
    const submitData = {
      course_id: submitForm.course_id,
      identity_id: identityId,
      ...(currentIssueId.value !== undefined ? { issue_id: currentIssueId.value } : {}),
      upload_time: submitForm.upload_time,
      image: submitForm.image,
      remark: submitForm.remark,
    }

    await handleSubmitScore(submitData)
    setFeedback('ok', '成绩提交成功')
    closeActiveModal()
    await refreshStatus()
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '成绩提交失败，请重试'
    setFeedback('error', errorMsg)
  }
}

function formatDateTime(value: any): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

function scoreTagText(row: Record<string, any>): string {
  if (!row?.isScored) return '审核中'
  const value = Number(row?.score)
  if (value === -2) return '曲目不对'
  if (value === -1) return '方法不对'
  if (value > 0) return `${value}分`
  return '-'
}

function scoreTagClass(row: Record<string, any>): string {
  if (!row?.isScored) return 'is-pending'
  const value = Number(row?.score)
  if (value === 5) return 'is-gold'
  if (value === 3) return 'is-pink'
  if (value === 2) return 'is-green'
  if (value < 0) return 'is-bad'
  return ''
}

async function handleUpdate(): Promise<void> {
  try {
    if (!updateForm.score_id) {
      setFeedback('error', '未找到可更新成绩记录')
      return
    }

    const imageUrl = await updateUploaderRef.value?.uploadNow()
    if (imageUrl) {
      updateForm.image = imageUrl
    }

    updateForm.upload_time = new Date().toISOString()
    const updateData = {
      upload_time: updateForm.upload_time,
      created_at: updateForm.create_at,
      image: updateForm.image,
      score: 0,
      is_scored: false,
      id: updateForm.score_id,
      ...(currentIssueId.value !== undefined ? { issue_id: currentIssueId.value } : {}),
      remark: updateForm.remark,
    }

    await handleUpdateScore(updateData, updateForm.score_id)
    setFeedback('ok', '成绩更新成功')
    closeActiveModal()
    await refreshStatus()
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '成绩更新失败，请重试'
    setFeedback('error', errorMsg)
  }
}

onMounted(() => {
  timer = setInterval(() => {
    nowTimestamp.value = Date.now()
  }, 30 * 1000)

  refreshStatus().catch((err: any) => {
    setFeedback('error', err?.message || '成绩状态加载失败')
  })
})

watch(
  [() => props.course.id, () => props.bingoCell],
  () => {
    refreshStatus().catch((err: any) => {
      setFeedback('error', err?.message || '成绩状态加载失败')
    })
  }
)

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.submit-button,
.modal-close {
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-radius: 10px;
  padding: 9px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease;
}

.submit-button:hover,
.modal-close:hover {
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 18px rgba(217, 70, 239, 0.18);
}

.submit-button:disabled {
  border-color: rgba(148, 163, 184, 0.45);
  color: rgba(226, 232, 240, 0.75);
  background: rgba(71, 85, 105, 0.45);
  cursor: not-allowed;
  box-shadow: none;
}

.submit-button.is-done,
.submit-button.is-done:disabled {
  border-color: rgba(251, 191, 36, 0.75);
  color: #fff8d6;
  background: linear-gradient(145deg, rgba(245, 193, 49, 0.74), rgba(213, 154, 18, 0.62));
  box-shadow:
    0 0 14px rgba(251, 191, 36, 0.28),
    0 0 18px rgba(245, 158, 11, 0.2);
}

.score-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.72);
  padding: 20px;
}

.score-modal-panel {
  width: min(720px, 96vw);
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.94), rgba(23, 12, 42, 0.9));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.2),
    0 0 46px rgba(217, 70, 239, 0.1);
  backdrop-filter: blur(10px);
  padding: 18px;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: start;
}

.info-row.column {
  grid-template-columns: 1fr;
}

.label {
  color: rgba(165, 243, 252, 0.86);
  font-size: 13px;
}

.value {
  color: rgba(236, 254, 255, 0.92);
  line-height: 1.65;
}

.score-image {
  width: 160px;
  border-radius: 8px;
  cursor: zoom-in;
}

.preview-panel {
  width: min(900px, 96vw);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.preview-image {
  width: 100%;
  max-height: 82vh;
  object-fit: contain;
  border-radius: 10px;
}

.history-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(34, 211, 238, 0.35);
  cursor: zoom-in;
  margin: 0 auto;
}

.score-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  color: rgba(226, 232, 240, 0.9);
  background: rgba(51, 65, 85, 0.45);
}

.score-tag.is-pending {
  border-color: rgba(34, 211, 238, 0.6);
  color: #a5f3fc;
  background: rgba(8, 47, 73, 0.45);
}

.score-tag.is-bad {
  border-color: rgba(248, 113, 113, 0.6);
  color: #fecaca;
  background: rgba(127, 29, 29, 0.45);
}

.score-tag.is-gold {
  border-color: rgba(251, 191, 36, 0.75);
  color: #fef3c7;
  background: linear-gradient(145deg, rgba(245, 193, 49, 0.74), rgba(213, 154, 18, 0.62));
}

.score-tag.is-pink {
  border-color: rgba(244, 114, 182, 0.75);
  color: #fce7f3;
  background: rgba(131, 24, 67, 0.52);
}

.score-tag.is-green {
  border-color: rgba(74, 222, 128, 0.75);
  color: #dcfce7;
  background: rgba(20, 83, 45, 0.55);
}
</style>
