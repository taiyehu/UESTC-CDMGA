import { useCallback, useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type AdminProfile = {
  id?: number
  identityId?: number
  identity_id?: number
  account?: string
  avatar?: string | null
  description?: string | null
  title?: string | null
  status?: number | null
}

const PAGE_SIZE = 5
const FALLBACK_AVATAR = '/club-logo.jpg'

function imageUrl(path?: string | null): string {
  if (!path) return FALLBACK_AVATAR
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function errorText(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }
  return error instanceof Error ? error.message : '操作失败'
}

function extractList(response: { data?: any }): AdminProfile[] {
  const body = response.data
  if (body && typeof body === 'object' && 'code' in body && body.code !== 0) {
    throw new Error(body.message || '请求失败')
  }
  const payload = body?.data ?? body
  return Array.isArray(payload) ? (payload as AdminProfile[]) : []
}

function profileKey(profile: AdminProfile): number | undefined {
  return profile.id ?? profile.identityId ?? profile.identity_id
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [jump, setJump] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/profile/all')
      setProfiles(extractList(response))
    } catch (e) {
      setProfiles([])
      setError(errorText(e) || '获取用户资料失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const key = keyword.trim().toLowerCase()
    const source = profiles.filter((item) => Number(item.status) !== 1)
    if (!key) return source
    return source.filter((item) => {
      const account = String(item.account || '').toLowerCase()
      const identityId = String(item.identityId ?? item.identity_id ?? '')
      return account.includes(key) || identityId.includes(key)
    })
  }, [profiles, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function updateStatus(profile: AdminProfile, status: number) {
    const id = profileKey(profile)
    if (id === undefined) {
      setNotice({ text: '缺少资料编号', error: true })
      return
    }
    setBusyId(id)
    setNotice(null)
    try {
      const response = await api.put(`/profile/${id}`, { ...profile, status })
      const body = response.data
      if (body && typeof body === 'object' && 'code' in body && body.code !== 0) {
        throw new Error(body.message || '操作失败')
      }
      setNotice({ text: status === 1 ? '审核通过' : '已驳回', error: false })
      await load()
    } catch (e) {
      setNotice({ text: errorText(e) || '操作失败', error: true })
    } finally {
      setBusyId(null)
    }
  }

  async function removeProfile(profile: AdminProfile) {
    if (!window.confirm('确定删除该用户资料吗？')) return
    const id = profileKey(profile)
    if (id === undefined) {
      setNotice({ text: '缺少资料编号', error: true })
      return
    }
    setBusyId(id)
    setNotice(null)
    try {
      await api.delete(`/profile/${id}`)
      setNotice({ text: '用户资料删除成功', error: false })
      await load()
    } catch (e) {
      setNotice({ text: errorText(e) || '删除失败', error: true })
    } finally {
      setBusyId(null)
    }
  }

  function changePage(target: number) {
    setCurrentPage(Math.min(totalPages, Math.max(1, target)))
  }

  function jumpTo() {
    const parsed = Number(jump)
    if (!Number.isFinite(parsed)) return
    changePage(Math.trunc(parsed))
    setJump('')
  }

  return (
    <PageShell title="ADMIN · PROFILES" subtitle="资料审核">
      <div style={{ maxWidth: 340, marginBottom: 16 }}>
        <input
          className="page-input"
          placeholder="按用户名或用户ID筛选"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {notice && <div className={notice.error ? 'page-card error' : 'page-card'}>{notice.text}</div>}
      {error && <div className="page-card error">{error}</div>}
      {loading && <div className="page-card">正在加载…</div>}

      {!loading && !error && (
        <div className="page-card">
          <table className="page-table">
            <thead>
              <tr>
                <th>头像</th>
                <th>用户名</th>
                <th>用户ID</th>
                <th>签名</th>
                <th>头衔</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((profile, index) => {
                const id = profileKey(profile)
                const busy = id !== undefined && busyId === id
                return (
                  <tr key={id ?? `profile-${index}`}>
                    <td>
                      <img
                        loading="lazy"
                        src={imageUrl(profile.avatar)}
                        alt="头像"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgba(34,211,238,.35)',
                        }}
                      />
                    </td>
                    <td>{profile.account || '-'}</td>
                    <td>{profile.identityId ?? profile.identity_id ?? '-'}</td>
                    <td>{profile.description || '-'}</td>
                    <td>{profile.title || '-'}</td>
                    <td>
                      {Number(profile.status) === 0 && <span style={{ color: '#fbbf24', fontWeight: 600 }}>审核中</span>}
                      {Number(profile.status) === 1 && <span style={{ color: '#34d399', fontWeight: 600 }}>已通过</span>}
                      {Number(profile.status) !== 0 && Number(profile.status) !== 1 && (
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>未提交</span>
                      )}
                    </td>
                    <td>
                      <div className="page-actions-row" style={{ margin: 0, flexWrap: 'wrap' }}>
                        {Number(profile.status) === 0 && (
                          <>
                            <button
                              type="button"
                              className="page-btn"
                              style={{ color: '#34d399' }}
                              disabled={busy}
                              onClick={() => void updateStatus(profile, 1)}
                            >
                              {busy ? '处理中…' : '通过'}
                            </button>
                            <button
                              type="button"
                              className="page-btn"
                              style={{ color: '#fbbf24' }}
                              disabled={busy}
                              onClick={() => void updateStatus(profile, -1)}
                            >
                              驳回
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="page-btn"
                          style={{ color: '#FF8FA3' }}
                          disabled={busy}
                          onClick={() => void removeProfile(profile)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filtered.length && <p className="meta">暂无资料可审核</p>}
        </div>
      )}

      <div className="page-pager">
        <button type="button" className="page-btn" disabled={currentPage <= 1} onClick={() => changePage(1)}>首页</button>
        <button type="button" className="page-btn" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}>上一页</button>
        <span>{currentPage} / {totalPages}</span>
        <button type="button" className="page-btn" disabled={currentPage >= totalPages} onClick={() => changePage(currentPage + 1)}>下一页</button>
        <button type="button" className="page-btn" disabled={currentPage >= totalPages} onClick={() => changePage(totalPages)}>尾页</button>
        <input
          className="page-input"
          type="number"
          min={1}
          max={totalPages}
          placeholder="页码"
          value={jump}
          style={{ width: 72, marginTop: 0 }}
          onChange={(event) => setJump(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') jumpTo()
          }}
        />
        <button type="button" className="page-btn" onClick={jumpTo}>跳转</button>
      </div>
    </PageShell>
  )
}
