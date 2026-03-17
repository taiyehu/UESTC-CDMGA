<template>
  <div>
    <h2 class="page-title">已通过资料</h2>

    <div class="mb-4 max-w-sm">
      <NeonInput v-model="keyword" placeholder="按用户名或用户ID筛选" />
    </div>

    <NeonRankTable min-width-class="min-w-180" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="px-4 py-3 text-center">头像</th>
          <th class="px-4 py-3 text-center">用户名</th>
          <th class="px-4 py-3 text-center">用户ID</th>
          <th class="px-4 py-3 text-center">签名</th>
          <th class="px-4 py-3 text-center">头衔</th>
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
      </tr>
    </NeonRankTable>

    <p v-if="!filteredProfiles.length" class="mt-3 text-cyan-100/75">暂无已通过资料</p>

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

const passedProfiles = ref<any[]>([])
const keyword = ref('')
const pageSize = 5
const currentPage = ref(1)

const filteredProfiles = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return passedProfiles.value

  return passedProfiles.value.filter((item) => {
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

async function fetchPassedProfiles(): Promise<void> {
  try {
    const response = await axios.get('/api/profile/all-passed')
    passedProfiles.value = response.data || []
  } catch {
    passedProfiles.value = []
    ElMessage({ message: '获取已通过资料失败', type: 'error' })
  }
}

onMounted(fetchPassedProfiles)
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

</style>
