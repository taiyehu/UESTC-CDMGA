import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

const PAGE_SIZE = 5

type CourseLite = { id: number; title?: string; category?: string | null }
type TipRow = { id: number; issueId: number; tip: string; teamId: number; teamName?: string; createdAt?: string }
type Notice = { type: 'ok' | 'error'; text: string }

function unwrap(res: any): any {
  const body = res?.data
  if (body && typeof body === 'object' && 'code' in body) return body.data ?? null
  return body ?? null
}

function listOf(res: any): any[] {
  const data = unwrap(res)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.items)) return data.items
  return []
}

function totalOf(res: any, fallback = 0): number {
  const data = unwrap(res)
  const total = Number(data?.total ?? data?.totalCount)
  return Number.isFinite(total) ? total : fallback
}

function errText(e: unknown, fallback: string): string {
  const err = e as any
  const message = err?.response?.data?.message || (e instanceof Error ? e.message : '')
  return typeof message === 'string' && message.trim() ? message : fallback
}

function isBingo(course: any): boolean {
  return String(course?.category || '').trim().toLowerCase() === 'bingo'
}

function mapTipRows(items: any[]): TipRow[] {
  const rows: TipRow[] = []
  for (const item of items) {
    const id = Number(item?.id)
    const issueId = Number(item?.issueId)
    if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(issueId) || issueId <= 0) continue
    rows.push({
      id,
      issueId,
      tip: String(item?.tip || ''),
      teamId: Number(item?.teamId || 0),
      teamName: String(item?.teamName || ''),
      createdAt: item?.createdAt ? String(item.createdAt) : undefined,
    })
  }
  return rows
}

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN')
}

function formatTeamMarker(teamId?: number, teamName?: string): string {
  const id = Number(teamId)
  if (Number.isFinite(id) && id > 0) return `#${id}`
  const matched = String(teamName || '').match(/(\d+)/)
  return matched ? `#${matched[1]}` : '-'
}

function resolveMatchedId(raw: string, options: number[]): { value?: number; ambiguous?: boolean } {
  const text = String(raw || '').trim()
  if (!text) return {}

  const direct = Number(text.replace(/^#/, ''))
  if (Number.isFinite(direct) && options.includes(direct)) return { value: direct }

  const matched = text.match(/(\d+)/)
  if (matched) {
    const num = Number(matched[1])
    if (Number.isFinite(num) && options.includes(num)) return { value: num }
  }

  const lower = text.toLowerCase()
  const candidates = options.filter((id) => `#${id}`.toLowerCase().includes(lower) || String(id).includes(lower))
  if (candidates.length === 1) return { value: candidates[0] }
  if (candidates.length > 1) return { ambiguous: true }
  return {}
}

async function fetchIssueIds(courseId: number): Promise<number[]> {
  try {
    const res = await api.get(`/issue/course/${courseId}`, { params: { page: 0, size: 25, unmasked: true } })
    const ids = listOf(res)
      .map((item: any) => Number(item?.issueId))
      .filter((id: number) => Number.isFinite(id) && id > 0)
    return Array.from(new Set<number>(ids)).sort((a, b) => a - b)
  } catch {
    return []
  }
}

async function fetchTeamIds(courseId: number): Promise<number[]> {
  const size = 50
  const teamSet = new Set<number>()
  const collect = (res: any) => {
    for (const row of listOf(res)) {
      const teamId = Number(row?.teamId)
      const members = Array.isArray(row?.members) ? row.members : []
      if (Number.isFinite(teamId) && teamId > 0 && members.length > 0) teamSet.add(teamId)
    }
  }
  try {
    const first = await api.get(`/team/course/${courseId}`, { params: { page: 0, size } })
    collect(first)
    const total = totalOf(first)
    const pages = Math.max(1, Math.ceil(total / size))
    for (let page = 2; page <= pages; page += 1) {
      const next = await api.get(`/team/course/${courseId}`, { params: { page: page - 1, size } })
      collect(next)
    }
    return Array.from(teamSet).sort((a, b) => a - b)
  } catch {
    return []
  }
}

export default function AdminBingoTipsPage() {
  const { courseId: courseIdParam } = useParams()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<CourseLite[]>([])
  const [selected, setSelected] = useState<CourseLite | null>(null)
  const [rows, setRows] = useState<TipRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [booting, setBooting] = useState(true)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [creating, setCreating] = useState(false)
  const [issueOptions, setIssueOptions] = useState<number[]>([])
  const [teamOptions, setTeamOptions] = useState<number[]>([])
  const [form, setForm] = useState({ issueId: '', tip: '', teamId: '' })

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const loadRows = useCallback(async (course: CourseLite, pageNo: number): Promise<TipRow[]> => {
    setRowsLoading(true)
    try {
      const res = await api.get(`/bingo-tip/course/${course.id}`, { params: { page: pageNo - 1, size: PAGE_SIZE } })
      const mapped = mapTipRows(listOf(res))
      setRows(mapped)
      setTotal(totalOf(res, mapped.length))
      return mapped
    } catch (e) {
      setRows([])
      setTotal(0)
      setNotice({ type: 'error', text: errText(e, '加载提示失败') })
      return []
    } finally {
      setRowsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setBooting(true)
    setError('')
    setPage(1)
    setRows([])
    setTotal(0)

    ;(async () => {
      try {
        const res = await api.get('/course/')
        const bingoList = (listOf(res) as CourseLite[]).filter(isBingo)
        if (cancelled) return
        setCourses(bingoList)

        const id = Number(courseIdParam)
        if (!courseIdParam || !Number.isFinite(id) || id <= 0) {
          setSelected(null)
          return
        }

        let course = bingoList.find((item) => Number(item.id) === id) ?? null
        if (!course) {
          const one = await api.get(`/course/${id}`)
          const data = unwrap(one) as CourseLite | null
          course = data && Number(data.id) === id ? data : null
        }
        if (cancelled) return

        if (!course || !isBingo(course)) {
          setSelected(null)
          setNotice({ type: 'error', text: '仅 bingo 课题支持提示配置' })
          navigate('/admin/bingo-tips', { replace: true })
          return
        }
        setSelected(course)
      } catch (e) {
        if (!cancelled) setError(errText(e, '加载 Bingo 提示页面失败'))
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [courseIdParam, navigate])

  useEffect(() => {
    if (!selected) {
      setIssueOptions([])
      setTeamOptions([])
      return
    }
    let cancelled = false
    setForm({ issueId: '', tip: '', teamId: '' })
    ;(async () => {
      const issues = await fetchIssueIds(selected.id)
      if (!cancelled) setIssueOptions(issues)
      const teams = await fetchTeamIds(selected.id)
      if (!cancelled) setTeamOptions(teams)
    })()
    return () => {
      cancelled = true
    }
  }, [selected])

  useEffect(() => {
    if (!selected) {
      setRows([])
      setTotal(0)
      return
    }
    void loadRows(selected, page)
  }, [selected, page, loadRows])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const normalizedCategory = String(selected?.category || '').trim().toLowerCase()

  function warn(text: string) {
    setNotice({ type: 'error', text })
  }

  function changePage(target: number) {
    setPage(Math.min(totalPages, Math.max(1, target)))
  }

  function normalizeIssueInput() {
    const result = resolveMatchedId(form.issueId, issueOptions)
    if (result.value) setForm((prev) => ({ ...prev, issueId: `#${result.value}` }))
  }

  function normalizeTeamInput() {
    const result = resolveMatchedId(form.teamId, teamOptions)
    if (result.value) setForm((prev) => ({ ...prev, teamId: `#${result.value}` }))
  }

  async function createTip() {
    if (!selected) return
    const issueResolved = resolveMatchedId(form.issueId, issueOptions)
    const teamResolved = resolveMatchedId(form.teamId, teamOptions)
    const tip = form.tip.trim()
    const issueId = issueResolved.value
    const teamId = teamResolved.value

    if (issueResolved.ambiguous) return warn('题目ID 匹配到多个结果，请输入更精确的编号')
    if (!issueId || !issueOptions.includes(issueId)) return warn('请输入或选择存在的题目ID')
    if (!tip) return warn('请填写提示内容')
    if (teamResolved.ambiguous) return warn('队伍ID 匹配到多个结果，请输入更精确的编号')
    if (!teamId || !teamOptions.includes(teamId)) return warn('请输入或选择存在的队伍ID')

    setCreating(true)
    try {
      await api.post(`/bingo-tip/course/${selected.id}/create`, {
        issue_id: issueId,
        tip,
        team_id: teamId,
      })
      setNotice({ type: 'ok', text: `Issue #${issueId} 提示添加成功` })
      setForm({ issueId: `#${issueId}`, teamId: `#${teamId}`, tip: '' })
      await loadRows(selected, page)
    } catch (e) {
      setNotice({ type: 'error', text: errText(e, '添加失败') })
    } finally {
      setCreating(false)
    }
  }

  async function removeRow(row: TipRow) {
    if (!selected) return
    setSaving((prev) => ({ ...prev, [row.id]: true }))
    try {
      await api.delete(`/bingo-tip/course/${selected.id}/tip/${row.id}`)
      setNotice({ type: 'ok', text: `提示 #${row.id} 已删除` })
      const remaining = await loadRows(selected, page)
      if (remaining.length === 0 && page > 1) setPage(page - 1)
    } catch (e) {
      setNotice({ type: 'error', text: errText(e, '删除失败') })
    } finally {
      setSaving((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  return (
    <PageShell
      title="ADMIN · BINGO TIPS"
      subtitle={selected ? `Bingo 提示配置 · ${selected.title || ''}` : 'Bingo 课题提示配置'}
      actions={
        selected ? (
          <button className="page-btn" type="button" onClick={() => navigate('/admin/bingo-tips')}>
            返回提示首页
          </button>
        ) : undefined
      }
    >
      {notice && <div className={`page-card${notice.type === 'error' ? ' error' : ''}`}>{notice.text}</div>}
      {error && <div className="page-card error">{error}</div>}
      {booting && <div className="page-card">载入中…</div>}

      {!booting && !error && selected && (
        <div className="page-actions-row">
          <span className="meta">课题ID: {selected.id}</span>
          <span className="meta">课题名称: {selected.title || '-'}</span>
          <span className="meta">类别: {normalizedCategory}</span>
        </div>
      )}

      {!booting && !error && !selected && (
        <div className="section-block">
          <h2>选择课题</h2>
          <p className="desc">请选择一个 bingo 课题进行提示配置：</p>
          {!courses.length ? (
            <div className="page-card">暂无可配置提示的 bingo 课题</div>
          ) : (
            <div className="page-card" style={{ overflowX: 'auto' }}>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>课题ID</th>
                    <th>课题名称</th>
                    <th>类别</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="mono">{course.id}</td>
                      <td>{course.title || '-'}</td>
                      <td>{course.category || '-'}</td>
                      <td>
                        <Link className="page-btn small" to={`/admin/bingo-tips/${course.id}`}>
                          进入配置
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!booting && !error && selected && (
        <>
          <div className="page-card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <div>
                <label className="meta" htmlFor="bingo-tip-issue">题目ID</label>
                <input
                  id="bingo-tip-issue"
                  className="page-input"
                  list="issue-option-list"
                  placeholder="可手动输入，如 #7 或 7"
                  value={form.issueId}
                  onChange={(e) => setForm((prev) => ({ ...prev, issueId: e.target.value }))}
                  onBlur={normalizeIssueInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') normalizeIssueInput()
                  }}
                />
              </div>
              <div>
                <label className="meta" htmlFor="bingo-tip-team">解锁队伍ID</label>
                <input
                  id="bingo-tip-team"
                  className="page-input"
                  list="team-option-list"
                  placeholder="可手动输入，如 #3 或 3"
                  value={form.teamId}
                  onChange={(e) => setForm((prev) => ({ ...prev, teamId: e.target.value }))}
                  onBlur={normalizeTeamInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') normalizeTeamInput()
                  }}
                />
              </div>
            </div>
            <datalist id="issue-option-list">
              {issueOptions.map((issueId) => (
                <option key={`i-${issueId}`} value={`#${issueId}`}>{issueId}</option>
              ))}
            </datalist>
            <datalist id="team-option-list">
              {teamOptions.map((teamId) => (
                <option key={`t-${teamId}`} value={`#${teamId}`}>{teamId}</option>
              ))}
            </datalist>
            <label className="meta" htmlFor="bingo-tip-content">提示内容</label>
            <textarea
              id="bingo-tip-content"
              className="page-input area"
              rows={3}
              placeholder="输入提示内容"
              value={form.tip}
              onChange={(e) => setForm((prev) => ({ ...prev, tip: e.target.value }))}
            />
            <div className="page-actions-row">
              <button className="page-btn primary" type="button" disabled={creating} onClick={() => void createTip()}>
                {creating ? '添加中…' : '添加提示'}
              </button>
              <span className="meta">
                题目候选 {issueOptions.length} 个 · 队伍候选 {teamOptions.length} 个
              </span>
            </div>
          </div>

          <div className="section-block">
            <h2>提示列表</h2>
            <div className="page-card" style={{ overflowX: 'auto' }}>
              {rowsLoading && <p className="meta">载入中…</p>}
              {!rowsLoading && !rows.length && <p className="meta">暂无提示记录</p>}
              {!!rows.length && (
                <table className="page-table">
                  <thead>
                    <tr>
                      <th>题目ID</th>
                      <th>解锁队伍</th>
                      <th>提示内容</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="mono">{row.issueId}</td>
                        <td>{formatTeamMarker(row.teamId, row.teamName)}</td>
                        <td>
                          <span
                            title={row.tip}
                            style={{ display: 'block', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {row.tip || '-'}
                          </span>
                        </td>
                        <td className="mono">{formatDateTime(row.createdAt)}</td>
                        <td>
                          <button
                            className="page-btn small"
                            type="button"
                            disabled={Boolean(saving[row.id])}
                            onClick={() => void removeRow(row)}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="page-pager">
            <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => changePage(1)}>首页</button>
            <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>上一页</button>
            <span>{page} / {totalPages}（共 {total} 条）</span>
            <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>下一页</button>
            <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => changePage(totalPages)}>尾页</button>
          </div>
        </>
      )}
    </PageShell>
  )
}
