import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import PageShell from '../components/PageShell'
import AvatarCropperModal from '../components/AvatarCropperModal'
import { api, type ProfileData } from '../api'

type Notice = { kind: 'ok' | 'err' | 'info'; text: string }
type SessionUser = { id?: number; account?: string; role?: string }
type ExtraProfile = { qqNumber: string; qqEmail: string; university: string }

const SCHOOLS = [
  ['UESTC', '电子科技大学'],
  ['SWJTU', '西南交通大学'],
] as const

const DEFAULT_AVATAR = '/club-logo.jpg'

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return DEFAULT_AVATAR
  if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('blob:')) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return '登录会话已失效，请重新登录后重试'
    const data: unknown = error.response?.data
    if (typeof data === 'string' && data) return data
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message) return message
    }
    return error.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

function readSessionUser(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem('userInfo')
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

/** Downscale the chosen avatar in the browser (Vue used its cropper + compressor). */
async function optimizeImage(file: Blob, maxSide = 256, quality = 0.84): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = objectUrl
    })
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法处理图片')
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('图片压缩失败')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function ProfileSettingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [user] = useState<SessionUser | null>(readSessionUser)
  const identityId = Number(user?.id)
  const hasUser = Number.isFinite(identityId) && identityId > 0

  const [activeTab, setActiveTab] = useState<'info' | 'titles'>(tabParam === 'titles' ? 'titles' : 'info')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [description, setDescription] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [extra, setExtra] = useState<ExtraProfile>({ qqNumber: '', qqEmail: '', university: '' })
  const [extraStatus, setExtraStatus] = useState('')
  const [savingExtra, setSavingExtra] = useState(false)

  const [titleName, setTitleName] = useState('')
  const [acquisitionMethod, setAcquisitionMethod] = useState('')
  const [applying, setApplying] = useState(false)
  const [titleStatus, setTitleStatus] = useState('')

  const [previewUrl, setPreviewUrl] = useState('')
  const [cropSrc, setCropSrc] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [pendingAvatar, setPendingAvatar] = useState<Blob | null>(null)
  const previewUrlRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // follow ?tab=titles like the Vue page (it also accepted ?tab=avatar / ?tab=info)
  useEffect(() => {
    if (tabParam === 'avatar' || tabParam === 'info') setActiveTab('info')
    else if (tabParam === 'titles') setActiveTab('titles')
  }, [tabParam])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const loadProfile = useCallback(async () => {
    if (!hasUser) {
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    try {
      const res = await api.get(`/profile/identity/${identityId}`)
      const data = (res.data?.data ?? res.data ?? null) as ProfileData | null
      setProfile(data)
      setDescription(data?.description ?? '')
    } catch (error) {
      setNotice({ kind: 'err', text: errorMessage(error, '资料加载失败') })
    } finally {
      setProfileLoading(false)
    }
  }, [hasUser, identityId])

  const loadExtraProfile = useCallback(async () => {
    if (!hasUser) return
    try {
      const res = await api.get('/identity-extra-profile/me')
      const data = (res.data?.data ?? res.data ?? {}) as Partial<ExtraProfile>
      setExtra({
        qqNumber: data.qqNumber ?? '',
        qqEmail: data.qqEmail ?? '',
        university: data.university ?? '',
      })
    } catch (error) {
      setExtraStatus(errorMessage(error, '补充信息加载失败'))
    }
  }, [hasUser])

  useEffect(() => {
    void loadProfile()
    void loadExtraProfile()
  }, [loadProfile, loadExtraProfile])

  function triggerFileInput() {
    fileInputRef.current?.click()
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice({ kind: 'err', text: '只能上传 JPG/PNG 图片' })
      return
    }
    const src = URL.createObjectURL(file)
    setCropSrc(src)
    setCropOpen(true)
  }

  async function handleCrop(blob: Blob) {
    try {
      const optimized = await optimizeImage(blob)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const nextUrl = URL.createObjectURL(optimized)
      previewUrlRef.current = nextUrl
      setPreviewUrl(nextUrl)
      setPendingAvatar(optimized)
      setCropOpen(false)
      if (cropSrc) URL.revokeObjectURL(cropSrc)
      setCropSrc('')
      setNotice({ kind: 'info', text: '头像已裁剪，请点击「保存并提交审核」' })
    } catch (error) {
      setNotice({ kind: 'err', text: errorMessage(error, '头像处理失败，请重试') })
    }
  }

  async function submitEditProfile() {
    if (!hasUser || saving) return
    if (description.length > 50) {
      setNotice({ kind: 'err', text: '签名不能超过50字' })
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('description', description)
      if (pendingAvatar) formData.append('avatar', pendingAvatar, 'avatar.jpg')
      const res = await api.post(`/profile/${identityId}/submit`, formData)
      if (res.data?.code !== 0) throw new Error(res.data?.message || '提交失败')
      setPendingAvatar(null)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
      setPreviewUrl('')
      setNotice({ kind: 'ok', text: '资料已提交审核，请等待管理员处理' })
      await loadProfile()
    } catch (error) {
      setNotice({ kind: 'err', text: errorMessage(error, '资料提交失败') })
    } finally {
      setSaving(false)
    }
  }

  async function saveExtraProfile() {
    if (savingExtra) return
    if (!hasUser) {
      setExtraStatus('请先登录后保存补充信息')
      return
    }
    const qqNumber = extra.qqNumber.trim()
    const qqEmail = extra.qqEmail.trim()
    const invalidNumber = qqNumber !== '' && !/^[1-9][0-9]{4,19}$/.test(qqNumber)
    const invalidEmail = qqEmail !== '' && !/^[A-Za-z0-9._+-]+@qq[.]com$/i.test(qqEmail)
    const invalidSchool = !SCHOOLS.some(([value]) => value === extra.university)
    if (invalidNumber || invalidEmail || invalidSchool) {
      setExtraStatus('QQ号须为5至20位数字，QQ邮箱须为@qq.com地址；两项均可留空，学校必须选择')
      return
    }
    setSavingExtra(true)
    setExtraStatus('正在保存补充信息...')
    try {
      await api.put('/identity-extra-profile/me', { ...extra, qqNumber, qqEmail })
      setExtraStatus('补充信息已保存')
    } catch (error) {
      setExtraStatus(errorMessage(error, '补充信息保存失败'))
    } finally {
      setSavingExtra(false)
    }
  }

  async function applyTitle() {
    if (applying) return
    const name = titleName.trim()
    if (!name) {
      setTitleStatus('请输入称号文字')
      return
    }
    setApplying(true)
    try {
      const res = await api.post('/title/apply', {
        name,
        acquisitionMethod: acquisitionMethod.trim() || null,
      })
      if (res.data?.code !== 0) throw new Error(res.data?.message || '申请失败')
      setTitleName('')
      setAcquisitionMethod('')
      setTitleStatus('称号申请已提交')
    } catch (error) {
      setTitleStatus(errorMessage(error, '申请失败'))
    } finally {
      setApplying(false)
    }
  }

  if (!hasUser) {
    return (
      <PageShell title="PROFILE SETTINGS" subtitle="个人资料与称号申请">
        <div className="page-card error">
          请先登录后再访问个人设置。
          <Link to="/login" style={{ marginLeft: 8, textDecoration: 'underline' }}>前往登录</Link>
        </div>
      </PageShell>
    )
  }

  const statusText = profile?.status === 1
    ? '资料已通过审核'
    : profile?.status === 0
      ? '资料审核中'
      : '资料未完善'

  return (
    <PageShell title="PROFILE SETTINGS" subtitle="个人资料与称号申请">
      <div className="profile-layout">
        <aside className="page-card profile-card">
          <img className="profile-avatar" src={previewUrl || getImageUrl(profile?.avatar)} alt="头像预览" />
          <h2>{user?.account || profile?.account || '社员'}</h2>
          <p className="meta">{statusText}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              className={activeTab === 'info' ? 'page-btn primary' : 'page-btn'}
              onClick={() => setActiveTab('info')}
            >
              我的信息
            </button>
            <button
              type="button"
              className={activeTab === 'titles' ? 'page-btn primary' : 'page-btn'}
              onClick={() => setActiveTab('titles')}
            >
              申请称号
            </button>
          </div>
        </aside>

        <section className="page-card">
          {notice && (
            <p
              role="status"
              className="meta"
              style={{ color: notice.kind === 'err' ? '#FF8FA3' : notice.kind === 'ok' ? '#9CFFC2' : undefined }}
            >
              {notice.text}
            </p>
          )}

          {activeTab === 'info' ? (
            <>
              <h3>编辑个人信息</h3>
              {profileLoading && <p className="meta">载入中…</p>}
              <div className="page-actions-row" style={{ marginTop: 12 }}>
                <button type="button" className="page-btn" onClick={triggerFileInput} disabled={saving}>
                  选择头像
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={onFileChange}
                />
                <span className="meta">提交后需管理员审核</span>
              </div>

              <label className="meta" htmlFor="profile-description" style={{ display: 'block', marginTop: 8 }}>
                签名
              </label>
              <textarea
                id="profile-description"
                className="page-input area"
                maxLength={50}
                value={description}
                placeholder="输入你的个性签名（50字以内）"
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="meta">{description.length}/50</p>
              <button type="button" className="page-btn primary" onClick={submitEditProfile} disabled={saving}>
                {saving ? '提交中…' : '保存并提交审核'}
              </button>

              <div className="section-block">
                <h2>补充信息</h2>
                <label className="meta" htmlFor="qq-number">QQ号（选填）</label>
                <input
                  id="qq-number"
                  className="page-input"
                  inputMode="numeric"
                  maxLength={20}
                  value={extra.qqNumber}
                  onChange={(e) => setExtra((prev) => ({ ...prev, qqNumber: e.target.value }))}
                />
                <label className="meta" htmlFor="qq-email">QQ邮箱（选填）</label>
                <input
                  id="qq-email"
                  className="page-input"
                  type="email"
                  maxLength={254}
                  value={extra.qqEmail}
                  onChange={(e) => setExtra((prev) => ({ ...prev, qqEmail: e.target.value }))}
                />
                <label className="meta" htmlFor="university">学校</label>
                <select
                  id="university"
                  className="page-select"
                  style={{ width: '100%', marginTop: 8 }}
                  value={extra.university}
                  onChange={(e) => setExtra((prev) => ({ ...prev, university: e.target.value }))}
                >
                  <option value="" disabled>请选择学校</option>
                  {SCHOOLS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="page-actions-row">
                  <button type="button" className="page-btn primary" onClick={saveExtraProfile} disabled={savingExtra}>
                    {savingExtra ? '保存中…' : '保存补充信息'}
                  </button>
                </div>
                {extraStatus && <p role="status" className="meta">{extraStatus}</p>}
              </div>
            </>
          ) : (
            <>
              <h3>申请称号</h3>
              <p className="meta">管理员审核通过后，可在个人界面佩戴。</p>
              <p className="meta" style={{ marginTop: 16 }}>称号文字</p>
              <input
                className="page-input"
                maxLength={32}
                value={titleName}
                placeholder="输入称号文字（32字以内）"
                onChange={(e) => setTitleName(e.target.value)}
              />
              <p className="meta">{titleName.length}/32</p>
              <p className="meta" style={{ marginTop: 12 }}>获得方式（选填）</p>
              <textarea
                className="page-input area"
                maxLength={255}
                value={acquisitionMethod}
                placeholder="描述这项称号的获得方式"
                onChange={(e) => setAcquisitionMethod(e.target.value)}
              />
              <p className="meta">{acquisitionMethod.length}/255</p>
              <div className="page-actions-row">
                <button type="button" className="page-btn primary" onClick={applyTitle} disabled={applying}>
                  {applying ? '提交中…' : '提交申请'}
                </button>
              </div>
              {titleStatus && <p role="status" className="meta">{titleStatus}</p>}
            </>
          )}
        </section>
      </div>

      <div className="page-actions-row">
        <button type="button" className="page-btn" onClick={() => navigate(-1)}>返回</button>
      </div>
      {cropOpen && cropSrc && <AvatarCropperModal src={cropSrc} onCancel={() => { setCropOpen(false); URL.revokeObjectURL(cropSrc); setCropSrc('') }} onCrop={handleCrop} />}
    </PageShell>
  )
}
