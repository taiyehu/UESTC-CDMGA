import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import './AvatarCropperModal.css'

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = src
  })
}

function rotateSize(width: number, height: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180
  return { width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height), height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height) }
}

async function cropImage(src: string, area: Area, rotation: number): Promise<Blob> {
  const image = await loadImage(src)
  const rot = (rotation * Math.PI) / 180
  const { width: bw, height: bh } = rotateSize(image.width, image.height, rotation)
  const canvas = document.createElement('canvas')
  canvas.width = bw; canvas.height = bh
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法处理图片')
  ctx.translate(bw / 2, bh / 2); ctx.rotate(rot); ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)
  const out = document.createElement('canvas'); out.width = 256; out.height = 256
  const octx = out.getContext('2d')
  if (!octx) throw new Error('无法处理图片')
  octx.drawImage(canvas, area.x, area.y, area.width, area.height, 0, 0, 256, 256)
  return new Promise((resolve, reject) => out.toBlob((blob) => blob ? resolve(blob) : reject(new Error('裁剪失败')), 'image/jpeg', 0.86))
}

export default function AvatarCropperModal({ src, onCancel, onCrop }: { src: string; onCancel: () => void; onCrop: (blob: Blob) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])
  async function confirm() {
    if (!area) return
    setBusy(true); setError('')
    try { onCrop(await cropImage(src, area, rotation)) }
    catch (e) { setError(e instanceof Error ? e.message : '裁剪失败') }
    finally { setBusy(false) }
  }
  return (
    <div className="crop-mask" role="dialog" aria-modal="true" aria-label="裁剪头像">
      <div className="crop-modal">
        <div className="crop-head"><div><div className="card-k">AVATAR CROP</div><h2>裁剪头像</h2></div><button className="icon-btn" type="button" aria-label="关闭" onClick={onCancel}>×</button></div>
        <div className="crop-area"><Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete} showGrid={false} /></div>
        <input className="crop-range" type="range" min={1} max={3} step={0.01} value={zoom} aria-label="缩放" onChange={(e) => setZoom(Number(e.target.value))} />
        {error && <div className="score-feedback error">{error}</div>}
        <div className="crop-actions">
          <button className="page-btn" type="button" onClick={() => setZoom((z) => Math.min(3, z * 1.1))}>放大</button>
          <button className="page-btn" type="button" onClick={() => setZoom((z) => Math.max(1, z * 0.9))}>缩小</button>
          <button className="page-btn" type="button" onClick={() => setRotation((r) => r - 90)}>左旋</button>
          <button className="page-btn" type="button" onClick={() => setRotation((r) => r + 90)}>右旋</button>
          <button className="page-btn primary" type="button" disabled={busy || !area} onClick={() => void confirm()}>{busy ? '裁剪中…' : '确定裁剪'}</button>
          <button className="page-btn" type="button" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  )
}
