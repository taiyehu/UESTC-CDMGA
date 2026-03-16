<template>
  <div>
    <h2 class="page-title">资料审核</h2>

    <div class="mb-4 max-w-sm">
      <NeonInput v-model="keyword" placeholder="按用户名或用户ID筛选" />
    </div>

    <NeonRankTable min-width-class="min-w-220" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="px-4 py-3 text-center">头像</th>
          <th class="px-4 py-3 text-center">用户名</th>
          <th class="px-4 py-3 text-center">用户ID</th>
          <th class="px-4 py-3 text-center">签名</th>
          <th class="px-4 py-3 text-center">头衔</th>
          <th class="px-4 py-3 text-center">状态</th>
          <th class="px-4 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="profile in pagedProfiles" :key="profile.id || profile.identityId" class="border-t border-white/12">
        <td class="px-4 py-3 text-center">
          <img :src="getImageUrl(profile.avatar)" alt="头像" class="avatar mx-auto" />
        </td>
        <td class="px-4 py-3 text-center">{{ profile.account || '-' }}</td>
        <td class="px-4 py-3 text-center">{{ profile.identityId || '-' }}</td>
        <td class="px-4 py-3 text-center">{{ profile.description || '-' }}</td>
        <td class="px-4 py-3 text-center">{{ profile.title || '-' }}</td>
        <td class="px-4 py-3 text-center">
          <span v-if="profile.status === 0" class="state state-pending">审核中</span>
          <span v-else-if="profile.status === 1" class="state state-pass">已通过</span>
          <span v-else class="state state-none">未提交</span>
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex flex-wrap justify-center gap-2">
            <NeonActionButton v-if="profile.status === 0" size="sm" variant="green" @click="approveProfile(profile)">通过</NeonActionButton>
            <NeonActionButton v-if="profile.status === 0" size="sm" variant="yellow" @click="rejectProfile(profile)">驳回</NeonActionButton>
            <NeonActionButton size="sm" variant="red" @click="deleteProfile(profile)">删除</NeonActionButton>
          </div>
        </td>
      </tr>
    </NeonRankTable>

    <p v-if="!filteredProfiles.length" class="mt-3 text-cyan-100/75">暂无资料可审核</p>

    <div class="mt-4 flex items-center justify-end gap-2">
      <NeonActionButton size="sm" :disabled="currentPage <= 1" @click="handlePageChange(currentPage - 1)">上一页</NeonActionButton>
      <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}</span>
      <NeonActionButton size="sm" :disabled="currentPage >= totalPages" @click="handlePageChange(currentPage + 1)">下一页</NeonActionButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import defaultAvatar from '@/assets/default-avatar.png'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

const profiles = ref<any[]>([])
const keyword = ref('')
const pageSize = 10
const currentPage = ref(1)

const filteredProfiles = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  const source = profiles.value.filter((item) => Number(item.status) !== 1)
  if (!key) return source

  return source.filter((item) => {
    const account = String(item.account || '').toLowerCase()
    const identityId = String(item.identityId || item.identity_id || '')
    return account.includes(key) || identityId.includes(key)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProfiles.value.length / pageSize)))

const pagedProfiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProfiles.value.slice(start, start + pageSize)
})

watch(filteredProfiles, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return defaultAvatar
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

async function fetchProfiles(): Promise<void> {
  try {
    const response = await axios.get('/api/profile/all')
    profiles.value = response.data || []
  } catch {
    profiles.value = []
    ElMessage({ message: '获取用户资料失败', type: 'error' })
  }
}

async function approveProfile(profile: any): Promise<void> {
  try {
    await axios.put(`/api/profile/${profile.id}`, { ...profile, status: 1 })
    ElMessage({ message: '审核通过', type: 'success' })
    await fetchProfiles()
  } catch {
    ElMessage({ message: '操作失败', type: 'error' })
  }
}

async function rejectProfile(profile: any): Promise<void> {
  try {
    await axios.put(`/api/profile/${profile.id}`, { ...profile, status: -1 })
    ElMessage({ message: '已驳回', type: 'success' })
    await fetchProfiles()
  } catch {
    ElMessage({ message: '操作失败', type: 'error' })
  }
}

async function deleteProfile(profile: any): Promise<void> {
  if (!window.confirm('确定删除该用户资料吗？')) return

  const profileId = profile.id || profile.identityId || profile.identity_id
  try {
    await axios.delete(`/api/profile/${profileId}`)
    ElMessage({ message: '用户资料删除成功', type: 'success' })
    await fetchProfiles()
  } catch {
    ElMessage({ message: '删除失败', type: 'error' })
  }
}

onMounted(fetchProfiles)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid rgba(34, 211, 238, 0.35);
}

.state {
  font-size: 13px;
  font-weight: 600;
}

.state-pending {
  color: #fbbf24;
}

.state-pass {
  color: #34d399;
}

.state-none {
  color: #94a3b8;
}

</style>
