<template>
  <div class="user-picker">
    <input v-model="keyword" class="title-input" placeholder="输入昵称搜索用户" @input="searchUsers" />
    <p v-if="modelValue" class="mt-1 text-xs text-emerald-200">已选择：{{ modelValue.account }}（ID {{ modelValue.id }}）</p>
    <div v-if="results.length" class="results">
      <button v-for="user in results" :key="user.id" type="button" class="result-row" @click="selectUser(user)">
        {{ user.account }} <span class="text-cyan-100/55">ID {{ user.id }}</span>
      </button>
    </div>
    <p v-else-if="keyword.trim() && !loading && !modelValue" class="mt-1 text-xs text-cyan-100/60">没有找到匹配的昵称</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue'
import axios from 'axios'

type UserOption = { id: number; account: string }
const props = defineProps<{ modelValue: UserOption | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: UserOption | null] }>()
const keyword = ref(props.modelValue?.account || '')
const results = ref<UserOption[]>([])
const loading = ref(false)
let timer: number | null = null
let requestId = 0

function searchUsers(): void {
  const currentRequest = ++requestId
  emit('update:modelValue', null)
  if (timer) window.clearTimeout(timer)
  loading.value = false
  results.value = []
  const query = keyword.value.trim()
  if (!query) {
    return
  }
  timer = window.setTimeout(async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/title/admin/users', { params: { keyword: query } })
      if (currentRequest === requestId && response.data?.code === 0) results.value = response.data.data || []
    } catch {
      if (currentRequest === requestId) results.value = []
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }, 250)
}

function selectUser(user: UserOption): void {
  requestId += 1
  if (timer) window.clearTimeout(timer)
  keyword.value = user.account
  results.value = []
  emit('update:modelValue', user)
}

onBeforeUnmount(() => {
  if (timer) window.clearTimeout(timer)
})
</script>

<style scoped>
.user-picker { position: relative; min-width: 210px; }
.title-input { display: block; width: 100%; min-height: 38px; padding: 7px 10px; border: 1px solid rgba(103, 232, 249, 0.35); border-radius: 9px; background: #0f172a; color: #e0f2fe; }
.results { position: absolute; z-index: 20; width: 100%; max-height: 220px; overflow-y: auto; margin-top: 4px; border: 1px solid rgba(103, 232, 249, 0.35); border-radius: 9px; background: #0f172a; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35); }
.result-row { display: flex; width: 100%; justify-content: space-between; gap: 8px; padding: 8px 10px; color: #e0f2fe; text-align: left; }
.result-row:hover { background: rgba(34, 211, 238, 0.16); }
</style>
