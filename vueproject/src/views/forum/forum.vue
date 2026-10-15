<template>
  <section class="mx-auto max-w-6xl px-4 pb-12 pt-5 text-cyan-50 md:px-8">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs tracking-[0.25em] text-cyan-100/65">CDMGA COMMUNITY</p>
        <h1 class="mt-1 text-3xl font-bold">论坛</h1>
      </div>
      <button class="forum-button" @click="showEditor = !showEditor">{{ showEditor ? '收起' : '发布帖子' }}</button>
    </div>
    <div class="mb-5 flex gap-3">
      <button class="forum-button" :class="{ active: !mine }" @click="switchList(false)">全部帖子</button>
      <button class="forum-button" :class="{ active: mine }" @click="switchList(true)">我的帖子</button>
    </div>

    <NeonCard v-if="showEditor" class="mb-5 rounded-2xl p-5">
      <h2 class="mb-3 text-lg font-semibold">发布帖子</h2>
      <input v-model="title" maxlength="120" class="forum-input mb-3" placeholder="标题（最多120字）" />
      <textarea v-model="content" maxlength="10000" rows="6" class="forum-input mb-3" placeholder="分享你的想法..." />
      <ForumAttachmentPicker ref="attachments" :max-images="6" :max-files="3" :disabled="submitting" />
      <div class="mt-4 flex items-center gap-3">
        <button class="forum-button" :disabled="submitting" @click="publish">{{ submitting ? '发布中...' : '确认发布' }}</button>
        <span v-if="formError" class="text-sm text-rose-200">{{ formError }}</span>
      </div>
    </NeonCard>

    <p v-if="loading" class="py-8 text-center text-cyan-100/70">正在加载帖子...</p>
    <p v-else-if="error" class="py-8 text-center text-rose-200">{{ error }}</p>
    <p v-else-if="!posts.length" class="py-8 text-center text-cyan-100/70">还没有帖子，来发布第一篇吧。</p>
    <div v-else class="space-y-4">
      <NeonCard v-for="post in posts" :key="post.id" class="rounded-2xl p-5">
        <router-link v-if="post.status !== 'deleted'" :to="`/forum/${post.id}`" class="text-xl font-semibold text-cyan-50 hover:text-cyan-200">{{ post.title }}</router-link>
        <span v-else class="text-xl font-semibold text-cyan-100/60">{{ post.title }}</span>
        <span v-if="post.status !== 'visible'" class="ml-3 text-sm text-amber-200">{{ post.status === 'hidden' ? '已隐藏' : '已删除' }}</span>
        <p class="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-cyan-100/80">{{ post.content }}</p>
        <img v-if="post.status === 'visible' && post.images?.[0]" :src="post.images[0].url" alt="帖子图片" class="mt-3 max-h-44 max-w-full rounded-lg object-cover" />
        <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-cyan-100/65">
          <span>{{ post.authorName }}</span><span>{{ formatTime(post.createdAt) }}</span>
          <span>♥ {{ post.likeCount }}</span><span>回复 {{ post.replyCount }}</span>
        </div>
      </NeonCard>
    </div>
    <div v-if="total > 10" class="mt-6 flex items-center justify-center gap-4">
      <button class="forum-button" :disabled="page === 0" @click="changePage(page - 1)">上一页</button>
      <span>{{ page + 1 }} / {{ Math.ceil(total / 10) }}</span>
      <button class="forum-button" :disabled="(page + 1) * 10 >= total" @click="changePage(page + 1)">下一页</button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import { forumApi, type ForumPost } from '@/api/forum'
import ForumAttachmentPicker from '@/components/ForumAttachmentPicker.vue'

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

function formatTime(value: string): string { return value ? new Date(value).toLocaleString('zh-CN') : '' }
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
.forum-input { width: 100%; border: 1px solid rgba(125,220,255,.35); border-radius: 10px; background: rgba(15,23,42,.65); padding: 10px 12px; color: #ecfeff; outline: none; }
.forum-input:focus { border-color: #67e8f9; }
.forum-button { border: 1px solid rgba(125,220,255,.58); border-radius: 10px; padding: 9px 18px; color: #ecfeff; background: rgba(8,47,73,.6); cursor: pointer; }
.forum-button.active, .forum-button:hover:not(:disabled) { background: rgba(8,145,178,.45); }
.forum-button:disabled { opacity: .45; cursor: not-allowed; }
</style>
