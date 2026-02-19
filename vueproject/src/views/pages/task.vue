<template>
  <div class="main-content">
    <h1>课题列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div v-for="course in courses" :key="course.id" class="course-item">
        <h2>{{ course.title }}</h2>
        <p>类别: {{ course.category }}</p>
        <p>开始时间: {{ formatDate(course.startTime) }}</p>
        <p>结束时间: {{ formatDate(course.endTime) }}</p>
        <p>描述: {{ course.description }}</p>
        <img
          :src="getImageUrl(course.image)"
          alt="课程图片"
          v-if="course.image"
          class="course-image"
          @click="handleImageClick(getImageUrl(course.image))"
        />
      </div>
    </div>
    <el-dialog v-model="previewVisible" width="auto" :show-close="true" center>
      <img
        :src="previewImage"
        alt="预览图片"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { fetchCourseData } from '@/api/course'

const courses = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const previewVisible = ref(false)
const previewImage = ref('')

async function fetchCourses() {
  try {
    const response = await fetchCourseData()
    const data = response.data || []
    courses.value = data.sort(
      (a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  } catch (err: any) {
    error.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
}

function handleImageClick(imgUrl: string) {
  previewImage.value = imgUrl
  previewVisible.value = true
}

function formatDate(date: string | number | Date) {
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString('zh-CN', options)
}

function getImageUrl(imagePath?: string) {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.main-content {
  margin-top: var(--navbar-height);
}
.course-item {
  margin-bottom: 32px;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.course-image {
  max-width: 300px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
}
</style>
