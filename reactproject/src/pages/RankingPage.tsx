import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api, fetchRanking, type RankRow } from '../api'

const PAGE_SIZE = 10

type BoardRow = RankRow & { totalScoreText?: string; displayRank?: number }

function currentSeasonStartYear(): number {
  const now = new Date()
  return now.getMonth() + 1 >= 10 ? now.getFullYear() : now.getFullYear() - 1
}

function imageUrl(path?: string | null) {
  if (!path) return '/club-logo.jpg'
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path
  return `/${path}`
}

function withRanks(rows: BoardRow[]): BoardRow[] {
  let previous: number | null = null
  let rank = 0
  return rows.map((row, index) => {
    const score = Number(row.totalScore ?? 0)
    if (previous === null || Math.abs(score - previous) > 1e-9) rank = index + 1
    previous = score
    return { ...row, displayRank: rank }
  })
}

function Pager({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null
  const start = Math.max(1, Math.min(page - 2, total - 4))
  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => start + i).filter((n) => n <= total)
  return <div className="page-pager"><button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</button>{pages.map((n) => <button key={n} className={n === page ? 'page-btn primary' : 'page-btn'} onClick={() => onChange(n)}>{n}</button>)}<button className="page-btn" disabled={page >= total} onClick={() => onChange(page + 1)}>下一页</button></div>
}

export default function RankingPage() {
  const [year, setYear] = useState(currentSeasonStartYear())
  const [rows, setRows] = useState<RankRow[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState<'contest' | 'ranking'>('contest')
  const [boardRows, setBoardRows] = useState<BoardRow[]>([])
  const [boardPage, setBoardPage] = useState(1)
  const [boardLoading, setBoardLoading] = useState(true)
  const [boardError, setBoardError] = useState('')

  const seasons = useMemo(() => {
    const latest = Math.max(2025, currentSeasonStartYear())
    return Array.from({ length: latest - 2025 + 1 }, (_, i) => latest - i)
  }, [])

  useEffect(() => {
    setLoading(true); setError('')
    fetchRanking(year)
      .then((data) => { setRows(withRanks([...data].sort((a, b) => Number(b.totalScore ?? 0) - Number(a.totalScore ?? 0)))); setPage(1) })
      .catch((e) => setError(e instanceof Error ? e.message : '获取排行榜失败'))
      .finally(() => setLoading(false))
  }, [year])

  useEffect(() => {
    let cancelled = false
    setBoardLoading(true); setBoardError('')
    api.get('/rank/board', { params: { category, mode: category === 'contest' ? 'history' : 'active' } })
      .then((res) => {
        if (cancelled) return
        const data = Array.isArray(res.data?.data) ? res.data.data as BoardRow[] : []
        setBoardRows(withRanks([...data].sort((a, b) => Number(b.totalScore ?? 0) - Number(a.totalScore ?? 0))))
        setBoardPage(1)
      })
      .catch((e) => { if (!cancelled) setBoardError(e instanceof Error ? e.message : '获取排行榜失败') })
      .finally(() => { if (!cancelled) setBoardLoading(false) })
    return () => { cancelled = true }
  }, [category])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rankById = useMemo(() => new Map(rows.map((row, i) => { let rank = i + 1; while (rank > 1 && Number(rows[rank - 2].totalScore) === Number(row.totalScore)) rank -= 1; return [row.identityId, rank] })), [rows])
  const boardTotalPages = Math.max(1, Math.ceil(boardRows.length / PAGE_SIZE))
  const pagedBoard = boardRows.slice((boardPage - 1) * PAGE_SIZE, boardPage * PAGE_SIZE)

  return (
    <PageShell title="RANK" subtitle="课题总分排行榜 · 打榜 / 比赛">
      <div className="ranking-layout">
        <section className="page-card ranking-panel">
          <h2>课题总分排行榜</h2>
          <div className="ranking-season"><label htmlFor="ranking-season">排行榜时段</label><select id="ranking-season" className="page-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>{seasons.map((start) => <option key={start} value={start}>{start}.10 - {start + 1}.9</option>)}</select></div>
          {loading && <p className="meta">排行榜加载中...</p>}
          {error && <p className="meta" style={{ color: '#FF8FA3' }}>{error}</p>}
          {!loading && !error && <div style={{ overflowX: 'auto' }}><table className="page-table"><thead><tr><th>排名</th><th>用户</th><th>分数</th></tr></thead><tbody>{paged.map((row) => <tr key={row.identityId}><td className="mono" style={{ textAlign: 'center', color: '#F5D0FE' }}>{rankById.get(row.identityId) ?? '-'}</td><td><Link className="rank-user" to={`/profile/${row.identityId}`}><img loading="lazy" src={imageUrl(row.avatar)} alt={`${row.account}的头像`} /><span>{row.account}</span></Link></td><td className="mono" style={{ textAlign: 'center' }}>{Number(row.totalScore ?? 0).toFixed(2)}</td></tr>)}</tbody></table></div>}
          {!loading && !error && !rows.length && <p className="meta">暂无榜单数据</p>}
          <Pager page={page} total={totalPages} onChange={setPage} />
        </section>

        <section className="page-card ranking-panel">
          <h2>{category === 'contest' ? '比赛排行榜（总计）' : '打榜排行榜（进行中）'}</h2>
          <div className="page-actions-row" style={{ justifyContent: 'center' }}><button className={category === 'contest' ? 'page-btn primary' : 'page-btn'} onClick={() => setCategory('contest')}>比赛排行榜</button><button className={category === 'ranking' ? 'page-btn primary' : 'page-btn'} onClick={() => setCategory('ranking')}>打榜排行榜</button></div>
          {boardLoading && <p className="meta">排行榜加载中...</p>}
          {boardError && <p className="meta" style={{ color: '#FF8FA3' }}>{boardError}</p>}
          {!boardLoading && !boardError && <div style={{ overflowX: 'auto' }}><table className="page-table"><thead><tr><th>排名</th><th>用户</th><th>分数</th></tr></thead><tbody>{pagedBoard.map((row) => <tr key={row.identityId}><td className="mono" style={{ textAlign: 'center', color: '#F5D0FE' }}>{row.displayRank}</td><td><Link className="rank-user" to={`/profile/${row.identityId}`}><img loading="lazy" src={imageUrl(row.avatar)} alt={`${row.account}的头像`} /><span>{row.account}</span></Link></td><td className="mono" style={{ textAlign: 'center' }}>{row.totalScoreText || row.totalScore}</td></tr>)}</tbody></table></div>}
          {!boardLoading && !boardError && !boardRows.length && <p className="meta">暂无榜单数据</p>}
          <Pager page={boardPage} total={boardTotalPages} onChange={setBoardPage} />
          <div style={{ textAlign: 'center', marginTop: 14 }}><Link className="page-btn" to={category === 'contest' ? '/contest-ranking' : '/ranking-new'}>查看详细榜单 →</Link></div>
        </section>
      </div>
    </PageShell>
  )
}
