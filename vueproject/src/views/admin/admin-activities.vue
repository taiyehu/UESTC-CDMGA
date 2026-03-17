<template>
  <div>
    <h2 class="page-title">活动管理</h2>

    <NeonRankTable min-width-class="min-w-240" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="px-4 py-3 text-center">活动ID</th>
          <th class="px-4 py-3 text-center">活动名称</th>
          <th class="px-4 py-3 text-center">开始时间</th>
          <th class="px-4 py-3 text-center">结束时间</th>
          <th class="px-4 py-3 text-center">描述</th>
          <th class="px-4 py-3 text-center">宣传图</th>
          <th class="px-4 py-3 text-center">活动文件</th>
          <th class="px-4 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="activity in pagedActivities" :key="activity.id" class="border-t border-white/12">
        <td class="px-4 py-3 text-center">{{ activity.id }}</td>
        <td class="px-4 py-3 text-center">{{ activity.name }}</td>
        <td class="px-4 py-3 text-center">{{ formatDateTime(activity.startTime) }}</td>
        <td class="px-4 py-3 text-center">{{ formatDateTime(activity.endTime) }}</td>
        <td class="px-4 py-3 text-center">{{ activity.description || '-' }}</td>
        <td class="px-4 py-3 text-center">
          <a v-if="activity.activityBanner" :href="getImageUrl(activity.activityBanner)" target="_blank" class="link">查看</a>
          <span v-else>-</span>
        </td>
        <td class="px-4 py-3 text-center">
          <a v-if="activity.activityFile" :href="getImageUrl(activity.activityFile)" target="_blank" class="link">下载</a>
          <span v-else>-</span>
        </td>
        <td class="px-4 py-3 text-center">
          <NeonActionButton size="sm" variant="red" @click="deleteActivity(activity.id)">删除</NeonActionButton>
        </td>
      </tr>
    </NeonRankTable>

    <AdminPagination :current-page="currentPage" :total-pages="totalPages" @change="handlePageChange" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import AdminPagination from '@/components/AdminPagination.vue'

const activities = ref<any[]>([])
const pageSize = ref(5)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(activities.value.length / pageSize.value)))

const pagedActivities = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return activities.value.slice(start, start + pageSize.value)
})

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function formatDateTime(value: any): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

async function fetchActivities(): Promise<void> {
  try {
    const response = await axios.get('/api/activity/list')
    activities.value = response.data.list || []
    currentPage.value = 1
  } catch {
    activities.value = []
    ElMessage({ message: '获取活动信息失败', type: 'error' })
  }
}

async function deleteActivity(activityId: number): Promise<void> {
  if (!window.confirm('确定删除该活动吗？')) return

  try {
    await axios.delete(`/api/activity/${activityId}`)
    ElMessage({ message: '活动删除成功', type: 'success' })
    await fetchActivities()
  } catch {
    ElMessage({ message: '删除失败', type: 'error' })
  }
}

onMounted(fetchActivities)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.link {
  color: #a5f3fc;
}

</style>
