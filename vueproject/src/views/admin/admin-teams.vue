<template>
  <div>
    <h2 class="page-title">Bingo 队伍管理</h2>

    <div class="mb-4 flex flex-wrap items-center gap-3 text-cyan-100/85" v-if="selectedCourse">
      <span>课题ID: {{ selectedCourse.id }}</span>
      <span>课题名称: {{ selectedCourse.title }}</span>
      <NeonActionButton size="sm" @click="backToTeamHome">返回队伍首页</NeonActionButton>
    </div>

    <div v-if="!selectedCourse" class="space-y-3">
      <p class="text-cyan-100/85">请选择一个 bingo 课题进行队伍管理：</p>
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
            <NeonActionButton size="sm" @click="goConfigureCourse(item)">进入配置</NeonActionButton>
          </td>
        </tr>
      </NeonRankTable>
    </div>

    <div v-else class="space-y-4">
      <NeonRankTable min-width-class="min-w-300" text-size-class="text-sm">
        <template #head>
          <tr>
            <th class="w-24 px-3 py-3 text-center">队伍号</th>
            <th class="px-3 py-3 text-center">成员1</th>
            <th class="px-3 py-3 text-center">成员2</th>
            <th class="px-3 py-3 text-center">成员3</th>
            <th class="w-28 px-3 py-3 text-center">操作</th>
          </tr>
        </template>

        <tr v-for="row in rows" :key="row.teamId" class="border-t border-white/12">
          <td class="px-3 py-3 text-center">{{ row.teamId }}</td>
          <td class="px-3 py-3">
            <el-select
              v-model="row.memberIds[0]"
              clearable
              filterable
              remote
              reserve-keyword
              :loading="memberSearchLoading"
              :remote-method="onSearchMembers"
              placeholder="---"
              class="team-select neon-select"
              popper-class="neon-select-popper"
            >
              <el-option
                v-for="option in memberOptions"
                :key="option.identityId"
                :label="`${option.account} (#${option.identityId})`"
                :value="option.identityId"
              />
            </el-select>
          </td>
          <td class="px-3 py-3">
            <el-select
              v-model="row.memberIds[1]"
              clearable
              filterable
              remote
              reserve-keyword
              :loading="memberSearchLoading"
              :remote-method="onSearchMembers"
              placeholder="---"
              class="team-select neon-select"
              popper-class="neon-select-popper"
            >
              <el-option
                v-for="option in memberOptions"
                :key="`m2-${option.identityId}`"
                :label="`${option.account} (#${option.identityId})`"
                :value="option.identityId"
              />
            </el-select>
          </td>
          <td class="px-3 py-3">
            <el-select
              v-model="row.memberIds[2]"
              clearable
              filterable
              remote
              reserve-keyword
              :loading="memberSearchLoading"
              :remote-method="onSearchMembers"
              placeholder="---"
              class="team-select neon-select"
              popper-class="neon-select-popper"
            >
              <el-option
                v-for="option in memberOptions"
                :key="`m3-${option.identityId}`"
                :label="`${option.account} (#${option.identityId})`"
                :value="option.identityId"
              />
            </el-select>
          </td>
          <td class="px-3 py-3 text-center">
            <NeonActionButton size="sm" variant="green" :disabled="savingMap[row.teamId]" @click="saveTeamRow(row)">
              {{ savingMap[row.teamId] ? '保存中...' : '保存' }}
            </NeonActionButton>
          </td>
        </tr>
      </NeonRankTable>

      <div class="mt-2 flex items-center justify-end gap-2">
        <NeonActionButton size="sm" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">上一页</NeonActionButton>
        <span class="text-cyan-100/85">{{ currentPage }} / {{ totalPages }}</span>
        <NeonActionButton size="sm" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">下一页</NeonActionButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NeonRankTable from '@/components/NeonRankTable.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import { fetchCourseByIdData, fetchCourseData } from '@/api/course'
import { fetchCourseTeams, saveCourseTeam, searchTeamMemberOptions, type TeamMemberOption } from '@/api/team'

interface TeamRowView {
  teamId: number
  memberIds: Array<number | undefined>
}

const route = useRoute()
const router = useRouter()

const bingoCourses = ref<any[]>([])
const selectedCourse = ref<any | null>(null)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const rows = ref<TeamRowView[]>([])
const savingMap = reactive<Record<number, boolean>>({})
const memberOptions = ref<TeamMemberOption[]>([])
const memberSearchLoading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))


async function loadBingoCourses() {
  const res = await fetchCourseData()
  const list = Array.isArray(res.data) ? res.data : []
  bingoCourses.value = list.filter((item: any) => String(item?.category || '').trim().toLowerCase() === 'bingo')
}

async function loadRows() {
  if (!selectedCourse.value) {
    rows.value = []
    total.value = 0
    return
  }

  const res = await fetchCourseTeams(selectedCourse.value.id, currentPage.value, pageSize)
  const list = Array.isArray(res.data?.list) ? res.data.list : []
  total.value = Number(res.data?.total || 0)

  rows.value = list.map((item: any) => {
    const sourceMembers = Array.isArray(item?.members) ? item.members : []
    const memberIds: Array<number | undefined> = [undefined, undefined, undefined]
    for (let i = 0; i < 3; i += 1) {
      const identityId = Number(sourceMembers[i]?.identityId)
      memberIds[i] = Number.isFinite(identityId) && identityId > 0 ? identityId : undefined
    }
    return {
      teamId: Number(item?.teamId),
      memberIds,
    }
  })
}

async function onSearchMembers(keyword: string) {
  const key = (keyword || '').trim()
  if (!selectedCourse.value || !key) {
    memberOptions.value = []
    return
  }

  memberSearchLoading.value = true
  try {
    const options = await searchTeamMemberOptions(selectedCourse.value.id, key, 20)
    memberOptions.value = options
  } catch (e: any) {
    memberOptions.value = []
    ElMessage.error(e?.message || '成员搜索失败')
  } finally {
    memberSearchLoading.value = false
  }
}

async function saveTeamRow(row: TeamRowView) {
  if (!selectedCourse.value) return

  const memberIds = row.memberIds.filter((id): id is number => Number.isFinite(id) && (id as number) > 0)
  const uniqueSize = new Set(memberIds).size
  if (uniqueSize !== memberIds.length) {
    ElMessage.warning(`队伍 #${row.teamId} 不能选择重复成员`)
    return
  }

  savingMap[row.teamId] = true
  try {
    await saveCourseTeam(selectedCourse.value.id, {
      team_id: row.teamId,
      member_ids: memberIds,
    })
    ElMessage.success(`队伍 #${row.teamId} 保存成功`)
    await loadRows()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    savingMap[row.teamId] = false
  }
}

function changePage(page: number) {
  currentPage.value = Math.min(totalPages.value, Math.max(1, page))
  loadRows().catch((e: any) => {
    ElMessage.error(e?.message || '加载失败')
  })
}

function backToTeamHome() {
  router.push('/admin/teams')
}

function goConfigureCourse(courseItem: any) {
  router.push(`/admin/teams/${courseItem.id}`)
}

async function loadCourseFromRoute() {
  const courseIdRaw = route.params.courseId
  const courseId = Number(courseIdRaw)

  if (!courseIdRaw || Number.isNaN(courseId) || courseId <= 0) {
    selectedCourse.value = null
    rows.value = []
    currentPage.value = 1
    total.value = 0
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
    ElMessage.warning('仅 bingo 课题支持队伍管理')
    selectedCourse.value = null
    rows.value = []
    await router.replace('/admin/teams')
    return
  }

  currentPage.value = 1
  await loadRows()
}

async function init() {
  try {
    await loadBingoCourses()
    await loadCourseFromRoute()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载队伍页面失败')
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

.team-select {
  width: 100%;
}

:deep(.neon-select .el-select__wrapper) {
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  background: rgba(15, 23, 42, 0.35);
  box-shadow: none;
}

:deep(.neon-select .el-select__wrapper:hover) {
  border-color: rgba(34, 211, 238, 0.65);
}

:deep(.neon-select .el-select__wrapper.is-focused) {
  border-color: rgba(34, 211, 238, 0.75);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.3);
}

:deep(.neon-select .el-select__selected-item),
:deep(.neon-select .el-select__placeholder),
:deep(.neon-select .el-select__input) {
  color: #e2e8f0;
}

:deep(.neon-select .el-select__caret) {
  color: rgba(103, 232, 249, 0.9);
}

:global(.neon-select-popper.el-select__popper) {
  --el-bg-color-overlay: rgba(15, 23, 42, 0.96);
  --el-text-color-regular: #dbeafe;
  --el-border-color-light: rgba(34, 211, 238, 0.35);
  --el-fill-color-light: rgba(8, 47, 73, 0.6);
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: rgba(15, 23, 42, 0.96);
}

:global(.neon-select-popper.el-popper .el-popper__arrow::before) {
  border-color: rgba(34, 211, 238, 0.35);
  background: rgba(15, 23, 42, 0.96);
}

:global(.neon-select-popper .el-select-dropdown__item) {
  color: #dbeafe;
}

:global(.neon-select-popper .el-select-dropdown__item:hover),
:global(.neon-select-popper .el-select-dropdown__item.hover) {
  background: rgba(8, 47, 73, 0.45);
  color: #cffafe;
}

:global(.neon-select-popper .el-select-dropdown__item.is-selected) {
  color: #67e8f9;
  background: rgba(8, 47, 73, 0.6);
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
</style>
