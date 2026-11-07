import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchActivityById, fetchAssocCourses, type Activity, type Course } from '../api'

function fmt(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN')
}

export default function ActivityDetailPage() {
  const { id } = useParams()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const activityId = Number(id)
    if (!Number.isFinite(activityId)) { setError('活动编号无效'); setLoading(false); return }
    Promise.allSettled([fetchActivityById(activityId), fetchAssocCourses(activityId)])
      .then(([act, assoc]) => {
        if (act.status === 'fulfilled') setActivity(act.value)
        if (assoc.status === 'fulfilled') setCourses(assoc.value)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageShell title="ACTIVITY DETAIL" subtitle={activity?.name}>
      <div className="page-actions-row"><Link className="page-btn" to="/activity">← 返回活动</Link></div>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !activity && <div className="page-card">活动不存在</div>}
      {activity && (
        <div className="detail-grid">
          <div className="page-card detail-cover" style={{ backgroundImage: `url(${activity.activityBanner || '/activity-banner.jpg'})` }} />
          <div className="page-card">
            <div className="card-k">EVENT</div>
            <h2>{activity.name}</h2>
            <p className="meta">{fmt(activity.startTime)} — {fmt(activity.endTime)}</p>
            <p className="desc">{activity.description || '暂无活动描述'}</p>
            <div className="page-actions-row"><Link className="page-btn primary" to={`/sign/${activity.id}`}>活动签到</Link><Link className="page-btn" to={`/activity/${activity.id}/sign-display`}>签到展示</Link></div>
          </div>
        </div>
      )}
      {courses.length > 0 && (
        <section className="section-block">
          <h2>关联课题</h2>
          <div className="page-grid">
            {courses.map((course) => (
              <Link className="page-card" key={course.id} to={`/task/${course.id}`}>
                <div className="card-k">{String(course.category || '课题').toUpperCase()}</div>
                <h3>{course.title}</h3>
                <p className="meta">{fmt(course.startTime)} — {fmt(course.endTime)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}
