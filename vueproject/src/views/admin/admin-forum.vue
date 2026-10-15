<template>
  <div class="text-cyan-50">
    <h1 class="mb-4 text-2xl font-bold">论坛管理</h1>
    <div class="mb-5 flex gap-3">
      <button class="forum-button" :class="{ active: tab === 'reports' }" @click="tab = 'reports'; page = 0; load()">举报记录</button>
      <button class="forum-button" :class="{ active: tab === 'posts' }" @click="tab = 'posts'; page = 0; load()">全部帖子</button>
    </div>
    <p v-if="error" class="mb-3 text-rose-200">{{ error }}</p>
    <p v-if="loading" class="py-6">正在加载...</p>
    <div v-else class="space-y-3">
      <div v-for="item in rows" :key="item.id" class="rounded-xl border border-cyan-200/20 bg-slate-900/70 p-4">
        <template v-if="tab === 'reports'">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-semibold">{{ item.postId ? '帖子' : '回复' }} #{{ item.postId || item.replyId }}</span>
            <span class="text-sm" :class="item.status === 'pending' ? 'text-amber-200' : 'text-cyan-100/70'">{{ statusText(item.status) }}</span>
            <span class="text-sm text-cyan-100/65">{{ formatTime(item.createdAt) }}</span>
          </div>
          <p class="mt-2 break-words text-sm">{{ item.targetText }}</p>
          <p class="mt-2 text-sm text-cyan-100/75">{{ item.reporterName }} 举报：{{ item.reason }} <span v-if="item.detail">· {{ item.detail }}</span></p>
          <div class="mt-3 flex flex-wrap gap-2">
            <router-link :to="`/forum/${item.postId || item.replyPostId}`" class="forum-button">查看内容</router-link>
            <button class="forum-button" @click="showActions(item.postId ? 'post' : 'reply', item.postId || item.replyId)">操作记录</button>
            <button class="forum-button" @click="showEdits(item.postId ? 'post' : 'reply', item.postId || item.replyId)">修改历史</button>
            <template v-if="item.status === 'pending'">
              <button class="forum-button" @click="moderate(item.postId ? 'post' : 'reply', item.postId || item.replyId, 'retain')">保留</button>
              <button class="forum-button" @click="moderate(item.postId ? 'post' : 'reply', item.postId || item.replyId, 'delete')">删除</button>
            </template>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-wrap items-center gap-3">
            <router-link :to="`/forum/${item.id}`" class="font-semibold text-cyan-100 hover:underline">#{{ item.id }} {{ item.title }}</router-link>
            <span class="text-sm text-amber-200">{{ statusText(item.status) }}</span>
          </div>
          <p class="mt-2 text-sm text-cyan-100/70">{{ item.authorName }} · {{ formatTime(item.createdAt) }} · {{ item.replyCount }} 条可见回复</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button class="forum-button" @click="showActions('post', item.id)">操作记录</button>
            <button class="forum-button" @click="showEdits('post', item.id)">修改历史</button>
            <template v-if="item.status !== 'deleted'">
              <button class="forum-button" @click="moderate('post', item.id, 'retain')">保留</button>
              <button class="forum-button" @click="moderate('post', item.id, 'delete')">删除</button>
            </template>
          </div>
        </template>
      </div>
      <p v-if="!rows.length" class="py-6 text-cyan-100/70">暂无记录</p>
    </div>
    <div v-if="total > 20" class="mt-5 flex items-center gap-3">
      <button class="forum-button" :disabled="page === 0" @click="changePage(page - 1)">上一页</button>
      <span>{{ page + 1 }} / {{ Math.ceil(total / 20) }}</span>
      <button class="forum-button" :disabled="(page + 1) * 20 >= total" @click="changePage(page + 1)">下一页</button>
    </div>
    <el-dialog v-model="actionsVisible" title="操作记录" width="min(90vw, 650px)">
      <div v-if="!actions.length" class="text-cyan-100/70">暂无操作记录</div>
      <div v-for="action in actions" :key="action.id" class="border-b border-cyan-200/20 py-2 text-sm text-cyan-50">
        {{ formatTime(action.createdAt) }} · {{ action.operatorName || '系统' }} · {{ action.action }}（{{ action.previousStatus }} → {{ action.newStatus }}）
        <p v-if="action.reason" class="mt-1 text-cyan-100/70">{{ action.reason }}</p>
      </div>
    </el-dialog>
    <el-dialog v-model="editsVisible" title="修改历史" width="min(90vw, 750px)">
      <div v-if="!edits.length" class="text-cyan-100/70">暂无修改记录</div>
      <div v-for="edit in edits" :key="edit.id" class="border-b border-cyan-200/20 py-3 text-sm text-cyan-50">
        <p>{{ formatTime(edit.createdAt) }} · {{ edit.editorName }}</p>
        <p v-if="edit.oldTitle !== null" class="mt-2 break-words text-cyan-100/70">标题：{{ edit.oldTitle }} → {{ edit.newTitle }}</p>
        <p class="mt-2 whitespace-pre-wrap break-words text-cyan-100/70">原内容：{{ edit.oldContent }}</p>
        <p class="mt-1 whitespace-pre-wrap break-words">修改后：{{ edit.newContent }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { forumApi } from '@/api/forum'

const tab = ref<'reports' | 'posts'>('reports')
const page = ref(0)
const total = ref(0)
const rows = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const actionsVisible = ref(false)
const actions = ref<any[]>([])
const editsVisible = ref(false)
const edits = ref<any[]>([])
function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function statusText(status: string): string { return ({ pending: '待处理', retained: '已保留', deleted: '已删除', visible: '可见', hidden: '已隐藏' } as Record<string, string>)[status] || status }
function changePage(value: number): void { page.value = value; void load() }

async function load(): Promise<void> {
  loading.value = true
  try {
    const result = tab.value === 'reports' ? await forumApi.adminReports(page.value) : await forumApi.adminPosts(page.value)
    rows.value = result.list
    total.value = result.total
    error.value = ''
  } catch (e: any) { error.value = e?.message || '加载失败' }
  finally { loading.value = false }
}

async function showActions(type: 'post' | 'reply', id: number): Promise<void> {
  try { actions.value = await forumApi.actions(type, id); actionsVisible.value = true }
  catch (e: any) { ElMessage.error(e?.message || '加载失败') }
}

async function showEdits(type: 'post' | 'reply', id: number): Promise<void> {
  try { edits.value = await forumApi.edits(type, id); editsVisible.value = true }
  catch (e: any) { ElMessage.error(e?.message || '加载失败') }
}

async function moderate(type: 'post' | 'reply', id: number, decision: 'retain' | 'delete'): Promise<void> {
  try {
    const answer = await ElMessageBox.prompt('请填写处理原因', decision === 'delete' ? '删除内容' : '保留内容', { inputPattern: /^.{1,500}$/, inputErrorMessage: '请输入1至500字' })
    await forumApi.moderate(type, id, decision, answer.value)
    ElMessage.success('处理完成')
    await load()
  } catch (e: any) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e?.message || '处理失败') }
}

onMounted(load)
</script>

<style scoped>
.forum-button { display: inline-block; border: 1px solid rgba(125,220,255,.58); border-radius: 9px; padding: 7px 13px; color: #ecfeff; background: rgba(8,47,73,.6); cursor: pointer; font-size: 13px; }
.forum-button.active, .forum-button:hover:not(:disabled) { background: rgba(8,145,178,.45); }
.forum-button:disabled { opacity: .45; cursor: not-allowed; }
</style>
