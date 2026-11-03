import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchCourseCatalog, fetchCourses, type Course } from '../api'

const PAGE_SIZE = 6

function fmt(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function TaskListPage({ awardMode = false }: { awardMode?: boolean }) {
  const [items, setItems] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false;
    (awardMode ? fetchCourseCatalog() : fetchCourses())
      .then((data) => {
        if (cancelled) return
        setItems([...data].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()))
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [awardMode])

  const filtered = useMemo(
    () => items.filter((c) => (String(c.category || '').toLowerCase() === 'award') === awardMode),
    [items, awardMode],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <PageShell title={awardMode ? 'AWARDS' : 'TASK'} subtitle={awardMode ? '用积分兑换的奖品列表' : '社团正在进行的课题'}>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !filtered.length && <div className="page-card">暂无{awardMode ? '奖品' : '课题'}</div>}
      <div className="page-grid">
        {pageItems.map((course) => (
          <Link className="page-card course-card" key={course.id} to={`/task/${course.id}`}>
            <div className="thumb" style={{ backgroundImage: `url(${course.image || '/maimai-og.jpg'})` }} />
            <div className="card-k">{String(course.category || '课题').toUpperCase()}</div>
            <h3>{course.title}</h3>
            <p className="meta">{fmt(course.startTime)} — {fmt(course.endTime)}</p>
            <p className="desc">{course.description || '暂无描述'}</p>
            <span className="page-btn small">{awardMode ? '去兑换' : '进入课题'} →</span>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="page-pager">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</button>
          <span>{page} / {totalPages}</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</button>
        </div>
      )}
    </PageShell>
  )
}
