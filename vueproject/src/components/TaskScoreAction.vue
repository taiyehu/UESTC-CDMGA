<template>
  <div class="task-score-action">
    <button
      type="button"
      class="submit-button"
      :disabled="isActionDisabled"
      @click="handleMainAction"
    >
      {{ mainButtonText }}
    </button>

    <el-dialog
      v-model="viewDialogVisible"
      title="成绩详情"
      width="50%"
      @close="closeViewDialog"
    >
      <el-descriptions border :column="1">
        <el-descriptions-item label="课题名称">
          {{ course.title || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="课题类别">
          {{ course.category || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="子题编号">
          {{ bingoCell ? `Bingo #${bingoCell}` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="成绩状态">
          {{ selectedScore && selectedScore.isScored ? '已评分' : '未评分' }}
        </el-descriptions-item>
        <el-descriptions-item label="得分">
          {{ selectedScore && selectedScore.isScored ? selectedScore.score : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="补充说明">
          {{ selectedScore?.remark || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="成绩图片">
          <template v-if="selectedScore?.image">
            <img
              :src="getImageUrl(selectedScore.image)"
              alt="成绩图片"
              style="width: 160px; height: auto; border-radius: 4px; cursor: pointer"
              @click="handleImageClick(getImageUrl(selectedScore.image))"
            />
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="previewVisible" width="auto" :show-close="true" center>
      <img
        :src="previewImage"
        alt="预览图片"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>

    <el-dialog
      v-model="submitDialogVisible"
      title="提交成绩"
      width="42%"
      @close="closeSubmitDialog"
    >
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="课题名称">
          <el-input v-model="submitForm.course_title" disabled />
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="submitForm.course_id" disabled />
        </el-form-item>
        <el-form-item v-if="bingoCell" label="Bingo子题">
          <el-input :model-value="`#${bingoCell}`" disabled />
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            type="textarea"
            v-model="submitForm.remark"
            placeholder="可选，填写补充说明"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/score/upload"
            name="image"
            :file-list="imageFileList"
            list-type="picture-card"
            :on-success="handleImageUploadSuccess"
            :before-upload="beforeImageUpload"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeSubmitDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认提交</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="updateDialogVisible"
      title="更新成绩"
      width="42%"
      @close="closeUpdateDialog"
    >
      <el-form :model="updateForm" label-width="100px">
        <el-form-item label="课题名称">
          <el-input v-model="updateForm.course_title" disabled />
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="updateForm.course_id" disabled />
        </el-form-item>
        <el-form-item v-if="bingoCell" label="Bingo子题">
          <el-input :model-value="`#${bingoCell}`" disabled />
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            type="textarea"
            v-model="updateForm.remark"
            placeholder="可选，填写补充说明"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/score/upload"
            name="image"
            :file-list="imageFileList"
            list-type="picture-card"
            :on-success="handleImageUpdateSuccess"
            :before-upload="beforeImageUpload"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeUpdateDialog">取消</el-button>
          <el-button type="primary" @click="handleUpdate">确认更新</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Course } from '@/api/types'
import { checkSubmitted, handleSubmitScore, handleUpdateScore } from '@/api/score'
import { compressImage } from '@/components/imageCompressor'

const props = defineProps<{
  course: Course
  bingoCell?: number
}>()

const submitted = ref(false)
const scored = ref(false)
const scoreId = ref<number | null>(null)
const selectedScore = ref<Record<string, any> | null>(null)

const viewDialogVisible = ref(false)
const submitDialogVisible = ref(false)
const updateDialogVisible = ref(false)
const previewVisible = ref(false)
const previewImage = ref('')
const imageFileList = ref<any[]>([])
const nowTimestamp = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

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

const mainButtonText = computed(() => {
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

const isActionDisabled = computed(() => !isWithinCourseTime.value && !scored.value)

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

function getImageUrl(imagePath?: string) {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function handleImageClick(imgUrl: string) {
  previewImage.value = imgUrl
  previewVisible.value = true
}

function buildBingoRemarkPrefix() {
  return props.bingoCell ? `[Bingo 子题 #${props.bingoCell}] ` : ''
}

async function refreshStatus() {
  const identityId = getCurrentIdentityId()
  if (!identityId) {
    submitted.value = false
    scored.value = false
    scoreId.value = null
    selectedScore.value = null
    return
  }

  const submittedRes = await checkSubmitted(identityId, props.course.id)
  submitted.value = Boolean(submittedRes?.data)

  if (!submitted.value) {
    scored.value = false
    scoreId.value = null
    selectedScore.value = null
    return
  }

  const scoreIdRes = await axios.get('/api/score/find', {
    params: { identity_id: identityId, course_id: props.course.id },
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

async function handleMainAction() {
  try {
    await refreshStatus()
    if (scored.value) {
      viewDialogVisible.value = true
      return
    }

    if (submitted.value) {
      await openUpdateDialog()
      return
    }

    openSubmitDialog()
  } catch (error: any) {
    ElMessage({ message: error?.message || '获取成绩状态失败', type: 'error' })
  }
}

function openSubmitDialog() {
  submitForm.course_id = String(props.course.id)
  submitForm.course_title = props.course.title
  submitForm.upload_time = ''
  submitForm.remark = buildBingoRemarkPrefix()
  submitForm.image = ''
  imageFileList.value = []
  submitDialogVisible.value = true
}

function closeSubmitDialog() {
  submitDialogVisible.value = false
}

async function openUpdateDialog() {
  const identityId = getCurrentIdentityId()
  if (!identityId) {
    ElMessage({ message: '未获取到用户信息，请重新登录', type: 'error' })
    return
  }

  if (!scoreId.value) {
    const response = await axios.get('/api/score/find', {
      params: { identity_id: identityId, course_id: props.course.id },
    })
    scoreId.value = Number(response.data)
  }

  updateForm.score_id = Number(scoreId.value || 0)
  updateForm.course_id = String(props.course.id)
  updateForm.course_title = props.course.title
  updateForm.create_at = props.course.createdAt
  updateForm.upload_time = ''
  updateForm.image = ''
  updateForm.remark = buildBingoRemarkPrefix()
  imageFileList.value = []
  updateDialogVisible.value = true
}

function closeUpdateDialog() {
  updateDialogVisible.value = false
}

function closeViewDialog() {
  viewDialogVisible.value = false
}

async function handleSubmit() {
  try {
    const identityId = getCurrentIdentityId()
    if (!identityId) {
      ElMessage({ message: '未获取到用户信息，请重新登录', type: 'error' })
      return
    }

    submitForm.upload_time = new Date().toISOString()
    const submitData = {
      course_id: submitForm.course_id,
      identity_id: identityId,
      upload_time: submitForm.upload_time,
      image: submitForm.image,
      remark: submitForm.remark,
    }

    await handleSubmitScore(submitData)
    ElMessage({ message: '成绩提交成功', type: 'success' })
    closeSubmitDialog()
    await refreshStatus()
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '成绩提交失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  }
}

async function handleUpdate() {
  try {
    if (!updateForm.score_id) {
      ElMessage({ message: '未找到可更新成绩记录', type: 'error' })
      return
    }

    updateForm.upload_time = new Date().toISOString()
    const updateData = {
      upload_time: updateForm.upload_time,
      created_at: updateForm.create_at,
      image: updateForm.image,
      score: 0,
      is_scored: false,
      id: updateForm.score_id,
      remark: updateForm.remark,
    }

    await handleUpdateScore(updateData, updateForm.score_id)
    ElMessage({ message: '成绩更新成功', type: 'success' })
    closeUpdateDialog()
    await refreshStatus()
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '成绩更新失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  }
}

function resolveUploadUrl(response: any): string {
  if (response && response.code === 0) return String(response.data || '')
  if (response && response.data && response.data.code === 0) {
    return String(response.data.data || '')
  }
  return ''
}

function handleImageUploadSuccess(response: any, _file: any, fileListParam: any[]) {
  const url = resolveUploadUrl(response)
  if (url) {
    submitForm.image = url
    imageFileList.value = fileListParam
    ElMessage({ message: '图片上传成功', type: 'success' })
  } else {
    ElMessage({ message: response?.message || response?.data?.message || '图片上传失败', type: 'error' })
  }
}

function handleImageUpdateSuccess(response: any, _file: any, fileListParam: any[]) {
  const url = resolveUploadUrl(response)
  if (url) {
    updateForm.image = url
    imageFileList.value = fileListParam
    ElMessage({ message: '图片上传成功', type: 'success' })
  } else {
    ElMessage({ message: response?.message || response?.data?.message || '图片上传失败', type: 'error' })
  }
}

async function beforeImageUpload(file: any) {
  try {
    if (!file.type.startsWith('image/')) {
      ElMessage({ message: '只能上传图片文件', type: 'error' })
      return false
    }
    const compressed = await compressImage(file)
    return compressed
  } catch (err: any) {
    ElMessage({ message: `图片压缩失败: ${err?.message || ''}`, type: 'error' })
    return false
  }
}

onMounted(() => {
  timer = setInterval(() => {
    nowTimestamp.value = Date.now()
  }, 30 * 1000)

  refreshStatus()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.submit-button {
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-radius: 10px;
  padding: 9px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease;
}

.submit-button:hover {
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
</style>
