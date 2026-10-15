<template>
  <section class="mx-auto max-w-5xl px-4 pb-12 pt-5 text-cyan-50 md:px-8">
    <router-link to="/forum" class="text-sm text-cyan-200 hover:underline">← 返回论坛</router-link>
    <p v-if="loading" class="py-8">正在加载帖子...</p>
    <p v-else-if="error" class="py-8 text-rose-200">{{ error }}</p>
    <template v-else-if="post">
      <NeonCard class="mt-4 rounded-2xl p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold">{{ post.title }}</h1>
            <p class="mt-2 text-sm text-cyan-100/65">{{ post.authorName }} · {{ formatTime(post.createdAt) }} <span v-if="post.status !== 'visible'">· {{ statusText(post.status) }}</span></p>
          </div>
          <div class="flex gap-2">
            <button class="forum-button" @click="like('post', post.id)">{{ post.liked ? '♥ 已赞' : '♡ 点赞' }} {{ post.likeCount }}</button>
            <button v-if="post.authorId !== me && post.status === 'visible'" class="forum-button" @click="report('post', post.id)">举报</button>
          </div>
        </div>
        <p class="mt-5 whitespace-pre-wrap break-words leading-7 text-cyan-50/90">{{ post.content }}</p>
        <div v-if="post.images?.length" class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <a v-for="image in post.images" :key="image.id" :href="image.url" target="_blank" rel="noopener noreferrer"><img :src="image.url" alt="帖子图片" class="max-h-72 w-full rounded-xl object-contain" /></a>
        </div>
        <div v-if="isAdmin && post.status !== 'deleted'" class="mt-5 flex gap-2 border-t border-cyan-200/20 pt-4">
          <button class="forum-button" @click="moderate('post', post.id, 'retain')">保留帖子</button>
          <button class="forum-button" @click="moderate('post', post.id, 'delete')">删除帖子</button>
        </div>
      </NeonCard>

      <h2 class="mb-3 mt-8 text-xl font-semibold">回复（{{ post.replies?.length || 0 }}）</h2>
      <div class="space-y-3">
        <NeonCard v-for="reply in post.replies || []" :key="reply.id" class="rounded-2xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>{{ reply.authorName }} <span v-if="reply.parentReplyId" class="text-cyan-100/60">回复 #{{ reply.parentReplyId }}</span> · {{ formatTime(reply.createdAt) }}</span>
            <span v-if="reply.status !== 'visible'" class="text-amber-200">{{ statusText(reply.status) }}</span>
          </div>
          <p class="mt-3 whitespace-pre-wrap break-words">{{ reply.content }}</p>
          <a v-for="image in reply.images" :key="image.id" :href="image.url" target="_blank" rel="noopener noreferrer" class="mt-3 block"><img :src="image.url" alt="回复图片" class="max-h-72 max-w-full rounded-lg object-contain" /></a>
          <div class="mt-4 flex flex-wrap gap-2">
            <button class="forum-button" @click="like('reply', reply.id)">{{ reply.liked ? '♥ 已赞' : '♡ 点赞' }} {{ reply.likeCount }}</button>
            <button v-if="reply.status === 'visible'" class="forum-button" @click="parentReplyId = reply.id">回复</button>
            <button v-if="reply.authorId !== me && reply.status === 'visible'" class="forum-button" @click="report('reply', reply.id)">举报</button>
            <template v-if="isAdmin && reply.status !== 'deleted'">
              <button class="forum-button" @click="moderate('reply', reply.id, 'retain')">保留</button>
              <button class="forum-button" @click="moderate('reply', reply.id, 'delete')">删除</button>
            </template>
          </div>
        </NeonCard>
      </div>

      <NeonCard v-if="post.status === 'visible'" class="mt-6 rounded-2xl p-5">
        <h3 class="mb-3 font-semibold">{{ parentReplyId ? `回复 #${parentReplyId}` : '发表回复' }}</h3>
        <button v-if="parentReplyId" class="mb-2 text-xs text-cyan-200" @click="parentReplyId = null">取消指定回复</button>
        <textarea v-model="replyContent" maxlength="3000" rows="4" class="forum-input" placeholder="写下你的回复..." />
        <label class="mt-3 block text-sm text-cyan-100/75">可选图片（1张，最多5MB）
          <input type="file" accept="image/png,image/jpeg,image/gif" class="mt-2 block w-full" @change="selectReplyImage" />
        </label>
        <div class="mt-4 flex items-center gap-3">
          <button class="forum-button" :disabled="submitting" @click="submitReply">{{ submitting ? '发送中...' : '发送回复' }}</button>
          <span v-if="formError" class="text-sm text-rose-200">{{ formError }}</span>
        </div>
      </NeonCard>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import { forumApi, type ForumPost } from '@/api/forum'

const route = useRoute()
const router = useRouter()
const post = ref<ForumPost | null>(null)
const loading = ref(false)
const error = ref('')
const replyContent = ref('')
const parentReplyId = ref<number | null>(null)
const replyImage = ref<File | null>(null)
const submitting = ref(false)
const formError = ref('')
const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
const me = Number(userInfo.id || userInfo.identityId || 0)
const isAdmin = computed(() => userInfo.role === 'admin')
const postId = computed(() => Number(route.params.id))
function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function statusText(value: string): string { return value === 'hidden' ? '举报后隐藏' : '已删除' }
function selectReplyImage(event: Event): void { replyImage.value = (event.target as HTMLInputElement).files?.[0] || null }

async function load(): Promise<void> {
  loading.value = true
  try { post.value = await forumApi.post(postId.value); error.value = '' }
  catch (e: any) { post.value = null; error.value = e?.message || '帖子加载失败' }
  finally { loading.value = false }
}

async function submitReply(): Promise<void> {
  if (!replyContent.value.trim()) { formError.value = '请填写回复内容'; return }
  if (replyImage.value && replyImage.value.size > 5 * 1024 * 1024) { formError.value = '图片不能超过5MB'; return }
  submitting.value = true
  try {
    const id = await forumApi.createReply(postId.value, replyContent.value, parentReplyId.value)
    let uploadFailed = false
    if (replyImage.value) {
      try { await forumApi.upload('reply', id, replyImage.value) }
      catch { uploadFailed = true }
    }
    replyContent.value = ''; replyImage.value = null; parentReplyId.value = null; formError.value = ''
    await load()
    ElMessage[uploadFailed ? 'warning' : 'success'](uploadFailed ? '回复已发布，图片上传失败' : '回复已发布')
  } catch (e: any) { formError.value = e?.message || '回复失败' }
  finally { submitting.value = false }
}

async function like(type: 'post' | 'reply', id: number): Promise<void> {
  try { await forumApi.like(type, id); await load() }
  catch (e: any) { ElMessage.error(e?.message || '操作失败') }
}

async function report(type: 'post' | 'reply', id: number): Promise<void> {
  try {
    const result = await ElMessageBox.prompt('请填写举报原因', '举报内容', { inputPattern: /^.{1,100}$/, inputErrorMessage: '请输入1至100字' })
    await forumApi.report(type, id, result.value)
    ElMessage.success('举报已提交，内容已隐藏')
    if (type === 'post') await router.push('/forum')
    else await load()
  } catch (e: any) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e?.message || '举报失败') }
}

async function moderate(type: 'post' | 'reply', id: number, decision: 'retain' | 'delete'): Promise<void> {
  try {
    const result = await ElMessageBox.prompt('请填写处理原因', decision === 'delete' ? '删除内容' : '保留内容', { inputPattern: /^.{1,500}$/, inputErrorMessage: '请输入1至500字' })
    await forumApi.moderate(type, id, decision, result.value)
    ElMessage.success('处理完成')
    await load()
  } catch (e: any) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e?.message || '处理失败') }
}

onMounted(load)
watch(postId, load)
</script>

<style scoped>
.forum-input { width: 100%; border: 1px solid rgba(125,220,255,.35); border-radius: 10px; background: rgba(15,23,42,.65); padding: 10px 12px; color: #ecfeff; outline: none; }
.forum-input:focus { border-color: #67e8f9; }
.forum-button { border: 1px solid rgba(125,220,255,.58); border-radius: 10px; padding: 7px 13px; color: #ecfeff; background: rgba(8,47,73,.6); cursor: pointer; font-size: 13px; }
.forum-button:hover:not(:disabled) { background: rgba(8,145,178,.45); }
.forum-button:disabled { opacity: .45; cursor: not-allowed; }
</style>
