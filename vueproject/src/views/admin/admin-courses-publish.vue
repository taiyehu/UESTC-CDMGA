<template>
  <div>
    <h2 class="page-title">发布课题</h2>

    <div class="form-grid">
      <div>
        <p class="label">课题名称</p>
        <NeonInput v-model="newCourse.title" placeholder="请输入课题名称" />
      </div>
      <div>
        <p class="label">课题类别</p>
        <NeonInput v-model="newCourse.category" placeholder="请输入课题类别" />
      </div>
      <div>
        <p class="label">开始时间</p>
        <NeonDateTimePicker v-model="newCourse.start_time" placeholder="选择开始时间" />
      </div>
      <div>
        <p class="label">结束时间</p>
        <NeonDateTimePicker v-model="newCourse.end_time" placeholder="选择结束时间" />
      </div>
      <div>
        <p class="label">课题描述</p>
        <NeonInput v-model="newCourse.description" textarea :rows="4" :maxlength="500" show-count placeholder="请输入课题描述" />
      </div>
      <div>
        <p class="label">上传图片</p>
        <ScoreImageUploader
          ref="courseImageUploaderRef"
          v-model="newCourse.image"
          :upload-on-select="false"
          action="/api/course/upload"
          field-name="image"
          @error="onUploadError"
        />
      </div>
    </div>

    <div class="mt-4 flex gap-3">
      <el-button type="primary" @click="uploadCourse">提交课题</el-button>
      <el-button @click="resetForm">重置</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import NeonInput from '@/components/NeonInput.vue'
import ScoreImageUploader from '@/components/ScoreImageUploader.vue'
import NeonDateTimePicker from '@/components/NeonDateTimePicker.vue'

type ScoreImageUploaderExpose = {
  uploadNow: () => Promise<string>
  clearSelection: () => void
}

const newCourse = reactive<any>({
  title: '',
  category: '',
  start_time: '',
  end_time: '',
  description: '',
  image: '',
})

const imageFileList = ref<any[]>([])
const courseImageUploaderRef = ref<ScoreImageUploaderExpose | null>(null)

function resetForm(): void {
  newCourse.title = ''
  newCourse.category = ''
  newCourse.start_time = ''
  newCourse.end_time = ''
  newCourse.description = ''
  newCourse.image = ''
  imageFileList.value = []
  courseImageUploaderRef.value?.clearSelection()
}

function onUploadError(message: string): void {
  ElMessage({ message, type: 'error' })
}

async function uploadCourse(): Promise<void> {
  const imageUrl = await courseImageUploaderRef.value?.uploadNow()
  if (imageUrl) {
    newCourse.image = imageUrl
  }

  if (!newCourse.title || !newCourse.category || !newCourse.start_time || !newCourse.end_time || !newCourse.description || !newCourse.image) {
    ElMessage({ message: '请填写所有必填项', type: 'error' })
    return
  }

  try {
    const response = await axios.post('/api/course/post', {
      title: newCourse.title,
      category: newCourse.category,
      startTime: dayjs(newCourse.start_time).format('YYYY-MM-DDTHH:mm:ss'),
      endTime: dayjs(newCourse.end_time).format('YYYY-MM-DDTHH:mm:ss'),
      description: newCourse.description,
      image: newCourse.image,
      createTime: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      updateTime: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    })

    if (response.data?.code === 0) {
      ElMessage({ message: '课题上传成功', type: 'success' })
      resetForm()
    } else {
      ElMessage({ message: response.data?.message || '课题上传失败', type: 'error' })
    }
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
