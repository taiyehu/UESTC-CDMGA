import { useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type Category = 'ranking' | 'contest'

type CourseRow = {
  id: number
  title: string
  category?: string | null
}

type ConfigRow = {
  id: number
  category?: string | null
  courseId?: number
  courseTitle?: string | null
  countingRules?: number | null
}

function matchesCategory(value: unknown, category: Category): boolean {
  return String(value ?? '').toLowerCase() === category
}

export default function AdminRankConfigsPage() {
  const [category, setCategory] = useState<Category>('ranking')
  const [courseId, setCourseId] = useState(0)
  const [countingRules, setCountingRules] = useState(0)
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setCourseId(0)

    Promise.all([api.get('/course/'), api.get('/rank/configs')])
      .then(([courseRes, configRes]) => {
        if (cancelled) return
        const courseList: CourseRow[] = Array.isArray(courseRes.data) ? courseRes.data : (courseRes.data?.data ?? [])
        setCourses((Array.isArray(courseList) ? courseList : []).filter((row) => matchesCategory(row.category, category)))

        const configData = configRes.data?.data ?? configRes.data ?? []
        setConfigs((Array.isArray(configData) ? configData : []).filter((row: ConfigRow) => matchesCategory(row.category, category)))
      })
      .catch((e) => {
        if (cancelled) return
        setCourses([])
        setConfigs([])
        setError(e instanceof Error ? `获取课题或配置失败：${e.message}` : '获取课题或配置失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [category])

  async function loadConfigs(): Promise<void> {
    const res = await api.get('/rank/configs')
    const configData = res.data?.data ?? res.data ?? []
    setConfigs((Array.isArray(configData) ? configData : []).filter((row: ConfigRow) => matchesCategory(row.category, category)))
  }

  async function saveConfig(): Promise<void> {
    setNotice(null)
    if (!courseId) {
      setNotice({ type: 'error', text: '请选择课题' })
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/rank/config', { courseId, countingRules })
      if (res.data?.code !== undefined && res.data.code !== 0) {
        throw new Error(res.data?.message || '保存失败')
      }
      setNotice({ type: 'ok', text: '保存成功' })
      await loadConfigs()
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setNotice({ type: 'error', text: message || (e instanceof Error ? e.message : '保存失败') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title="ADMIN · RANK CONFIG" subtitle="显示分 = 原始 score + counting_rules">
      {notice && <div className={`page-card${notice.type === 'error' ? ' error' : ''}`}>{notice.text}</div>}
      {error && <div className="page-card error">{error}</div>}

      <div className="page-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>类别</span>
            <select
              className="page-select"
              style={{ width: '100%' }}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="ranking">ranking</option>
              <option value="contest">contest</option>
            </select>
          </label>

          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>课题</span>
            <select
              className="page-select"
              style={{ width: '100%' }}
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
            >
              <option value={0}>请选择课题</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="meta" style={{ display: 'block', marginBottom: 6 }}>counting_rules</span>
            <input
              className="page-input"
              style={{ marginTop: 0 }}
              type="number"
              step="0.01"
              value={countingRules}
              onChange={(e) => setCountingRules(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="page-actions-row" style={{ marginBottom: 0 }}>
          <button className="page-btn primary" type="button" disabled={saving || loading} onClick={() => void saveConfig()}>
            {saving ? '保存中…' : '保存配置'}
          </button>
          <button className="page-btn" type="button" disabled={saving || loading} onClick={() => void loadConfigs()}>
            刷新配置
          </button>
        </div>
      </div>

      {loading && <div className="page-card">载入中…</div>}

      {!loading && (
        <div className="page-card" style={{ overflowX: 'auto' }}>
          <table className="page-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>类别</th>
                <th>课题</th>
                <th>counting_rules</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.category}</td>
                  <td>{row.courseTitle || '-'}</td>
                  <td className="mono">{row.countingRules ?? '-'}</td>
                </tr>
              ))}
              {!configs.length && (
                <tr>
                  <td colSpan={4} className="meta" style={{ textAlign: 'center', padding: '24px 8px' }}>
                    暂无配置
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
