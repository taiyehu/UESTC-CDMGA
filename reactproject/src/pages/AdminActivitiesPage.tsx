import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api, type Activity, type Course } from '../api'

const PAGE_SIZE = 5

type AdminActivity = Activity & { activityFile?: string | null }
type SignCourse = Course & { isDeleted?: boolean | null }
type Status = { type: 'ok' | 'error'; text: string }

const centerStyle: CSSProperties = { textAlign: 'center' }

function resolveUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN')
}

function errorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string } } } | null)?.response
  if (response?.data?.message) return response.data.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [signCourses, setSignCourses] = useState<SignCourse[]>([])
  const [selectedSignCourse, setSelectedSignCourse] = useState<Record<number, number | undefined>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [jumpPage, setJumpPage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Status | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [associatingId, setAssociatingId] = useState<number | null>(null)

  async function loadActivities() {
    try {
      const res = await api.get('/activity/list')
      const list = Array.isArray(res.data?.list) ? (res.data.list as AdminActivity[]) : []
      setActivities(list)
      setError('')
      setCurrentPage(1)
    } catch (err) {
      setActivities([])
      setError(errorMessage(err, '获取活动信息失败'))
    } finally {
      setLoading(false)
    }
  }

  async function loadSignCourses() {
    try {
      const res = await api.get('/course/')
      const list = Array.isArray(res.data) ? (res.data as SignCourse[]) : []
      setSignCourses(list.filter((course) => String(course.category ?? '').trim().toLowerCase() === 'sign' && !course.isDeleted))
    } catch {
      setStatus({ type: 'error', text: '获取签到课题失败' })
    }
  }

  useEffect(() => {
    // Load once on mount; reloads happen explicitly after mutations.
    void loadActivities()
    void loadSignCourses()
  }, [])

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))
  const page = Math.min(totalPages, Math.max(1, currentPage))
  const pagedActivities = activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goTo(target: number) {
    const safe = Number.isFinite(target) ? target : 1
    setCurrentPage(Math.min(totalPages, Math.max(1, safe)))
    setJumpPage('')
  }

  function jumpToPage() {
    const target = Number(jumpPage)
    if (!Number.isFinite(target)) return
    goTo(target)
  }

  async function linkSignCourse(activityId: number) {
    const courseId = selectedSignCourse[activityId]
    if (!courseId) {
      setStatus({ type: 'error', text: '请先选择签到课题' })
      return
    }
    setAssociatingId(activityId)
    setStatus(null)
    try {
      await api.post('/activity/add-assoc-course', {
        activityId,
        courseId,
        rules: '现场扫码签到自动获得 10 分',
      })
      setStatus({ type: 'ok', text: '签到课题已关联' })
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err, '关联失败，请检查是否已关联其他签到课题') })
    } finally {
      setAssociatingId(null)
    }
  }

  async function deleteActivity(activityId: number) {
    if (!window.confirm('确定删除该活动吗？')) return
    setDeletingId(activityId)
    setStatus(null)
    try {
      await api.delete(`/activity/${activityId}`)
      setStatus({ type: 'ok', text: '活动删除成功' })
      setLoading(true)
      await loadActivities()
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err, '删除失败') })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageShell title="ADMIN · ACTIVITIES" subtitle="活动管理与签到课题关联">
      {status && (
        <p className="meta" style={{ marginBottom: 12, color: status.type === 'error' ? '#FF8FA3' : '#7EF0C8' }}>
          {status.text}
        </p>
      )}

      {loading && <div className="page-card">载入中…</div>}

      {!loading && error && (
        <div className="page-card error">
          <p style={{ margin: 0 }}>{error}</p>
          <div className="page-actions-row" style={{ marginBottom: 0 }}>
            <button className="page-btn small" type="button" onClick={() => { setLoading(true); void loadActivities() }}>重试</button>
          </div>
        </div>
      )}

      {!loading && !error && !activities.length && <div className="page-card">暂无活动</div>}

      {!loading && !error && activities.length > 0 && (
        <>
          <div className="page-card" style={{ overflowX: 'auto', padding: 12 }}>
            <table className="page-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={centerStyle}>活动ID</th>
                  <th style={centerStyle}>活动名称</th>
                  <th style={centerStyle}>开始时间</th>
                  <th style={centerStyle}>结束时间</th>
                  <th style={centerStyle}>描述</th>
                  <th style={centerStyle}>宣传图</th>
                  <th style={centerStyle}>活动文件</th>
                  <th style={centerStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td style={centerStyle}><span className="mono">{activity.id}</span></td>
                    <td style={centerStyle}>{activity.name}</td>
                    <td style={centerStyle}>{formatDateTime(activity.startTime)}</td>
                    <td style={centerStyle}>{formatDateTime(activity.endTime)}</td>
                    <td style={centerStyle} title={activity.description || undefined}>{activity.description || '-'}</td>
                    <td style={centerStyle}>
                      {activity.activityBanner ? (
                        <a href={resolveUrl(activity.activityBanner)} target="_blank" rel="noreferrer">查看</a>
                      ) : '-'}
                    </td>
                    <td style={centerStyle}>
                      {activity.activityFile ? (
                        <a href={resolveUrl(activity.activityFile)} target="_blank" rel="noreferrer">下载</a>
                      ) : '-'}
                    </td>
                    <td style={centerStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <select
                          className="page-select"
                          style={{ maxWidth: 150 }}
                          value={selectedSignCourse[activity.id] ?? ''}
                          onChange={(event) => {
                            const value = event.target.value
                            setSelectedSignCourse((prev) => ({
                              ...prev,
                              [activity.id]: value ? Number(value) : undefined,
                            }))
                          }}
                        >
                          <option value="">选择签到课题</option>
                          {signCourses.map((course) => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                        </select>
                        <button
                          className="page-btn small"
                          type="button"
                          disabled={associatingId === activity.id}
                          onClick={() => { void linkSignCourse(activity.id) }}
                        >
                          {associatingId === activity.id ? '关联中…' : '关联'}
                        </button>
                        <Link className="page-btn small" to={`/activity/${activity.id}`}>活动页</Link>
                        <button
                          className="page-btn small"
                          type="button"
                          style={{ color: '#FF8FA3', borderColor: 'rgba(255,143,163,.5)' }}
                          disabled={deletingId === activity.id}
                          onClick={() => { void deleteActivity(activity.id) }}
                        >
                          {deletingId === activity.id ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="page-pager">
            <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => goTo(1)}>首页</button>
            <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => goTo(page - 1)}>上一页</button>
            <span>{page} / {totalPages}</span>
            <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>下一页</button>
            <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => goTo(totalPages)}>尾页</button>
            <input
              className="page-select"
              type="number"
              min={1}
              max={totalPages}
              placeholder="页码"
              value={jumpPage}
              style={{ width: 72 }}
              onChange={(event) => setJumpPage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  jumpToPage()
                }
              }}
            />
            <button className="page-btn small" type="button" onClick={jumpToPage}>跳转</button>
          </div>
        </>
      )}
    </PageShell>
  )
}
