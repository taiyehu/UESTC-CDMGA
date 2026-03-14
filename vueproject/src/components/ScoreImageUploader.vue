<template>
  <div class="upload-wrap">
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="upload-btn" :disabled="disabled || uploading" @click="pickFile">
        {{ uploading ? '上传中...' : '选择图片' }}
      </button>
      <span class="upload-tip">支持图片文件，上传前自动压缩。</span>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" :disabled="disabled || uploading" @change="handleFileChange" />

    <p v-if="statusText" :class="['mt-2 text-sm', statusType === 'error' ? 'text-rose-300' : 'text-cyan-100/80']">
      {{ statusText }}
    </p>

    <div v-if="previewSrc" class="preview-wrap mt-3">
      <img :src="previewSrc" alt="上传预览" class="preview-image" />
      <button type="button" class="remove-btn" :disabled="disabled || uploading" @click="clearImage">移除</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { computed, ref } from 'vue'
import { compressImage } from '@/components/imageCompressor'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    action?: string
    fieldName?: string
    uploadOnSelect?: boolean
  }>(),
  {
    disabled: false,
    action: '/api/score/upload',
    fieldName: 'image',
    uploadOnSelect: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'error', message: string): void
  (e: 'uploaded', value: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const statusText = ref('')
const statusType = ref<'ok' | 'error'>('ok')
const pendingFile = ref<File | Blob | null>(null)
const pendingName = ref('')
const pendingPreview = ref('')

const previewSrc = computed(() => {
  if (pendingPreview.value) return pendingPreview.value
  return props.modelValue ? toImageUrl(props.modelValue) : ''
})

function pickFile(): void {
  fileInput.value?.click()
}

function toImageUrl(path?: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function clearImage(): void {
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
  }
  pendingPreview.value = ''
  pendingFile.value = null
  pendingName.value = ''
  emit('update:modelValue', '')
  statusText.value = '已移除已选图片。'
  statusType.value = 'ok'
}

function resolveUploadUrl(response: any): string {
  if (response && response.code === 0) return String(response.data || '')
  if (response && response.data && response.data.code === 0) {
    return String(response.data.data || '')
  }
  return ''
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    statusText.value = '只能上传图片文件。'
    statusType.value = 'error'
    emit('error', statusText.value)
    input.value = ''
    return
  }

  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
  }
  pendingPreview.value = URL.createObjectURL(file)
  statusText.value = '已选择图片，可预览。'
  statusType.value = 'ok'

  if (!props.uploadOnSelect) {
    pendingFile.value = file
    pendingName.value = file.name
    input.value = ''
    return
  }

  uploading.value = true
  statusText.value = ''

  try {
    const uploadUrl = await uploadNow(file, file.name)
    if (!uploadUrl) return

    pendingFile.value = null
    pendingName.value = ''
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '图片上传失败'
    statusText.value = msg
    statusType.value = 'error'
    emit('error', msg)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function uploadNow(fileParam?: File | Blob | null, fileNameParam?: string): Promise<string> {
  const file = fileParam || pendingFile.value
  if (!file) {
    return props.modelValue || ''
  }

  uploading.value = true
  statusText.value = ''

  try {
    const compressed = await compressImage(file)
    const formData = new FormData()
    const fileName = fileNameParam || pendingName.value || 'upload-image.jpg'
    formData.append(props.fieldName, compressed, fileName)

    const res = await axios.post(props.action, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const uploadUrl = resolveUploadUrl(res.data)
    if (!uploadUrl) {
      const msg = res.data?.message || res.data?.data?.message || '图片上传失败'
      statusText.value = msg
      statusType.value = 'error'
      emit('error', msg)
      return ''
    }

    emit('update:modelValue', uploadUrl)
    emit('uploaded', uploadUrl)
    statusText.value = '图片上传成功。'
    statusType.value = 'ok'
    pendingFile.value = null
    pendingName.value = ''
    return uploadUrl
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '图片上传失败'
    statusText.value = msg
    statusType.value = 'error'
    emit('error', msg)
    return ''
  } finally {
    uploading.value = false
  }
}

function clearSelection(): void {
  clearImage()
}

defineExpose({
  uploadNow,
  clearSelection,
})
</script>

<style scoped>
.upload-btn,
.remove-btn {
  border: 1px solid rgba(34, 211, 238, 0.7);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  color: #cffafe;
  background: linear-gradient(90deg, rgba(8, 47, 73, 0.7), rgba(88, 28, 135, 0.62));
}

.upload-btn:disabled,
.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-tip {
  color: rgba(207, 250, 254, 0.72);
  font-size: 13px;
}

.preview-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.preview-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.4);
}
</style>
