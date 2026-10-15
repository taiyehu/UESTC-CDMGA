<template>
  <el-dialog v-model="visible" class="forum-report-dialog" :title="target?.type === 'reply' ? '举报评论' : '举报帖子'" width="min(90vw, 480px)" :close-on-click-modal="!submitting" :close-on-press-escape="!submitting" :show-close="!submitting" @opened="reasonInput?.focus()" @closed="reset">
    <p class="mb-5 text-sm leading-6 text-slate-300">请说明举报原因。提交后内容会暂时隐藏，等待管理员处理。</p>
    <label for="forum-report-reason" class="mb-2 block text-sm font-semibold text-slate-100">举报理由 <span class="text-rose-300">*</span></label>
    <textarea id="forum-report-reason" ref="reasonInput" v-model="reason" maxlength="100" rows="4" class="report-input" placeholder="请描述违规内容，最多 100 字" :disabled="submitting" @input="error = ''" />
    <div class="mt-1 flex justify-between text-xs"><span class="text-rose-300">{{ error }}</span><span class="text-slate-400">{{ reason.length }}/100</span></div>
    <template #footer><div class="flex justify-end gap-3"><button class="secondary-button" :disabled="submitting" @click="visible = false">取消</button><button class="submit-button" :disabled="submitting" @click="submit">{{ submitting ? '提交中...' : '提交举报' }}</button></div></template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { forumApi } from '@/api/forum'

type ReportTarget = { type: 'post' | 'reply'; id: number }
const props = defineProps<{ modelValue: boolean; target: ReportTarget | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; reported: [target: ReportTarget] }>()
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const reason = ref('')
const reasonInput = ref<HTMLTextAreaElement | null>(null)
const error = ref('')
const submitting = ref(false)

function reset(): void { reason.value = ''; error.value = '' }

async function submit(): Promise<void> {
  const target = props.target
  const value = reason.value.trim()
  if (!target || submitting.value) return
  if (!value) { error.value = '请填写举报理由'; return }
  submitting.value = true
  error.value = ''
  try {
    await forumApi.report(target.type, target.id, value)
    ElMessage.success('举报已提交，内容已暂时隐藏')
    visible.value = false
    emit('reported', target)
  } catch (e: any) { error.value = e?.message || '举报提交失败，请稍后重试' }
  finally { submitting.value = false }
}
</script>

<style scoped>
.report-input { width: 100%; resize: vertical; border: 1px solid rgba(148,163,184,.35); border-radius: 10px; background: rgba(30,41,59,.85); padding: 12px 14px; color: #f8fafc; outline: none; }
.report-input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,.13); }
.report-input:disabled { opacity: .6; }
.secondary-button, .submit-button { border-radius: 10px; padding: 9px 17px; font-size: 13px; font-weight: 600; }
.secondary-button { border: 1px solid rgba(148,163,184,.4); color: #e2e8f0; }
.secondary-button:hover:not(:disabled) { background: rgba(148,163,184,.12); }
.submit-button { background: #00a1d6; color: #fff; }
.submit-button:hover:not(:disabled) { background: #22b8e9; }
.secondary-button:disabled, .submit-button:disabled { opacity: .5; cursor: not-allowed; }
:global(.forum-report-dialog.el-dialog) { border: 1px solid rgba(148,163,184,.3); border-radius: 16px; background: #0f172a; box-shadow: 0 20px 60px rgba(2,6,23,.5); }
:global(.forum-report-dialog .el-dialog__title) { color: #f8fafc; font-weight: 700; }
:global(.forum-report-dialog .el-dialog__headerbtn .el-dialog__close) { color: #94a3b8; }
</style>
