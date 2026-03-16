<template>
  <article class="space-y-5">
    <header class="task-panel text-left header-wrap">
      <div class="header-main">
        <div class="task-category-row">
          <div class="score-legend" aria-label="分值图例">
            <span class="legend-dot score-5">5</span>
            <span class="legend-dot score-3">3</span>
            <span class="legend-dot score-2">2</span>
          </div>
          <p class="task-category">bingo</p>
        </div>
        <h1 class="task-title">{{ course.title }}</h1>
        <p class="task-time">持续时间：{{ duration }}</p>
        <p class="task-content">{{ course.description || '暂无课题内容。' }}</p>
      </div>

      <aside class="team-panel">
        <template v-if="!currentIdentityId">
          <p class="team-empty">未登录，无法查看队伍信息</p>
        </template>

        <template v-else-if="!myTeam">
          <p class="team-empty">未参加队伍，点击创建或加入队伍</p>
          <div class="team-actions">
            <button type="button" class="team-btn create" @click="handleCreateTeam">创建</button>
            <button type="button" class="team-btn join" @click="joinDialogVisible = true">加入</button>
          </div>
        </template>

        <template v-else>
          <div class="team-head-row">
            <p class="team-meta">队伍号：#{{ myTeam.teamId }}</p>
            <p class="team-meta">总分：{{ Number(myTeam.totalScore || 0).toFixed(2) }}</p>
          </div>
          <div class="member-row">
            <div v-for="slot in memberSlots" :key="slot.slot" class="member-card" :class="{ empty: !slot.member }" @click="onMemberSlotClick(slot.member)">
              <template v-if="slot.member">
                <img v-if="slot.member.avatar" :src="toUrl(slot.member.avatar)" class="member-avatar" alt="队员头像" />
                <div v-else class="member-avatar placeholder">?</div>
                <p class="member-name">{{ slot.member.account }}</p>
              </template>
              <template v-else>
                <div class="member-avatar placeholder">+</div>
                <p class="member-name">邀请队员</p>
              </template>
            </div>
          </div>
          <div class="leave-wrap">
            <button type="button" class="team-btn leave leave-mini" @click="leaveConfirmVisible = true">退出队伍</button>
          </div>
        </template>
      </aside>
    </header>

    <section class="task-panel">
      <div class="bingo-outer-frame">
        <BingoIssueGrid
          :course-id="props.course.id"
          :identity-id="currentIdentityId"
          :refresh-token="gridRefreshToken"
          @select="goCell"
        />
      </div>
    </section>

    <el-dialog v-model="joinDialogVisible" title="加入队伍" width="520px" class="team-dialog" modal-class="team-dialog-mask">
      <div class="space-y-3">
        <el-input v-model="joinKeyword" placeholder="搜索队伍ID或队员名称" class="team-input" />
        <div class="flex gap-2">
          <button type="button" class="team-btn join" @click="searchJoinOptions">搜索</button>
        </div>
        <div class="join-list">
          <button
            v-for="item in joinOptions"
            :key="item.teamId"
            type="button"
            class="join-option"
            @click="handleJoinTeam(item.teamId)"
          >
            <span class="join-option-main">队伍 #{{ item.teamId }} | {{ item.memberAccounts.join(' / ') || '暂无成员' }} | {{ item.memberCount }}/3</span>
            <span class="join-option-hint">点击加入</span>
          </button>
          <p v-if="joinSearched && joinOptions.length === 0" class="team-empty">未检索到可加入队伍</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="inviteDialogVisible" title="邀请队员" width="460px" class="team-dialog" modal-class="team-dialog-mask">
      <el-select
        v-model="inviteTargetId"
        clearable
        filterable
        remote
        reserve-keyword
        :loading="inviteLoading"
        :remote-method="searchInviteOptions"
        placeholder="输入ID或用户名搜索"
        class="w-full team-select"
        popper-class="team-select-popper"
      >
        <el-option
          v-for="option in inviteOptions"
          :key="option.identityId"
          :label="`${option.account} (#${option.identityId})`"
          :value="option.identityId"
        />
      </el-select>
      <template #footer>
        <button type="button" class="team-btn create" @click="handleInviteMember">邀请加入</button>
      </template>
    </el-dialog>

    <el-dialog v-model="leaveConfirmVisible" title="确认退出队伍" width="420px" class="team-dialog" modal-class="team-dialog-mask">
      <p class="team-empty">确认要退出当前队伍吗？</p>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <button type="button" class="team-btn" @click="leaveConfirmVisible = false">取消</button>
          <button type="button" class="team-btn leave leave-mini" @click="confirmLeaveTeam">确认退出</button>
        </div>
      </template>
    </el-dialog>
  </article>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Course } from '@/api/types'
import { formatDuration } from './task-utils'
import BingoIssueGrid from '@/components/BingoIssueGrid.vue'
import {
  createMyTeam,
  fetchMyTeamPanel,
  fetchMyTeamScore,
  inviteCourseTeamMember,
  joinCourseTeam,
  leaveCourseTeam,
  searchJoinTeamOptions,
  searchTeamMemberOptions,
  type TeamJoinOption,
  type TeamMemberOption,
  type TeamPanel,
} from '@/api/team'
import { ElMessage } from 'element-plus'

const props = defineProps<{ course: Course }>()
const router = useRouter()
const myTeam = ref<TeamPanel | null>(null)
const gridRefreshToken = ref(0)
const joinDialogVisible = ref(false)
const inviteDialogVisible = ref(false)
const joinKeyword = ref('')
const joinOptions = ref<TeamJoinOption[]>([])
const joinSearched = ref(false)
const inviteOptions = ref<TeamMemberOption[]>([])
const inviteTargetId = ref<number | null>(null)
const inviteLoading = ref(false)
const leaveConfirmVisible = ref(false)

function parseSessionValue(raw: string | null): any {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const currentUser = computed(() => {
  return parseSessionValue(sessionStorage.getItem('userInfo'))
})

const currentIdentityId = computed<number | null>(() => {
  const value = Number(currentUser.value?.id ?? currentUser.value?.identityId ?? currentUser.value?.userId)
  return Number.isFinite(value) && value > 0 ? value : null
})

const memberSlots = computed(() => {
  const members = Array.isArray(myTeam.value?.members) ? myTeam.value!.members : []
  return Array.from({ length: 3 }, (_, index) => ({
    slot: index + 1,
    member: members[index] || null,
  }))
})

const duration = computed(() => formatDuration(props.course.startTime, props.course.endTime))

function toUrl(path?: string) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

async function loadMyTeamPanel() {
  if (!currentIdentityId.value) {
    myTeam.value = null
    gridRefreshToken.value += 1
    return
  }
  try {
    const panel = await fetchMyTeamPanel(props.course.id, currentIdentityId.value)
    if (!panel) {
      myTeam.value = null
      return
    }
    const score = await fetchMyTeamScore(props.course.id, currentIdentityId.value)
    panel.totalScore = Number.isFinite(score) ? score : Number(panel.totalScore || 0)
    myTeam.value = panel
  } catch {
    myTeam.value = null
  } finally {
    gridRefreshToken.value += 1
  }
}

async function handleCreateTeam() {
  if (!currentIdentityId.value) {
    ElMessage.error('请先登录')
    return
  }
  try {
    await createMyTeam(props.course.id, currentIdentityId.value)
    ElMessage.success('创建队伍成功')
    await loadMyTeamPanel()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '创建失败')
  }
}

async function searchJoinOptions() {
  if (!currentIdentityId.value) return
  joinSearched.value = true
  joinOptions.value = await searchJoinTeamOptions(props.course.id, currentIdentityId.value, joinKeyword.value)
}

async function handleJoinTeam(teamId: number) {
  if (!currentIdentityId.value) return
  try {
    await joinCourseTeam(props.course.id, currentIdentityId.value, teamId)
    ElMessage.success('加入队伍成功')
    joinDialogVisible.value = false
    joinKeyword.value = ''
    joinOptions.value = []
    joinSearched.value = false
    await loadMyTeamPanel()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '加入失败')
  }
}

function onMemberSlotClick(member: any | null) {
  if (!myTeam.value || member) return
  inviteTargetId.value = null
  inviteOptions.value = []
  inviteDialogVisible.value = true
}

async function searchInviteOptions(keyword: string) {
  const key = (keyword || '').trim()
  if (!key) {
    inviteOptions.value = []
    return
  }
  inviteLoading.value = true
  try {
    inviteOptions.value = await searchTeamMemberOptions(props.course.id, key, 20)
  } finally {
    inviteLoading.value = false
  }
}

async function handleInviteMember() {
  if (!currentIdentityId.value || !inviteTargetId.value) {
    ElMessage.warning('请先选择邀请对象')
    return
  }
  try {
    await inviteCourseTeamMember(props.course.id, currentIdentityId.value, inviteTargetId.value)
    ElMessage.success('邀请成功，对方已加入队伍')
    inviteDialogVisible.value = false
    await loadMyTeamPanel()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '邀请失败')
  }
}

async function confirmLeaveTeam() {
  if (!currentIdentityId.value) return
  try {
    await leaveCourseTeam(props.course.id, currentIdentityId.value)
    ElMessage.success('已退出队伍')
    leaveConfirmVisible.value = false
    myTeam.value = null
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '退出失败')
  }
}

function goCell(cellId: number) {
  router.push(`/task/${props.course.id}/bingo/${cellId}`)
}

watch(
  () => props.course.id,
  () => {
    loadMyTeamPanel()
  },
  { immediate: true }
)
</script>

<style scoped>
.task-panel {
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 16px;
  padding: 18px;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.5), rgba(76, 29, 149, 0.22));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 20px rgba(34, 211, 238, 0.12);
}

.task-category {
  margin-bottom: 0;
  font-size: 12px;
  text-transform: uppercase;
  color: rgba(34, 211, 238, 0.9);
}

.task-category-row {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-legend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.legend-dot.score-5 {
  color: #fef3c7;
  background: linear-gradient(145deg, rgba(245, 193, 49, 0.74), rgba(213, 154, 18, 0.62));
  border: 1px solid rgba(251, 191, 36, 0.8);
}

.legend-dot.score-3 {
  color: #fce7f3;
  background: rgba(157, 23, 77, 0.78);
  border: 1px solid rgba(244, 114, 182, 0.8);
}

.legend-dot.score-2 {
  color: #dcfce7;
  background: rgba(22, 101, 52, 0.82);
  border: 1px solid rgba(74, 222, 128, 0.8);
}

.task-title {
  font-size: clamp(1.4rem, 2vw, 2rem);
  color: #e0f2fe;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.4);
}

.task-time {
  margin-top: 6px;
  color: rgba(186, 230, 253, 0.85);
}

.task-content {
  margin-top: 12px;
  line-height: 1.72;
  color: rgba(236, 254, 255, 0.9);
}

.header-wrap {
  display: grid;
  gap: 14px;
}

.team-panel {
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 12px;
  padding: 12px;
  background: rgba(2, 6, 23, 0.35);
}

.team-empty {
  color: rgba(186, 230, 253, 0.88);
  font-size: 15px;
}

.team-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.team-btn {
  border: 1px solid rgba(34, 211, 238, 0.78);
  border-radius: 8px;
  padding: 8px 12px;
  color: #e0f2fe;
  background: rgba(8, 47, 73, 0.72);
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
}

.team-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow:
    0 0 10px rgba(34, 211, 238, 0.42),
    0 0 14px rgba(217, 70, 239, 0.18);
}

.team-btn.create {
  border-color: rgba(16, 185, 129, 0.75);
  color: #ecfdf5;
  background: rgba(6, 78, 59, 0.62);
}

.team-btn.join {
  border-color: rgba(56, 189, 248, 0.75);
  color: #e0f2fe;
  background: rgba(12, 74, 110, 0.62);
}

.team-btn.leave {
  border-color: rgba(251, 191, 36, 0.75);
  color: #fef3c7;
  background: rgba(120, 53, 15, 0.55);
}

.team-meta {
  color: rgba(224, 247, 255, 0.92);
  font-size: 16px;
  font-weight: 600;
}

.team-meta + .team-meta {
  margin-top: 4px;
}

.team-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.member-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.leave-wrap {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.leave-mini {
  padding: 4px 9px;
  font-size: 12px;
  border-radius: 7px;
}

.member-card {
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 10px;
  padding: 8px;
  text-align: center;
  background: rgba(15, 23, 42, 0.38);
}

.member-card.empty {
  cursor: pointer;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  margin: 0 auto;
  border: 1px solid rgba(34, 211, 238, 0.4);
}

.member-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5f3fc;
  background: rgba(8, 47, 73, 0.5);
  font-weight: 700;
}

.member-name {
  margin-top: 6px;
  font-size: 14px;
  color: rgba(224, 247, 255, 0.9);
}

.join-list {
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: grid;
  gap: 8px;
}

.join-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.join-option {
  position: relative;
  overflow: hidden;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid rgba(34, 211, 238, 0.35);
  border-radius: 8px;
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.62), rgba(12, 74, 110, 0.45));
  color: #dbeafe;
  padding: 8px 10px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  animation: join-option-pulse 2.1s ease-in-out infinite;
}

.join-option::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -35%;
  width: 24%;
  background: linear-gradient(90deg, transparent, rgba(165, 243, 252, 0.34), transparent);
  transform: skewX(-18deg);
  animation: join-option-sheen 2.6s ease-in-out infinite;
}

.join-option:hover {
  transform: translateY(-1px) scale(1.01);
  border-color: rgba(103, 232, 249, 0.9);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.32),
    0 0 22px rgba(14, 116, 144, 0.24);
}

.join-option-main {
  position: relative;
  z-index: 1;
}

.join-option-hint {
  position: relative;
  z-index: 1;
  white-space: nowrap;
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  color: #ccfbf1;
  border: 1px solid rgba(45, 212, 191, 0.45);
  background: rgba(15, 118, 110, 0.32);
}

@keyframes join-option-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(34, 211, 238, 0.04);
  }
  50% {
    box-shadow: 0 0 16px rgba(34, 211, 238, 0.22);
  }
}

@keyframes join-option-sheen {
  0% {
    left: -35%;
    opacity: 0;
  }
  14% {
    opacity: 0.78;
  }
  48% {
    left: 112%;
    opacity: 0;
  }
  100% {
    left: 112%;
    opacity: 0;
  }
}

@media (min-width: 1024px) {
  .header-wrap {
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }
}

.bingo-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  min-height: 0;
  border-radius: 10px;
  border: 2px solid rgba(34, 211, 238, 0.55);
  background: linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55));
  color: #cffafe;
  font-weight: 700;
  letter-spacing: 0.06em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bingo-cell:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 16px rgba(34, 211, 238, 0.45),
    0 0 22px rgba(217, 70, 239, 0.22);
}

.cell-score {
  font-size: clamp(22px, 6.4vw, 42px);
  font-weight: 800;
  line-height: 0.95;
}

.bingo-outer-frame {
  border: 1px solid rgba(34, 211, 238, 0.32);
  border-radius: 14px;
  padding: 10px;
  background: rgba(2, 6, 23, 0.3);
}

.bingo-inner-frame {
  border: 1px solid rgba(34, 211, 238, 0.22);
  border-radius: 12px;
  padding: 8px;
  max-height: max(340px, calc(100vh - 360px));
  overflow: auto;
}

.bingo-grid {
  width: min(100%, min(68vh, 520px));
  margin: 0 auto;
}

.bingo-cell.cell-score-2 {
  border-color: rgba(74, 222, 128, 0.9);
}

.bingo-cell.cell-score-3 {
  border-color: rgba(244, 114, 182, 0.9);
}

.bingo-cell.cell-score-5 {
  border-color: rgba(251, 191, 36, 0.9);
}

.bingo-cell.cell-score-2 .cell-score {
  color: #86efac;
}

.bingo-cell.cell-score-3 .cell-score {
  color: #f9a8d4;
}

.bingo-cell.cell-score-5 .cell-score {
  color: #fde68a;
}

.bingo-cell.cell-completed.cell-score-2 {
  background: linear-gradient(145deg, rgba(22, 101, 52, 0.78), rgba(21, 128, 61, 0.66));
}

.bingo-cell.cell-completed.cell-score-3 {
  background: linear-gradient(145deg, rgba(131, 24, 67, 0.8), rgba(157, 23, 77, 0.68));
}

.bingo-cell.cell-completed.cell-score-5 {
  background: linear-gradient(145deg, rgba(120, 53, 15, 0.8), rgba(146, 64, 14, 0.72));
}

.bingo-cell.cell-line-scored {
  border-width: 3px;
  background:
    linear-gradient(120deg, rgba(250, 255, 0, 0.8), rgba(125, 211, 252, 0.76), rgba(167, 139, 250, 0.74), rgba(255, 62, 191, 0.78));
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.24);
}

.bingo-cell.cell-line-scored.cell-completed {
  background:
    linear-gradient(120deg, rgba(250, 255, 0, 0.8), rgba(125, 211, 252, 0.76), rgba(167, 139, 250, 0.74), rgba(255, 62, 191, 0.78));
}

:global(.team-dialog-mask) {
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(2px);
}

:global(.team-dialog.el-dialog) {
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94));
  box-shadow:
    0 0 24px rgba(34, 211, 238, 0.2),
    0 0 36px rgba(217, 70, 239, 0.12);
}

:global(.team-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
  margin-right: 0;
  padding-bottom: 12px;
}

:global(.team-dialog .el-dialog__title) {
  color: #e2e8f0;
  font-weight: 700;
}

:global(.team-dialog .el-dialog__body) {
  color: #dbeafe;
}

:global(.team-dialog .el-dialog__footer) {
  border-top: 1px solid rgba(34, 211, 238, 0.2);
  padding-top: 12px;
}

:deep(.team-input .el-input__wrapper) {
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  background: rgba(15, 23, 42, 0.45);
  box-shadow: none;
}

:deep(.team-input .el-input__inner) {
  color: #e2e8f0;
}

:deep(.team-input .el-input__inner::placeholder) {
  color: rgba(186, 230, 253, 0.7);
}

:deep(.team-select .el-select__wrapper) {
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  background: rgba(15, 23, 42, 0.45);
  box-shadow: none;
}

:deep(.team-select .el-select__selected-item),
:deep(.team-select .el-select__placeholder),
:deep(.team-select .el-select__input) {
  color: #e2e8f0;
}

:global(.team-select-popper.el-select__popper) {
  --el-bg-color-overlay: rgba(15, 23, 42, 0.98);
  --el-fill-color-light: rgba(8, 47, 73, 0.45);
  --el-fill-color-blank: rgba(15, 23, 42, 0.98);
  --el-border-color-light: rgba(34, 211, 238, 0.35);
  --el-text-color-regular: #dbeafe;
  --el-text-color-primary: #e2e8f0;
  border: 1px solid rgba(34, 211, 238, 0.35);
  background: linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(12, 74, 110, 0.82));
  box-shadow:
    0 0 18px rgba(34, 211, 238, 0.25),
    0 0 30px rgba(14, 116, 144, 0.2);
}

:global(body .team-select-popper.el-select__popper) {
  border-color: rgba(34, 211, 238, 0.42) !important;
  background: linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(12, 74, 110, 0.82)) !important;
}

:global(.team-select-popper.el-popper .el-popper__arrow::before) {
  border-color: rgba(34, 211, 238, 0.42);
  background: rgba(15, 23, 42, 0.96);
}

:global(body .team-select-popper .el-popper__arrow::before) {
  border-color: rgba(34, 211, 238, 0.42) !important;
  background: rgba(15, 23, 42, 0.96) !important;
}

:global(.team-select-popper .el-select-dropdown__item) {
  color: #dbeafe;
  transition: background-color 0.14s ease, color 0.14s ease;
}

:global(body .team-select-popper .el-select-dropdown__item) {
  color: #dbeafe !important;
}

:global(.team-select-popper .el-select-dropdown__item:hover),
:global(.team-select-popper .el-select-dropdown__item.hover) {
  background: rgba(8, 47, 73, 0.45);
  color: #cffafe;
}

:global(body .team-select-popper .el-select-dropdown__item:hover),
:global(body .team-select-popper .el-select-dropdown__item.hover) {
  background: rgba(8, 47, 73, 0.45) !important;
  color: #cffafe !important;
}

:global(.team-select-popper .el-select-dropdown__item.is-selected) {
  color: #67e8f9;
  background: rgba(8, 47, 73, 0.62);
}

:global(body .team-select-popper .el-select-dropdown__item.is-selected) {
  color: #67e8f9 !important;
  background: rgba(8, 47, 73, 0.62) !important;
}

:global(.team-select-popper .el-select-dropdown__empty) {
  color: rgba(186, 230, 253, 0.78);
}
</style>
