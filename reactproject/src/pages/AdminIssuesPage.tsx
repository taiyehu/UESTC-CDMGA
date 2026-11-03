import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

type CourseLite = { id: number; title?: string; category?: string | null }
type IssueRow = { issueId: number; image: string; text: string; file: string; songName: string }
type Notice = { type: 'ok' | 'error'; text: string }

function unwrap(res: any): any {
  const body = res?.data
  if (body && typeof body === 'object' && 'code' in body) return body.data ?? null
  return body ?? null
}

function listOf(res: any): any[] {
  const data = unwrap(res)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.items)) return data.items
  return []
}

function errText(e: unknown, fallback: string): string {
  const err = e as any
  const message = err?.response?.data?.message || (e instanceof Error ? e.message : '')
  return typeof message === 'string' && message.trim() ? message : fallback
}

function toUrl(path?: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function normalizeCategory(course: CourseLite | null): string {
  return String(course?.category || '').trim().toLowerCase()
}

export default function AdminIssuesPage() {
  const { courseId: courseIdParam } = useParams()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<CourseLite[]>([])
  const [selected, setSelected] = useState<CourseLite | null>(null)
  const [rows, setRows] = useState<IssueRow[]>([])
  const [page, setPage] = useState(1)
  const [booting, setBooting] = useState(true)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const category = useMemo(() => normalizeCategory(selected), [selected])
  const issueTotal = category === 'bingo' ? 25 : 6
  const issuePageSize = category === 'bingo' ? 5 : 6
  const totalPages = Math.max(1, Math.ceil(issueTotal / issuePageSize))

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const loadRows = useCallback(async (course: CourseLite, pageNo: number): Promise<IssueRow[]> => {
    const courseCategory = normalizeCategory(course)
    const total = courseCategory === 'bingo' ? 25 : 6
    const size = courseCategory === 'bingo' ? 5 : 6
    setRowsLoading(true)
    try {
      const res = await api.get(`/issue/course/${course.id}`, { params: { page: pageNo - 1, size, unmasked: true } })
      const existingMap = new Map<number, any>()
      for (const item of listOf(res)) {
        const id = Number(item?.issueId)
        if (Number.isFinite(id)) existingMap.set(id, item)
      }

      const start = (pageNo - 1) * size + 1
      const end = Math.min(total, start + size - 1)
      const next: IssueRow[] = []
      for (let issueId = start; issueId <= end; issueId += 1) {
        const existing = existingMap.get(issueId)
        next.push({
          issueId,
          image: String(existing?.image || ''),
          text: String(existing?.text || ''),
          file: String(existing?.file || ''),
          songName: String(existing?.songName || ''),
        })
      }
      setRows(next)
      return next
    } catch (e) {
      setRows([])
      setNotice({ type: 'error', text: errText(e, '加载 issue 失败') })
      return []
    } finally {
      setRowsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setBooting(true)
    setError('')
    setPage(1)
    setRows([])

    ;(async () => {
      try {
        const res = await api.get('/course/')
        const eligible = (listOf(res) as CourseLite[]).filter((item) => {
          const value = normalizeCategory(item)
          return value === 'typical' || value === 'bingo'
        })
        if (cancelled) return
        setCourses(eligible)

        const id = Number(courseIdParam)
        if (!courseIdParam || !Number.isFinite(id) || id <= 0) {
          setSelected(null)
          return
        }

        let course = eligible.find((item) => Number(item.id) === id) ?? null
        if (!course) {
          const one = await api.get(`/course/${id}`)
          const data = unwrap(one) as CourseLite | null
          course = data && Number(data.id) === id ? data : null
        }
        if (cancelled) return

        const courseCategory = normalizeCategory(course)
        if (!course || (courseCategory !== 'typical' && courseCategory !== 'bingo')) {
          setSelected(null)
          setNotice({ type: 'error', text: '仅 typical 和 bingo 课题支持 issue 配置' })
          navigate('/admin/issues', { replace: true })
          return
        }
        setSelected(course)
      } catch (e) {
        if (!cancelled) setError(errText(e, '加载 Issue 页面失败'))
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [courseIdParam, navigate])

  useEffect(() => {
    if (!selected) return
    void loadRows(selected, page)
  }, [selected, page, loadRows])

  function warn(text: string) {
    setNotice({ type: 'error', text })
  }

  function changePage(target: number) {
    setPage(Math.min(totalPages, Math.max(1, target)))
  }

  function patchRow(issueId: number, patch: Partial<IssueRow>) {
    setRows((prev) => prev.map((row) => (row.issueId === issueId ? { ...row, ...patch } : row)))
  }

  async function onPickUpload(event: ChangeEvent<HTMLInputElement>, issueId: number, kind: 'image' | 'file') {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !selected) return

    const key = `${kind}-${issueId}`
    setUploading((prev) => ({ ...prev, [key]: true }))
    try {
      const formData = new FormData()
      formData.append(kind === 'image' ? 'image' : 'file', file)
      formData.append('courseId', String(selected.id))
      const res = await api.post(kind === 'image' ? '/issue/upload-image' : '/issue/upload-file', formData)
      const data = unwrap(res)
      const url = typeof data === 'string' ? data : ''
      if (!url) throw new Error(kind === 'image' ? '图片上传失败' : '文件上传失败')
      patchRow(issueId, kind === 'image' ? { image: url } : { file: url })
      setNotice({ type: 'ok', text: `${kind === 'image' ? '图片' : '文件'}上传成功，请记得保存` })
    } catch (e) {
      setNotice({ type: 'error', text: errText(e, kind === 'image' ? '图片上传失败' : '文件上传失败') })
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function saveRow(row: IssueRow) {
    if (!selected) return
    const songName = row.songName.trim()

    if (category === 'typical' && !songName) return warn(`Typical 课题的 issue #${row.issueId} 需要填写 song_name`)
    if (category === 'bingo' && songName && [...songName].length !== 1) {
      return warn(`Bingo 课题的 issue #${row.issueId} 标记只能是单个字符`)
    }

    setSaving((prev) => ({ ...prev, [row.issueId]: true }))
    try {
      await api.post(`/issue/course/${selected.id}/upsert`, {
        issue_id: row.issueId,
        image: row.image,
        text: row.text,
        file: row.file,
        song_name: songName || undefined,
      })
      patchRow(row.issueId, { songName })
      setNotice({ type: 'ok', text: `Issue #${row.issueId} 保存成功` })
    } catch (e) {
      setNotice({ type: 'error', text: errText(e, '保存失败') })
    } finally {
      setSaving((prev) => ({ ...prev, [row.issueId]: false }))
    }
  }

  return (
    <PageShell
      title="ADMIN · ISSUES"
      subtitle={selected ? `Issue 上传管理 · ${selected.title || ''}` : 'Issue 上传管理'}
      actions={
        selected ? (
          <button className="page-btn" type="button" onClick={() => navigate('/admin/issues')}>
            返回 Issue 首页
          </button>
        ) : undefined
      }
    >
      {notice && <div className={`page-card${notice.type === 'error' ? ' error' : ''}`}>{notice.text}</div>}
      {error && <div className="page-card error">{error}</div>}
      {booting && <div className="page-card">载入中…</div>}

      {!booting && !error && selected && (
        <div className="page-actions-row">
          <span className="meta">课题ID: {selected.id}</span>
          <span className="meta">课题名称: {selected.title || '-'}</span>
          <span className="meta">类别: {category}</span>
        </div>
      )}

      {!booting && !error && !selected && (
        <div className="section-block">
          <h2>选择课题</h2>
          <p className="desc">请选择一个 typical 或 bingo 课题进行 issue 配置：</p>
          {!courses.length ? (
            <div className="page-card">暂无可配置 issue 的课题</div>
          ) : (
            <div className="page-card" style={{ overflowX: 'auto' }}>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>课题ID</th>
                    <th>课题名称</th>
                    <th>类别</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="mono">{course.id}</td>
                      <td>{course.title || '-'}</td>
                      <td>{course.category || '-'}</td>
                      <td>
                        <Link className="page-btn small" to={`/admin/issues/${course.id}`}>
                          进入配置
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!booting && !error && selected && (
        <div className="section-block">
          <h2>Issue 列表（{category === 'bingo' ? '25 格' : '6 题'}）</h2>
          <div className="page-card" style={{ overflowX: 'auto' }}>
            {rowsLoading && <p className="meta">载入中…</p>}
            {!rowsLoading && !rows.length && <p className="meta">暂无 issue 记录</p>}
            {!!rows.length && (
              <table className="page-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>图片</th>
                    <th>文本描述</th>
                    <th>文件</th>
                    <th>{category === 'bingo' ? '标记字符' : 'song_name'}</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.issueId}>
                      <td className="mono">{row.issueId}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          {row.image && (
                            <img
                              src={toUrl(row.image)}
                              alt={`issue ${row.issueId} 图片`}
                              loading="lazy"
                              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(34, 211, 238, 0.35)' }}
                            />
                          )}
                          <label className="page-btn small">
                            {uploading[`image-${row.issueId}`] ? '上传中…' : '上传图片'}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => void onPickUpload(e, row.issueId, 'image')}
                            />
                          </label>
                        </div>
                      </td>
                      <td>
                        <textarea
                          className="page-input area"
                          rows={4}
                          placeholder="填写 text"
                          value={row.text}
                          onChange={(e) => patchRow(row.issueId, { text: e.target.value })}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          {row.file && (
                            <a className="page-btn small" href={toUrl(row.file)} target="_blank" rel="noreferrer">
                              查看文件
                            </a>
                          )}
                          <label className="page-btn small">
                            {uploading[`file-${row.issueId}`] ? '上传中…' : '上传文件'}
                            <input type="file" hidden onChange={(e) => void onPickUpload(e, row.issueId, 'file')} />
                          </label>
                        </div>
                      </td>
                      <td>
                        <input
                          className="page-input"
                          placeholder={category === 'bingo' ? '单个字符（如 A / ★ / 中）' : '必填'}
                          value={row.songName}
                          onChange={(e) => patchRow(row.issueId, { songName: e.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          className="page-btn primary"
                          type="button"
                          disabled={Boolean(saving[row.issueId])}
                          onClick={() => void saveRow(row)}
                        >
                          {saving[row.issueId] ? '保存中…' : '保存'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {category === 'bingo' && (
            <div className="page-pager">
              <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => changePage(1)}>首页</button>
              <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>下一页</button>
              <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => changePage(totalPages)}>尾页</button>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
