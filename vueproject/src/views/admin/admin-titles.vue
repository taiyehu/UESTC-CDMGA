<template>
  <div>
    <h2 class="page-title">称号管理</h2>

    <section class="title-panel">
      <h3 class="section-title">待审核申请</h3>
      <div v-for="item in pending" :key="item.id" class="title-row">
        <div class="min-w-0 flex-1">
          <p>{{ item.account }} 申请了 <strong>{{ item.name }}</strong></p>
          <p class="mt-1 text-xs text-cyan-100/65">{{ formatTime(item.createdAt) }}</p>
        </div>
        <select v-model="reviewTiers[item.id]" class="title-input w-auto" aria-label="称号等级">
          <option v-for="option in tierOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <input v-model="reviewMethods[item.id]" maxlength="255" class="title-input max-w-44" placeholder="获得方式（选填）" />
        <input v-model="reviewReasons[item.id]" maxlength="255" class="title-input max-w-44" placeholder="发放原因（选填）" />
        <NeonActionButton size="sm" variant="green" @click="review(item, true)">通过</NeonActionButton>
        <NeonActionButton size="sm" variant="yellow" @click="review(item, false)">驳回</NeonActionButton>
      </div>
      <p v-if="!pending.length" class="text-sm text-cyan-100/70">暂无待审核申请</p>
    </section>

    <section class="title-panel mt-5">
      <h3 class="section-title">创建或再次发放称号</h3>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="text-sm text-cyan-100/80">接收用户（按昵称搜索）
          <AdminUserPicker v-model="recipient" class="mt-2" />
        </label>
        <label class="text-sm text-cyan-100/80">已有称号
          <select v-model.number="selectedTitleId" class="title-input mt-2">
            <option :value="0">新建称号</option>
            <option v-for="item in definitions" :key="item.id" :value="item.id">{{ item.name }}（{{ tierLabel(item.tier) }}）</option>
          </select>
        </label>
        <template v-if="selectedTitleId === 0">
          <label class="text-sm text-cyan-100/80">称号文字
            <input v-model="newName" maxlength="32" class="title-input mt-2" placeholder="最多32字" />
          </label>
          <label class="text-sm text-cyan-100/80">等级
            <select v-model="newTier" class="title-input mt-2">
              <option v-for="option in tierOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label class="text-sm text-cyan-100/80">获得方式（选填）
            <input v-model="newMethod" maxlength="255" class="title-input mt-2" placeholder="称号的获得方式" />
          </label>
        </template>
        <label class="text-sm text-cyan-100/80">发放原因（选填）
          <input v-model="newReason" maxlength="255" class="title-input mt-2" placeholder="本次发放的原因" />
        </label>
      </div>
      <NeonActionButton class="mt-4" variant="green" @click="submitGrant">{{ selectedTitleId ? '发放已有称号' : '创建并发放' }}</NeonActionButton>
    </section>

    <section class="title-panel mt-5">
      <h3 class="section-title">所有称号记录</h3>
      <div class="mb-4 flex flex-wrap items-end gap-3">
        <label class="text-sm text-cyan-100/80">按昵称筛选用户
          <AdminUserPicker :key="filterPickerKey" v-model="filterUser" class="mt-2" />
        </label>
        <NeonActionButton size="sm" @click="applyFilter">筛选</NeonActionButton>
        <NeonActionButton size="sm" variant="gray" @click="clearFilter">查看全部</NeonActionButton>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-220 text-left text-sm text-cyan-50">
          <thead class="border-b border-cyan-100/20 text-cyan-100/75">
            <tr><th class="p-3">用户</th><th class="p-3">称号</th><th class="p-3">状态</th><th class="p-3">发放时间</th><th class="p-3">发放原因</th><th class="p-3">操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in awards" :key="item.id" class="border-b border-white/10">
              <td class="p-3">{{ item.account }} <span class="text-cyan-100/55">#{{ item.identityId }}</span></td>
              <td class="p-3"><TitleBadge :name="item.name" :tier="item.tier" :acquisition-method="item.acquisitionMethod" /></td>
              <td class="p-3">
                {{ statusLabel(item.status) }}{{ item.isEquipped ? ' · 佩戴中' : '' }}
                <span v-if="item.revokedAt" class="block text-xs text-cyan-100/55">{{ formatTime(item.revokedAt) }}</span>
              </td>
              <td class="p-3">{{ formatTime(item.grantedAt) }}</td>
              <td class="max-w-55 break-words p-3">{{ item.grantReason || '-' }}</td>
              <td class="p-3">
                <div class="flex gap-2">
                  <NeonActionButton size="sm" @click="startEdit(item)">编辑</NeonActionButton>
                  <NeonActionButton v-if="item.status === 'approved'" size="sm" variant="red" @click="revoke(item)">撤销</NeonActionButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!awards.length" class="mt-3 text-sm text-cyan-100/70">暂无称号记录</p>
      <AdminPagination :current-page="page + 1" :total-pages="totalPages" @change="changePage" />

      <div v-if="editing" class="mt-5 border-t border-cyan-100/20 pt-4">
        <h4 class="font-semibold text-cyan-50">编辑 {{ editing.account }} 的 {{ editing.name }}</h4>
        <p class="mt-1 text-xs text-cyan-100/65">获得方式属于称号定义，修改后会影响所有获得该称号的用户。</p>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <label class="text-sm text-cyan-100/80">获得方式<input v-model="editingMethod" maxlength="255" class="title-input mt-2" /></label>
          <label class="text-sm text-cyan-100/80">本次发放原因<input v-model="editingReason" maxlength="255" class="title-input mt-2" /></label>
        </div>
        <div class="mt-3 flex gap-2">
          <NeonActionButton size="sm" variant="green" @click="saveDetails">保存</NeonActionButton>
          <NeonActionButton size="sm" variant="gray" @click="editing = null">取消</NeonActionButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import AdminPagination from '@/components/AdminPagination.vue'
import AdminUserPicker from '@/components/AdminUserPicker.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import TitleBadge from '@/components/TitleBadge.vue'

type UserOption = { id: number; account: string }
type TitleRow = { id: number; identityId: number; account: string; name: string; tier: string; status: string; isEquipped: boolean; acquisitionMethod?: string; grantReason?: string; createdAt?: string; grantedAt?: string; revokedAt?: string }
type Definition = { id: number; name: string; tier: string }

const tierOptions = [
  { value: 'normal', label: '普通' }, { value: 'silver', label: '银色' },
  { value: 'gold', label: '金色' }, { value: 'color', label: '彩色' },
]
const pending = ref<TitleRow[]>([])
const awards = ref<TitleRow[]>([])
const definitions = ref<Definition[]>([])
const reviewTiers = ref<Record<number, string>>({})
const reviewMethods = ref<Record<number, string>>({})
const reviewReasons = ref<Record<number, string>>({})
const recipient = ref<UserOption | null>(null)
const newName = ref('')
const newTier = ref('normal')
const newMethod = ref('')
const newReason = ref('')
const selectedTitleId = ref(0)
const filterUser = ref<UserOption | null>(null)
const filterPickerKey = ref(0)
const appliedFilterId = ref<number | null>(null)
const page = ref(0)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / 20)))
const editing = ref<TitleRow | null>(null)
const editingMethod = ref('')
const editingReason = ref('')

function tierLabel(tier: string): string { return tierOptions.find((item) => item.value === tier)?.label || tier }
function statusLabel(status: string): string {
  if (status === 'approved') return '已发放'
  if (status === 'pending') return '待审核'
  if (status === 'revoked') return '已撤销'
  return '已驳回'
}
function formatTime(input?: string): string { return input ? input.replace('T', ' ') : '-' }

async function fetchData(): Promise<void> {
  try {
    const [pendingRes, definitionsRes, awardsRes] = await Promise.all([
      axios.get('/api/title/admin/pending'),
      axios.get('/api/title/admin/definitions'),
      axios.get('/api/title/admin/awards', { params: { page: page.value, size: 20, identityId: appliedFilterId.value || undefined } }),
    ])
    if ([pendingRes, definitionsRes, awardsRes].some((response) => response.data?.code !== 0)) throw new Error('获取称号数据失败')
    pending.value = pendingRes.data.data || []
    definitions.value = definitionsRes.data.data || []
    awards.value = awardsRes.data.data?.list || []
    total.value = Number(awardsRes.data.data?.total || 0)
    for (const item of pending.value) {
      reviewTiers.value[item.id] ||= 'normal'
      reviewMethods.value[item.id] ??= item.acquisitionMethod || ''
      reviewReasons.value[item.id] ??= ''
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取称号数据失败')
  }
}

async function review(item: TitleRow, approved: boolean): Promise<void> {
  const note = approved ? '' : (window.prompt('请输入驳回原因（可留空）') ?? null)
  if (note === null) return
  try {
    const response = await axios.post(`/api/title/admin/review/${item.id}`, {
      approved, tier: reviewTiers.value[item.id], note,
      acquisitionMethod: reviewMethods.value[item.id], grantReason: reviewReasons.value[item.id],
    })
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    ElMessage.success(approved ? '审核通过' : '已驳回')
    await fetchData()
  } catch (error: any) { ElMessage.error(error.message || '审核失败') }
}

async function submitGrant(): Promise<void> {
  if (!recipient.value || (!selectedTitleId.value && !newName.value.trim())) {
    ElMessage.warning('请选择用户并填写或选择称号')
    return
  }
  try {
    const url = selectedTitleId.value ? '/api/title/admin/grant' : '/api/title/admin/create'
    const payload = selectedTitleId.value
      ? { identityId: recipient.value.id, titleId: selectedTitleId.value, grantReason: newReason.value.trim() }
      : { identityId: recipient.value.id, name: newName.value.trim(), tier: newTier.value, acquisitionMethod: newMethod.value.trim(), grantReason: newReason.value.trim() }
    const response = await axios.post(url, payload)
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    ElMessage.success('称号已发放')
    newName.value = ''
    newReason.value = ''
    await fetchData()
  } catch (error: any) { ElMessage.error(error.message || '发放失败') }
}

function applyFilter(): void {
  if (!filterUser.value) { ElMessage.warning('请先按昵称选择用户'); return }
  appliedFilterId.value = filterUser.value.id
  page.value = 0
  fetchData()
}
function clearFilter(): void {
  filterUser.value = null
  filterPickerKey.value += 1
  appliedFilterId.value = null
  page.value = 0
  fetchData()
}
function changePage(nextPage: number): void { page.value = nextPage - 1; fetchData() }
function startEdit(item: TitleRow): void {
  editing.value = item
  editingMethod.value = item.acquisitionMethod || ''
  editingReason.value = item.grantReason || ''
}
async function saveDetails(): Promise<void> {
  if (!editing.value) return
  try {
    const response = await axios.post(`/api/title/admin/details/${editing.value.id}`, {
      acquisitionMethod: editingMethod.value.trim(), grantReason: editingReason.value.trim(),
    })
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    editing.value = null
    ElMessage.success('称号信息已更新')
    await fetchData()
  } catch (error: any) { ElMessage.error(error.message || '保存失败') }
}
async function revoke(item: TitleRow): Promise<void> {
  if (!window.confirm(`确定撤销 ${item.account} 的「${item.name}」吗？记录仍会保留。`)) return
  try {
    const response = await axios.post(`/api/title/admin/revoke/${item.id}`)
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    ElMessage.success('称号已撤销')
    await fetchData()
  } catch (error: any) { ElMessage.error(error.message || '撤销失败') }
}

onMounted(fetchData)
</script>

<style scoped>
.page-title { font-size: 24px; font-weight: 700; color: #e2e8f0; margin-bottom: 16px; }
.section-title { font-size: 18px; font-weight: 600; color: #e0f2fe; margin-bottom: 14px; }
.title-panel { border: 1px solid rgba(34, 211, 238, 0.24); border-radius: 14px; background: rgba(15, 23, 42, 0.48); padding: 18px; }
.title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 12px 0; border-top: 1px solid rgba(255, 255, 255, 0.12); }
.title-input { display: block; width: 100%; min-height: 38px; padding: 7px 10px; border: 1px solid rgba(103, 232, 249, 0.35); border-radius: 9px; background: #0f172a; color: #e0f2fe; }
</style>
