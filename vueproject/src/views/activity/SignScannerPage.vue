<template>
  <section class="mx-auto max-w-xl px-4 py-7 text-center text-cyan-50">
    <h1 class="mb-3 text-3xl font-bold">扫码签到</h1>
    <p class="mb-5 text-sm text-cyan-100/80">对准活动现场的动态二维码，识别后将自动进入签到页面。</p>
    <div class="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-400/50 bg-slate-950">
      <video ref="video" autoplay muted playsinline class="h-full w-full object-cover" />
      <div v-if="!cameraActive" class="absolute inset-0 flex items-center justify-center bg-slate-950/85 px-5 text-cyan-100/80">{{ cameraMessage }}</div>
      <div v-else class="pointer-events-none absolute inset-[14%] rounded-xl border-2 border-cyan-300/80" aria-hidden="true" />
    </div>
    <p v-if="error" class="mt-4 text-rose-300" role="alert">{{ error }}</p>
    <p v-else class="mt-4 text-sm text-cyan-100/75">{{ status }}</p>
    <div class="mt-5 flex flex-wrap justify-center gap-3">
      <button v-if="!cameraActive" type="button" class="scan-button" :disabled="opening" @click="startCamera">{{ opening ? '正在打开...' : '打开摄像头' }}</button>
      <button v-if="cameraActive && !liveDetection" type="button" class="scan-button" :disabled="busy" @click="captureFrame">识别当前画面</button>
      <label class="scan-button cursor-pointer">
        拍照或选择图片
        <input class="sr-only" type="file" accept="image/*" capture="environment" @change="onImageSelected" />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { optimizeImage } from '@/utils/compression'

type QrDetector = { detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>> }
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector

const router = useRouter()
const video = ref<HTMLVideoElement | null>(null)
const cameraActive = ref(false)
const opening = ref(false)
const liveDetection = ref(false)
const busy = ref(false)
const cameraMessage = ref('正在准备摄像头...')
const status = ref('')
const error = ref('')
let stream: MediaStream | null = null
let detector: QrDetector | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let disposed = false

function stopCamera() {
  if (timer) clearTimeout(timer)
  timer = undefined
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  if (video.value) video.value.srcObject = null
  cameraActive.value = false
}

function signPath(rawValue: string): string | null {
  try {
    const url = new URL(rawValue)
    if (url.origin !== window.location.origin || !/^\/sign\/[1-9]\d*$/.test(url.pathname) || url.hash) return null
    const token = url.searchParams.get('token')
    if (!token || token.length > 200 || Array.from(url.searchParams).length !== 1) return null
    return url.pathname + url.search
  } catch { return null }
}

function handleResult(rawValue: string): boolean {
  const path = signPath(rawValue)
  if (!path) { error.value = '请扫描本站活动现场的签到二维码'; return false }
  stopCamera()
  router.push(path)
  return true
}

async function scanLoop() {
  if (disposed || !cameraActive.value || !detector || !video.value) return
  if (video.value.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    try {
      const codes = await detector.detect(video.value)
      if (disposed || !cameraActive.value) return
      const first = codes[0]
      if (first && handleResult(first.rawValue)) return
    } catch {
      detector = null
      liveDetection.value = false
      status.value = '实时识别不可用，请点击“识别当前画面”。'
    }
  }
  if (detector && cameraActive.value) timer = setTimeout(scanLoop, 250)
}

async function startCamera() {
  if (opening.value || disposed) return
  error.value = ''
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.value = window.isSecureContext
      ? '当前浏览器无法打开摄像头，请使用拍照识别。'
      : '当前网站使用 HTTP，浏览器禁止实时摄像头；请使用拍照识别。管理员开启 HTTPS 后即可实时扫码。'
    return
  }
  try {
    opening.value = true
    stopCamera()
    cameraMessage.value = '正在请求摄像头权限...'
    const opened = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } })
    if (disposed || document.hidden) { opened.getTracks().forEach(track => track.stop()); return }
    stream = opened
    if (!video.value) { stopCamera(); return }
    video.value.srcObject = opened
    await video.value.play()
    if (disposed || document.hidden) { stopCamera(); return }
    cameraActive.value = true
    const constructor = (window as Window & { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector
    try { detector = constructor ? new constructor({ formats: ['qr_code'] }) : null } catch { detector = null }
    liveDetection.value = !!detector
    status.value = detector ? '正在自动识别二维码...' : '请对准二维码并点击“识别当前画面”。'
    if (detector) scanLoop()
  } catch {
    stopCamera()
    cameraMessage.value = '摄像头不可用或未获授权，请使用拍照识别。'
  } finally {
    opening.value = false
  }
}

async function uploadImage(file: File) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const optimized = await optimizeImage(file, { maxSide: 1600, quality: 0.86, format: 'image/jpeg' })
    if (optimized.size > 5 * 1024 * 1024) throw new Error('图片超过 5 MB，请换一张更清晰的近距离照片')
    const body = new FormData()
    body.append('image', optimized)
    const response = await axios.post('/api/sign/decode', body)
    handleResult(String(response.data.data || ''))
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '识别失败，请重新对准二维码'
  } finally {
    busy.value = false
  }
}

async function captureFrame() {
  if (!video.value || !cameraActive.value) return
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 1600 / Math.max(video.value.videoWidth, video.value.videoHeight))
  canvas.width = Math.max(1, Math.round(video.value.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.value.videoHeight * scale))
  canvas.getContext('2d')?.drawImage(video.value, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (blob) await uploadImage(new File([blob], 'scan.jpg', { type: 'image/jpeg' }))
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await uploadImage(file)
  input.value = ''
}

function onVisibilityChange() {
  if (document.hidden) {
    stopCamera()
    cameraMessage.value = '摄像头已暂停，点击“打开摄像头”继续。'
  }
}

onMounted(() => { document.addEventListener('visibilitychange', onVisibilityChange); startCamera() })
onBeforeUnmount(() => { disposed = true; document.removeEventListener('visibilitychange', onVisibilityChange); stopCamera() })
</script>

<style scoped>
.scan-button { border: 1px solid rgba(103, 232, 249, .7); border-radius: 10px; padding: 10px 14px; color: #ecfeff; background: rgba(8, 47, 73, .7); }
.scan-button:disabled { opacity: .55; cursor: wait; }
</style>
