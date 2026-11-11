import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

const PAGE_SIZE = 5
const MEMBER_SLOTS = 3

type CourseLite = { id: number; title?: string; category?: string | null }
type MemberOption = { identityId: number; account: string }
type TeamRow = {
  teamId: number
  members: MemberOption[]
  memberIds: Array<number | undefined>
}
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

function toMemberOptions(data: any): MemberOption[] {
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  return list
    .map((item: any) => ({ identityId: Number(item?.identityId), account: String(item?.account ?? '') }))
    .filter((item: MemberOption) => Number.isFinite(item.identityId) && item.identityId > 0)
}

function memberLabel(option: MemberOption): string {
  return `${option.account || '社员'} (#${option.identityId})`
}

function readAdminIdentityId(): number | null {
  try {
    const raw = sessionStorage.getItem('userInfo')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const value = Number(parsed?.id ?? parsed?.identityId ?? parsed?.userId)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function MemberPicker({
  value,
  options,
  savedOptions,
  disabled,
  onPick,
  onSearch,
}: {
  value?: number
  options: MemberOption[]
  savedOptions: MemberOption[]
  disabled?: boolean
  onPick: (identityId: number | undefined) => void
  onSearch: (keyword: string) => void
}) {
  const listId = useId()
  const [text, setText] = useState('')

  const merged = useMemo(() => {
    const map = new Map<number, MemberOption>()
    for (const option of options) map.set(option.identityId, option)
    for (const option of savedOptions) if (!map.has(option.identityId)) map.set(option.identityId, option)
    return Array.from(map.values())
  }, [options, savedOptions])
  const mergedRef = useRef<MemberOption[]>([])
  const labelFor = useCallback((identityId?: number): string => {
    if (!identityId) return ''
    const found = mergedRef.current.find((option) => option.identityId === identityId)
    return found ? memberLabel(found) : `#${identityId}`
  }, [])

  useEffect(() => {
    mergedRef.current = merged
  }, [merged])

  useEffect(() => {
    setText(labelFor(value))
  }, [value, labelFor])

  function resolve(raw: string): number | undefined {
    const trimmed = raw.trim()
    if (!trimmed) return undefined
    const exact = mergedRef.current.find((option) => memberLabel(option) === trimmed || option.account === trimmed)
    if (exact) return exact.identityId
    const matched = trimmed.match(/#(\d+)/) || trimmed.match(/^(\d+)$/)
    if (matched) {
      const id = Number(matched[1])
      if (Number.isFinite(id) && id > 0) return id
    }
    const partial = mergedRef.current.filter((option) => option.account.toLowerCase().includes(trimmed.toLowerCase()))
    return partial.length === 1 ? partial[0].identityId : undefined
  }

  function commit() {
    const trimmed = text.trim()
    if (!trimmed) {
      onPick(undefined)
      return
    }
    const identityId = resolve(trimmed)
    if (identityId) {
      onPick(identityId)
      setText(labelFor(identityId))
      return
    }
    setText(labelFor(value))
  }

  return (
    <>
      <input
        className="page-input"
        list={listId}
        placeholder="搜索账号或输入 #id"
        value={text}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          const exact = mergedRef.current.find(
            (option) => memberLabel(option) === next.trim() || option.account === next.trim(),
          )
          if (exact) onPick(exact.identityId)
          onSearch(next)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
      />
      <datalist id={listId}>
        {merged.map((option) => (
          <option key={option.identityId} value={memberLabel(option)} />
        ))}
      </datalist>
    </>
  )
}

export default function AdminTeamsPage() {
  const { courseId: courseIdParam } = useParams()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<CourseLite[]>([])
  const [selected, setSelected] = useState<CourseLite | null>(null)
  const [rows, setRows] = useState<TeamRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [booting, setBooting] = useState(true)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const searchTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const loadRows = useCallback(async (course: CourseLite, pageNo: number): Promise<TeamRow[]> => {
    setRowsLoading(true)
    try {
      const res = await api.get(`/team/course/${course.id}`, { params: { page: pageNo - 1, size: PAGE_SIZE } })
      const list = listOf(res)
      const mapped: TeamRow[] = list.map((item: any) => {
        const sourceMembers = Array.isArray(item?.members) ? item.members : []
        const members: MemberOption[] = sourceMembers
          .map((member: any) => ({ identityId: Number(member?.identityId), account: String(member?.account ?? '') }))
          .filter((member: MemberOption) => Number.isFinite(member.identityId) && member.identityId > 0)
        const memberIds: Array<number | undefined> = []
        for (let slot = 0; slot < MEMBER_SLOTS; slot += 1) {
          const identityId = Number(members[slot]?.identityId)
          memberIds.push(Number.isFinite(identityId) && identityId > 0 ? identityId : undefined)
        }
        return { teamId: Number(item?.teamId), members, memberIds }
      })
      setRows(mapped)
      setTotal(totalOf(res, mapped.length))
      return mapped
    } catch (e) {
      setRows([])
      setTotal(0)
      setNotice({ type: 'error', text: errText(e, '加载队伍失败') })
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
    setMemberOptions([])

    ;(async () => {
      try {
        const res = await api.get('/course/')
        const bingoList = (listOf(res) as CourseLite[]).filter(
          (item) => String(item?.category || '').trim().toLowerCase() === 'bingo',
        )
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

        if (!course || String(course.category || '').trim().toLowerCase() !== 'bingo') {
          setSelected(null)
          setNotice({ type: 'error', text: '仅 bingo 课题支持此处的队伍管理' })
          navigate('/admin/teams', { replace: true })
          return
        }
        setSelected(course)
      } catch (e) {
        if (!cancelled) setError(errText(e, '加载队伍页面失败'))
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
      setRows([])
      setTotal(0)
      return
    }
    void loadRows(selected, page)
  }, [selected, page, loadRows])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function warn(text: string) {
    setNotice({ type: 'error', text })
  }

  function changePage(target: number) {
    setPage(Math.min(totalPages, Math.max(1, target)))
  }

  function patchRow(teamId: number, slot: number, identityId: number | undefined) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.teamId !== teamId) return row
        const memberIds = [...row.memberIds]
        memberIds[slot] = identityId
        return { ...row, memberIds }
      }),
    )
  }

  function onSearchMembers(keyword: string) {
    if (!selected) return
    const courseId = selected.id
    const key = keyword.trim()
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    if (!key) {
      setMemberOptions([])
      return
    }
    searchTimer.current = window.setTimeout(() => {
      setSearchingMembers(true)
      api
        .get(`/team/course/${courseId}/member-options`, { params: { keyword: key, size: 20 } })
        .then((res) => setMemberOptions(toMemberOptions(unwrap(res))))
        .catch((e) => {
          setMemberOptions([])
          setNotice({ type: 'error', text: errText(e, '成员搜索失败') })
        })
        .finally(() => setSearchingMembers(false))
    }, 300)
  }

  async function saveTeamRow(row: TeamRow) {
    if (!selected) return
    const adminIdentityId = readAdminIdentityId()
    if (!adminIdentityId) return warn('未获取到管理员身份，请重新登录')

    const memberIds = row.memberIds.filter((id): id is number => Number.isFinite(id) && Number(id) > 0)
    if (new Set(memberIds).size !== memberIds.length) {
      return warn(`队伍 #${row.teamId} 不能选择重复成员`)
    }

    setSaving((prev) => ({ ...prev, [row.teamId]: true }))
    try {
      await api.post(`/team/course/${selected.id}/save`, {
        team_id: row.teamId,
        member_ids: memberIds,
        admin_identity_id: adminIdentityId,
      })
      setNotice({ type: 'ok', text: `队伍 #${row.teamId} 保存成功` })

      const fresh = await loadRows(selected, page)
      const lastRow = fresh[fresh.length - 1]
      const lastOccupied = Boolean(lastRow && lastRow.memberIds.some((id) => Number.isFinite(id) && Number(id) > 0))
      if (fresh.length >= PAGE_SIZE && lastOccupied && page < totalPages) {
        setPage(page + 1)
      }
    } catch (e) {
      setNotice({ type: 'error', text: errText(e, '保存失败') })
    } finally {
      setSaving((prev) => ({ ...prev, [row.teamId]: false }))
    }
  }

  return (
    <PageShell
      title="ADMIN · TEAMS"
      subtitle={selected ? `Bingo 队伍管理 · ${selected.title || ''}` : 'Bingo 队伍管理'}
      actions={
        selected ? (
          <button className="page-btn" type="button" onClick={() => navigate('/admin/teams')}>
            返回队伍首页
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
        </div>
      )}

      {!booting && !error && !selected && (
        <div className="section-block">
          <h2>选择课题</h2>
          <p className="desc">请选择一个 bingo 课题进行队伍管理；桌游队伍请在房间中管理。</p>
          {!courses.length ? (
            <div className="page-card">暂无可管理队伍的课题</div>
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
                        <Link className="page-btn small" to={`/admin/teams/${course.id}`}>
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
        <div className="section-block">
          <h2>队伍列表</h2>
          <p className="desc">
            输入账号或 #id 搜索成员，选中后点击保存。
            {searchingMembers ? ' 搜索中…' : ''}
          </p>
          <div className="page-card" style={{ overflowX: 'auto' }}>
            {rowsLoading && <p className="meta">载入中…</p>}
            {!rowsLoading && !rows.length && <p className="meta">暂无队伍数据</p>}
            {!!rows.length && (
              <table className="page-table">
                <thead>
                  <tr>
                    <th>队伍号</th>
                    <th>成员1</th>
                    <th>成员2</th>
                    <th>成员3</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.teamId}>
                      <td className="mono">{row.teamId}</td>
                      {row.memberIds.map((identityId, slot) => (
                        <td key={`${row.teamId}-${slot}`}>
                          <MemberPicker
                            value={identityId}
                            options={memberOptions}
                            savedOptions={row.members}
                            disabled={Boolean(saving[row.teamId])}
                            onPick={(nextId) => patchRow(row.teamId, slot, nextId)}
                            onSearch={onSearchMembers}
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className="page-btn primary"
                          type="button"
                          disabled={Boolean(saving[row.teamId])}
                          onClick={() => void saveTeamRow(row)}
                        >
                          {saving[row.teamId] ? '保存中…' : '保存'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="page-pager">
            <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => changePage(1)}>首页</button>
            <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>上一页</button>
            <span>{page} / {totalPages}（共 {total} 支队伍）</span>
            <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>下一页</button>
            <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => changePage(totalPages)}>尾页</button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
