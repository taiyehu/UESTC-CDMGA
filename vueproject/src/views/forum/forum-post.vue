<template>
  <section class="forum-page mx-auto max-w-7xl px-4 pb-14 pt-6 text-cyan-50 md:px-8">
    <router-link to="/forum" class="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-sky-300">← 返回论坛</router-link>
    <p v-if="loading" class="surface-panel py-12 text-center text-slate-400">正在加载帖子...</p>
    <p v-else-if="error" class="surface-panel py-12 text-center text-rose-300">{{ error }}</p>
    <div v-else-if="post" class="forum-layout">
      <main class="min-w-0 space-y-4">
        <article class="surface-panel p-5 md:p-7">
          <div class="flex items-start gap-3">
            <router-link :to="`/profile/${post.authorId}`" class="shrink-0"><img :src="avatarUrl(post.avatar)" :alt="`${post.authorName}的头像`" class="avatar" /></router-link>
            <div class="flex min-w-0 flex-1 flex-col items-start gap-1"><div class="flex flex-wrap items-center gap-2"><router-link :to="`/profile/${post.authorId}`" class="font-semibold text-sky-300 hover:text-sky-200">{{ post.authorName }}</router-link><span v-if="post.status !== 'visible'" class="status-tag">{{ statusText(post.status) }}</span></div><TitleBadge v-if="post.titleName && post.titleTier" compact :name="post.titleName" :tier="post.titleTier" :acquisition-method="post.titleAcquisitionMethod" /></div>
          </div>
          <h1 class="mt-5 break-words text-2xl font-bold leading-tight">{{ post.title }}</h1>
          <div class="mt-4">
            <template v-if="editingPost">
              <input v-model="editTitle" maxlength="120" class="forum-input" placeholder="标题" />
              <textarea v-model="editContent" maxlength="10000" rows="6" class="forum-input mt-3" placeholder="正文" />
              <p class="mt-4 text-sm text-slate-400">移除现有附件会立即生效；新附件将在保存后上传。</p>
              <ForumAttachmentPicker ref="editAttachments" class="mt-3" :max-images="6" :max-files="3" :existing-image-count="post.images.length" :existing-file-count="post.files.length" :disabled="submitting" />
              <div class="mt-4 flex gap-2"><button class="primary-button" :disabled="submitting" @click="savePostEdit">保存修改</button><button class="secondary-button" @click="editingPost = false">取消</button></div>
            </template>
            <p v-else class="whitespace-pre-wrap break-words leading-8 text-slate-200">{{ post.content }}</p>
            <div v-if="post.images?.length" class="mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
              <div v-for="image in post.images" :key="image.id"><button type="button" class="w-full" @click="previewUrl = image.url"><img :src="image.url" alt="帖子图片" class="post-image" /></button><button v-if="editingPost" class="text-button mt-1" @click="removeImage(image.id)">移除图片</button></div>
            </div>
            <div v-if="post.files?.length" class="mt-5 space-y-2"><div v-for="file in post.files" :key="file.id" class="file-row"><a :href="file.url" class="min-w-0 truncate text-sky-300 hover:underline">▧ {{ file.name }}</a><button v-if="editingPost" class="text-button" @click="removeFile(file.id)">移除</button></div></div>
          </div>
          <div class="action-row mt-6 flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 text-sm text-slate-400">
            <button v-if="post.status === 'visible'" class="text-button" @click="like('post', post.id)">{{ post.liked ? '♥' : '♡' }} {{ post.likeCount }} 点赞</button>
            <span>↩ {{ post.replies?.length || 0 }} 评论</span>
            <div class="ml-auto flex flex-wrap items-center gap-4"><time class="text-xs text-slate-400" :datetime="post.createdAt">{{ formatTime(post.createdAt) }}</time><button v-if="post.authorId !== me && post.status === 'visible'" class="text-button" @click="openReport('post', post.id)">举报</button><button v-if="post.authorId === me && post.status === 'visible'" class="text-button" @click="startPostEdit">编辑</button><button v-if="post.authorId === me && post.status !== 'deleted'" class="text-button danger" @click="requestDelete('post', post.id)">删除帖子</button></div>
          </div>
        </article>

        <section class="surface-panel p-5 md:p-7">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><h2 class="text-lg font-bold">评论 <span class="ml-1 text-sm font-normal text-slate-400">{{ post.replies?.length || 0 }}</span></h2><div class="flex items-center gap-1" role="group" aria-label="评论排序"><button class="sort-button" :class="{ active: replySort === 'latest' }" @click="switchReplySort('latest')">时间顺序</button><button class="sort-button" :class="{ active: replySort === 'likes' }" @click="switchReplySort('likes')">最多点赞</button></div></div>
          <div v-if="post.status === 'visible'" ref="replyEditor" class="border-b border-white/10 py-5">
            <div class="flex gap-3"><img :src="myAvatar" alt="我的头像" class="avatar" /><div class="min-w-0 flex-1"><p class="mb-2 text-sm font-semibold">{{ parentReplyId ? `回复 #${parentReplyId}` : '发表你的评论' }}</p><button v-if="parentReplyId" class="text-button mb-2" @click="parentReplyId = null">取消指定回复</button><textarea v-model="replyContent" maxlength="3000" rows="3" class="forum-input" placeholder="发一条友善的评论吧..." /><ForumAttachmentPicker ref="replyAttachments" class="mt-3" :max-images="1" :disabled="submitting" /><div class="mt-3 flex flex-wrap items-center justify-end gap-3"><span v-if="formError" class="mr-auto text-sm text-rose-300">{{ formError }}</span><button class="primary-button" :disabled="submitting" @click="submitReply">{{ submitting ? '发送中...' : '发布评论' }}</button></div></div></div>
          </div>
          <p v-if="!post.replies?.length" class="py-10 text-center text-sm text-slate-400">还没有评论，来聊聊吧。</p>
          <div v-for="reply in post.replies || []" :key="reply.id" class="comment-row flex gap-3 border-b border-white/10 py-5 last:border-b-0">
            <router-link :to="`/profile/${reply.authorId}`" class="shrink-0"><img :src="avatarUrl(reply.avatar)" :alt="`${reply.authorName}的头像`" class="avatar" /></router-link>
            <div class="min-w-0 flex-1">
              <div class="flex flex-col items-start gap-1"><div class="flex flex-wrap items-center gap-2"><router-link :to="`/profile/${reply.authorId}`" class="font-semibold text-sky-300 hover:text-sky-200">{{ reply.authorName }}</router-link><span v-if="reply.authorId === post.authorId" class="owner-tag">楼主</span><span v-if="reply.status !== 'visible'" class="status-tag">{{ statusText(reply.status) }}</span></div><TitleBadge v-if="reply.titleName && reply.titleTier" compact :name="reply.titleName" :tier="reply.titleTier" :acquisition-method="reply.titleAcquisitionMethod" /></div>
              <p v-if="reply.parentReplyId" class="mt-1 text-xs text-slate-400">回复 #{{ reply.parentReplyId }}</p>
              <template v-if="editingReplyId === reply.id"><textarea v-model="editReplyContent" maxlength="3000" rows="4" class="forum-input mt-3" /><ForumAttachmentPicker ref="editReplyAttachments" class="mt-3" :max-images="1" :existing-image-count="reply.images.length" :disabled="submitting" /><div class="mt-3 flex gap-2"><button class="primary-button" :disabled="submitting" @click="saveReplyEdit(reply.id)">保存</button><button class="secondary-button" @click="editingReplyId = null">取消</button></div></template>
              <p v-else class="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{{ reply.content }}</p>
              <div v-for="image in reply.images" :key="image.id" class="mt-3"><button type="button" @click="previewUrl = image.url"><img :src="image.url" alt="回复图片" class="reply-image" /></button><button v-if="editingReplyId === reply.id" class="text-button ml-2" @click="removeImage(image.id)">移除图片</button></div>
              <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400"><span>{{ formatTime(reply.createdAt) }}</span><button v-if="reply.status === 'visible'" class="text-button" @click="like('reply', reply.id)">{{ reply.liked ? '♥' : '♡' }} {{ reply.likeCount }}</button><button v-if="reply.status === 'visible'" class="text-button" @click="chooseReply(reply.id)">回复</button><button v-if="reply.authorId !== me && reply.status === 'visible'" class="text-button" @click="openReport('reply', reply.id)">举报</button><button v-if="reply.authorId === me && reply.status === 'visible'" class="text-button" @click="startReplyEdit(reply.id, reply.content)">编辑</button><button v-if="(reply.authorId === me || post.authorId === me) && reply.status !== 'deleted'" class="text-button danger" @click="requestDelete('reply', reply.id, reply.authorName)">删除</button></div>
            </div>
          </div>
        </section>
      </main>

      <aside class="space-y-4"><div class="surface-panel p-5"><p class="mb-4 text-sm font-semibold">关于作者</p><div class="flex items-start gap-3"><router-link :to="`/profile/${post.authorId}`"><img :src="avatarUrl(post.avatar)" :alt="`${post.authorName}的头像`" class="avatar" /></router-link><div class="flex min-w-0 flex-col items-start gap-1"><router-link :to="`/profile/${post.authorId}`" class="font-semibold text-sky-300">{{ post.authorName }}</router-link><TitleBadge v-if="post.titleName && post.titleTier" compact :name="post.titleName" :tier="post.titleTier" :acquisition-method="post.titleAcquisitionMethod" /></div></div></div><div class="surface-panel p-5"><p class="text-sm font-semibold">参与讨论</p><p class="mt-2 text-sm leading-6 text-slate-400">喜欢这篇帖子可以点赞，也欢迎在评论区继续交流。</p><router-link to="/forum" class="mt-4 inline-block text-sm text-sky-300 hover:underline">浏览更多帖子 →</router-link></div></aside>
    </div>
    <el-dialog v-model="previewOpen" title="图片预览" width="min(90vw, 800px)"><img :src="previewUrl" alt="图片预览" class="max-h-[70vh] w-full object-contain" /></el-dialog>
    <ForumReportDialog v-model="reportOpen" :target="reportTarget" @reported="handleReported" />
    <el-dialog v-model="deleteDialogVisible" class="forum-delete-dialog" title="确认删除" width="min(90vw, 440px)" :close-on-click-modal="!deleting" :show-close="!deleting" @closed="deleteTarget = null">
      <p class="text-base font-semibold text-slate-100">{{ deletePrompt }}</p>
      <p class="mt-3 text-sm leading-6 text-slate-400">删除后内容将不再公开显示，此操作无法由用户撤销。</p>
      <template #footer><div class="flex justify-end gap-3"><button class="secondary-button" :disabled="deleting" @click="deleteDialogVisible = false">取消</button><button class="danger-button" :disabled="deleting" @click="confirmDelete">{{ deleting ? '删除中...' : '确认删除' }}</button></div></template>
    </el-dialog>
  </section>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ForumAttachmentPicker from '@/components/ForumAttachmentPicker.vue'
import ForumReportDialog from '@/components/ForumReportDialog.vue'
import { forumApi, type ForumPost, type ForumSort } from '@/api/forum'
import TitleBadge from '@/components/TitleBadge.vue'
import defaultAvatar from '@/assets/default-avatar.png'

type AttachmentPickerExpose = { getImages: () => File[]; getFiles: () => File[]; clear: () => void; isPreparing: () => boolean; hasError: () => boolean }

const route = useRoute()
const router = useRouter()
const post = ref<ForumPost | null>(null)
const replySort = ref<ForumSort>('latest')
const loading = ref(false)
const error = ref('')
const replyContent = ref('')
const parentReplyId = ref<number | null>(null)
const replyAttachments = ref<AttachmentPickerExpose | null>(null)
const replyEditor = ref<HTMLElement | null>(null)
const editAttachments = ref<AttachmentPickerExpose | null>(null)
const editReplyAttachments = ref<AttachmentPickerExpose | null>(null)
const editingPost = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editingReplyId = ref<number | null>(null)
const editReplyContent = ref('')
const previewUrl = ref('')
const previewOpen = computed({ get: () => !!previewUrl.value, set: (open) => { if (!open) previewUrl.value = '' } })
const reportOpen = ref(false)
const reportTarget = ref<{ type: 'post' | 'reply'; id: number } | null>(null)
const submitting = ref(false)
const formError = ref('')
const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
const me = Number(userInfo.id || userInfo.identityId || 0)
const myAvatar = ref(avatarUrl(userInfo.avatar || userInfo.avatarUrl || userInfo.profile?.avatar))
const deleteDialogVisible = ref(false)
const deleting = ref(false)
const deleteTarget = ref<{ type: 'post' | 'reply'; id: number; authorName?: string } | null>(null)
const deletePrompt = computed(() => {
  if (deleteTarget.value?.type === 'post') return '确定删除这篇帖子吗？'
  if (deleteTarget.value?.authorName) return `确定删除 ${deleteTarget.value.authorName} 的评论吗？`
  return '确定删除这条评论吗？'
})
const postId = computed(() => Number(route.params.id))
function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function statusText(value: string): string { return value === 'hidden' ? '举报后隐藏' : '已删除' }
function avatarUrl(value?: string): string { return value ? (/^https?:\/\//.test(value) || value.startsWith('/') ? value : `/${value}`) : defaultAvatar }

async function loadMyAvatar(): Promise<void> {
  if (!me) return
  try { myAvatar.value = avatarUrl((await forumApi.myAvatar(me)) || undefined) }
  catch { /* 保留登录信息中的头像 */ }
}

function switchReplySort(value: ForumSort): void { replySort.value = value; void load() }

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

function chooseReply(id: number): void {
  parentReplyId.value = id
  void nextTick(() => replyEditor.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

async function load(): Promise<void> {
  loading.value = true
  try { post.value = await forumApi.post(postId.value, replySort.value); error.value = '' }
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

function requestDelete(type: 'post' | 'reply', id: number, authorName?: string): void {
  deleteTarget.value = { type, id, authorName: type === 'reply' && post.value?.authorId === me ? authorName : undefined }
  deleteDialogVisible.value = true
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    await forumApi.deleteContent(target.type, target.id)
    deleteDialogVisible.value = false
    ElMessage.success('已删除')
    if (target.type === 'post') await router.push('/forum')
    else await load()
  } catch (e: any) { ElMessage.error(e?.message || '删除失败') }
  finally { deleting.value = false }
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

function openReport(type: 'post' | 'reply', id: number): void { reportTarget.value = { type, id }; reportOpen.value = true }
async function handleReported(target: { type: 'post' | 'reply'; id: number }): Promise<void> {
  if (target.type === 'post') await router.push('/forum')
  else await load()
}

onMounted(() => { void load(); void loadMyAvatar() })
watch(postId, load)
</script>

<style scoped>
.forum-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; align-items: start; gap: 20px; }
.surface-panel { border: 1px solid rgba(148, 163, 184, .2); border-radius: 16px; background: rgba(15, 23, 42, .92); box-shadow: 0 12px 32px rgba(2, 6, 23, .16); }
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #334155; }
.owner-tag, .status-tag { border-radius: 999px; padding: 2px 8px; font-size: 11px; }
.owner-tag { color: #7dd3fc; background: rgba(14, 165, 233, .18); }
.status-tag { color: #fde68a; background: rgba(251, 191, 36, .15); }
.post-image { width: 100%; height: 180px; border-radius: 10px; object-fit: cover; background: #1e293b; }
.reply-image { max-width: 260px; max-height: 230px; border-radius: 10px; object-fit: contain; }
.file-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 520px; border: 1px solid rgba(148,163,184,.18); border-radius: 10px; background: rgba(30,41,59,.6); padding: 9px 12px; font-size: 13px; }
.forum-input { width: 100%; border: 1px solid rgba(148,163,184,.3); border-radius: 10px; background: rgba(30,41,59,.75); padding: 11px 13px; color: #f8fafc; outline: none; }
.forum-input:focus { border-color: #38bdf8; }
.primary-button, .secondary-button, .danger-button { border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; transition: background .2s; }
.primary-button { background: #00a1d6; color: white; }
.primary-button:hover:not(:disabled) { background: #22b8e9; }
.secondary-button { border: 1px solid rgba(148,163,184,.35); color: #e2e8f0; }
.secondary-button:hover:not(:disabled) { background: rgba(56,189,248,.12); }
.danger-button { background: #e05260; color: white; }
.danger-button:hover:not(:disabled) { background: #ef6b78; }
.text-button { color: inherit; font-size: inherit; }
.text-button:hover { color: #7dd3fc; }
.text-button.danger:hover { color: #fda4af; }
.sort-button { padding: 7px 10px; border-radius: 8px; color: #94a3b8; font-size: 12px; }
.sort-button.active { color: #7dd3fc; background: rgba(14, 165, 233, .12); }
.sort-button:hover { color: #e0f2fe; }
.primary-button:disabled, .secondary-button:disabled, .danger-button:disabled { opacity: .5; cursor: not-allowed; }
:global(.forum-delete-dialog.el-dialog) { border: 1px solid rgba(148,163,184,.3); border-radius: 16px; background: #0f172a; box-shadow: 0 20px 60px rgba(2,6,23,.5); }
:global(.forum-delete-dialog .el-dialog__title) { color: #f8fafc; font-weight: 700; }
:global(.forum-delete-dialog .el-dialog__headerbtn .el-dialog__close) { color: #94a3b8; }
@media (max-width: 900px) { .forum-layout { grid-template-columns: minmax(0, 1fr); } .forum-layout aside { display: none; } }
@media (max-width: 640px) { .avatar { width: 42px; height: 42px; } .post-image { height: 120px; } }
</style>
