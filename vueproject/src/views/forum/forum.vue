<template>
  <section class="forum-page mx-auto max-w-7xl px-4 pb-14 pt-6 text-cyan-50 md:px-8">
    <header class="forum-header mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-xs font-semibold tracking-[0.22em] text-sky-300">CDMGA COMMUNITY</p>
        <h1 class="mt-1 text-3xl font-bold">群友论坛</h1>
        <p class="mt-2 text-sm text-slate-400">分享动态、交流想法，看看群友最近在聊什么。</p>
      </div>
      <button class="primary-button" @click="showEditor = !showEditor">{{ showEditor ? '收起编辑器' : '＋ 发布帖子' }}</button>
    </header>

    <div class="forum-layout">
      <main class="min-w-0">
        <div class="surface-panel mb-4 flex items-center gap-1 p-2" role="tablist" aria-label="帖子列表">
          <button class="feed-tab" :class="{ active: !mine }" role="tab" :aria-selected="!mine" @click="switchList(false)">全部动态</button>
          <button class="feed-tab" :class="{ active: mine }" role="tab" :aria-selected="mine" @click="switchList(true)">我的帖子</button>
          <span class="ml-auto pr-3 text-xs text-slate-400">{{ total }} 篇帖子</span>
        </div>

        <div v-if="showEditor" class="surface-panel mb-4 p-5 md:p-6">
          <div class="mb-4 flex items-center gap-3"><img :src="myAvatar" alt="我的头像" class="avatar" /><div><h2 class="font-semibold">发布帖子</h2><p class="text-xs text-slate-400">分享给所有群友</p></div></div>
          <input v-model="title" maxlength="120" class="forum-input mb-3" placeholder="起一个标题" />
          <textarea v-model="content" maxlength="10000" rows="6" class="forum-input mb-3" placeholder="这一刻想和大家分享什么？" />
          <ForumAttachmentPicker ref="attachments" :max-images="6" :max-files="3" :disabled="submitting" />
          <div class="mt-5 flex flex-wrap items-center justify-end gap-3">
            <span v-if="formError" class="mr-auto text-sm text-rose-300">{{ formError }}</span>
            <button class="primary-button" :disabled="submitting" @click="publish">{{ submitting ? '发布中...' : '发布动态' }}</button>
          </div>
        </div>

        <div v-if="loading" class="surface-panel py-12 text-center text-slate-400">正在加载帖子...</div>
        <div v-else-if="error" class="surface-panel py-12 text-center text-rose-300">{{ error }}</div>
        <div v-else-if="!posts.length" class="surface-panel py-14 text-center"><p class="text-lg font-semibold">这里还没有帖子</p><p class="mt-2 text-sm text-slate-400">发布第一篇，开启讨论吧。</p></div>
        <div v-else class="space-y-4">
          <article v-for="post in posts" :key="post.id" class="surface-panel feed-card p-5 md:p-6">
            <div class="flex gap-3">
              <router-link :to="`/profile/${post.authorId}`" class="shrink-0"><img :src="avatarUrl(post.avatar)" :alt="`${post.authorName}的头像`" class="avatar" /></router-link>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1"><router-link :to="`/profile/${post.authorId}`" class="font-semibold text-sky-300 hover:text-sky-200">{{ post.authorName }}</router-link><span v-if="post.status !== 'visible'" class="status-tag">{{ post.status === 'hidden' ? '已隐藏' : '已删除' }}</span></div>
                <p class="mt-1 text-xs text-slate-400">{{ formatTime(post.createdAt) }}</p>
                <router-link v-if="post.status !== 'deleted'" :to="`/forum/${post.id}`" class="mt-4 block text-xl font-semibold leading-snug hover:text-sky-300">{{ post.title }}</router-link>
                <h2 v-else class="mt-4 text-xl font-semibold text-slate-400">{{ post.title }}</h2>
                <p class="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{{ post.content }}</p>
                <router-link v-if="post.status === 'visible' && post.images?.length" :to="`/forum/${post.id}`" class="mt-4 grid max-w-xl grid-cols-3 gap-2">
                  <img v-for="image in post.images.slice(0, 3)" :key="image.id" :src="image.url" alt="帖子图片" class="feed-image" />
                </router-link>
                <div class="feed-actions mt-5 flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 text-sm text-slate-400">
                  <router-link v-if="post.status !== 'deleted'" :to="`/forum/${post.id}`" class="hover:text-sky-300">↩ <span class="ml-1">{{ post.replyCount }} 评论</span></router-link>
                  <span>♡ <span class="ml-1">{{ post.likeCount }} 点赞</span></span>
                  <span v-if="post.files?.length">▧ <span class="ml-1">{{ post.files.length }} 个附件</span></span>
                </div>
              </div>
            </div>
          </article>
        </div>
        <div v-if="total > 10" class="mt-6 flex items-center justify-center gap-4 text-sm">
          <button class="secondary-button" :disabled="page === 0" @click="changePage(page - 1)">上一页</button>
          <span class="text-slate-300">{{ page + 1 }} / {{ Math.ceil(total / 10) }}</span>
          <button class="secondary-button" :disabled="(page + 1) * 10 >= total" @click="changePage(page + 1)">下一页</button>
        </div>
      </main>

      <aside class="space-y-4">
        <div class="surface-panel p-5"><p class="text-sm font-semibold">加入讨论</p><p class="mt-2 text-sm leading-6 text-slate-400">无论是课题心得、活动见闻，还是想和群友聊的话题，都可以在这里发布。</p><button class="primary-button mt-4 w-full" @click="showEditor = true">写一篇帖子</button></div>
        <div class="surface-panel p-5"><p class="text-sm font-semibold">社区动态</p><p class="mt-3 text-2xl font-bold text-sky-300">{{ total }}</p><p class="text-xs text-slate-400">{{ mine ? '我的帖子' : '当前可见帖子' }}</p><p class="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">请友善交流。发现不合适的内容，可以进入帖子进行举报。</p></div>
      </aside>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { forumApi, type ForumPost } from '@/api/forum'
import ForumAttachmentPicker from '@/components/ForumAttachmentPicker.vue'
import defaultAvatar from '@/assets/default-avatar.png'

type AttachmentPickerExpose = { getImages: () => File[]; getFiles: () => File[]; clear: () => void; isPreparing: () => boolean; hasError: () => boolean }

const router = useRouter()
const posts = ref<ForumPost[]>([])
const total = ref(0)
const page = ref(0)
const loading = ref(false)
const error = ref('')
const showEditor = ref(false)
const title = ref('')
const content = ref('')
const attachments = ref<AttachmentPickerExpose | null>(null)
const mine = ref(false)
const submitting = ref(false)
const formError = ref('')
const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
const myAvatar = avatarUrl(userInfo.avatar || userInfo.avatarUrl || userInfo.profile?.avatar)

function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
function avatarUrl(value?: string): string { return value ? (/^https?:\/\//.test(value) || value.startsWith('/') ? value : `/${value}`) : defaultAvatar }
function uploadError(error: any): string {
  if (error?.response?.status === 413) return '请求过大（HTTP 413），请检查 Nginx 上传上限'
  return error?.response?.data?.message || error?.message || '未知错误'
}
function switchList(value: boolean): void { mine.value = value; page.value = 0; void load() }

async function load(): Promise<void> {
  loading.value = true
  try {
    const response = await forumApi.posts(page.value, mine.value)
    posts.value = response.list
    total.value = response.total
    error.value = ''
  } catch (e: any) { error.value = e?.message || '帖子加载失败' }
  finally { loading.value = false }
}

function changePage(next: number): void { page.value = next; void load() }

async function publish(): Promise<void> {
  if (!title.value.trim() || !content.value.trim()) { formError.value = '请填写标题和正文'; return }
  if (attachments.value?.isPreparing() || attachments.value?.hasError()) { formError.value = '请先处理附件选择错误'; return }
  const images = attachments.value?.getImages() || []
  const files = attachments.value?.getFiles() || []
  submitting.value = true
  try {
    const id = await forumApi.createPost(title.value, content.value)
    const uploadErrors: string[] = []
    for (const file of images) {
      try { await forumApi.upload('post', id, file) }
      catch (e: any) { uploadErrors.push(`图片 ${file.name}：${uploadError(e)}`) }
    }
    for (const file of files) {
      try { await forumApi.uploadFile(id, file) }
      catch (e: any) { uploadErrors.push(`文件 ${file.name}：${uploadError(e)}`) }
    }
    if (uploadErrors.length) ElMessage.warning({ message: `帖子已发布，但附件上传失败：${uploadErrors.join('；')}`, duration: 10000, showClose: true })
    else ElMessage.success('帖子已发布')
    await router.push(`/forum/${id}`)
  } catch (e: any) { formError.value = e?.message || '发布失败' }
  finally { submitting.value = false }
}

onMounted(load)
</script>

<style scoped>
.forum-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; align-items: start; gap: 20px; }
.surface-panel { border: 1px solid rgba(148, 163, 184, .2); border-radius: 16px; background: rgba(15, 23, 42, .92); box-shadow: 0 12px 32px rgba(2, 6, 23, .16); }
.feed-card { transition: border-color .2s, transform .2s; }
.feed-card:hover { border-color: rgba(56, 189, 248, .42); transform: translateY(-1px); }
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #334155; }
.feed-image { width: 100%; height: 154px; border-radius: 10px; object-fit: cover; background: #1e293b; }
.feed-tab { padding: 10px 16px; border-radius: 10px; color: #94a3b8; font-size: 14px; font-weight: 600; }
.feed-tab.active { color: #7dd3fc; background: rgba(14, 165, 233, .16); }
.feed-tab:hover { color: #e0f2fe; }
.status-tag { padding: 2px 8px; border-radius: 999px; background: rgba(251, 191, 36, .15); color: #fde68a; font-size: 11px; }
.forum-input { width: 100%; border: 1px solid rgba(148,163,184,.3); border-radius: 10px; background: rgba(30,41,59,.75); padding: 11px 13px; color: #f8fafc; outline: none; }
.forum-input:focus { border-color: #38bdf8; }
.primary-button, .secondary-button { border-radius: 10px; padding: 9px 17px; font-size: 14px; font-weight: 600; transition: background .2s; }
.primary-button { background: #00a1d6; color: white; }
.primary-button:hover:not(:disabled) { background: #22b8e9; }
.secondary-button { border: 1px solid rgba(148,163,184,.35); color: #e2e8f0; }
.secondary-button:hover:not(:disabled) { background: rgba(56,189,248,.12); }
.primary-button:disabled, .secondary-button:disabled { opacity: .5; cursor: not-allowed; }
@media (max-width: 900px) { .forum-layout { grid-template-columns: minmax(0, 1fr); } .forum-layout aside { display: none; } }
@media (max-width: 640px) { .feed-image { height: 100px; } .avatar { width: 42px; height: 42px; } }
</style>
