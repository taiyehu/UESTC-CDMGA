import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchRanking, type RankRow } from '../api'

export default function RankingPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [rows, setRows] = useState<RankRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchRanking(year)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <PageShell
      title="RANKING"
      subtitle="赛季总分榜"
      actions={
        <select className="page-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[0, 1, 2].map((offset) => {
            const y = new Date().getFullYear() - offset
            return <option key={y} value={y}>{y} 赛季</option>
          })}
        </select>
      }
    >
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !rows.length && <div className="page-card">本赛季暂无成绩</div>}
      {!!rows.length && (
        <div className="page-card">
          <table className="page-table">
            <thead><tr><th>#</th><th>社员</th><th>总分</th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.identityId}>
                  <td className={`rank rank-${index + 1}`}>{index + 1}</td>
                  <td><Link to={`/profile/${row.identityId}`}>{row.account || `社员 ${row.identityId}`}</Link></td>
                  <td className="mono">{Number(row.totalScore ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  )
}
