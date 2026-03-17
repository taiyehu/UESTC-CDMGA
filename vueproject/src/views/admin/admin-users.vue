<template>
  <div>
    <h2 class="page-title">用户管理</h2>

    <NeonRankTable min-width-class="min-w-150" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="px-4 py-3 text-center">用户ID</th>
          <th class="px-4 py-3 text-center">账号</th>
          <th class="px-4 py-3 text-center">角色</th>
          <th class="px-4 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="user in users" :key="user.id" class="border-t border-white/12">
        <td class="px-4 py-3 text-center">{{ user.id }}</td>
        <td class="px-4 py-3 text-center">{{ user.account }}</td>
        <td class="px-4 py-3 text-center">{{ user.role }}</td>
        <td class="px-4 py-3 text-center">
          <NeonActionButton size="sm" variant="red" @click="deleteUser(user.id)">删除</NeonActionButton>
        </td>
      </tr>
    </NeonRankTable>

    <AdminPagination :current-page="currentPage" :total-pages="totalPages" @change="handlePageChange" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUsersData, deleteUserData } from '@/api/user'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import AdminPagination from '@/components/AdminPagination.vue'

const users = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

async function fetchUsers(): Promise<void> {
  try {
    const response = await fetchUsersData({ page: currentPage.value, pageSize: pageSize.value })
    users.value = response.data.list || []
    total.value = response.data.total || 0
  } catch {
    users.value = []
    ElMessage({ message: '获取用户信息失败', type: 'error' })
  }
}

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
  fetchUsers()
}

async function deleteUser(userId: number): Promise<void> {
  if (!window.confirm('确定删除该用户吗？')) return

  try {
    const response = await deleteUserData(userId)
    if (response.status === 204) {
      ElMessage({ message: '用户删除成功', type: 'success' })
      await fetchUsers()
    } else {
      ElMessage({ message: '删除失败', type: 'error' })
    }
  } catch {
    ElMessage({ message: '删除失败', type: 'error' })
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

</style>
