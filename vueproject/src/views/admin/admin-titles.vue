<template>
  <div>
    <h2 class="page-title">称号管理</h2>

    <section class="title-panel">
      <h3 class="section-title">待审核申请</h3>
      <div v-if="pending.length" class="space-y-3">
        <div v-for="item in pending" :key="item.id" class="title-row">
          <div class="min-w-0 flex-1">
            <p class="text-cyan-50">{{ item.account }}（ID {{ item.identityId }}）申请了 <strong>{{ item.name }}</strong></p>
            <p class="mt-1 text-xs text-cyan-100/65">{{ formatTime(item.createdAt) }}</p>
          </div>
          <select v-model="reviewTiers[item.id]" class="title-input w-auto" aria-label="审核称号等级">
            <option v-for="option in tierOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <NeonActionButton size="sm" variant="green" @click="review(item, true)">通过</NeonActionButton>
          <NeonActionButton size="sm" variant="yellow" @click="review(item, false)">驳回</NeonActionButton>
        </div>
      </div>
      <p v-else class="text-sm text-cyan-100/70">暂无待审核申请</p>
    </section>

    <section class="title-panel mt-5">
      <h3 class="section-title">创建并发放称号</h3>
      <div class="flex flex-wrap items-end gap-3">
        <label class="min-w-44 flex-1 text-sm text-cyan-100/80">称号文字
          <input v-model="newName" maxlength="32" class="title-input mt-2" placeholder="最多32字" />
        </label>
        <label class="text-sm text-cyan-100/80">等级
          <select v-model="newTier" class="title-input mt-2">
            <option v-for="option in tierOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="w-36 text-sm text-cyan-100/80">接收用户ID
          <input v-model.number="recipientId" type="number" min="1" class="title-input mt-2" />
        </label>
        <NeonActionButton variant="green" @click="createAndGrant">创建并发放</NeonActionButton>
      </div>
    </section>

    <section class="title-panel mt-5">
      <h3 class="section-title">再次发放已有称号</h3>
      <div class="flex flex-wrap items-end gap-3">
        <label class="min-w-55 flex-1 text-sm text-cyan-100/80">管理员创建的称号
          <select v-model.number="selectedTitleId" class="title-input mt-2">
            <option :value="0">请选择称号</option>
            <option v-for="item in definitions" :key="item.id" :value="item.id">{{ item.name }}（{{ tierLabel(item.tier) }}）</option>
          </select>
        </label>
        <label class="w-36 text-sm text-cyan-100/80">接收用户ID
          <input v-model.number="grantRecipientId" type="number" min="1" class="title-input mt-2" />
        </label>
        <NeonActionButton @click="grantExisting">发放</NeonActionButton>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import NeonActionButton from '@/components/NeonActionButton.vue'

type TitleRow = { id: number; identityId: number; account: string; name: string; tier: string; createdAt?: string }
type Definition = { id: number; name: string; tier: string }

const tierOptions = [
  { value: 'normal', label: '普通' },
  { value: 'silver', label: '银色' },
  { value: 'gold', label: '金色' },
  { value: 'color', label: '彩色' },
]
const pending = ref<TitleRow[]>([])
const definitions = ref<Definition[]>([])
const reviewTiers = ref<Record<number, string>>({})
const newName = ref('')
const newTier = ref('normal')
const recipientId = ref<number | null>(null)
const selectedTitleId = ref(0)
const grantRecipientId = ref<number | null>(null)

function tierLabel(tier: string): string {
  return tierOptions.find((item) => item.value === tier)?.label || tier
}

function formatTime(input?: string): string {
  return input ? input.replace('T', ' ') : '-'
}

async function fetchData(): Promise<void> {
  try {
    const [pendingRes, definitionsRes] = await Promise.all([
      axios.get('/api/title/admin/pending'),
      axios.get('/api/title/admin/definitions'),
    ])
    if (pendingRes.data?.code !== 0 || definitionsRes.data?.code !== 0) throw new Error('获取称号数据失败')
    pending.value = pendingRes.data.data || []
    definitions.value = definitionsRes.data.data || []
    for (const item of pending.value) reviewTiers.value[item.id] ||= 'normal'
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
    })
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    ElMessage.success(approved ? '审核通过' : '已驳回')
    await fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '审核失败')
  }
}

async function createAndGrant(): Promise<void> {
  if (!newName.value.trim() || !recipientId.value) {
    ElMessage.warning('请填写称号和接收用户ID')
    return
  }
  try {
    const response = await axios.post('/api/title/admin/create', {
      name: newName.value.trim(), tier: newTier.value, identityId: recipientId.value,
    })
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    ElMessage.success('称号已创建并发放')
    newName.value = ''
    await fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '发放失败')
  }
}

async function grantExisting(): Promise<void> {
  if (!selectedTitleId.value || !grantRecipientId.value) {
    ElMessage.warning('请选择称号和接收用户')
    return
  }
  try {
    const response = await axios.post('/api/title/admin/grant', {
      titleId: selectedTitleId.value, identityId: grantRecipientId.value,
    })
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    ElMessage.success('称号已发放')
  } catch (error: any) {
    ElMessage.error(error.message || '发放失败')
  }
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
