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
            <button v-if="post.status === 'visible'" class="forum-button" @click="like('post', post.id)">{{ post.liked ? '♥ 已赞' : '♡ 点赞' }} {{ post.likeCount }}</button>
            <button v-if="post.authorId !== me && post.status === 'visible'" class="forum-button" @click="report('post', post.id)">举报</button>
            <button v-if="post.authorId === me && post.status === 'visible'" class="forum-button" @click="startPostEdit">修改</button>
            <button v-if="post.authorId === me && post.status !== 'deleted'" class="forum-button" @click="deleteContent('post', post.id)">删除</button>
          </div>
        </div>
        <template v-if="editingPost">
          <input v-model="editTitle" maxlength="120" class="forum-input mt-5" placeholder="标题" />
          <textarea v-model="editContent" maxlength="10000" rows="6" class="forum-input mt-3" placeholder="正文" />
          <p class="mt-4 text-sm text-cyan-100/70">移除现有附件会立即生效；新附件将在保存后上传。</p>
          <ForumAttachmentPicker ref="editAttachments" class="mt-3" :max-images="6" :max-files="3" :existing-image-count="post.images.length" :existing-file-count="post.files.length" :disabled="submitting" />
          <div class="mt-4 flex gap-2"><button class="forum-button" :disabled="submitting" @click="savePostEdit">保存修改</button><button class="forum-button" @click="editingPost = false">取消</button></div>
        </template>
        <p v-else class="mt-5 whitespace-pre-wrap break-words leading-7 text-cyan-50/90">{{ post.content }}</p>
        <div v-if="post.images?.length" class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div v-for="image in post.images" :key="image.id"><button type="button" @click="previewUrl = image.url"><img :src="image.url" alt="帖子图片" class="max-h-72 w-full rounded-xl object-contain" /></button><button v-if="editingPost" class="forum-button mt-1" @click="removeImage(image.id)">移除图片</button></div>
        </div>
        <div v-if="post.files?.length" class="mt-4 space-y-2">
          <div v-for="file in post.files" :key="file.id" class="flex flex-wrap items-center gap-3 text-sm">
            <a :href="file.url" class="text-cyan-200 underline">{{ file.name }}</a>
            <button v-if="editingPost" class="forum-button" @click="removeFile(file.id)">移除文件</button>
          </div>
        </div>
      </NeonCard>

      <h2 class="mb-3 mt-8 text-xl font-semibold">回复（{{ post.replies?.length || 0 }}）</h2>
      <div class="space-y-3">
        <NeonCard v-for="reply in post.replies || []" :key="reply.id" class="rounded-2xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>{{ reply.authorName }} <span v-if="reply.parentReplyId" class="text-cyan-100/60">回复 #{{ reply.parentReplyId }}</span> · {{ formatTime(reply.createdAt) }}</span>
            <span v-if="reply.status !== 'visible'" class="text-amber-200">{{ statusText(reply.status) }}</span>
          </div>
          <template v-if="editingReplyId === reply.id">
            <textarea v-model="editReplyContent" maxlength="3000" rows="4" class="forum-input mt-3" />
            <ForumAttachmentPicker ref="editReplyAttachments" class="mt-3" :max-images="1" :existing-image-count="reply.images.length" :disabled="submitting" />
            <div class="mt-3 flex gap-2"><button class="forum-button" :disabled="submitting" @click="saveReplyEdit(reply.id)">保存</button><button class="forum-button" @click="editingReplyId = null">取消</button></div>
          </template>
          <p v-else class="mt-3 whitespace-pre-wrap break-words">{{ reply.content }}</p>
          <div v-for="image in reply.images" :key="image.id" class="mt-3"><button type="button" @click="previewUrl = image.url"><img :src="image.url" alt="回复图片" class="max-h-72 max-w-full rounded-lg object-contain" /></button><button v-if="editingReplyId === reply.id" class="forum-button ml-2" @click="removeImage(image.id)">移除图片</button></div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button v-if="reply.status === 'visible'" class="forum-button" @click="like('reply', reply.id)">{{ reply.liked ? '♥ 已赞' : '♡ 点赞' }} {{ reply.likeCount }}</button>
            <button v-if="reply.status === 'visible'" class="forum-button" @click="parentReplyId = reply.id">回复</button>
            <button v-if="reply.authorId !== me && reply.status === 'visible'" class="forum-button" @click="report('reply', reply.id)">举报</button>
            <button v-if="reply.authorId === me && reply.status === 'visible'" class="forum-button" @click="startReplyEdit(reply.id, reply.content)">修改</button>
            <button v-if="(reply.authorId === me || post.authorId === me) && reply.status !== 'deleted'" class="forum-button" @click="deleteContent('reply', reply.id)">删除评论</button>
          </div>
        </NeonCard>
      </div>

      <NeonCard v-if="post.status === 'visible'" class="mt-6 rounded-2xl p-5">
        <h3 class="mb-3 font-semibold">{{ parentReplyId ? `回复 #${parentReplyId}` : '发表回复' }}</h3>
        <button v-if="parentReplyId" class="mb-2 text-xs text-cyan-200" @click="parentReplyId = null">取消指定回复</button>
        <textarea v-model="replyContent" maxlength="3000" rows="4" class="forum-input" placeholder="写下你的回复..." />
        <ForumAttachmentPicker ref="replyAttachments" class="mt-3" :max-images="1" :disabled="submitting" />
        <div class="mt-4 flex items-center gap-3">
          <button class="forum-button" :disabled="submitting" @click="submitReply">{{ submitting ? '发送中...' : '发送回复' }}</button>
          <span v-if="formError" class="text-sm text-rose-200">{{ formError }}</span>
        </div>
      </NeonCard>
      <el-dialog v-model="previewOpen" title="图片预览" width="min(90vw, 800px)"><img :src="previewUrl" alt="图片预览" class="max-h-[70vh] w-full object-contain" /></el-dialog>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import ForumAttachmentPicker from '@/components/ForumAttachmentPicker.vue'
import { forumApi, type ForumPost } from '@/api/forum'

type AttachmentPickerExpose = { getImages: () => File[]; getFiles: () => File[]; clear: () => void; isPreparing: () => boolean; hasError: () => boolean }

const route = useRoute()
const router = useRouter()
const post = ref<ForumPost | null>(null)
const loading = ref(false)
const error = ref('')
const replyContent = ref('')
const parentReplyId = ref<number | null>(null)
const replyAttachments = ref<AttachmentPickerExpose | null>(null)
const editAttachments = ref<AttachmentPickerExpose | null>(null)
const editReplyAttachments = ref<AttachmentPickerExpose | null>(null)
const editingPost = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editingReplyId = ref<number | null>(null)
const editReplyContent = ref('')
const previewUrl = ref('')
const previewOpen = computed({ get: () => !!previewUrl.value, set: (open) => { if (!open) previewUrl.value = '' } })
const submitting = ref(false)
const formError = ref('')
const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
const me = Number(userInfo.id || userInfo.identityId || 0)
const postId = computed(() => Number(route.params.id))
function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function statusText(value: string): string { return value === 'hidden' ? '举报后隐藏' : '已删除' }

function startPostEdit(): void {
  if (!post.value) return
  editTitle.value = post.value.title
  editContent.value = post.value.content
  editingPost.value = true
}

function startReplyEdit(id: number, content: string): void {
  editingReplyId.value = id
  editReplyContent.value = content
}

async function load(): Promise<void> {
  loading.value = true
  try { post.value = await forumApi.post(postId.value); error.value = '' }
  catch (e: any) { post.value = null; error.value = e?.message || '帖子加载失败' }
  finally { loading.value = false }
}

async function submitReply(): Promise<void> {
  if (!replyContent.value.trim()) { formError.value = '请填写回复内容'; return }
  if (replyAttachments.value?.isPreparing() || replyAttachments.value?.hasError()) { formError.value = '请先处理图片选择错误'; return }
  submitting.value = true
  try {
    const id = await forumApi.createReply(postId.value, replyContent.value, parentReplyId.value)
    let uploadFailed = false
    const image = replyAttachments.value?.getImages()[0]
    if (image) {
      try { await forumApi.upload('reply', id, image) }
      catch { uploadFailed = true }
    }
    replyContent.value = ''; replyAttachments.value?.clear(); parentReplyId.value = null; formError.value = ''
    await load()
    ElMessage[uploadFailed ? 'warning' : 'success'](uploadFailed ? '回复已发布，图片上传失败' : '回复已发布')
  } catch (e: any) { formError.value = e?.message || '回复失败' }
  finally { submitting.value = false }
}

async function savePostEdit(): Promise<void> {
  if (!post.value || !editTitle.value.trim() || !editContent.value.trim()) { formError.value = '标题和正文不能为空'; return }
  if (editAttachments.value?.isPreparing() || editAttachments.value?.hasError()) { formError.value = '请先处理附件选择错误'; return }
  submitting.value = true
  try {
    const id = post.value.id
    const images = editAttachments.value?.getImages() || []
    const files = editAttachments.value?.getFiles() || []
    await forumApi.editPost(id, editTitle.value, editContent.value)
    let failed = false
    for (const image of images) { try { await forumApi.upload('post', id, image) } catch { failed = true } }
    for (const file of files) { try { await forumApi.uploadFile(id, file) } catch { failed = true } }
    editingPost.value = false
    await load()
    ElMessage[failed ? 'warning' : 'success'](failed ? '文字已保存，部分附件上传失败' : '修改已保存')
  } catch (e: any) { ElMessage.error(e?.message || '修改失败') }
  finally { submitting.value = false }
}

async function saveReplyEdit(id: number): Promise<void> {
  if (!editReplyContent.value.trim()) { ElMessage.warning('回复不能为空'); return }
  if (editReplyAttachments.value?.isPreparing() || editReplyAttachments.value?.hasError()) { ElMessage.warning('请先处理图片选择错误'); return }
  submitting.value = true
  try {
    const image = editReplyAttachments.value?.getImages()[0]
    await forumApi.editReply(id, editReplyContent.value)
    let failed = false
    if (image) { try { await forumApi.upload('reply', id, image) } catch { failed = true } }
    editingReplyId.value = null
    await load()
    ElMessage[failed ? 'warning' : 'success'](failed ? '文字已保存，图片上传失败' : '回复已修改')
  } catch (e: any) { ElMessage.error(e?.message || '修改失败') }
  finally { submitting.value = false }
}

async function deleteContent(type: 'post' | 'reply', id: number): Promise<void> {
  try {
    await ElMessageBox.confirm(type === 'post' ? '确定删除自己的帖子吗？' : '确定删除这条评论吗？', '确认删除', { type: 'warning' })
    await forumApi.deleteContent(type, id)
    ElMessage.success('已删除')
    if (type === 'post') await router.push('/forum')
    else await load()
  } catch (e: any) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e?.message || '删除失败') }
}

async function removeImage(id: number): Promise<void> {
  try {
    await forumApi.removeImage(id)
    if (post.value) {
      post.value.images = post.value.images.filter(image => image.id !== id)
      for (const reply of post.value.replies || []) reply.images = reply.images.filter(image => image.id !== id)
    }
    ElMessage.success('图片已移除')
  }
  catch (e: any) { ElMessage.error(e?.message || '移除失败') }
}

async function removeFile(id: number): Promise<void> {
  try {
    await forumApi.removeFile(id)
    if (post.value) post.value.files = post.value.files.filter(file => file.id !== id)
    ElMessage.success('文件已移除')
  }
  catch (e: any) { ElMessage.error(e?.message || '移除失败') }
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
