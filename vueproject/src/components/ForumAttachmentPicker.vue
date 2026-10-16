<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <NeonActionButton size="sm" variant="blue" :disabled="disabled || preparing || images.length + existingImageCount >= maxImages" @click="imageInput?.click()">
        {{ preparing ? '处理图片中...' : '选择图片' }}
      </NeonActionButton>
      <span class="text-xs text-cyan-100/75">图片 {{ images.length + existingImageCount }}/{{ maxImages }}，选择后可预览，上传前自动压缩</span>
      <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/gif" multiple class="hidden" @change="pickImages" />
    </div>
    <div v-if="images.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div v-for="(item, index) in images" :key="item.url" class="rounded-xl border border-cyan-200/25 bg-slate-900/60 p-2">
        <button type="button" class="block w-full" @click="previewUrl = item.url"><img :src="item.url" :alt="item.file.name" class="h-32 w-full rounded-lg object-contain" /></button>
        <p class="mt-1 truncate text-xs text-cyan-100/75" :title="item.file.name">{{ item.file.name }}</p>
        <NeonActionButton size="sm" variant="red" :disabled="disabled" @click="removeImage(index)">移除</NeonActionButton>
      </div>
    </div>
    <div v-if="maxFiles" class="flex flex-wrap items-center gap-3">
      <NeonActionButton size="sm" variant="blue" :disabled="disabled || files.length + existingFileCount >= maxFiles" @click="fileInput?.click()">选择文件</NeonActionButton>
      <span class="text-xs text-cyan-100/75">文件 {{ files.length + existingFileCount }}/{{ maxFiles }}，每个不超过10MB</span>
      <input ref="fileInput" type="file" accept=".pdf,.txt,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx" multiple class="hidden" @change="pickFiles" />
    </div>
    <div v-if="files.length" class="space-y-2">
      <div v-for="(file, index) in files" :key="`${file.name}-${index}`" class="flex items-center justify-between gap-3 rounded-lg border border-cyan-200/20 p-2 text-sm">
        <span class="min-w-0 truncate" :title="file.name">{{ file.name }}（{{ (file.size / 1024 / 1024).toFixed(1) }} MB）</span>
        <div class="flex gap-2"><NeonActionButton size="sm" variant="blue" @click="previewFile(file)">预览</NeonActionButton><NeonActionButton size="sm" variant="red" :disabled="disabled" @click="files.splice(index, 1)">移除</NeonActionButton></div>
      </div>
    </div>
    <p v-if="error" class="text-sm text-rose-200">{{ error }}</p>
    <el-dialog v-model="previewOpen" title="图片预览" width="min(90vw, 800px)">
      <img :src="previewUrl" alt="图片预览" class="max-h-[70vh] w-full object-contain" />
    </el-dialog>
    <el-dialog v-model="filePreviewOpen" title="文件预览" width="min(90vw, 800px)" @closed="closeFilePreview">
      <p class="mb-3 break-all text-sm text-cyan-50">{{ filePreview?.name }}</p>
      <iframe v-if="filePreviewUrl" :src="filePreviewUrl" title="文件预览" class="h-[65vh] w-full bg-white" />
      <p v-else class="text-sm text-cyan-100/75">此类文件无法在浏览器内预览，请确认文件名和大小后上传。</p>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import NeonActionButton from '@/components/NeonActionButton.vue'
import { optimizeImage } from '@/utils/compression'

const props = withDefaults(defineProps<{
  maxImages: number
  maxFiles?: number
  existingImageCount?: number
  existingFileCount?: number
  disabled?: boolean
}>(), { maxFiles: 0, existingImageCount: 0, existingFileCount: 0, disabled: false })

const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const images = ref<{ file: File; url: string }[]>([])
const files = ref<File[]>([])
const preparing = ref(false)
const error = ref('')
const previewUrl = ref('')
const previewOpen = computed({ get: () => !!previewUrl.value, set: (open) => { if (!open) previewUrl.value = '' } })
const filePreview = ref<File | null>(null)
const filePreviewUrl = ref('')
const filePreviewOpen = ref(false)

async function pickImages(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files || [])
  input.value = ''
  if (selected.length + images.value.length + props.existingImageCount > props.maxImages) { error.value = `最多选择${props.maxImages}张图片`; return }
  preparing.value = true
  try {
    for (const file of selected) {
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) throw new Error('仅支持 PNG、JPEG、GIF 图片')
      const compressed = await optimizeImage(file, { maxSide: 1600, quality: 0.86 })
      if (compressed.size > 5 * 1024 * 1024) throw new Error('图片压缩后仍超过5MB')
      images.value.push({ file: compressed, url: URL.createObjectURL(compressed) })
    }
    error.value = ''
  } catch (e: any) { error.value = e?.message || '图片处理失败' }
  finally { preparing.value = false }
}

function pickFiles(event: Event): void {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files || [])
  input.value = ''
  if (selected.length + files.value.length + props.existingFileCount > props.maxFiles) { error.value = `最多选择${props.maxFiles}个文件`; return }
  if (selected.some(file => file.size > 10 * 1024 * 1024 || !/\.(pdf|txt|zip|docx?|xlsx?|pptx?)$/i.test(file.name))) { error.value = '仅支持10MB以内的 PDF、TXT、ZIP、Office 文件'; return }
  files.value.push(...selected)
  error.value = ''
}

function removeImage(index: number): void {
  const [item] = images.value.splice(index, 1)
  if (item) URL.revokeObjectURL(item.url)
}

function previewFile(file: File): void {
  closeFilePreview()
  filePreview.value = file
  if (/\.(pdf|txt)$/i.test(file.name)) filePreviewUrl.value = URL.createObjectURL(file)
  filePreviewOpen.value = true
}

function closeFilePreview(): void {
  if (filePreviewUrl.value) URL.revokeObjectURL(filePreviewUrl.value)
  filePreviewUrl.value = ''
  filePreview.value = null
}

function clear(): void {
  images.value.forEach(item => URL.revokeObjectURL(item.url))
  images.value = []
  files.value = []
  error.value = ''
  closeFilePreview()
}

defineExpose({ getImages: () => images.value.map(item => item.file), getFiles: () => [...files.value], clear, isPreparing: () => preparing.value, hasError: () => !!error.value })
onBeforeUnmount(clear)
</script>
