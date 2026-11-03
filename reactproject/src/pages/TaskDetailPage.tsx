import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchCourseById, type Course } from '../api'

export default function TaskDetailPage() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const courseId = Number(id)
    if (!Number.isFinite(courseId)) { setError('课题编号无效'); setLoading(false); return }
    fetchCourseById(courseId)
      .then((data) => setCourse(data))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageShell title="TASK DETAIL" subtitle={course?.title}>
      <div className="page-actions-row"><Link className="page-btn" to="/task">← 返回课题</Link></div>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !course && <div className="page-card">课题不存在</div>}
      {course && (
        <div className="detail-grid">
          <div className="page-card detail-cover" style={{ backgroundImage: `url(${course.image || '/maimai-og.jpg'})` }} />
          <div className="page-card">
            <div className="card-k">{String(course.category || '课题').toUpperCase()}</div>
            <h2>{course.title}</h2>
            <p className="meta">{course.startTime} — {course.endTime}</p>
            <p className="desc">{course.description || '暂无课题描述'}</p>
            {course.award && <p className="meta">兑换积分：{course.award.cost ?? '-'} · 剩余 {course.award.remainingStock ?? 0}/{course.award.totalStock ?? 0}</p>}
            <div className="page-actions-row">
              {String(course.category || '').toLowerCase().includes('bingo') ? <Link className="page-btn primary" to={`/task/${course.id}/bingo/1`}>进入 Bingo 网格</Link> : null}
              <Link className="page-btn" to="/task">返回列表</Link>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
