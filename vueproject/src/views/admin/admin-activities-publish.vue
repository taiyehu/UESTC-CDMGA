<template>
  <div>
    <h2 class="page-title">发布活动</h2>

    <div class="form-grid">
      <div>
        <p class="label">活动名称</p>
        <NeonInput v-model="newActivity.name" placeholder="请输入活动名称" />
      </div>
      <div>
        <p class="label">开始时间</p>
        <NeonDateTimePicker v-model="newActivity.startTime" placeholder="选择开始时间" />
      </div>
      <div>
        <p class="label">结束时间</p>
        <NeonDateTimePicker v-model="newActivity.endTime" placeholder="选择结束时间" />
      </div>
      <div>
        <p class="label">活动描述</p>
        <NeonInput v-model="newActivity.description" textarea :rows="4" :maxlength="500" show-count placeholder="请输入活动描述" />
      </div>
      <div>
        <p class="label">上传宣传图</p>
        <ScoreImageUploader
          ref="bannerUploaderRef"
          v-model="newActivity.activityBanner"
          :upload-on-select="false"
          action="/api/activity/uploadBanner"
          field-name="banner"
          @error="onUploadError"
        />
      </div>
      <div>
        <p class="label">上传文件</p>
        <el-upload
          action="/api/activity/uploadFile"
          name="file"
          :file-list="fileFileList"
          :on-success="handleFileUploadSuccess"
        >
          <el-button>点击上传</el-button>
        </el-upload>
      </div>
    </div>

    <div class="mt-4 flex gap-3">
      <el-button type="primary" @click="uploadActivity">提交活动</el-button>
      <el-button @click="resetForm">重置</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import NeonInput from '@/components/NeonInput.vue'
import ScoreImageUploader from '@/components/ScoreImageUploader.vue'
import NeonDateTimePicker from '@/components/NeonDateTimePicker.vue'

type ScoreImageUploaderExpose = {
  uploadNow: () => Promise<string>
  clearSelection: () => void
}

const newActivity = reactive<any>({
  name: '',
  startTime: '',
  endTime: '',
  description: '',
  activityBanner: '',
  activityFile: '',
})

const fileFileList = ref<any[]>([])
const bannerUploaderRef = ref<ScoreImageUploaderExpose | null>(null)

function resetForm(): void {
  newActivity.name = ''
  newActivity.startTime = ''
  newActivity.endTime = ''
  newActivity.description = ''
  newActivity.activityBanner = ''
  newActivity.activityFile = ''
  fileFileList.value = []
  bannerUploaderRef.value?.clearSelection()
}

function onUploadError(message: string): void {
  ElMessage({ message, type: 'error' })
}

function handleFileUploadSuccess(response: any, fileListParam: any[]): void {
  if (response && response.code === 0) {
    newActivity.activityFile = response.data
    fileFileList.value = fileListParam
    ElMessage({ message: '文件上传成功', type: 'success' })
  } else {
    ElMessage({ message: '文件上传失败', type: 'error' })
  }
}

async function uploadActivity(): Promise<void> {
  const bannerUrl = await bannerUploaderRef.value?.uploadNow()
  if (bannerUrl) {
    newActivity.activityBanner = bannerUrl
  }

  if (!newActivity.name || !newActivity.startTime || !newActivity.endTime || !newActivity.description || !newActivity.activityBanner || !newActivity.activityFile) {
    ElMessage({ message: '请填写所有必填项', type: 'error' })
    return
  }

  try {
    await axios.post('/api/activity/post', newActivity)
    ElMessage({ message: '活动上传成功', type: 'success' })
    resetForm()
  } catch {
    ElMessage({ message: '上传过程中发生错误', type: 'error' })
  }
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  gap: 14px;
  max-width: 720px;
}

.label {
  margin-bottom: 6px;
  color: rgba(224, 247, 255, 0.92);
  font-size: 14px;
}
</style>
