<template>
  <div>
    <h2 class="page-title">Bingo 题目提交管理</h2>

    <NeonRankTable min-width-class="min-w-280" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="w-20 px-3 py-3 text-center">成绩ID</th>
          <th class="w-20 px-3 py-3 text-center">题目ID</th>
          <th class="w-44 px-3 py-3 text-center">课题名称</th>
          <th class="w-32 px-3 py-3 text-center">用户名</th>
          <th class="w-28 px-3 py-3 text-center">组名</th>
          <th class="w-44 px-3 py-3 text-center">上传时间</th>
          <th class="w-28 px-3 py-3 text-center">图片</th>
          <th class="w-32 px-3 py-3 text-center">方式</th>
          <th class="w-56 px-3 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="row in pagedRows" :key="row.id" class="border-t border-white/12">
        <td class="px-3 py-3 text-center">{{ row.id }}</td>
        <td class="px-3 py-3 text-center">{{ row.taskId }}</td>
        <td class="px-3 py-3 text-center">{{ row.courseName }}</td>
        <td class="px-3 py-3 text-center">{{ row.account }}</td>
        <td class="px-3 py-3 text-center">{{ row.groupName }}</td>
        <td class="px-3 py-3 text-center">{{ row.uploadTime }}</td>
        <td class="px-3 py-3 text-center">
          <img v-if="row.image" :src="row.image" alt="提交图片" class="thumb mx-auto" @click="openPreview(row.image)" />
          <span v-else>-</span>
        </td>
        <td class="px-3 py-3 text-center">{{ row.method }}</td>
        <td class="px-3 py-3 text-center">
          <div class="action-wrap">
            <button
              type="button"
              class="neon-btn ok"
              :class="{ 'is-pending': pendingStatusMap[row.id] === 1 }"
              :disabled="Boolean(pendingStatusMap[row.id])"
              @click="reviewScore(row, 1)"
            >
              {{ pendingStatusMap[row.id] === 1 ? '处理中...' : '通过' }}
            </button>
            <div class="action-right">
              <button
                type="button"
                class="neon-btn warn"
                :class="{ 'is-pending': pendingStatusMap[row.id] === 2 }"
                :disabled="Boolean(pendingStatusMap[row.id])"
                @click="reviewScore(row, 2)"
              >
                {{ pendingStatusMap[row.id] === 2 ? '处理中...' : '曲目不对' }}
              </button>
              <button
                type="button"
                class="neon-btn danger"
                :class="{ 'is-pending': pendingStatusMap[row.id] === 3 }"
                :disabled="Boolean(pendingStatusMap[row.id])"
                @click="reviewScore(row, 3)"
              >
                {{ pendingStatusMap[row.id] === 3 ? '处理中...' : '游玩方式不对' }}
              </button>
            </div>
          </div>
        </td>
      </tr>
    </NeonRankTable>

    <div class="mt-4 flex items-center justify-end gap-2">
      <button type="button" class="neon-btn" :disabled="currentPage <= 1" @click="handlePageChange(currentPage - 1)">上一页</button>
      <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="neon-btn" :disabled="currentPage >= totalPages" @click="handlePageChange(currentPage + 1)">下一页</button>
    </div>

    <teleport to="body">
      <div v-if="previewVisible" class="preview-mask" @click.self="previewVisible = false">
        <div class="preview-wrap">
          <button type="button" class="neon-btn mb-3" @click="previewVisible = false">关闭</button>
          <img :src="previewImage" alt="图片预览" class="preview-image" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUnScoredBingoScores, handleUpdateScore } from '@/api/score'
import NeonRankTable from '@/components/NeonRankTable.vue'

type BingoRow = {
  id: number
  taskId: string
  courseName: string
  account: string
  groupName: string
  uploadTime: string
  image: string
  method: string
  uploadTimeRaw: string
  remark: string
  issueId?: number
}

const rows = ref<BingoRow[]>([])
const currentPage = ref(1)
const pageSize = 10
const previewVisible = ref(false)
const previewImage = ref('')
const pendingStatusMap = ref<Record<number, number | undefined>>({})

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return rows.value.slice(start, start + pageSize)
})

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
}

function openPreview(src: string): void {
  previewImage.value = src
  previewVisible.value = true
}

function normalizeUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function extractTaskId(item: any): string {
  if (item?.issueId !== undefined && item?.issueId !== null && item?.issueId !== '') {
    return String(item.issueId)
  }
  const remark = item?.remark
  if (!remark) return '-'
  const matched = remark.match(/#(\d+)/)
  return matched?.[1] || '-'
}

function extractGroupName(item: any): string {
  return String(item?.groupName || item?.identity?.groupName || '-')
}

function extractMethod(item: any): string {
  if (item?.method) return String(item.method)
  if (item?.playMode) return String(item.playMode)
  const remark = String(item?.remark || '')
  const matched = remark.match(/方式[:：]\s*([^\]\n]+)/)
  return matched?.[1]?.trim() || '-'
}

function formatDateTime(value: any): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

async function reviewScore(row: BingoRow, status: number): Promise<void> {
  if (pendingStatusMap.value[row.id]) return
  pendingStatusMap.value[row.id] = status

  try {
    const updatePayload: Record<string, any> = {
      upload_time: row.uploadTimeRaw,
      image: row.image,
      point: status,
      is_scored: true,
      issue_id: row.issueId,
      remark: row.remark,
    }

    await handleUpdateScore(updatePayload, row.id)

    // 更新成功后直接从待审核列表移除，减少重复全量刷新带来的迟滞感。
    rows.value = rows.value.filter((item) => item.id !== row.id)
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }

    ElMessage({ message: `成绩 ${row.id} 已处理`, type: status === 1 ? 'success' : 'warning' })
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '处理失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  } finally {
    delete pendingStatusMap.value[row.id]
  }
}

async function fetchBingoRows(): Promise<void> {
  try {
    const response = await fetchUnScoredBingoScores({ page: 1, pageSize: 1000 })
    const list = response.data.list || []
    const mapped = list
      .map((item: any) => {
        return {
          id: Number(item.id),
          taskId: extractTaskId(item),
          courseName: String(item?.course?.title || '-'),
          account: String(item?.identity?.account || '-'),
          groupName: extractGroupName(item),
          uploadTime: formatDateTime(item.uploadTime),
          uploadTimeRaw: item.uploadTime,
          image: normalizeUrl(item.image),
          method: extractMethod(item),
          remark: String(item?.remark || ''),
          issueId: item?.issueId,
        } as BingoRow
      })

    rows.value = mapped
    currentPage.value = 1
  } catch {
    rows.value = []
    ElMessage({ message: '获取 Bingo 提交失败', type: 'error' })
  }
}

onMounted(fetchBingoRows)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(34, 211, 238, 0.35);
  cursor: zoom-in;
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

.neon-btn.is-pending {
  box-shadow:
    0 0 12px rgba(34, 211, 238, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.neon-btn.ok {
  border-color: rgba(52, 211, 153, 0.55);
}

.neon-btn.warn {
  border-color: rgba(251, 191, 36, 0.55);
}

.neon-btn.danger {
  border-color: rgba(248, 113, 113, 0.55);
}

.action-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
}

.action-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
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
