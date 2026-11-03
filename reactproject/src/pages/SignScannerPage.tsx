import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

type QrDetector = { detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>> }
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector

/** Downscale/re-encode an image in the browser before uploading it. */
async function optimizeImage(
  input: File,
  { maxSide, quality, format = 'image/jpeg' }: { maxSide: number; quality: number; format?: 'image/webp' | 'image/jpeg' },
): Promise<File> {
  if (!input.type.startsWith('image/') || ['image/svg+xml', 'image/gif'].includes(input.type)) return input

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(input)
  } catch {
    return input
  }

  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return input
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality))
    if (!blob || blob.type !== format) return input
    if (scale === 1 && blob.size >= input.size) return input
    return new File(
      [blob],
      `${input.name.replace(/\.[^.]+$/, '')}.${format === 'image/jpeg' ? 'jpg' : 'webp'}`,
      { type: format },
    )
  } finally {
    bitmap.close()
  }
}

/**
 * Camera / photo based scanner for the rotating activity sign-in QR code.
 * A scanned URL must point to this origin and look like /sign/<activityId>?token=...
 * The camera feed, live BarcodeDetector loop and visibility handling mirror the
 * Vue SignScannerPage.
 */
export default function SignScannerPage() {
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<QrDetector | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const attemptRef = useRef(0)
  const disposedRef = useRef(false)
  const activeRef = useRef(false)
  const openingRef = useRef(false)
  const busyRef = useRef(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [opening, setOpening] = useState(false)
  const [liveDetection, setLiveDetection] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cameraMessage, setCameraMessage] = useState('正在准备摄像头...')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  function stopCamera() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    attemptRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    activeRef.current = false
    setCameraActive(false)
  }

  function signPath(rawValue: string): string | null {
    try {
      const url = new URL(rawValue)
      if (url.origin !== window.location.origin || !/^\/sign\/[1-9]\d*$/.test(url.pathname) || url.hash) return null
      const token = url.searchParams.get('token')
      if (!token || token.length > 200 || Array.from(url.searchParams).length !== 1) return null
      return url.pathname + url.search
    } catch {
      return null
    }
  }

  function handleResult(rawValue: string): boolean {
    const path = signPath(rawValue)
    if (!path) {
      setError('请扫描本站活动现场的签到二维码')
      return false
    }
    stopCamera()
    navigate(path)
    return true
  }

  async function scanLoop() {
    if (disposedRef.current || !activeRef.current) return
    const video = videoRef.current
    const detector = detectorRef.current
    if (!detector || !video) return

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        const codes = await detector.detect(video)
        if (disposedRef.current || !activeRef.current) return
        const first = codes[0]
        if (first && handleResult(first.rawValue)) return
      } catch {
        detectorRef.current = null
        setLiveDetection(false)
        setStatus('实时识别不可用，请点击“识别当前画面”。')
      }
    }

    if (detectorRef.current && activeRef.current) {
      timerRef.current = setTimeout(() => { void scanLoop() }, 250)
    }
  }

  async function startCamera() {
    if (openingRef.current || disposedRef.current) return
    setError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage(
        window.isSecureContext
          ? '当前浏览器无法打开摄像头，请使用拍照识别。'
          : '当前网站使用 HTTP，浏览器禁止实时摄像头；请使用拍照识别。管理员开启 HTTPS 后即可实时扫码。',
      )
      return
    }

    openingRef.current = true
    setOpening(true)
    stopCamera()
    const attempt = attemptRef.current

    try {
      setCameraMessage('正在请求摄像头权限...')
      const opened = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      })
      if (disposedRef.current || document.hidden || attempt !== attemptRef.current) {
        opened.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = opened
      const video = videoRef.current
      if (!video) {
        stopCamera()
        return
      }
      video.srcObject = opened
      await video.play()

      if (disposedRef.current || document.hidden || attempt !== attemptRef.current) {
        stopCamera()
        return
      }

      activeRef.current = true
      setCameraActive(true)

      const Constructor = (window as Window & { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector
      try {
        detectorRef.current = Constructor ? new Constructor({ formats: ['qr_code'] }) : null
      } catch {
        detectorRef.current = null
      }
      const hasDetector = Boolean(detectorRef.current)
      setLiveDetection(hasDetector)
      setStatus(hasDetector ? '正在自动识别二维码...' : '请对准二维码并点击“识别当前画面”。')
      if (hasDetector) void scanLoop()
    } catch {
      if (attempt === attemptRef.current) {
        stopCamera()
        setCameraMessage('摄像头不可用或未获授权，请使用拍照识别。')
      }
    } finally {
      if (attempt === attemptRef.current) {
        openingRef.current = false
        setOpening(false)
      }
    }
  }

  async function uploadImage(file: File) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      const optimized = await optimizeImage(file, { maxSide: 1600, quality: 0.86, format: 'image/jpeg' })
      if (optimized.size > 5 * 1024 * 1024) throw new Error('图片超过 5 MB，请换一张更清晰的近距离照片')
      const body = new FormData()
      body.append('image', optimized)
      const response = await api.post('/sign/decode', body)
      handleResult(String(response.data?.data || ''))
    } catch (cause) {
      const err = cause as { response?: { data?: { message?: string } }; message?: string }
      setError(err.response?.data?.message || err.message || '识别失败，请重新对准二维码')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function captureFrame() {
    const video = videoRef.current
    if (!video || !activeRef.current) return
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (blob) await uploadImage(new File([blob], 'scan.jpg', { type: 'image/jpeg' }))
  }

  async function onImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (file) await uploadImage(file)
    input.value = ''
  }

  useEffect(() => {
    disposedRef.current = false
    openingRef.current = false
    setOpening(false)

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopCamera()
        setCameraMessage('摄像头已暂停，点击“打开摄像头”继续。')
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    void startCamera()

    return () => {
      disposedRef.current = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopCamera()
    }
    // Camera lifecycle intentionally runs once for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-shell">
      <div className="bg" aria-hidden="true" />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 560,
          margin: '0 auto',
          padding: '36px 16px 56px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 5vw, 38px)' }}>扫码签到</h1>
        <p className="meta" style={{ margin: '8px 0 20px' }}>
          对准活动现场的动态二维码，识别后将自动进入签到页面。
        </p>

        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 380,
            aspectRatio: '1 / 1',
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: 18,
            border: '1px solid rgba(34, 211, 238, .5)',
            background: '#020617',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {!cameraActive ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                padding: '0 22px',
                background: 'rgba(2, 6, 23, .86)',
                color: 'rgba(207, 250, 254, .82)',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {cameraMessage}
            </div>
          ) : (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '14%',
                borderRadius: 12,
                border: '2px solid rgba(103, 232, 249, .8)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {error ? (
          <p role="alert" style={{ margin: '16px 0 0', color: '#fda4af', fontSize: 12 }}>{error}</p>
        ) : (
          <p className="meta" style={{ margin: '16px 0 0' }}>{status}</p>
        )}

        <div className="page-actions-row" style={{ justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {!cameraActive && (
            <button
              type="button"
              className="page-btn"
              disabled={opening}
              onClick={() => { void startCamera() }}
            >
              {opening ? '正在打开...' : '打开摄像头'}
            </button>
          )}
          {cameraActive && !liveDetection && (
            <button
              type="button"
              className="page-btn"
              disabled={busy}
              onClick={() => { void captureFrame() }}
            >
              识别当前画面
            </button>
          )}
          <label className="page-btn" style={{ cursor: 'pointer' }}>
            拍照或选择图片
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(event) => { void onImageSelected(event) }}
            />
          </label>
        </div>
      </main>
    </div>
  )
}
