<template>
  <div>
    <h2 class="page-title">发布内容</h2>

    <div class="form-grid">
      <div>
        <p class="label">发布类型</p>
        <el-select v-model="publishType" class="full-width" placeholder="选择发布类型">
          <el-option label="课题" value="course" />
          <el-option label="活动" value="activity" />
        </el-select>
      </div>

      <div>
        <p class="label">{{ publishType === 'course' ? '课题名称' : '活动名称' }}</p>
        <NeonInput v-model="form.title" :placeholder="publishType === 'course' ? '请输入课题名称' : '请输入活动名称'" />
      </div>

      <div v-if="publishType === 'course'">
        <p class="label">课题类别</p>
        <el-select v-model="form.category" class="full-width" placeholder="请选择课题类别">
          <el-option label="typical" value="typical" />
          <el-option label="bingo" value="bingo" />
          <el-option label="legacy" value="legacy" />
        </el-select>
      </div>

      <div>
        <p class="label">开始时间</p>
        <NeonDateTimePicker v-model="form.startTime" placeholder="选择开始时间" />
      </div>

      <div>
        <p class="label">结束时间</p>
        <NeonDateTimePicker v-model="form.endTime" placeholder="选择结束时间" />
      </div>

      <div>
        <p class="label">{{ publishType === 'course' ? '课题描述' : '活动描述' }}</p>
        <NeonInput v-model="form.description" textarea :rows="4" :maxlength="500" show-count :placeholder="publishType === 'course' ? '请输入课题描述' : '请输入活动描述'" />
      </div>

      <div>
        <p class="label">{{ publishType === 'course' ? '上传图片' : '上传宣传图' }}</p>
        <ScoreImageUploader
          ref="imageUploaderRef"
          v-model="form.image"
          :upload-on-select="false"
          :action="publishType === 'course' ? '/api/course/upload' : '/api/activity/uploadBanner'"
          :field-name="publishType === 'course' ? 'image' : 'banner'"
          @error="onUploadError"
        />
      </div>

      <div v-if="publishType === 'activity'">
        <p class="label">上传文件</p>
        <el-upload action="/api/activity/uploadFile" name="file" :file-list="activityFileList" :on-success="handleFileUploadSuccess">
          <el-button>点击上传</el-button>
        </el-upload>
      </div>
    </div>

    <div class="mt-4 flex gap-3">
      <el-button type="primary" @click="submitContent">提交{{ publishType === 'course' ? '课题' : '活动' }}</el-button>
      <el-button @click="resetForm">重置</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import NeonInput from '@/components/NeonInput.vue'
import ScoreImageUploader from '@/components/ScoreImageUploader.vue'
import NeonDateTimePicker from '@/components/NeonDateTimePicker.vue'

type PublishType = 'course' | 'activity'

type ScoreImageUploaderExpose = {
  uploadNow: () => Promise<string>
  clearSelection: () => void
}

const publishType = ref<PublishType>('course')

const form = reactive({
  title: '',
  category: 'typical',
  startTime: '',
  endTime: '',
  description: '',
  image: '',
  activityFile: '',
})

const imageUploaderRef = ref<ScoreImageUploaderExpose | null>(null)
const activityFileList = ref<any[]>([])

watch(
  () => publishType.value,
  () => {
    resetForm()
  }
)

function resetForm(): void {
  form.title = ''
  form.category = 'typical'
  form.startTime = ''
  form.endTime = ''
  form.description = ''
  form.image = ''
  form.activityFile = ''
  activityFileList.value = []
  imageUploaderRef.value?.clearSelection()
}

function onUploadError(message: string): void {
  ElMessage({ message, type: 'error' })
}

function handleFileUploadSuccess(response: any, fileListParam: any[]): void {
  if (response?.code === 0) {
    form.activityFile = response.data
    activityFileList.value = fileListParam
    ElMessage({ message: '文件上传成功', type: 'success' })
  } else {
    ElMessage({ message: '文件上传失败', type: 'error' })
  }
}

async function submitContent(): Promise<void> {
  const imageUrl = await imageUploaderRef.value?.uploadNow()
  if (imageUrl) {
    form.image = imageUrl
  }

  if (!form.title || !form.startTime || !form.endTime || !form.description || !form.image) {
    ElMessage({ message: '请填写所有必填项', type: 'error' })
    return
  }

  if (publishType.value === 'course') {
    if (!form.category) {
      ElMessage({ message: '请选择课题类别', type: 'error' })
      return
    }
    try {
      const response = await axios.post('/api/course/post', {
        title: form.title,
        category: form.category,
        startTime: dayjs(form.startTime).format('YYYY-MM-DDTHH:mm:ss'),
        endTime: dayjs(form.endTime).format('YYYY-MM-DDTHH:mm:ss'),
        description: form.description,
        image: form.image,
        createTime: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        updateTime: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      })

      if (response.data?.code === 0) {
        ElMessage({ message: '课题发布成功', type: 'success' })
        resetForm()
      } else {
        ElMessage({ message: response.data?.message || '课题发布失败', type: 'error' })
      }
    } catch {
      ElMessage({ message: '发布过程中发生错误', type: 'error' })
    }
    return
  }

  if (!form.activityFile) {
    ElMessage({ message: '请上传活动文件', type: 'error' })
    return
  }

  try {
    await axios.post('/api/activity/post', {
      name: form.title,
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description,
      activityBanner: form.image,
      activityFile: form.activityFile,
    })
    ElMessage({ message: '活动发布成功', type: 'success' })
    resetForm()
  } catch {
    ElMessage({ message: '发布过程中发生错误', type: 'error' })
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

.full-width {
  width: 100%;
}
</style>
