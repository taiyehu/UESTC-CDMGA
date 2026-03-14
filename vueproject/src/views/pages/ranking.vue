<template>
  <section class="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="RANK">
        RANK
      </h1>
    </header>
    <div class="hud-card p-4 md:p-6">
      <h2 class="mb-5 text-center text-xl font-semibold text-cyan-100 md:text-2xl">用户总分排行榜</h2>

      <NeonRankTable min-width-class="min-w-160" text-size-class="text-lg">
          <template #head>
            <tr>
              <th class="px-4 py-3 text-center">排名</th>
              <th class="px-4 py-3 text-center">头像</th>
              <th class="px-4 py-3 text-center">用户名</th>
              <th class="px-4 py-3 text-center">总分</th>
            </tr>
          </template>
            <tr
              v-for="(row, index) in pagedRankData"
              :key="row.identityId"
              class="border-t border-white/12 transition hover:bg-cyan-300/8"
            >
              <td class="px-4 py-3 text-center font-semibold text-fuchsia-100">
                {{ (rankCurrentPage - 1) * rankPageSize + index + 1 }}
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="mx-auto block"
                  @click="goToProfile(row.identityId)"
                >
                  <img
                    :src="getImageUrl(row.avatar)"
                    alt="头像"
                    class="h-10 w-10 rounded-full border border-cyan-300/45 object-cover"
                  />
                </button>
              </td>
              <td class="px-4 py-3 text-center">{{ row.account }}</td>
              <td class="px-4 py-3 text-center font-semibold text-cyan-100">{{ row.totalScore }}</td>
            </tr>
      </NeonRankTable>

      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          class="neon-button disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="rankCurrentPage <= 1"
          @click="goPage(rankCurrentPage - 1)"
        >
          上一页
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="neon-button"
          :class="
            page === rankCurrentPage
              ? 'is-active'
              : ''
          "
          @click="goPage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="neon-button disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="rankCurrentPage >= totalPages"
          @click="goPage(rankCurrentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <router-link
      to="/contest-ranking"
      class="fixed bottom-5 right-5 neon-button"
    >
      查看比赛排行榜
    </router-link>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import NeonRankTable from '@/components/NeonRankTable.vue'

const rankAllData = ref<any[]>([])
const rankSortedData = ref<any[]>([])
const rankPageSize = ref<number>(10)
const rankCurrentPage = ref<number>(1)

const totalPages = computed<number>(() => {
  return Math.max(1, Math.ceil(rankSortedData.value.length / rankPageSize.value))
})

const visiblePages = computed<number[]>(() => {
  const total = totalPages.value
  const current = rankCurrentPage.value
  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + windowSize - 1)

  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const pagedRankData = computed<any[]>(() => {
  const start = (rankCurrentPage.value - 1) * rankPageSize.value
  return rankSortedData.value.slice(start, start + rankPageSize.value)
})

const router = useRouter()

function goToProfile(id: string | number): void {
  router.push(`/profile/${id}`)
}

async function fetchRankData(): Promise<void> {
  try {
    const res = await axios.get('/api/score/user-total-scores')
    let data = res.data.data || []
    data.sort((a: any, b: any) => b.totalScore - a.totalScore)
    rankAllData.value = data
    rankSortedData.value = data
  } catch (e) {
    ElMessage({ message: '获取排行榜失败', type: 'error' })
  }
}

function handleRankPageChange(page: number): void {
  rankCurrentPage.value = page
}

function goPage(page: number): void {
  const safePage = Math.min(totalPages.value, Math.max(1, page))
  handleRankPageChange(safePage)
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

onMounted(() => {
  fetchRankData()
})
</script>

<style scoped>
.glitch-title {
  position: relative;
  display: inline-block;
  letter-spacing: 0.12em;
  line-height: 1;
  background-image: linear-gradient(135deg, #22d3ee 0%, #9333ea 40%, #c026d3 62%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 16px rgba(139, 92, 246, 0.38);
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glitch-title::before {
  color: rgba(34, 211, 238, 0.8);
  transform: translateX(1px);
  clip-path: polygon(0 4%, 100% 0, 100% 38%, 0 42%);
}

.glitch-title::after {
  color: rgba(217, 70, 239, 0.8);
  transform: translateX(-1px);
  clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 96%);
}

.hud-card {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}

.hud-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.9), rgba(168, 85, 247, 0.86), rgba(244, 114, 182, 0.9));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.neon-button {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.neon-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.86), rgba(168, 85, 247, 0.82), rgba(244, 114, 182, 0.88));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.neon-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 18px rgba(217, 70, 239, 0.18);
}

.is-active {
  background: rgba(34, 211, 238, 0.24);
  border-color: rgba(165, 243, 252, 0.75);
}
</style>
