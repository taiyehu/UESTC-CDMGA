import { Fragment, useEffect, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

type RankSubmission = {
  scoreId?: number
  courseId?: number
  courseTitle?: string | null
  image?: string | null
  displayScore?: number
  displayScoreText?: string | null
  uploadTime?: string
}

type RankRow = {
  identityId: number
  account?: string
  avatar?: string | null
  description?: string | null
  totalScore?: number
  totalScoreText?: string | null
  submissions?: RankSubmission[]
}

const PAGE_SIZE = 10
const AVATAR_FALLBACK = '/club-logo.jpg'

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

/** Same thumbnail strategy as the Vue mediaThumbnail helper. */
function mediaThumbnailUrl(path: string, size: number): string {
  if (!path || !/^\/(?:images|scores|avatars)\/.+\.(?:jpe?g|png)$/i.test(path)) return path
  return `/api/media/thumb?path=${encodeURIComponent(path)}&size=${size}`
}

function restoreOriginalImage(event: SyntheticEvent<HTMLImageElement>, originalUrl: string) {
  if (!originalUrl) return
  const image = event.currentTarget
  if (image.src !== new URL(originalUrl, window.location.href).href) image.src = originalUrl
}

function paginationWindow(total: number, current: number): number[] {
  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + windowSize - 1)
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export default function ContestRankingPage() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<RankRow[]>([])
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/rank/board', { params: { category: 'contest', mode: 'history' } })
        if (cancelled) return
        const data: RankRow[] = Array.isArray(res.data?.data) ? (res.data.data as RankRow[]) : []
        setRows([...data].sort((a, b) => Number(b.totalScore ?? 0) - Number(a.totalScore ?? 0)))
        setPage(1)
        setExpanded([])
      } catch {
        if (!cancelled) setError('获取排行榜失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const visiblePages = useMemo(() => paginationWindow(totalPages, page), [totalPages, page])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page])

  const rankByIdentityId = useMemo(() => {
    const rankMap: Record<string, number> = {}
    let lastScore: number | null = null
    let currentRank = 0
    rows.forEach((row, index) => {
      const score = Number(row.totalScore ?? 0)
      if (lastScore === null || Math.abs(score - lastScore) > 1e-9) {
        currentRank = index + 1
        lastScore = score
      }
      rankMap[String(row.identityId)] = currentRank
    })
    return rankMap
  }, [rows])

  function goPage(nextPage: number) {
    setPage(Math.min(totalPages, Math.max(1, nextPage)))
  }

  function toggleExpanded(identityId: number) {
    const key = String(identityId)
    setExpanded((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  return (
    <PageShell title="CONTEST RANKING" subtitle="比赛排行榜（总计）">
      <div className="page-card">
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>比赛排行榜（总计）</h2>

        {loading ? (
          <p className="meta">载入中…</p>
        ) : error ? (
          <p role="alert" className="meta" style={{ color: '#FF8FA3' }}>{error}</p>
        ) : !rows.length ? (
          <p className="meta">暂无比赛成绩</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="page-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>展开</th>
                    <th style={{ textAlign: 'center' }}>排名</th>
                    <th style={{ textAlign: 'center' }}>头像</th>
                    <th style={{ textAlign: 'center' }}>用户名</th>
                    <th style={{ textAlign: 'center' }}>总分</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => {
                    const key = String(row.identityId)
                    const isExpanded = expanded.includes(key)
                    const avatar = getImageUrl(row.avatar) || AVATAR_FALLBACK
                    return (
                      <Fragment key={key}>
                        <tr>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="page-btn small"
                              onClick={() => toggleExpanded(row.identityId)}
                            >
                              {isExpanded ? '收起' : '展开'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>{rankByIdentityId[key] || 0}</td>
                          <td>
                            <button
                              type="button"
                              title={row.description || '暂无个性签名 · 点击查看玩家信息'}
                              aria-label={`查看${row.account || ''}的玩家信息`}
                              onClick={() => navigate(`/profile/${row.identityId}`)}
                              style={{ display: 'block', margin: '0 auto', padding: 0, border: 0, background: 'none', cursor: 'pointer' }}
                            >
                              <img
                                loading="lazy"
                                src={mediaThumbnailUrl(avatar, 96)}
                                onError={(e) => restoreOriginalImage(e, avatar)}
                                alt="头像"
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1px solid rgba(77,225,255,.45)',
                                }}
                              />
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>{row.account}</td>
                          <td style={{ textAlign: 'center' }} className="mono">
                            {row.totalScoreText || (row.totalScore ?? 0)}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} style={{ padding: 12, background: 'rgba(8,18,30,.55)' }}>
                              {row.submissions?.length ? (
                                <div
                                  className="page-grid"
                                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
                                >
                                  {row.submissions.map((submission, index) => {
                                    const imageUrl = getImageUrl(submission.image)
                                    return (
                                      <div
                                        className="page-card"
                                        key={submission.scoreId ?? index}
                                        style={{ padding: 10, textAlign: 'center' }}
                                      >
                                        <p className="card-k">{submission.courseTitle || `第${index + 1}项`}</p>
                                        <p className="mono" style={{ margin: '6px 0', color: '#FF5FA2' }}>
                                          {submission.displayScoreText || submission.displayScore || '—'}
                                        </p>
                                        {imageUrl ? (
                                          <img
                                            loading="lazy"
                                            src={mediaThumbnailUrl(imageUrl, 160)}
                                            onError={(e) => restoreOriginalImage(e, imageUrl)}
                                            alt="课题图片"
                                            onClick={() => setPreviewImage(imageUrl)}
                                            style={{
                                              width: 96,
                                              height: 96,
                                              objectFit: 'cover',
                                              borderRadius: 8,
                                              border: '1px solid rgba(255,255,255,.5)',
                                              cursor: 'zoom-in',
                                            }}
                                          />
                                        ) : (
                                          <p className="meta">无图片</p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <p className="meta" style={{ textAlign: 'center', margin: 0 }}>无比赛成绩</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="page-pager">
              <button type="button" className="page-btn" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                上一页
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={pageNumber === page ? 'page-btn small primary' : 'page-btn small'}
                  onClick={() => goPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                下一页
              </button>
              <span>第 {page} / {totalPages} 页</span>
            </div>
          </>
        )}
      </div>

      <Link
        className="page-btn"
        to="/ranking"
        style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 30 }}
      >
        查看课题排行榜
      </Link>

      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          onClick={() => setPreviewImage('')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0,0,0,.7)',
          }}
        >
          <button
            type="button"
            className="page-btn small"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewImage('')
            }}
            style={{ position: 'absolute', right: 16, top: 16 }}
          >
            关闭
          </button>
          <img
            src={previewImage}
            alt="预览图片"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '80vh',
              maxWidth: '90vw',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.3)',
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </PageShell>
  )
}
