import { useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent, ReactNode } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type PublishType = 'course' | 'activity'
type CourseCategory = 'typical' | 'bingo' | 'legacy' | 'contest' | 'ranking' | 'award' | 'sign'
type Status = { type: 'ok' | 'error'; text: string }

const CATEGORY_OPTIONS: { value: CourseCategory; label: string }[] = [
  { value: 'typical', label: 'typical' },
  { value: 'bingo', label: 'bingo' },
  { value: 'legacy', label: 'legacy' },
  { value: 'contest', label: 'contest' },
  { value: 'ranking', label: 'ranking' },
  { value: 'award', label: 'award' },
  { value: 'sign', label: 'sign（现场签到，10 分）' },
]

const labelStyle: CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, color: '#B9E8FF' }
const inputStyle: CSSProperties = { marginTop: 0 }
const previewStyle: CSSProperties = { width: 120, height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,.24)' }
const hiddenStyle: CSSProperties = { display: 'none' }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  )
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Normalize a datetime-local value to the backend's YYYY-MM-DDTHH:mm:ss shape. */
function toLocalDateTime(value: string): string {
  if (!value) return ''
  const withSeconds = value.length === 16 ? `${value}:00` : value
  return withSeconds.length > 19 ? withSeconds.slice(0, 19) : withSeconds
}

function nowStamp(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

/** Relative upload paths need a leading slash; absolute http(s) URLs stay untouched. */
function resolveUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function errorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string } } } | null)?.response
  if (response?.data?.message) return response.data.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default function AdminContentPage() {
  const [publishType, setPublishType] = useState<PublishType>('course')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CourseCategory>('typical')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [description, setDescription] = useState('')
  const [awardCost, setAwardCost] = useState('')
  const [awardStock, setAwardStock] = useState('1')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [activityFile, setActivityFile] = useState('')
  const [activityFileName, setActivityFileName] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)

  // Release blob preview URLs when they are replaced or the page unmounts.
  useEffect(() => {
    if (!imagePreview.startsWith('blob:')) return
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const isCourse = publishType === 'course'
  const isAward = isCourse && category === 'award'
  const preview = imagePreview || resolveUrl(imageUrl)

  function resetForm(keepStatus = false) {
    setTitle('')
    setCategory('typical')
    setStartTime('')
    setEndTime('')
    setDescription('')
    setAwardCost('')
    setAwardStock('1')
    setImageUrl('')
    setImageFile(null)
    setImagePreview('')
    setActivityFile('')
    setActivityFileName('')
    if (!keepStatus) setStatus(null)
  }

  function changePublishType(next: PublishType) {
    if (next === publishType) return
    setPublishType(next)
    resetForm()
  }

  function changeCategory(next: CourseCategory) {
    setCategory(next)
    if (publishType === 'course') {
      setTitle('')
      setAwardCost('')
      setAwardStock('1')
    }
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', text: '只能上传图片文件。' })
      return
    }
    setImageFile(file)
    setImageUrl('')
    setImagePreview(URL.createObjectURL(file))
    setStatus(null)
  }

  function clearImage() {
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
  }

  async function onActivityFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadingFile(true)
    setStatus(null)
    try {
      const formData = new FormData()
      formData.append('file', file, file.name)
      const res = await api.post('/activity/uploadFile', formData)
      const url = res.data?.code === 0 ? String(res.data.data || '') : ''
      if (!url) throw new Error(res.data?.message || '文件上传失败')
      setActivityFile(url)
      setActivityFileName(file.name)
      setStatus({ type: 'ok', text: '文件上传成功' })
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err, '文件上传失败') })
    } finally {
      setUploadingFile(false)
    }
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append(isCourse ? 'image' : 'banner', file, file.name)
    const res = await api.post(isCourse ? '/course/upload' : '/activity/uploadBanner', formData)
    const url = res.data?.code === 0 ? String(res.data.data || '') : ''
    if (!url) throw new Error(res.data?.message || '图片上传失败')
    return url
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || uploadingFile) return
    setStatus(null)

    if (!title.trim() || !startTime || !endTime || !description.trim()) {
      setStatus({ type: 'error', text: '请填写所有必填项' })
      return
    }
    if (!imageFile && !imageUrl) {
      setStatus({ type: 'error', text: '请填写所有必填项' })
      return
    }

    setSubmitting(true)
    try {
      let finalImage = imageUrl
      if (imageFile) {
        try {
          finalImage = await uploadImage(imageFile)
        } catch (err) {
          setStatus({ type: 'error', text: errorMessage(err, '图片上传失败') })
          return
        }
        if (!finalImage) {
          setStatus({ type: 'error', text: '请填写所有必填项' })
          return
        }
        setImageUrl(finalImage)
        setImageFile(null)
        setImagePreview(finalImage)
      }

      if (isCourse) {
        const cost = Number(awardCost)
        const stock = Number(awardStock)
        if (category === 'award' && (!Number.isInteger(cost) || cost <= 0)) {
          setStatus({ type: 'error', text: '奖品兑换积分必须是大于 0 的整数' })
          return
        }
        if (category === 'award' && (!Number.isInteger(stock) || stock <= 0)) {
          setStatus({ type: 'error', text: '奖品数量必须是大于 0 的整数' })
          return
        }

        const res = await api.post('/course/post', {
          title,
          category,
          startTime: toLocalDateTime(startTime),
          endTime: toLocalDateTime(endTime),
          description,
          image: finalImage,
          awardCost: category === 'award' ? cost : null,
          awardStock: category === 'award' ? stock : null,
          createTime: nowStamp(),
          updateTime: nowStamp(),
        })
        if (res.data?.code === 0) {
          setStatus({ type: 'ok', text: '课题发布成功' })
          resetForm(true)
        } else {
          setStatus({ type: 'error', text: res.data?.message || '课题发布失败' })
        }
        return
      }

      if (!activityFile) {
        setStatus({ type: 'error', text: '请上传活动文件' })
        return
      }

      const res = await api.post('/activity/post', {
        name: title,
        startTime: toLocalDateTime(startTime),
        endTime: toLocalDateTime(endTime),
        description,
        activityBanner: finalImage,
        activityFile,
      })
      const code = res.data?.code
      if (code === undefined || code === 0) {
        setStatus({ type: 'ok', text: '活动发布成功' })
        resetForm(true)
      } else {
        setStatus({ type: 'error', text: res.data?.message || '活动发布失败' })
      }
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err, '发布过程中发生错误') })
    } finally {
      setSubmitting(false)
    }
  }

  const titlePlaceholder = isCourse
    ? isAward
      ? '请输入具体奖品名称'
      : '请输入课题名称'
    : '请输入活动名称'

  return (
    <PageShell title="ADMIN · CONTENT" subtitle="发布新的课题或活动">
      <form className="page-card" style={{ maxWidth: 760 }} onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Field label="发布类型">
            <select
              className="page-select"
              style={{ width: '100%' }}
              value={publishType}
              disabled={submitting || uploadingFile}
              onChange={(event) => changePublishType(event.target.value as PublishType)}
            >
              <option value="course">课题</option>
              <option value="activity">活动</option>
            </select>
          </Field>

          <Field label={isCourse ? '课题名称' : '活动名称'}>
            <input
              className="page-input"
              style={inputStyle}
              value={title}
              placeholder={titlePlaceholder}
              disabled={submitting}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          {isCourse && (
            <Field label="课题类别">
              <select
                className="page-select"
                style={{ width: '100%' }}
                value={category}
                disabled={submitting || uploadingFile}
                onChange={(event) => changeCategory(event.target.value as CourseCategory)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
          )}

          {isAward && (
            <Field label="兑换所需积分">
              <input
                className="page-input"
                style={inputStyle}
                type="number"
                min={1}
                step={1}
                value={awardCost}
                placeholder="请输入大于 0 的整数"
                disabled={submitting}
                onChange={(event) => setAwardCost(event.target.value)}
              />
            </Field>
          )}

          {isAward && (
            <Field label="奖品数量">
              <input
                className="page-input"
                style={inputStyle}
                type="number"
                min={1}
                step={1}
                value={awardStock}
                placeholder="请输入大于 0 的整数"
                disabled={submitting}
                onChange={(event) => setAwardStock(event.target.value)}
              />
            </Field>
          )}

          <Field label="开始时间">
            <input
              className="page-input"
              style={inputStyle}
              type="datetime-local"
              step={1}
              value={startTime}
              disabled={submitting}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </Field>

          <Field label="结束时间">
            <input
              className="page-input"
              style={inputStyle}
              type="datetime-local"
              step={1}
              value={endTime}
              disabled={submitting}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </Field>

          <Field label={isCourse ? '课题描述' : '活动描述'}>
            <textarea
              className="page-input area"
              style={inputStyle}
              maxLength={500}
              value={description}
              placeholder={isCourse ? '请输入课题描述' : '请输入活动描述'}
              disabled={submitting}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="meta" style={{ marginTop: 4, textAlign: 'right' }}>{description.length} / 500</div>
          </Field>

          <Field label={isCourse ? '上传图片' : '上传宣传图'}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <label className="page-btn small" style={{ cursor: 'pointer' }}>
                <span>选择图片</span>
                <input
                  type="file"
                  accept="image/*"
                  style={hiddenStyle}
                  disabled={submitting}
                  onChange={onImageChange}
                />
              </label>
              <span className="meta">支持图片文件，提交时上传。</span>
            </div>
            {preview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <img src={preview} alt="上传预览" style={previewStyle} />
                <button className="page-btn small" type="button" disabled={submitting} onClick={clearImage}>移除</button>
              </div>
            )}
          </Field>

          {!isCourse && (
            <Field label="上传文件">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <label className="page-btn small" style={{ cursor: 'pointer' }}>
                  <span>{uploadingFile ? '上传中…' : '选择文件'}</span>
                  <input
                    type="file"
                    style={hiddenStyle}
                    disabled={uploadingFile || submitting}
                    onChange={(event) => { void onActivityFileChange(event) }}
                  />
                </label>
                {activityFile ? (
                  <a className="meta" href={resolveUrl(activityFile)} target="_blank" rel="noreferrer">
                    {activityFileName || '已上传文件'}
                  </a>
                ) : (
                  <span className="meta">{uploadingFile ? '正在上传活动文件…' : '未上传文件'}</span>
                )}
                {activityFile && (
                  <button
                    className="page-btn small"
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setActivityFile('')
                      setActivityFileName('')
                    }}
                  >
                    移除
                  </button>
                )}
              </div>
            </Field>
          )}
        </div>

        {status && (
          <p className="meta" style={{ marginTop: 14, color: status.type === 'error' ? '#FF8FA3' : '#7EF0C8' }}>
            {status.text}
          </p>
        )}

        <div className="page-actions-row">
          <button className="page-btn primary" type="submit" disabled={submitting || uploadingFile}>
            {submitting ? '提交中…' : `提交${isCourse ? '课题' : '活动'}`}
          </button>
          <button className="page-btn" type="button" disabled={submitting || uploadingFile} onClick={() => resetForm()}>重置</button>
        </div>
      </form>
    </PageShell>
  )
}
