<template>
  <div>
    <h2 class="page-title">Issue 上传管理</h2>

    <div class="mb-4 flex flex-wrap items-center gap-3 text-cyan-100/85" v-if="selectedCourse">
      <span>课题ID: {{ selectedCourse.id }}</span>
      <span>课题名称: {{ selectedCourse.title }}</span>
      <span>类别: {{ normalizedCategory }}</span>
      <button type="button" class="neon-btn" @click="backToIssueHome">返回 Issue 首页</button>
    </div>

    <div v-if="!selectedCourse" class="space-y-3">
      <p class="text-cyan-100/85">请选择一个 typical 或 bingo 课题进行 issue 配置：</p>
      <NeonRankTable min-width-class="min-w-220" text-size-class="text-sm">
        <template #head>
          <tr>
            <th class="w-20 px-3 py-3 text-center">课题ID</th>
            <th class="px-3 py-3 text-center">课题名称</th>
            <th class="w-28 px-3 py-3 text-center">类别</th>
            <th class="w-28 px-3 py-3 text-center">操作</th>
          </tr>
        </template>
        <tr v-for="item in eligibleCourses" :key="item.id" class="border-t border-white/12">
          <td class="px-3 py-3 text-center">{{ item.id }}</td>
          <td class="px-3 py-3 text-center">{{ item.title }}</td>
          <td class="px-3 py-3 text-center">{{ item.category }}</td>
          <td class="px-3 py-3 text-center">
            <button type="button" class="neon-btn" @click="goConfigureCourse(item)">进入配置</button>
          </td>
        </tr>
      </NeonRankTable>
    </div>

    <NeonRankTable v-else min-width-class="min-w-300" text-size-class="text-sm">
      <template #head>
        <tr>
          <th class="w-20 px-3 py-3 text-center">ID</th>
          <th class="w-36 px-3 py-3 text-center">图片</th>
          <th class="px-3 py-3 text-center">文本描述</th>
          <th class="w-40 px-3 py-3 text-center">文件</th>
          <th class="w-40 px-3 py-3 text-center">{{ normalizedCategory === 'bingo' ? '标记字符' : 'song_name' }}</th>
          <th class="w-28 px-3 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-for="row in rows" :key="row.issueId" class="border-t border-white/12">
        <td class="px-3 py-3 text-center">{{ row.issueId }}</td>
        <td class="px-3 py-3 text-center">
          <div class="flex flex-col items-center gap-2">
            <img v-if="row.image" :src="toUrl(row.image)" alt="issue图片" class="thumb" />
            <input type="file" accept="image/*" class="hidden" :id="`img-${row.issueId}`" @change="onPickImage($event, row.issueId)" />
            <button type="button" class="neon-btn" @click="triggerPick(`img-${row.issueId}`)">上传图片</button>
          </div>
        </td>
        <td class="px-3 py-3">
          <textarea v-model="row.text" class="issue-text" rows="4" placeholder="填写 text" />
        </td>
        <td class="px-3 py-3 text-center">
          <div class="flex flex-col items-center gap-2">
            <a v-if="row.file" :href="toUrl(row.file)" target="_blank" class="file-link">查看文件</a>
            <input type="file" class="hidden" :id="`file-${row.issueId}`" @change="onPickFile($event, row.issueId)" />
            <button type="button" class="neon-btn" @click="triggerPick(`file-${row.issueId}`)">上传文件</button>
          </div>
        </td>
        <td class="px-3 py-3 text-center">
          <input
            v-model="row.songName"
            class="song-input"
            :placeholder="normalizedCategory === 'bingo' ? '单个字符（如 A / ★ / 中）' : '必填'"
          />
        </td>
        <td class="px-3 py-3 text-center">
          <button type="button" class="neon-btn ok" :disabled="savingMap[row.issueId]" @click="saveRow(row)">
            {{ savingMap[row.issueId] ? '保存中...' : '保存' }}
          </button>
        </td>
      </tr>
    </NeonRankTable>

    <div v-if="normalizedCategory === 'bingo'" class="mt-4 flex items-center justify-end gap-2">
      <button type="button" class="neon-btn" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">上一页</button>
      <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="neon-btn" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">下一页</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NeonRankTable from '@/components/NeonRankTable.vue'
import { fetchCourseByIdData, fetchCourseData } from '@/api/course'
import { fetchCourseIssues, upsertCourseIssue, uploadIssueFile, uploadIssueImage } from '@/api/issue'

interface IssueRow {
  issueId: number
  image: string
  text: string
  file: string
  songName: string
}

const eligibleCourses = ref<any[]>([])
const selectedCourse = ref<any | null>(null)
const currentPage = ref(1)
const rows = ref<IssueRow[]>([])
const savingMap = reactive<Record<number, boolean>>({})
const route = useRoute()
const router = useRouter()

const normalizedCategory = computed(() => String(selectedCourse.value?.category || '').trim().toLowerCase())
const issueTotal = computed(() => (normalizedCategory.value === 'bingo' ? 25 : 6))
const pageSize = computed(() => (normalizedCategory.value === 'bingo' ? 5 : 6))
const totalPages = computed(() => Math.max(1, Math.ceil(issueTotal.value / pageSize.value)))

function toUrl(path?: string) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function triggerPick(inputId: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null
  input?.click()
}

async function loadEligibleCourses() {
  const res = await fetchCourseData()
  const list = Array.isArray(res.data) ? res.data : []
  eligibleCourses.value = list.filter((item: any) => {
    const category = String(item?.category || '').trim().toLowerCase()
    return category === 'typical' || category === 'bingo'
  })
}

async function loadRows() {
  if (!selectedCourse.value || !normalizedCategory.value) {
    rows.value = []
    return
  }

  const res = await fetchCourseIssues(selectedCourse.value.id, currentPage.value, pageSize.value, { unmasked: true })
  const list = Array.isArray(res.data?.list) ? res.data.list : []
  const map = new Map<number, any>()
  for (const item of list) {
    const id = Number(item?.issueId)
    if (!Number.isNaN(id)) {
      map.set(id, item)
    }
  }

  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(issueTotal.value, start + pageSize.value - 1)
  const nextRows: IssueRow[] = []

  for (let i = start; i <= end; i += 1) {
    const existing = map.get(i)
    nextRows.push({
      issueId: i,
      image: existing?.image || '',
      text: existing?.text || '',
      file: existing?.file || '',
      songName: existing?.songName || '',
    })
  }

  rows.value = nextRows
}

async function onPickImage(event: Event, issueId: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !selectedCourse.value) return

  try {
    const url = await uploadIssueImage(selectedCourse.value.id, file)
    const row = rows.value.find((item) => item.issueId === issueId)
    if (row) row.image = url
  } catch (e: any) {
    ElMessage.error(e?.message || '图片上传失败')
  }
}

async function onPickFile(event: Event, issueId: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !selectedCourse.value) return

  try {
    const url = await uploadIssueFile(selectedCourse.value.id, file)
    const row = rows.value.find((item) => item.issueId === issueId)
    if (row) row.file = url
  } catch (e: any) {
    ElMessage.error(e?.message || '文件上传失败')
  }
}

async function saveRow(row: IssueRow) {
  if (!selectedCourse.value) return

  const normalizedSongName = (row.songName || '').trim()

  if (normalizedCategory.value === 'typical' && !row.songName.trim()) {
    ElMessage.warning(`Typical 课题的 issue #${row.issueId} 需要填写 song_name`)
    return
  }

  if (normalizedCategory.value === 'bingo' && normalizedSongName && [...normalizedSongName].length !== 1) {
      ElMessage.warning(`Bingo 课题的 issue #${row.issueId} 标记只能是单个字符`)
      return
  }

  savingMap[row.issueId] = true
  try {
    await upsertCourseIssue(selectedCourse.value.id, {
      issue_id: row.issueId,
      image: row.image,
      text: row.text,
      file: row.file,
      song_name: normalizedCategory.value === 'bingo' ? (normalizedSongName || undefined) : normalizedSongName || undefined,
    })
    ElMessage.success(`Issue #${row.issueId} 保存成功`)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    savingMap[row.issueId] = false
  }
}

function changePage(page: number) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
  loadRows().catch((e) => {
    ElMessage.error(e?.message || '加载失败')
  })
}

function backToIssueHome() {
  router.push('/admin/issues')
}

function goConfigureCourse(courseItem: any) {
  router.push(`/admin/issues/${courseItem.id}`)
}

async function loadCourseFromRoute() {
  const courseIdRaw = route.params.courseId
  const courseId = Number(courseIdRaw)

  if (!courseIdRaw || Number.isNaN(courseId) || courseId <= 0) {
    selectedCourse.value = null
    rows.value = []
    currentPage.value = 1
    return
  }

  const inList = eligibleCourses.value.find((item: any) => Number(item?.id) === courseId)
  if (inList) {
    selectedCourse.value = inList
  } else {
    const res = await fetchCourseByIdData(courseId)
    selectedCourse.value = res.data
  }

  const category = String(selectedCourse.value?.category || '').trim().toLowerCase()
  if (category !== 'typical' && category !== 'bingo') {
    ElMessage.warning('仅 typical 和 bingo 课题支持 issue 配置')
    selectedCourse.value = null
    rows.value = []
    await router.replace('/admin/issues')
    return
  }

  currentPage.value = 1
  await loadRows()
}

async function init() {
  try {
    await loadEligibleCourses()
    await loadCourseFromRoute()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载 Issue 页面失败')
  }
}

onMounted(init)
watch(() => route.params.courseId, () => {
  loadCourseFromRoute().catch((e: any) => {
    ElMessage.error(e?.message || '加载失败')
  })
})
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
}

.issue-text {
  width: 100%;
  min-height: 90px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 8px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
}

.song-input {
  width: 100%;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 8px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
}

.file-link {
  color: #67e8f9;
  text-decoration: underline;
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

.neon-btn.ok {
  border-color: rgba(52, 211, 153, 0.55);
}

.hidden {
  display: none;
}
</style>
