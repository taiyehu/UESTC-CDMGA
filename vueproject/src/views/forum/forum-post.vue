<template>
  <section class="forum-page mx-auto max-w-7xl px-4 pb-14 pt-6 text-left text-cyan-50 md:px-8">
    <router-link to="/forum" class="mb-5 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-slate-800/80 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-sky-400/60 hover:bg-slate-700 hover:text-sky-300">← 返回论坛</router-link>
    <p v-if="loading" class="surface-panel py-12 text-center text-slate-400">正在加载帖子...</p>
    <p v-else-if="error" class="surface-panel py-12 text-center text-rose-300">{{ error }}</p>
    <div v-else-if="post" class="forum-layout">
      <main class="min-w-0 space-y-4">
        <article class="surface-panel p-5 text-left md:p-7">
          <div class="flex items-start gap-3">
            <router-link :to="`/profile/${post.authorId}`" class="shrink-0"><img :src="avatarUrl(post.avatar)" :alt="`${post.authorName}的头像`" class="avatar" /></router-link>
            <div class="flex min-w-0 flex-1 flex-col items-start gap-1"><div class="flex flex-wrap items-center gap-2"><router-link :to="`/profile/${post.authorId}`" class="font-semibold text-sky-300 hover:text-sky-200">{{ post.authorName }}</router-link><span v-if="post.status !== 'visible'" class="status-tag">{{ statusText(post.status) }}</span></div><TitleBadge v-if="post.titleName && post.titleTier" compact :name="post.titleName" :tier="post.titleTier" :acquisition-method="post.titleAcquisitionMethod" /></div>
          </div>
          <h1 class="mt-5 break-words text-center text-2xl font-bold leading-tight">{{ post.title }}</h1>
          <div class="post-body mt-4 text-left">
            <template v-if="editingPost">
              <input v-model="editTitle" maxlength="120" class="forum-input" placeholder="标题" />
              <textarea v-model="editContent" maxlength="10000" rows="6" class="forum-input mt-3" placeholder="正文" />
              <p class="mt-4 text-sm text-slate-400">移除现有附件会立即生效；新附件将在保存后上传。</p>
              <ForumAttachmentPicker ref="editAttachments" class="mt-3" :max-images="6" :max-files="3" :existing-image-count="post.images.length" :existing-file-count="post.files.length" :disabled="submitting" />
              <div class="mt-4 flex gap-2"><button class="primary-button" :disabled="submitting" @click="savePostEdit">保存修改</button><button class="secondary-button" @click="editingPost = false">取消</button></div>
            </template>
            <p v-else class="whitespace-pre-wrap break-words text-left leading-8 text-slate-200">{{ post.content }}</p>
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

        <section class="surface-panel p-5 text-left md:p-7">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><h2 class="text-lg font-bold">评论 <span class="ml-1 text-sm font-normal text-slate-400">{{ post.replies?.length || 0 }}</span></h2><div class="flex items-center gap-1" role="group" aria-label="评论排序"><button class="sort-button" :class="{ active: replySort === 'latest' }" @click="switchReplySort('latest')">时间顺序</button><button class="sort-button" :class="{ active: replySort === 'likes' }" @click="switchReplySort('likes')">最多点赞</button></div></div>
          <div v-if="post.status === 'visible'" ref="replyEditor" class="border-b border-white/10 py-5">
            <div class="flex items-start gap-3"><img :src="myAvatar" alt="我的头像" class="avatar" /><div class="min-w-0 flex-1 text-left"><p class="mb-2 text-sm font-semibold">{{ parentReplyId ? `回复 @${replyTargetName}` : '发表你的评论' }}</p><button v-if="parentReplyId" class="text-button mb-2" @click="cancelReplyTarget">取消指定回复</button><textarea v-model="replyContent" maxlength="3000" rows="3" class="forum-input" placeholder="发一条友善的评论吧..." /><ForumAttachmentPicker ref="replyAttachments" class="mt-3" :max-images="1" :disabled="submitting" /><div class="mt-3 flex flex-wrap items-center justify-end gap-3"><span v-if="formError" class="mr-auto text-sm text-rose-300">{{ formError }}</span><button class="primary-button" :disabled="submitting" @click="submitReply">{{ submitting ? '发送中...' : '发布评论' }}</button></div></div></div>
          </div>
          <p v-if="!post.replies?.length" class="py-10 text-center text-sm text-slate-400">还没有评论，来聊聊吧。</p>
          <div v-for="group in replyGroups" :key="group.root.id" class="comment-thread border-b border-white/10 py-5 text-left last:border-b-0">
            <ForumReplyItem :reply="group.root" :post-author-id="post.authorId" :me="me" @like="like('reply', $event)" @reply="chooseReply" @report="openReport('reply', $event)" @delete="requestDelete('reply', $event.id, $event.authorName)" @preview="previewUrl = $event" />
            <div v-if="group.children.length" class="ml-10 mt-4 space-y-2 sm:ml-[60px]">
              <ForumReplyItem v-for="child in group.children" :key="child.id" :reply="child" :post-author-id="post.authorId" :me="me" nested @like="like('reply', $event)" @reply="chooseReply" @report="openReport('reply', $event)" @delete="requestDelete('reply', $event.id, $event.authorName)" @preview="previewUrl = $event" />
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
import { forumApi, type ForumPost, type ForumReply, type ForumSort } from '@/api/forum'
import ForumReplyItem from '@/components/ForumReplyItem.vue'
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
const replyTargetName = ref('')
const replyAttachments = ref<AttachmentPickerExpose | null>(null)
const replyEditor = ref<HTMLElement | null>(null)
const editAttachments = ref<AttachmentPickerExpose | null>(null)
const editingPost = ref(false)
const editTitle = ref('')
const editContent = ref('')
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
const replyGroups = computed(() => {
  const groups = new Map<number, { root: ForumReply; children: ForumReply[] }>()
  const replies = post.value?.replies || []
  for (const reply of replies) if (!reply.parentReplyId) groups.set(reply.id, { root: reply, children: [] })
  for (const reply of replies) {
    if (!reply.parentReplyId) continue
    const rootId = reply.rootReplyId || reply.parentReplyId
    const group = groups.get(rootId)
    if (group) group.children.push(reply)
    else groups.set(rootId, { root: reply, children: [] })
  }
  const result = [...groups.values()]
  for (const group of result) group.children.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  if (replySort.value === 'likes') result.sort((a, b) => b.root.likeCount - a.root.likeCount || b.root.createdAt.localeCompare(a.root.createdAt) || b.root.id - a.root.id)
  else result.sort((a, b) => a.root.createdAt.localeCompare(b.root.createdAt) || a.root.id - b.root.id)
  return result
})
function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function statusText(value: string): string { return value === 'hidden' ? '举报后隐藏' : '已删除' }
function avatarUrl(value?: string): string { return value ? (/^https?:\/\//.test(value) || value.startsWith('/') ? value : `/${value}`) : defaultAvatar }

async function loadMyAvatar(): Promise<void> {
  if (!me) return
  try { myAvatar.value = avatarUrl((await forumApi.myAvatar(me)) || undefined) }
  catch { /* 保留登录信息中的头像 */ }
}

function switchReplySort(value: ForumSort): void {
  if (replySort.value === value) return
  const scrollY = window.scrollY
  replySort.value = value
  void nextTick(() => window.scrollTo(0, scrollY))
}

function startPostEdit(): void {
  if (!post.value) return
  editTitle.value = post.value.title
  editContent.value = post.value.content
  editingPost.value = true
}

function cancelReplyTarget(): void { parentReplyId.value = null; replyTargetName.value = '' }

function chooseReply(reply: ForumReply): void {
  parentReplyId.value = reply.id
  replyTargetName.value = reply.authorName
  void nextTick(() => replyEditor.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

async function load(): Promise<void> {
  const initial = !post.value
  if (initial) loading.value = true
  try { post.value = await forumApi.post(postId.value, replySort.value); error.value = '' }
  catch (e: any) { if (initial) { post.value = null; error.value = e?.message || '帖子加载失败' } else ElMessage.error(e?.message || '帖子刷新失败') }
  finally { if (initial) loading.value = false }
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
    replyContent.value = ''; replyAttachments.value?.clear(); cancelReplyTarget(); formError.value = ''
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
  try {
    const scrollY = window.scrollY
    const liked = await forumApi.like(type, id)
    const target = type === 'post' ? post.value : post.value?.replies?.find(reply => reply.id === id)
    if (target) { target.liked = liked; target.likeCount += liked ? 1 : -1; await nextTick(); window.scrollTo(0, scrollY) }
  }
  catch (e: any) { ElMessage.error(e?.message || '操作失败') }
}

function openReport(type: 'post' | 'reply', id: number): void { reportTarget.value = { type, id }; reportOpen.value = true }
async function handleReported(target: { type: 'post' | 'reply'; id: number }): Promise<void> {
  if (target.type === 'post') await router.push('/forum')
  else await load()
}

onMounted(() => { void load(); void loadMyAvatar() })
watch(postId, () => { post.value = null; void load() })
</script>

<style scoped>
.forum-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; align-items: start; gap: 20px; }
.surface-panel { border: 1px solid rgba(148, 163, 184, .2); border-radius: 16px; background: rgba(15, 23, 42, .92); box-shadow: 0 12px 32px rgba(2, 6, 23, .16); }
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #334155; }
.post-body { margin-left: 60px; }
.status-tag { border-radius: 999px; padding: 2px 8px; color: #fde68a; background: rgba(251, 191, 36, .15); font-size: 11px; }
.post-image { width: 100%; height: 180px; border-radius: 10px; object-fit: cover; background: #1e293b; }
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
@media (max-width: 640px) { .avatar { width: 42px; height: 42px; } .post-image { height: 120px; } .post-body { margin-left: 54px; } }
</style>
