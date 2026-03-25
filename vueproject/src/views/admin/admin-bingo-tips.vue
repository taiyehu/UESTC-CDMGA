<template>
  <div>
    <h2 class="page-title">Bingo 提示管理</h2>

    <div class="mb-4 flex flex-wrap items-center gap-3 text-cyan-100/85" v-if="selectedCourse">
      <span>课题ID: {{ selectedCourse.id }}</span>
      <span>课题名称: {{ selectedCourse.title }}</span>
      <span>类别: {{ normalizedCategory }}</span>
      <button type="button" class="neon-btn" @click="backToTipsHome">返回提示首页</button>
    </div>

    <div v-if="!selectedCourse" class="space-y-3">
      <p class="text-cyan-100/85">请选择一个 bingo 课题进行提示配置：</p>
      <NeonRankTable min-width-class="min-w-220" text-size-class="text-sm">
        <template #head>
          <tr>
            <th class="w-20 px-3 py-3 text-center">课题ID</th>
            <th class="px-3 py-3 text-center">课题名称</th>
            <th class="w-28 px-3 py-3 text-center">类别</th>
            <th class="w-28 px-3 py-3 text-center">操作</th>
          </tr>
        </template>
        <tr v-for="item in bingoCourses" :key="item.id" class="border-t border-white/12">
          <td class="px-3 py-3 text-center">{{ item.id }}</td>
          <td class="px-3 py-3 text-center">{{ item.title }}</td>
          <td class="px-3 py-3 text-center">{{ item.category }}</td>
          <td class="px-3 py-3 text-center">
            <button type="button" class="neon-btn" @click="goConfigureCourse(item)">进入配置</button>
          </td>
        </tr>
      </NeonRankTable>
    </div>

    <div v-if="selectedCourse" class="create-panel">
      <div class="create-grid">
        <div>
          <label class="field-label">题目ID</label>
          <input
            v-model="createForm.issueId"
            class="field-select"
            list="issue-option-list"
            placeholder="可手动输入，如 #7 或 7"
            @blur="normalizeIssueInput"
            @keyup.enter="normalizeIssueInput"
          />
        </div>
        <div>
          <label class="field-label">解锁队伍ID</label>
          <input
            v-model="createForm.teamId"
            class="field-select"
            list="team-option-list"
            placeholder="可手动输入，如 #3 或 3"
            @blur="normalizeTeamInput"
            @keyup.enter="normalizeTeamInput"
          />
        </div>
      </div>
      <datalist id="issue-option-list">
        <option v-for="issueId in issueOptions" :key="`i-${issueId}`" :value="`#${issueId}`">{{ issueId }}</option>
      </datalist>
      <datalist id="team-option-list">
        <option v-for="teamId in teamOptions" :key="`t-${teamId}`" :value="`#${teamId}`">{{ teamId }}</option>
      </datalist>
      <div class="mt-2">
        <label class="field-label">提示内容</label>
        <textarea v-model="createForm.tip" class="tip-text" rows="3" placeholder="输入提示内容" />
      </div>
      <div class="mt-3">
        <button type="button" class="neon-btn ok" :disabled="creating" @click="createTip">
          {{ creating ? '添加中...' : '添加提示' }}
        </button>
      </div>
    </div>

    <NeonRankTable v-if="selectedCourse" min-width-class="min-w-320" text-size-class="text-sm">
      <template #head>
        <tr>
          <th class="w-20 px-3 py-3 text-center">题目ID</th>
          <th class="w-24 px-3 py-3 text-center">解锁队伍</th>
          <th class="px-3 py-3 text-center">提示内容</th>
          <th class="w-44 px-3 py-3 text-center">创建时间</th>
          <th class="w-24 px-3 py-3 text-center">操作</th>
        </tr>
      </template>

      <tr v-if="rows.length === 0" class="border-t border-white/12">
        <td colspan="5" class="px-3 py-4 text-center text-cyan-100/70">暂无提示记录</td>
      </tr>

      <tr v-for="row in rows" :key="row.id" class="border-t border-white/12">
        <td class="px-3 py-3 text-center">{{ row.issueId }}</td>
        <td class="px-3 py-3 text-center">{{ formatTeamMarker(row.teamId, row.teamName) }}</td>
        <td class="px-3 py-3"><p class="tip-line" :title="row.tip">{{ row.tip }}</p></td>
        <td class="px-3 py-3 text-center">{{ formatDateTime(row.createdAt) }}</td>
        <td class="px-3 py-3 text-center">
          <button type="button" class="neon-btn danger" :disabled="Boolean(savingMap[row.id])" @click="removeRow(row)">删除</button>
        </td>
      </tr>
    </NeonRankTable>

    <AdminPagination
      v-if="selectedCourse"
      :current-page="currentPage"
      :total-pages="totalPages"
      :summary-text="`${currentPage} / ${totalPages}（共 ${totalCount} 条）`"
      @change="changePage"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NeonRankTable from '@/components/NeonRankTable.vue'
import AdminPagination from '@/components/AdminPagination.vue'
import { fetchCourseByIdData, fetchCourseData } from '@/api/course'
import { createCourseBingoTip, deleteCourseBingoTip, fetchCourseBingoTips } from '@/api/bingoTip'
import { fetchCourseIssues } from '@/api/issue'
import { fetchCourseTeams } from '@/api/team'

type TipRow = {
  id: number
  issueId: number
  tip: string
  teamId: number
  teamName?: string
  createdAt?: string
}

const route = useRoute()
const router = useRouter()

const bingoCourses = ref<any[]>([])
const selectedCourse = ref<any | null>(null)
const rows = ref<TipRow[]>([])
const currentPage = ref(1)
const totalCount = ref(0)
const savingMap = reactive<Record<number, boolean>>({})
const creating = ref(false)
const issueOptions = ref<number[]>([])
const teamOptions = ref<number[]>([])
const createForm = reactive({
  issueId: '',
  tip: '',
  teamId: '',
})

const pageSize = 5
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))
const normalizedCategory = computed(() => String(selectedCourse.value?.category || '').trim().toLowerCase())

async function loadBingoCourses() {
  const res = await fetchCourseData()
  const list = Array.isArray(res.data) ? res.data : []
  bingoCourses.value = list.filter((item: any) => String(item?.category || '').trim().toLowerCase() === 'bingo')
}

function buildPageRows(tips: any[]) {
  const mapped: TipRow[] = []
  for (const item of tips) {
    const id = Number(item?.id)
    const issueId = Number(item?.issueId)
    if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(issueId) || issueId <= 0) continue
    mapped.push({
      id,
      issueId,
      tip: String(item?.tip || ''),
      teamId: Number(item?.teamId || 0),
      teamName: String(item?.teamName || ''),
      createdAt: item?.createdAt,
    })
  }
  rows.value = mapped
}

async function loadRows() {
  if (!selectedCourse.value) {
    rows.value = []
    totalCount.value = 0
    return
  }

  const res = await fetchCourseBingoTips(selectedCourse.value.id, currentPage.value, pageSize)
  const list = Array.isArray(res?.data?.list) ? res.data.list : []
  totalCount.value = Number(res?.data?.total || 0)
  buildPageRows(list)
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

function formatTeamMarker(teamId?: number, teamName?: string) {
  if (Number.isFinite(Number(teamId)) && Number(teamId) > 0) {
    return `#${Number(teamId)}`
  }
  const text = String(teamName || '').trim()
  const matched = text.match(/(\d+)/)
  return matched ? `#${matched[1]}` : '-'
}

function resolveMatchedId(raw: string, options: number[]): { value?: number; ambiguous?: boolean } {
  const text = String(raw || '').trim()
  if (!text) return {}

  const directNum = Number(text.replace(/^#/, ''))
  if (Number.isFinite(directNum) && options.includes(directNum)) {
    return { value: directNum }
  }

  const matched = text.match(/(\d+)/)
  if (matched) {
    const n = Number(matched[1])
    if (Number.isFinite(n) && options.includes(n)) {
      return { value: n }
    }
  }

  const lower = text.toLowerCase()
  const candidates = options.filter((id) => `#${id}`.toLowerCase().includes(lower) || String(id).includes(lower))
  if (candidates.length === 1) return { value: candidates[0] }
  if (candidates.length > 1) return { ambiguous: true }
  return {}
}

function normalizeIssueInput() {
  const result = resolveMatchedId(createForm.issueId, issueOptions.value)
  if (result.value) {
    createForm.issueId = `#${result.value}`
  }
}

function normalizeTeamInput() {
  const result = resolveMatchedId(createForm.teamId, teamOptions.value)
  if (result.value) {
    createForm.teamId = `#${result.value}`
  }
}

async function createTip() {
  if (!selectedCourse.value) return
  const issueResolved = resolveMatchedId(createForm.issueId, issueOptions.value)
  const teamResolved = resolveMatchedId(createForm.teamId, teamOptions.value)
  const issueId = issueResolved.value
  const teamId = teamResolved.value
  const normalizedTip = String(createForm.tip || '').trim()

  if (issueResolved.ambiguous) {
    ElMessage.warning('题目ID 匹配到多个结果，请输入更精确的编号')
    return
  }
  if (!Number.isFinite(Number(issueId)) || Number(issueId) <= 0 || !issueOptions.value.includes(Number(issueId))) {
    ElMessage.warning('请输入或选择存在的题目ID')
    return
  }

  if (!normalizedTip) {
    ElMessage.warning('请填写提示内容')
    return
  }

  if (teamResolved.ambiguous) {
    ElMessage.warning('队伍ID 匹配到多个结果，请输入更精确的编号')
    return
  }
  if (!Number.isFinite(Number(teamId)) || Number(teamId) <= 0 || !teamOptions.value.includes(Number(teamId))) {
    ElMessage.warning('请输入或选择存在的队伍ID')
    return
  }

  creating.value = true
  try {
    await createCourseBingoTip(selectedCourse.value.id, {
      issue_id: Number(issueId),
      tip: normalizedTip,
      team_id: Number(teamId),
    })
    ElMessage.success(`Issue #${issueId} 提示添加成功`)
    createForm.issueId = `#${issueId}`
    createForm.teamId = `#${teamId}`
    createForm.tip = ''
    await loadRows()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '添加失败')
  } finally {
    creating.value = false
  }
}

async function loadIssueOptions() {
  issueOptions.value = []
  if (!selectedCourse.value || normalizedCategory.value !== 'bingo') return

  try {
    const res = await fetchCourseIssues(selectedCourse.value.id, 1, 25, { unmasked: true })
    const list = Array.isArray(res?.data?.list) ? res.data.list : []
    const ids = list
      .map((item: any) => Number(item?.issueId))
      .filter((id: number) => Number.isFinite(id) && id > 0)
    const uniqueIds: number[] = Array.from(new Set<number>(ids))
    issueOptions.value = uniqueIds.sort((a: number, b: number) => a - b)
  } catch {
    issueOptions.value = []
  }
}

async function loadTeamOptions() {
  teamOptions.value = []
  if (!selectedCourse.value || normalizedCategory.value !== 'bingo') return

  try {
    const pageSize = 50
    const firstRes = await fetchCourseTeams(selectedCourse.value.id, 1, pageSize)
    const firstList = Array.isArray(firstRes?.data?.list) ? firstRes.data.list : []
    const total = Number(firstRes?.data?.total || 0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const teamSet = new Set<number>()
    for (const row of firstList) {
      const teamId = Number(row?.teamId)
      const members = Array.isArray(row?.members) ? row.members : []
      if (Number.isFinite(teamId) && teamId > 0 && members.length > 0) teamSet.add(teamId)
    }

    for (let page = 2; page <= totalPages; page += 1) {
      const res = await fetchCourseTeams(selectedCourse.value.id, page, pageSize)
      const list = Array.isArray(res?.data?.list) ? res.data.list : []
      for (const row of list) {
        const teamId = Number(row?.teamId)
        const members = Array.isArray(row?.members) ? row.members : []
        if (Number.isFinite(teamId) && teamId > 0 && members.length > 0) teamSet.add(teamId)
      }
    }

    teamOptions.value = Array.from(teamSet).sort((a, b) => a - b)
  } catch {
    teamOptions.value = []
  }
}

async function removeRow(row: TipRow) {
  if (!selectedCourse.value) return
  savingMap[row.id] = true
  try {
    await deleteCourseBingoTip(selectedCourse.value.id, row.id)
    ElMessage.success(`提示 #${row.id} 已删除`)
    await loadRows()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  } finally {
    savingMap[row.id] = false
  }
}

function changePage(page: number) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
  loadRows().catch((e: any) => {
    ElMessage.error(e?.message || '加载失败')
  })
}

function backToTipsHome() {
  router.push('/admin/bingo-tips')
}

function goConfigureCourse(courseItem: any) {
  router.push(`/admin/bingo-tips/${courseItem.id}`)
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

  const inList = bingoCourses.value.find((item: any) => Number(item?.id) === courseId)
  if (inList) {
    selectedCourse.value = inList
  } else {
    const res = await fetchCourseByIdData(courseId)
    selectedCourse.value = res.data
  }

  const category = String(selectedCourse.value?.category || '').trim().toLowerCase()
  if (category !== 'bingo') {
    ElMessage.warning('仅 bingo 课题支持提示配置')
    selectedCourse.value = null
    rows.value = []
    await router.replace('/admin/bingo-tips')
    return
  }

  currentPage.value = 1
  createForm.issueId = ''
  createForm.teamId = ''
  createForm.tip = ''
  await loadIssueOptions()
  await loadTeamOptions()
  await loadRows()
}

async function init() {
  try {
    await loadBingoCourses()
    await loadCourseFromRoute()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载 Bingo 提示页面失败')
  }
}

onMounted(init)
watch(
  () => route.params.courseId,
  () => {
    loadCourseFromRoute().catch((e: any) => {
      ElMessage.error(e?.message || '加载失败')
    })
  }
)
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.tip-text {
  width: 100%;
  min-height: 80px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 8px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
}

.create-panel {
  margin-bottom: 12px;
  border: 1px solid rgba(34, 211, 238, 0.24);
  border-radius: 10px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.35);
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.field-label {
  display: block;
  margin: 0 0 6px;
  color: rgba(207, 250, 254, 0.9);
  font-size: 13px;
}

.field-select {
  width: 100%;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 8px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
}

.tip-line {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 760px) {
  .create-grid {
    grid-template-columns: 1fr;
  }
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

.neon-btn.danger {
  border-color: rgba(248, 113, 113, 0.55);
}
</style>
