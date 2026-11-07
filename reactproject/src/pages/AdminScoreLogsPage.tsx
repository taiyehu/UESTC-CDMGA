import { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type Category = 'bingo' | 'non-bingo'

type ScoreRow = {
  id: number
  uploadTime?: string | null
  image?: string | null
  score?: number | null
  isScored?: boolean | null
  issueId?: number | null
  remark?: string | null
  course?: {
    id?: number
    title?: string
  } | null
  identity?: {
    id?: number
    account?: string | null
  } | null
}

type Query = {
  courseId: string
  identityId: string
  issueId: string
  isScored: string
}

const PAGE_SIZE = 5

const EMPTY_QUERY: Query = { courseId: '', identityId: '', issueId: '', isScored: '' }

function readAdminIdentityId(): number | null {
  try {
    const raw = sessionStorage.getItem('userInfo')
    if (!raw) return null
    const user = JSON.parse(raw)
    const value = Number(user?.id ?? user?.identityId ?? user?.userId)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function parseOptionalNumber(raw: string): number | undefined {
  if (!raw.trim()) return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function parseOptionalBool(raw: string): boolean | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN')
}

export default function AdminScoreLogsPage() {
  const adminId = useMemo(readAdminIdentityId, [])
  const [category, setCategory] = useState<Category>('non-bingo')
  const [query, setQuery] = useState<Query>(EMPTY_QUERY)
  const [rows, setRows] = useState<ScoreRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function loadRows(
    targetPage = page,
    activeCategory: Category = category,
    filters: Query = query,
  ): Promise<void> {
    if (!adminId) {
      setRows([])
      setTotal(0)
      setError('管理员身份无效，请重新登录')
      return
    }

    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number | boolean> = {
        admin_identity_id: adminId,
        category: activeCategory,
        page: targetPage - 1,
        size: PAGE_SIZE,
      }
      const courseId = parseOptionalNumber(filters.courseId)
      const identityId = parseOptionalNumber(filters.identityId)
      const issueId = parseOptionalNumber(filters.issueId)
      const isScored = parseOptionalBool(filters.isScored)
      if (courseId !== undefined) params.course_id = courseId
      if (identityId !== undefined) params.identity_id = identityId
      if (issueId !== undefined) params.issue_id = issueId
      if (isScored !== undefined) params.is_scored = isScored

      const res = await api.get('/score/admin/logs', { params })
      const list: ScoreRow[] = Array.isArray(res.data?.list) ? res.data.list : []
      setRows(list)
      setTotal(Number(res.data?.total ?? 0))
      setPage(targetPage)
    } catch (e) {
      const data = (e as { response?: { data?: { msg?: string; message?: string } } })?.response?.data
      setRows([])
      setTotal(0)
      setError(data?.msg || data?.message || (e instanceof Error ? e.message : '获取成绩日志失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRows(1, category)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  function updateQuery<K extends keyof Query>(key: K, value: Query[K]): void {
    setQuery((prev) => ({ ...prev, [key]: value }))
  }

  function handleSearch(): void {
    void loadRows(1, category, query)
  }

  function resetQuery(): void {
    setQuery(EMPTY_QUERY)
    void loadRows(1, category, EMPTY_QUERY)
  }

  function handlePageChange(target: number): void {
    void loadRows(Math.min(totalPages, Math.max(1, target)))
  }

  function switchCategory(next: Category): void {
    if (next === category) return
    setCategory(next)
  }

  return (
    <PageShell title="ADMIN · SCORE LOGS" subtitle="成绩日志查询">
      <div className="page-card" style={{ marginBottom: 16 }}>
        <div className="page-actions-row" style={{ marginTop: 0 }}>
          <button
            className={`page-btn${category === 'non-bingo' ? ' primary' : ''}`}
            type="button"
            onClick={() => switchCategory('non-bingo')}
          >
            常规课题
          </button>
          <button
            className={`page-btn${category === 'bingo' ? ' primary' : ''}`}
            type="button"
            onClick={() => switchCategory('bingo')}
          >
            Bingo课题
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>课题ID</span>
            <input
              className="page-input"
              style={{ marginTop: 0 }}
              placeholder="例如 12"
              value={query.courseId}
              onChange={(e) => updateQuery('courseId', e.target.value)}
            />
          </label>
          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>用户ID</span>
            <input
              className="page-input"
              style={{ marginTop: 0 }}
              placeholder="例如 1001"
              value={query.identityId}
              onChange={(e) => updateQuery('identityId', e.target.value)}
            />
          </label>
          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>题目ID</span>
            <input
              className="page-input"
              style={{ marginTop: 0 }}
              placeholder="Bingo可用，例如 7"
              value={query.issueId}
              onChange={(e) => updateQuery('issueId', e.target.value)}
            />
          </label>
          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>评分状态</span>
            <select
              className="page-select"
              style={{ width: '100%' }}
              value={query.isScored}
              onChange={(e) => updateQuery('isScored', e.target.value)}
            >
              <option value="">全部</option>
              <option value="true">已评分</option>
              <option value="false">未评分</option>
            </select>
          </label>
        </div>

        <div className="page-actions-row" style={{ marginBottom: 0 }}>
          <button className="page-btn primary" type="button" disabled={loading} onClick={handleSearch}>
            {loading ? '查询中…' : '查询'}
          </button>
          <button className="page-btn" type="button" disabled={loading} onClick={resetQuery}>
            重置
          </button>
        </div>
      </div>

      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}

      {!loading && !error && (
        <div className="page-card" style={{ overflowX: 'auto' }}>
          <table className="page-table">
            <thead>
              <tr>
                <th>成绩ID</th>
                <th>课题ID</th>
                <th>课题名称</th>
                <th>题目ID</th>
                <th>用户ID</th>
                <th>用户名</th>
                <th>上传时间</th>
                <th>图片</th>
                <th>分数</th>
                <th>状态</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && (
                <tr>
                  <td colSpan={11} className="meta" style={{ textAlign: 'center', padding: '18px 8px' }}>
                    暂无记录
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const imageUrl = getImageUrl(row.image)
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.course?.id || '-'}</td>
                    <td>{row.course?.title || '-'}</td>
                    <td>{row.issueId ?? '-'}</td>
                    <td>{row.identity?.id || '-'}</td>
                    <td>{row.identity?.account || '-'}</td>
                    <td>{formatDateTime(row.uploadTime)}</td>
                    <td>
                      {imageUrl ? (
                        <img
                          loading="lazy"
                          src={imageUrl}
                          alt="成绩图片"
                          onClick={() => setPreview(imageUrl)}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid rgba(34, 211, 238, 0.35)',
                            cursor: 'zoom-in',
                          }}
                        />
                      ) : '-'}
                    </td>
                    <td>{row.score ?? '-'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          minWidth: 56,
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                          color: row.isScored ? '#bbf7d0' : '#fde68a',
                          background: row.isScored ? 'rgba(22, 163, 74, 0.22)' : 'rgba(217, 119, 6, 0.2)',
                          border: `1px solid ${row.isScored ? 'rgba(74, 222, 128, 0.5)' : 'rgba(251, 191, 36, 0.45)'}`,
                        }}
                      >
                        {row.isScored ? '已评分' : '未评分'}
                      </span>
                    </td>
                    <td>
                      <p
                        title={row.remark || '-'}
                        style={{ maxWidth: 280, margin: '0 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {row.remark || '-'}
                      </p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="page-pager">
        <button className="page-btn" type="button" disabled={loading || page <= 1} onClick={() => handlePageChange(1)}>
          首页
        </button>
        <button className="page-btn" type="button" disabled={loading || page <= 1} onClick={() => handlePageChange(page - 1)}>
          上一页
        </button>
        <span>{page} / {totalPages}（共 {total} 条）</span>
        <button
          className="page-btn"
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => handlePageChange(page + 1)}
        >
          下一页
        </button>
        <button
          className="page-btn"
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          尾页
        </button>
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 6, 23, 0.72)',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(900px, 96vw)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}
          >
            <button className="page-btn" type="button" onClick={() => setPreview(null)}>关闭</button>
            <img
              src={preview}
              alt="图片预览"
              style={{ width: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: 10 }}
            />
          </div>
        </div>
      )}
    </PageShell>
  )
}
