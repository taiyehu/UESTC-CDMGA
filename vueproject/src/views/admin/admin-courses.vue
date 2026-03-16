<template>
  <div>
    <h2 class="page-title">课题管理</h2>

    <NeonRankTable min-width-class="min-w-220" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="w-14 px-2 py-3 text-center">ID</th>
          <th class="w-32 px-2 py-3 text-center">课题名称</th>
          <th class="w-24 px-2 py-3 text-center">类别</th>
          <th class="w-32 px-2 py-3 text-center">开始时间</th>
          <th class="w-32 px-2 py-3 text-center">结束时间</th>
          <th class="px-2 py-3 text-center" style="width: 36rem">描述</th>
          <th class="w-32 px-3 py-3 text-center">图片</th>
          <th class="w-40 px-3 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="course in courses" :key="course.id" class="border-t border-white/12">
        <td class="px-2 py-3 text-center">{{ course.id }}</td>
        <td class="px-2 py-3">
          <input v-model="course.title" class="inline-input" placeholder="课题名称" />
        </td>
        <td class="px-2 py-3">
          <select v-model="course.category" class="inline-select">
            <option v-if="!isPresetCategory(course.category)" :value="course.category">{{ course.category }}</option>
            <option value="typical">typical</option>
            <option value="bingo">bingo</option>
            <option value="legacy">legacy</option>
          </select>
        </td>
        <td class="px-2 py-3">
          <NeonDateTimePicker v-model="course.startTime" placeholder="开始时间" />
        </td>
        <td class="px-2 py-3">
          <NeonDateTimePicker v-model="course.endTime" placeholder="结束时间" />
        </td>
        <td class="px-2 py-3 align-top">
          <textarea v-model="course.description" class="desc-editor" rows="4" placeholder="课题描述" />
        </td>
        <td class="px-3 py-3 text-center">
          <div class="flex flex-col items-center gap-2">
            <img
              v-if="course.image"
              :src="getImageUrl(course.image)"
              alt="课题图片"
              class="thumb mx-auto"
              @click="openPreview(getImageUrl(course.image))"
            />
            <span v-else>-</span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              :id="`course-img-${course.id}`"
              :disabled="Boolean(uploadingImageMap[course.id])"
              @change="onPickImage($event, course)"
            />
            <NeonActionButton
              size="sm"
              variant="blue"
              :disabled="Boolean(uploadingImageMap[course.id])"
              @click="triggerPick(`course-img-${course.id}`)"
            >
              {{ uploadingImageMap[course.id] ? '上传中...' : '重新上传' }}
            </NeonActionButton>
          </div>
        </td>
        <td class="px-3 py-3 text-center">
          <div class="action-group">
            <NeonActionButton size="sm" variant="green" :loading="Boolean(savingMap[course.id])" @click="saveCourse(course)">保存</NeonActionButton>
            <NeonActionButton size="sm" variant="red" @click="deleteCourse(course.id)">删除</NeonActionButton>
          </div>
        </td>
      </tr>
    </NeonRankTable>

    <div class="mt-4 flex items-center justify-end gap-2">
      <NeonActionButton size="sm" :disabled="currentPage <= 1" @click="handlePageChange(currentPage - 1)">上一页</NeonActionButton>
      <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}</span>
      <NeonActionButton size="sm" :disabled="currentPage >= totalPages" @click="handlePageChange(currentPage + 1)">下一页</NeonActionButton>
    </div>

    <teleport to="body">
      <div v-if="previewVisible" class="preview-mask" @click.self="previewVisible = false">
        <div class="preview-wrap">
          <NeonActionButton size="sm" class="mb-3" @click="previewVisible = false">关闭</NeonActionButton>
          <img :src="previewImage" alt="图片预览" class="preview-image" />
        </div>
      </div>
    </teleport>

  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAllCourseData, deleteCourseData, updateCourseData, uploadCourseImage } from '@/api/course'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import NeonDateTimePicker from '@/components/NeonDateTimePicker.vue'

type CourseRow = {
  id: number
  title: string
  category: string
  startTime: string | null
  endTime: string | null
  description: string
  image: string
}

const courses = ref<CourseRow[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const previewVisible = ref(false)
const previewImage = ref('')
const savingMap = reactive<Record<number, boolean>>({})
const uploadingImageMap = reactive<Record<number, boolean>>({})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function openPreview(src: string): void {
  previewImage.value = src
  previewVisible.value = true
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function normalizeDateTime(value: any): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function isPresetCategory(category: string): boolean {
  return category === 'typical' || category === 'bingo' || category === 'legacy'
}

function toCourseRow(course: any): CourseRow {
  return {
    id: Number(course?.id),
    title: String(course?.title || ''),
    category: String(course?.category || 'typical'),
    startTime: normalizeDateTime(course?.start_time || course?.startTime),
    endTime: normalizeDateTime(course?.end_time || course?.endTime),
    description: String(course?.description || ''),
    image: String(course?.image || ''),
  }
}

function triggerPick(inputId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null
  input?.click()
}

async function onPickImage(event: Event, row: CourseRow): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploadingImageMap[row.id] = true
  try {
    const imageUrl = await uploadCourseImage(file)
    row.image = imageUrl
    ElMessage({ message: `课题 #${row.id} 图片已更新`, type: 'success' })
  } catch (e: any) {
    ElMessage({ message: e?.message || '图片上传失败', type: 'error' })
  } finally {
    uploadingImageMap[row.id] = false
  }
}

async function fetchCourses(): Promise<void> {
  try {
    const response = await fetchAllCourseData({ page: currentPage.value, size: pageSize.value })
    const list = Array.isArray(response.data?.list) ? response.data.list : []
    courses.value = list.map((item: any) => toCourseRow(item))
    total.value = response.data.total || 0
  } catch {
    courses.value = []
    ElMessage({ message: '获取课题信息失败', type: 'error' })
  }
}

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
  fetchCourses()
}

async function deleteCourse(courseId: number): Promise<void> {
  if (!window.confirm('确定删除该课题吗？')) return

  try {
    const response = await deleteCourseData(courseId)
    if (response.status === 204) {
      ElMessage({ message: '课题删除成功', type: 'success' })
      await fetchCourses()
    } else {
      ElMessage({ message: '删除失败', type: 'error' })
    }
  } catch {
    ElMessage({ message: '删除失败', type: 'error' })
  }
}

async function saveCourse(course: CourseRow): Promise<void> {
  if (savingMap[course.id]) return

  const payload = {
    id: course.id,
    title: course.title.trim(),
    category: course.category.trim(),
    startTime: course.startTime,
    endTime: course.endTime,
    description: course.description.trim(),
    image: course.image.trim(),
  }

  if (!payload.id || !payload.title || !payload.category || !payload.startTime || !payload.endTime || !payload.description || !payload.image) {
    ElMessage({ message: '请填写所有必填项', type: 'error' })
    return
  }

  savingMap[course.id] = true
  try {
    const response = await updateCourseData(payload.id, {
      title: payload.title,
      category: payload.category,
      startTime: payload.startTime,
      endTime: payload.endTime,
      description: payload.description,
      image: payload.image,
    })

    if (response.data?.code === 0) {
      ElMessage({ message: '课题修改成功', type: 'success' })
      course.title = payload.title
      course.category = payload.category
      course.description = payload.description
      course.image = payload.image
    } else {
      ElMessage({ message: response.data?.message || '课题修改失败', type: 'error' })
    }
  } catch {
    ElMessage({ message: '课题修改失败', type: 'error' })
  } finally {
    savingMap[course.id] = false
  }
}

onMounted(fetchCourses)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.action-group {
  display: inline-flex;
  gap: 8px;
}

.inline-input,
.inline-select,
.desc-editor {
  width: 100%;
  border: 1px solid rgba(34, 211, 238, 0.42);
  border-radius: 8px;
  padding: 8px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
}

.inline-select {
  min-height: 38px;
}

.desc-editor {
  resize: vertical;
  min-height: 92px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.hidden {
  display: none;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(34, 211, 238, 0.35);
  cursor: zoom-in;
}

.preview-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.72);
  padding: 20px;
}

.preview-wrap {
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
</style>
