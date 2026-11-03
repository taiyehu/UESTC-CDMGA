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
  rawScore?: number
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

type CourseOption = {
  id: number
  title: string
  category?: string | null
  startTime?: string
  endTime?: string
  description?: string | null
  image?: string | null
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

/** Fall back to the original asset when the server thumbnail cannot be produced. */
function restoreOriginalImage(event: SyntheticEvent<HTMLImageElement>, originalUrl: string) {
  if (!originalUrl) return
  const image = event.currentTarget
  if (image.src !== new URL(originalUrl, window.location.href).href) image.src = originalUrl
}

function formatTime(time?: string): string {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '-'
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function paginationWindow(total: number, current: number): number[] {
  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + windowSize - 1)
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export default function RankingNewPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<'active' | 'history'>('active')
  const [category, setCategory] = useState<'ranking' | 'contest'>('ranking')
  const [rows, setRows] = useState<RankRow[]>([])
  const [historyCourses, setHistoryCourses] = useState<CourseOption[]>([])
  const [activeCourses, setActiveCourses] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState(0)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [courseError, setCourseError] = useState('')
  const [previewImage, setPreviewImage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const params: Record<string, string | number> = { category, mode }
        if (mode === 'history' && selectedCourseId > 0) params.courseId = selectedCourseId
        const res = await api.get('/rank/board', { params })
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
  }, [mode, category, selectedCourseId])

  useEffect(() => {
    if (mode !== 'history') {
      setHistoryCourses([])
      return
    }
    let cancelled = false
    setCourseError('')
    api.get('/rank/courses', { params: { category } })
      .then((res) => {
        if (cancelled) return
        const data = res.data?.data
        setHistoryCourses(Array.isArray(data) ? (data as CourseOption[]) : [])
      })
      .catch(() => {
        if (!cancelled) setCourseError('获取历史课题失败')
      })
    return () => {
      cancelled = true
    }
  }, [mode, category])

  useEffect(() => {
    if (!(mode === 'active' && category === 'ranking')) {
      setActiveCourses([])
      return
    }
    let cancelled = false
    setCourseError('')
    api.get('/course/availablecourse-containing', { params: { excludePrefix: 'ranking', page: 0, size: 100 } })
      .then((res) => {
        if (cancelled) return
        const list = res.data?.list
        setActiveCourses(Array.isArray(list) ? (list as CourseOption[]) : [])
      })
      .catch(() => {
        if (!cancelled) setCourseError('获取进行中 ranking 课题失败')
      })
    return () => {
      cancelled = true
    }
  }, [mode, category])

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

  function switchMode(nextMode: 'active' | 'history') {
    setMode(nextMode)
    setSelectedCourseId(0)
    setCourseError('')
  }

  function switchCategory(nextCategory: 'ranking' | 'contest') {
    setCategory(nextCategory)
    setSelectedCourseId(0)
    setCourseError('')
  }

  function goPage(nextPage: number) {
    setPage(Math.min(totalPages, Math.max(1, nextPage)))
  }

  function toggleExpanded(identityId: number) {
    const key = String(identityId)
    setExpanded((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  return (
    <PageShell title="RANKING" subtitle="进行中 / 历史 · 打榜排行 / 比赛成绩">
      <div className="page-card">
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>一⭐起⭐打⭐榜</h2>

        <div className="page-actions-row">
          <button
            type="button"
            className={mode === 'active' ? 'page-btn primary' : 'page-btn'}
            onClick={() => switchMode('active')}
          >
            进行中
          </button>
          <button
            type="button"
            className={mode === 'history' ? 'page-btn primary' : 'page-btn'}
            onClick={() => switchMode('history')}
          >
            历史
          </button>
        </div>

        <div className="page-actions-row">
          <button
            type="button"
            className={category === 'ranking' ? 'page-btn primary' : 'page-btn'}
            onClick={() => switchCategory('ranking')}
          >
            打榜排行
          </button>
          <button
            type="button"
            className={category === 'contest' ? 'page-btn primary' : 'page-btn'}
            onClick={() => switchCategory('contest')}
          >
            比赛成绩记录
          </button>
        </div>

        {mode === 'history' && (
          <div className="page-actions-row" style={{ flexWrap: 'wrap' }}>
            <span className="meta">历史课题：</span>
            <select
              className="page-select"
              style={{ minWidth: 240, flex: 1 }}
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            >
              <option value={0}>全部课题</option>
              {historyCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}（{formatTime(course.startTime)} - {formatTime(course.endTime)}）
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="meta">
          {mode === 'active'
            ? '当前排行榜仅统计在进行中的课题成绩。'
            : '历史模式可查看该类别全部课题，并支持按课题筛选。'}
        </p>

        {courseError && <p role="status" className="meta" style={{ color: '#FF8FA3' }}>{courseError}</p>}

        {mode === 'active' && category === 'ranking' && (
          <div className="section-block">
            <h2>进行中的 ranking 课题</h2>
            {activeCourses.length ? (
              <div className="page-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {activeCourses.map((course) => (
                  <article className="page-card" key={course.id} style={{ padding: 12 }}>
                    {course.image && (
                      <img
                        loading="lazy"
                        src={mediaThumbnailUrl(getImageUrl(course.image), 960)}
                        onError={(e) => restoreOriginalImage(e, getImageUrl(course.image))}
                        alt={course.title}
                        style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, display: 'block' }}
                      />
                    )}
                    <h3 style={{ marginTop: 10 }}>{course.title}</h3>
                    <p className="desc">{course.description || '暂无描述'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="meta">当前没有进行中的 ranking 课题。</p>
            )}
          </div>
        )}

        {loading ? (
          <p className="meta" style={{ marginTop: 16 }}>载入中…</p>
        ) : error ? (
          <p role="alert" className="meta" style={{ marginTop: 16, color: '#FF8FA3' }}>{error}</p>
        ) : !rows.length ? (
          <p className="meta" style={{ marginTop: 16 }}>暂无排行数据</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
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
                                        <p className="card-k">{submission.courseTitle || '课题'}</p>
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
                                <p className="meta" style={{ textAlign: 'center', margin: 0 }}>无课题成绩</p>
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

      <div style={{ position: 'fixed', right: 20, bottom: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 30 }}>
        <Link className="page-btn" to="/ranking">回到常规课题排行榜</Link>
        <Link className="page-btn" to="/contest-ranking">查看旧版比赛榜</Link>
      </div>

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
