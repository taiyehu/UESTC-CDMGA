<template>
  <div>
    <h2 class="page-title">课题管理</h2>

    <NeonRankTable min-width-class="min-w-240" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="px-4 py-3 text-center">课题ID</th>
          <th class="px-4 py-3 text-center">课题名称</th>
          <th class="px-4 py-3 text-center">类别</th>
          <th class="px-4 py-3 text-center">开始时间</th>
          <th class="px-4 py-3 text-center">结束时间</th>
          <th class="px-4 py-3 text-center">描述</th>
          <th class="px-4 py-3 text-center">图片</th>
          <th class="px-4 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="course in courses" :key="course.id" class="border-t border-white/12">
        <td class="px-4 py-3 text-center">{{ course.id }}</td>
        <td class="px-4 py-3 text-center">{{ course.title }}</td>
        <td class="px-4 py-3 text-center">{{ course.category }}</td>
        <td class="px-4 py-3 text-center">{{ formatDateTime(course.start_time || course.startTime) }}</td>
        <td class="px-4 py-3 text-center">{{ formatDateTime(course.end_time || course.endTime) }}</td>
        <td class="px-4 py-3 text-center">{{ course.description || '-' }}</td>
        <td class="px-4 py-3 text-center">
          <a v-if="course.image" :href="getImageUrl(course.image)" target="_blank" class="link">查看</a>
          <span v-else>-</span>
        </td>
        <td class="px-4 py-3 text-center">
          <button type="button" class="neon-btn danger" @click="deleteCourse(course.id)">删除</button>
        </td>
      </tr>
    </NeonRankTable>

    <div class="mt-4 flex items-center justify-end gap-2">
      <button type="button" class="neon-btn" :disabled="currentPage <= 1" @click="handlePageChange(currentPage - 1)">上一页</button>
      <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="neon-btn" :disabled="currentPage >= totalPages" @click="handlePageChange(currentPage + 1)">下一页</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAllCourseData, deleteCourseData } from '@/api/course'
import NeonRankTable from '@/components/NeonRankTable.vue'

const courses = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function formatDateTime(value: any): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

async function fetchCourses(): Promise<void> {
  try {
    const response = await fetchAllCourseData({ page: currentPage.value, size: pageSize.value })
    courses.value = response.data.list || []
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

onMounted(fetchCourses)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.neon-btn {
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-radius: 8px;
  padding: 6px 10px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
}

.neon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.neon-btn.danger {
  border-color: rgba(248, 113, 113, 0.55);
}

.link {
  color: #a5f3fc;
}
</style>
