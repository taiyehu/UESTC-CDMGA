<template>
  <div>
    <h2 class="page-title">常规课题成绩管理</h2>

    <NeonRankTable min-width-class="min-w-260" text-size-class="text-base">
      <template #head>
        <tr>
          <th class="w-20 px-3 py-3 text-center">成绩ID</th>
          <th class="w-44 px-3 py-3 text-center">课题名称</th>
          <th class="w-36 px-3 py-3 text-center">用户名</th>
          <th class="w-44 px-3 py-3 text-center">上传时间</th>
          <th class="w-28 px-3 py-3 text-center">图片</th>
          <th class="w-72 px-3 py-3 text-center">备注</th>
          <th class="w-24 px-3 py-3 text-center">评分</th>
          <th class="w-36 px-3 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="score in pagedScores" :key="score.id" class="border-t border-white/12">
        <td class="px-3 py-3 text-center">{{ score.id }}</td>
        <td class="px-3 py-3 text-center">{{ score.course?.title || '-' }}</td>
        <td class="px-3 py-3 text-center">{{ score.identity?.account || '-' }}</td>
        <td class="px-3 py-3 text-center">{{ formatDateTime(score.uploadTime) }}</td>
        <td class="px-3 py-3 text-center">
          <img
            v-if="score.image"
            :src="getImageUrl(score.image)"
            alt="成绩图片"
            class="thumb mx-auto"
            @click="openPreview(getImageUrl(score.image))"
          />
          <span v-else>-</span>
        </td>
        <td class="px-3 py-3 text-center">
          <p class="remark-text" :title="score.remark || '-'">{{ score.remark || '-' }}</p>
        </td>
        <td class="px-3 py-3 text-center">
          <div class="mx-auto max-w-24">
            <NeonInput :model-value="String(scoreDraft[score.id] ?? score.score ?? '')" placeholder="分数" @update:model-value="(val) => setDraft(score.id, val)" />
          </div>
        </td>
        <td class="px-3 py-3 text-center">
          <div class="flex flex-wrap justify-center gap-2">
            <NeonActionButton size="sm" variant="green" @click="updateScore(score)">通过</NeonActionButton>
            <NeonActionButton size="sm" variant="red" @click="deleteScore(score.id)">删除</NeonActionButton>
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
          <NeonActionButton size="sm" variant="gray" class="mb-3" @click="previewVisible = false">关闭</NeonActionButton>
          <img :src="previewImage" alt="图片预览" class="preview-image" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { fetchUnScoredNonBingoScores, handleUpdateScore } from '@/api/score'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

const allScores = ref<any[]>([])
const currentPage = ref(1)
const pageSize = 10
const scoreDraft = ref<Record<number, string>>({})
const previewVisible = ref(false)
const previewImage = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(allScores.value.length / pageSize)))

const pagedScores = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return allScores.value.slice(start, start + pageSize)
})

function openPreview(src: string): void {
  previewImage.value = src
  previewVisible.value = true
}

function setDraft(scoreId: number, value: string): void {
  scoreDraft.value[scoreId] = value
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

async function fetchScores(): Promise<void> {
  try {
    const response = await fetchUnScoredNonBingoScores({ page: 1, pageSize: 1000 })
    allScores.value = response.data.list || []

    const draft: Record<number, string> = {}
    for (const item of allScores.value) {
      draft[item.id] = String(item.score ?? '')
    }
    scoreDraft.value = draft

    currentPage.value = 1
  } catch {
    allScores.value = []
    ElMessage({ message: '获取成绩列表失败', type: 'error' })
  }
}

function handlePageChange(page: number): void {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
}

async function updateScore(score: any): Promise<void> {
  try {
    const raw = scoreDraft.value[score.id]
    let point = Number(raw)
    if (!Number.isFinite(point)) {
      ElMessage({ message: '请输入有效分数', type: 'error' })
      return
    }

    if (score.course && score.course.category === 'contest') {
      point = point - 10000000
    }

    const updatePayload = {
      id: score.id,
      upload_time: dayjs(score.uploadTime).format('YYYY-MM-DDTHH:mm:ss'),
      image: score.image,
      point,
      is_scored: true,
      remark: score.remark,
    }

    await handleUpdateScore(updatePayload, updatePayload.id)
    ElMessage({ message: '成绩提交成功', type: 'success' })
    await fetchScores()
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '成绩提交失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  }
}

async function deleteScore(scoreId: number): Promise<void> {
  if (!window.confirm('确定删除成绩？删除后用户需重新提交')) return

  try {
    await axios.delete(`/api/score/delete/${scoreId}`)
    ElMessage({ message: '成绩删除成功', type: 'success' })
    await fetchScores()
  } catch {
    ElMessage({ message: '成绩删除失败', type: 'error' })
  }
}

onMounted(fetchScores)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
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
