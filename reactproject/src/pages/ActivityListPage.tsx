import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchActivities, type Activity } from '../api'

function fmt(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityListPage() {
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActivities()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell title="ACTIVITY" subtitle="社团活动与现场">
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !items.length && <div className="page-card">暂无活动</div>}
      <div className="page-grid">
        {items.map((item) => (
          <Link className="page-card course-card" key={item.id} to={`/activity/${item.id}`}>
            <div className="thumb" style={{ backgroundImage: `url(${item.activityBanner || '/activity-banner.jpg'})` }} />
            <div className="card-k">EVENT</div>
            <h3>{item.name}</h3>
            <p className="meta">{fmt(item.startTime)} — {fmt(item.endTime)}</p>
            <p className="desc">{item.description || '暂无活动描述'}</p>
            <span className="page-btn small">查看活动 →</span>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
