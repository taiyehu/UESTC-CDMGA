<template>
  <section class="hud-card min-w-0 p-4 md:p-6">
    <h2 class="mb-4 text-center text-xl font-semibold text-cyan-100 md:text-2xl">{{ category === 'contest' ? '比赛排行榜（总计）' : '打榜排行榜（进行中）' }}</h2>
    <div class="mb-5 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="切换排行榜">
      <NeonActionButton :aria-pressed="category === 'contest'" :class="category === 'contest' ? 'is-active' : ''" @click="switchCategory('contest')">比赛排行榜</NeonActionButton>
      <NeonActionButton :aria-pressed="category === 'ranking'" :class="category === 'ranking' ? 'is-active' : ''" @click="switchCategory('ranking')">打榜排行榜</NeonActionButton>
    </div>

    <p v-if="loading" class="py-10 text-center text-cyan-100/75">排行榜加载中...</p>
    <p v-else-if="error" class="py-10 text-center text-rose-300">{{ error }}</p>
    <template v-else>
      <NeonRankTable min-width-class="min-w-90" text-size-class="text-base">
        <template #head>
          <tr>
            <th class="px-3 py-3 text-center">排名</th>
            <th class="px-3 py-3 text-left">用户</th>
            <th class="px-3 py-3 text-center">分数</th>
          </tr>
        </template>
        <tr v-for="row in pagedRows" :key="row.identityId" class="border-t border-white/12 transition hover:bg-cyan-300/8">
          <td class="px-3 py-3 text-center font-semibold text-fuchsia-100">{{ row.displayRank }}</td>
          <td class="px-3 py-3">
            <router-link :to="`/profile/${row.identityId}`" class="flex min-w-0 items-center gap-2 text-sky-300 hover:text-sky-200">
              <img loading="lazy" :src="mediaThumbnailUrl(imageUrl(row.avatar), 96)" @error="restoreOriginalImage($event, imageUrl(row.avatar))" :alt="`${row.account}的头像`" class="h-9 w-9 shrink-0 rounded-full border border-cyan-300/45 object-cover" />
              <span class="min-w-0 break-all">{{ row.account }}</span>
            </router-link>
          </td>
          <td class="px-3 py-3 text-center font-semibold text-cyan-100">{{ row.totalScoreText || row.totalScore }}</td>
        </tr>
      </NeonRankTable>
      <p v-if="!rows.length" class="mt-4 text-center text-sm text-cyan-100/75">暂无榜单数据</p>
      <div v-if="totalPages > 1" class="mt-5 flex items-center justify-center gap-3">
        <NeonActionButton :disabled="page === 1" @click="page--">上一页</NeonActionButton>
        <span class="text-sm text-cyan-100/85">{{ page }} / {{ totalPages }}</span>
        <NeonActionButton :disabled="page === totalPages" @click="page++">下一页</NeonActionButton>
      </div>
      <div class="mt-5 text-center">
        <router-link :to="category === 'contest' ? '/contest-ranking' : '/ranking-new'" class="text-sm text-sky-300 hover:underline">查看详细榜单 →</router-link>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import NeonActionButton from '@/components/NeonActionButton.vue'
import NeonRankTable from '@/components/NeonRankTable.vue'
import defaultAvatar from '@/assets/default-avatar.png'
import { mediaThumbnailUrl, restoreOriginalImage } from '@/utils/mediaThumbnail'

type Category = 'contest' | 'ranking'
type RankRow = { identityId: number; account: string; avatar?: string; totalScore: number; totalScoreText?: string; displayRank: number }

const category = ref<Category>('contest')
const rows = ref<RankRow[]>([])
const page = ref(1)
const loading = ref(false)
const error = ref('')
const pageSize = 10
let requestId = 0

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)))
const pagedRows = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function imageUrl(path?: string): string {
  if (!path) return defaultAvatar
  return /^https?:\/\//.test(path) || path.startsWith('/') ? path : `/${path}`
}

async function loadBoard(): Promise<void> {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get('/api/rank/board', { params: { category: category.value, mode: category.value === 'contest' ? 'history' : 'active' } })
    if (id !== requestId) return
    if (response.data?.code !== 0) throw new Error(response.data?.message || '获取排行榜失败')
    const data = [...(response.data?.data || [])].sort((a: RankRow, b: RankRow) => Number(b.totalScore) - Number(a.totalScore))
    let previousScore: number | null = null
    let displayRank = 0
    rows.value = data.map((row: RankRow, index: number) => {
      const score = Number(row.totalScore || 0)
      if (previousScore === null || Math.abs(score - previousScore) > 1e-9) displayRank = index + 1
      previousScore = score
      return { ...row, displayRank }
    })
  } catch (e: any) {
    if (id === requestId) error.value = e?.message || '获取排行榜失败'
  } finally {
    if (id === requestId) loading.value = false
  }
}

function switchCategory(next: Category): void {
  if (category.value === next) return
  category.value = next
  page.value = 1
  void loadBoard()
}

onMounted(() => { void loadBoard() })
</script>

<style scoped>
.hud-card {
  border: 1px solid rgba(103, 232, 249, 0.3);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 28px rgba(34, 211, 238, 0.16), 0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}
.is-active { border-color: rgba(244, 114, 182, 0.9); background: rgba(126, 34, 206, 0.45); }
</style>
