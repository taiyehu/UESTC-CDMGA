<template>
  <div>
    <h2 class="page-title">成绩日志</h2>

    <div class="filter-panel">
      <div class="category-switch">
        <NeonActionButton
          size="sm"
          :variant="activeCategory === 'non-bingo' ? 'blue' : 'gray'"
          @click="switchCategory('non-bingo')"
        >
          常规课题
        </NeonActionButton>
        <NeonActionButton
          size="sm"
          :variant="activeCategory === 'bingo' ? 'blue' : 'gray'"
          @click="switchCategory('bingo')"
        >
          Bingo课题
        </NeonActionButton>
      </div>

      <div class="filter-grid">
        <div>
          <label class="field-label">课题ID</label>
          <NeonInput :model-value="query.courseId" placeholder="例如 12" @update:model-value="(v) => (query.courseId = v)" />
        </div>
        <div>
          <label class="field-label">用户ID</label>
          <NeonInput :model-value="query.identityId" placeholder="例如 1001" @update:model-value="(v) => (query.identityId = v)" />
        </div>
        <div>
          <label class="field-label">题目ID</label>
          <NeonInput :model-value="query.issueId" placeholder="Bingo可用，例如 7" @update:model-value="(v) => (query.issueId = v)" />
        </div>
        <div>
          <label class="field-label">评分状态</label>
          <select v-model="query.isScored" class="status-select">
            <option value="">全部</option>
            <option value="true">已评分</option>
            <option value="false">未评分</option>
          </select>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <NeonActionButton size="sm" variant="green" :loading="loading" @click="handleSearch">查询</NeonActionButton>
        <NeonActionButton size="sm" variant="gray" :disabled="loading" @click="resetQuery">重置</NeonActionButton>
      </div>
    </div>

    <NeonRankTable min-width-class="min-w-300" text-size-class="text-sm">
      <template #head>
        <tr>
          <th class="w-20 px-3 py-3 text-center">成绩ID</th>
          <th class="w-32 px-3 py-3 text-center">课题ID</th>
          <th class="w-44 px-3 py-3 text-center">课题名称</th>
          <th class="w-24 px-3 py-3 text-center">题目ID</th>
          <th class="w-28 px-3 py-3 text-center">用户ID</th>
          <th class="w-36 px-3 py-3 text-center">用户名</th>
          <th class="w-44 px-3 py-3 text-center">上传时间</th>
          <th class="w-28 px-3 py-3 text-center">图片</th>
          <th class="w-24 px-3 py-3 text-center">分数</th>
          <th class="w-24 px-3 py-3 text-center">状态</th>
          <th class="w-72 px-3 py-3 text-center">备注</th>
        </tr>
      </template>

      <tr v-if="!loading && rows.length === 0" class="border-t border-white/12">
        <td colspan="11" class="px-3 py-4 text-center text-cyan-100/70">暂无记录</td>
      </tr>

      <tr v-for="row in rows" :key="row.id" class="border-t border-white/12">
        <td class="px-3 py-3 text-center">{{ row.id }}</td>
        <td class="px-3 py-3 text-center">{{ row.course?.id || '-' }}</td>
        <td class="px-3 py-3 text-center">{{ row.course?.title || '-' }}</td>
        <td class="px-3 py-3 text-center">{{ row.issueId ?? '-' }}</td>
        <td class="px-3 py-3 text-center">{{ row.identity?.id || '-' }}</td>
        <td class="px-3 py-3 text-center">{{ row.identity?.account || '-' }}</td>
        <td class="px-3 py-3 text-center">{{ formatDateTime(row.uploadTime) }}</td>
        <td class="px-3 py-3 text-center">
          <img
            v-if="row.image"
            :src="getImageUrl(row.image)"
            alt="成绩图片"
            class="thumb mx-auto"
            @click="openPreview(getImageUrl(row.image))"
          />
          <span v-else>-</span>
        </td>
        <td class="px-3 py-3 text-center">{{ row.score ?? '-' }}</td>
        <td class="px-3 py-3 text-center">
          <span class="status-pill" :class="row.isScored ? 'is-pass' : 'is-pending'">{{ row.isScored ? '已评分' : '未评分' }}</span>
        </td>
        <td class="px-3 py-3 text-center">
          <p class="remark-text" :title="row.remark || '-'">{{ row.remark || '-' }}</p>
        </td>
      </tr>
    </NeonRankTable>

    <div class="mt-4 flex items-center justify-end gap-2">
      <NeonActionButton size="sm" :disabled="currentPage <= 1 || loading" @click="handlePageChange(currentPage - 1)">上一页</NeonActionButton>
      <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}（共 {{ total }} 条）</span>
      <NeonActionButton size="sm" :disabled="currentPage >= totalPages || loading" @click="handlePageChange(currentPage + 1)">下一页</NeonActionButton>
    </div>

    <teleport to="body">
      <div v-if="previewVisible" class="preview-mask" @click.self="previewVisible = false">
        <div class="preview-wrap">
          <NeonActionButton size="sm" variant="gray" class="mb-3" @click="previewVisible = false">关闭</NeonActionButton>
          <img :src="previewImage" alt="图片预览" class="preview-image" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAdminScoreLogs } from '@/api/score'
import NeonInput from '@/components/NeonInput.vue'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

type ScoreRow = {
  id: number
  uploadTime?: string
  image?: string
  score?: number
  isScored?: boolean
  issueId?: number | null
  remark?: string | null
  course?: {
    id?: number
    title?: string
  }
  identity?: {
    id?: number
    account?: string
  }
}

const loading = ref(false)
const rows = ref<ScoreRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const activeCategory = ref<'bingo' | 'non-bingo'>('non-bingo')

const query = reactive({
  courseId: '',
  identityId: '',
  issueId: '',
  isScored: '',
})

const previewVisible = ref(false)
const previewImage = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function parseSessionValue(raw: string | null): any {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const currentUser = computed(() => parseSessionValue(sessionStorage.getItem('userInfo')))
const currentIdentityId = computed<number | null>(() => {
  const value = Number(currentUser.value?.id ?? currentUser.value?.identityId ?? currentUser.value?.userId)
  return Number.isFinite(value) && value > 0 ? value : null
})

function parseOptionalNumber(raw: string): number | undefined {
  if (!raw?.trim()) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseOptionalBool(raw: string): boolean | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function formatDateTime(value: any): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function openPreview(src: string): void {
  previewImage.value = src
  previewVisible.value = true
}

async function fetchRows(): Promise<void> {
  if (!currentIdentityId.value) {
    ElMessage({ message: '管理员身份无效，请重新登录', type: 'error' })
    rows.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const res = await fetchAdminScoreLogs({
      adminIdentityId: currentIdentityId.value,
      category: activeCategory.value,
      page: currentPage.value,
      pageSize,
      courseId: parseOptionalNumber(query.courseId),
      identityId: parseOptionalNumber(query.identityId),
      issueId: parseOptionalNumber(query.issueId),
      isScored: parseOptionalBool(query.isScored),
    })

    rows.value = Array.isArray(res?.data?.list) ? res.data.list : []
    total.value = Number(res?.data?.total || 0)
  } catch (error: any) {
    rows.value = []
    total.value = 0
    const message = error?.response?.data?.msg || error?.response?.data?.message || '获取成绩日志失败'
    ElMessage({ message, type: 'error' })
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  currentPage.value = 1
  fetchRows()
}

function resetQuery(): void {
  query.courseId = ''
  query.identityId = ''
  query.issueId = ''
  query.isScored = ''
  currentPage.value = 1
  fetchRows()
}

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
  fetchRows()
}

function switchCategory(next: 'bingo' | 'non-bingo'): void {
  if (activeCategory.value === next) return
  activeCategory.value = next
  currentPage.value = 1
  fetchRows()
}

onMounted(fetchRows)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.filter-panel {
  margin-bottom: 14px;
  border: 1px solid rgba(34, 211, 238, 0.22);
  border-radius: 12px;
  padding: 12px;
  background: rgba(8, 25, 49, 0.42);
}

.category-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.field-label {
  display: block;
  margin: 0 0 6px;
  color: rgba(207, 250, 254, 0.9);
  font-size: 13px;
}

.status-select {
  width: 100%;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 10px;
  background: rgba(7, 24, 46, 0.58);
  color: #e0f7ff;
  padding: 10px 12px;
  outline: none;
}

.remark-text {
  max-width: 280px;
  margin: 0 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(34, 211, 238, 0.35);
  cursor: zoom-in;
}

.status-pill {
  display: inline-block;
  min-width: 56px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.status-pill.is-pass {
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.22);
  border: 1px solid rgba(74, 222, 128, 0.5);
}

.status-pill.is-pending {
  color: #fde68a;
  background: rgba(217, 119, 6, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.45);
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

@media (max-width: 1100px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
