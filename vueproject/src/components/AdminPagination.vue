<template>
  <div class="admin-pagination">
    <NeonActionButton size="sm" :disabled="disabled || safeCurrentPage <= 1" @click="emitChange(1)">首页</NeonActionButton>
    <NeonActionButton size="sm" :disabled="disabled || safeCurrentPage <= 1" @click="emitChange(safeCurrentPage - 1)">上一页</NeonActionButton>
    <span class="summary">{{ summaryText || `${safeCurrentPage} / ${safeTotalPages}` }}</span>
    <NeonActionButton size="sm" :disabled="disabled || safeCurrentPage >= safeTotalPages" @click="emitChange(safeCurrentPage + 1)">下一页</NeonActionButton>
    <NeonActionButton size="sm" :disabled="disabled || safeCurrentPage >= safeTotalPages" @click="emitChange(safeTotalPages)">尾页</NeonActionButton>
    <input v-model="pageInput" type="number" min="1" :max="safeTotalPages" class="page-jump-input" placeholder="页码" :disabled="disabled" @keyup.enter="jumpTo" />
    <NeonActionButton size="sm" :disabled="disabled" @click="jumpTo">跳转</NeonActionButton>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    disabled?: boolean
    summaryText?: string
  }>(),
  {
    disabled: false,
    summaryText: '',
  }
)

const emit = defineEmits<{
  (event: 'change', page: number): void
}>()

const pageInput = ref('')

const safeTotalPages = computed(() => Math.max(1, Number(props.totalPages) || 1))
const safeCurrentPage = computed(() => {
  const page = Number(props.currentPage) || 1
  return Math.min(safeTotalPages.value, Math.max(1, page))
})

watch(
  () => [props.currentPage, props.totalPages],
  () => {
    pageInput.value = ''
  }
)

function emitChange(target: number) {
  const page = Math.min(safeTotalPages.value, Math.max(1, Number(target) || 1))
  emit('change', page)
}

function jumpTo() {
  const page = Number(pageInput.value)
  if (!Number.isFinite(page)) return
  emitChange(page)
}
</script>

<style scoped>
.admin-pagination {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.summary {
  color: rgba(207, 250, 254, 0.85);
}

.page-jump-input {
  width: 72px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  padding: 6px 8px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.35);
}
</style>
