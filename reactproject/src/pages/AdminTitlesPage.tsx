import { useEffect, useRef, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type UserOption = { id: number; account: string }

type TitleRow = {
  id: number
  identityId: number
  account: string
  name: string
  tier: string
  status: string
  isEquipped: boolean
  acquisitionMethod?: string | null
  grantReason?: string | null
  createdAt?: string | null
  grantedAt?: string | null
  revokedAt?: string | null
}

type Definition = { id: number; name: string; tier: string }

type Notice = { kind: 'ok' | 'error'; text: string } | null

const TIER_OPTIONS = [
  { value: 'normal', label: '普通' },
  { value: 'silver', label: '银色' },
  { value: 'gold', label: '金色' },
  { value: 'color', label: '彩色' },
] as const

const PAGE_SIZE = 20

const BADGE_TONES: Record<string, { borderColor: string; color: string; background: string }> = {
  normal: { borderColor: 'rgba(103,232,249,.5)', color: '#cffafe', background: 'linear-gradient(120deg,rgba(8,47,73,.9),rgba(14,116,144,.55))' },
  silver: { borderColor: '#cbd5e1', color: '#f8fafc', background: 'linear-gradient(120deg,#475569,#94a3b8,#334155)' },
  gold: { borderColor: '#fde68a', color: '#422006', background: 'linear-gradient(120deg,#b45309,#fef08a,#f59e0b)' },
  color: { borderColor: 'rgba(255,255,255,.75)', color: '#fff', background: 'linear-gradient(100deg,#0891b2,#7c3aed,#db2777,#0891b2)' },
}

function tierLabel(tier: string): string {
  return TIER_OPTIONS.find((item) => item.value === tier)?.label || tier
}

function statusLabel(status: string): string {
  if (status === 'approved') return '已发放'
  if (status === 'pending') return '待审核'
  if (status === 'revoked') return '已撤销'
  return '已驳回'
}

function formatTime(input?: string | null): string {
  return input ? input.replace('T', ' ') : '-'
}

function apiMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string } | null
  if (err?.response?.data?.message) return err.response.data.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function TitleBadge({ name, tier, acquisitionMethod }: { name: string; tier: string; acquisitionMethod?: string | null }) {
  const tone = BADGE_TONES[tier] || BADGE_TONES.normal
  return (
    <span
      title={acquisitionMethod || '暂无获得方式'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        padding: '4px 12px',
        borderRadius: 999,
        border: `1px solid ${tone.borderColor}`,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '.04em',
        overflowWrap: 'anywhere',
        color: tone.color,
        background: tone.background,
      }}
    >
      {name}
    </span>
  )
}

function UserPicker({
  value,
  onChange,
  resetToken = 0,
  placeholder = '输入昵称搜索用户',
}: {
  value: UserOption | null
  onChange: (next: UserOption | null) => void
  resetToken?: number
  placeholder?: string
}) {
  const [keyword, setKeyword] = useState(value?.account || '')
  const [results, setResults] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timer = useRef<number | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    requestId.current += 1
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    setKeyword(value?.account || '')
    setResults([])
    setLoading(false)
    setSearched(false)
    // Reset only when the parent explicitly bumps resetToken (e.g. "查看全部").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken])

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  function handleInput(next: string) {
    setKeyword(next)
    onChange(null)
    requestId.current += 1
    const currentRequest = requestId.current
    if (timer.current !== null) window.clearTimeout(timer.current)
    setResults([])
    setSearched(false)
    setLoading(false)
    const query = next.trim()
    if (!query) return
    timer.current = window.setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get('/title/admin/users', { params: { keyword: query } })
        if (currentRequest !== requestId.current) return
        setResults(res.data?.code === 0 ? ((res.data?.data ?? []) as UserOption[]) : [])
      } catch {
        if (currentRequest === requestId.current) setResults([])
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false)
          setSearched(true)
        }
      }
    }, 250)
  }

  function selectUser(user: UserOption) {
    requestId.current += 1
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    setKeyword(user.account)
    setResults([])
    setSearched(false)
    setLoading(false)
    onChange(user)
  }

  return (
    <div style={{ position: 'relative', minWidth: 210 }}>
      <input
        className="page-input"
        value={keyword}
        placeholder={placeholder}
        onChange={(e) => handleInput(e.target.value)}
        style={{ marginTop: 8 }}
      />
      {value && <p className="meta" style={{ color: '#a7f3d0' }}>已选择：{value.account}（ID {value.id}）</p>}
      {loading && <p className="meta">搜索中…</p>}
      {!!results.length && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            width: '100%',
            maxHeight: 220,
            overflowY: 'auto',
            marginTop: 4,
            border: '1px solid rgba(103,232,249,.35)',
            borderRadius: 9,
            background: '#0f172a',
            boxShadow: '0 12px 30px rgba(0,0,0,.35)',
          }}
        >
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 10px',
                border: 0,
                color: '#e0f2fe',
                textAlign: 'left',
                background: 'transparent',
              }}
            >
              <span>{user.account}</span>
              <span className="mono" style={{ color: 'rgba(207,250,254,.55)' }}>ID {user.id}</span>
            </button>
          ))}
        </div>
      )}
      {!results.length && !loading && searched && !value && <p className="meta">没有找到匹配的昵称</p>}
    </div>
  )
}

function Pager({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number
  totalPages: number
  disabled?: boolean
  onChange: (next: number) => void
}) {
  const [jump, setJump] = useState('')
  const safePage = Math.min(totalPages, Math.max(1, page))

  function go(next: number) {
    setJump('')
    onChange(next)
  }

  function jumpTo() {
    const target = Number(jump)
    if (Number.isFinite(target) && target >= 1) go(Math.min(totalPages, Math.floor(target)))
  }

  return (
    <div className="page-pager" style={{ flexWrap: 'wrap' }}>
      <button className="page-btn small" type="button" disabled={disabled || safePage <= 1} onClick={() => go(1)}>首页</button>
      <button className="page-btn small" type="button" disabled={disabled || safePage <= 1} onClick={() => go(safePage - 1)}>上一页</button>
      <span className="mono">{safePage} / {totalPages}</span>
      <button className="page-btn small" type="button" disabled={disabled || safePage >= totalPages} onClick={() => go(safePage + 1)}>下一页</button>
      <button className="page-btn small" type="button" disabled={disabled || safePage >= totalPages} onClick={() => go(totalPages)}>尾页</button>
      <input
        className="page-input"
        type="number"
        min={1}
        max={totalPages}
        placeholder="页码"
        value={jump}
        disabled={disabled}
        onChange={(e) => setJump(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') jumpTo() }}
        style={{ width: 72, marginTop: 0 }}
      />
      <button className="page-btn small" type="button" disabled={disabled} onClick={jumpTo}>跳转</button>
    </div>
  )
}

export default function AdminTitlesPage() {
  const [pending, setPending] = useState<TitleRow[]>([])
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [awards, setAwards] = useState<TitleRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState<Notice>(null)

  const [reviewTiers, setReviewTiers] = useState<Record<number, string>>({})
  const [reviewMethods, setReviewMethods] = useState<Record<number, string>>({})
  const [reviewReasons, setReviewReasons] = useState<Record<number, string>>({})
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  const [recipient, setRecipient] = useState<UserOption | null>(null)
  const [selectedTitleId, setSelectedTitleId] = useState(0)
  const [newName, setNewName] = useState('')
  const [newTier, setNewTier] = useState('normal')
  const [newMethod, setNewMethod] = useState('')
  const [newReason, setNewReason] = useState('')
  const [granting, setGranting] = useState(false)

  const [filterUser, setFilterUser] = useState<UserOption | null>(null)
  const [filterResetToken, setFilterResetToken] = useState(0)
  const [appliedFilterId, setAppliedFilterId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [refreshToken, setRefreshToken] = useState(0)

  const [editing, setEditing] = useState<TitleRow | null>(null)
  const [editingMethod, setEditingMethod] = useState('')
  const [editingReason, setEditingReason] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    Promise.all([
      api.get('/title/admin/pending'),
      api.get('/title/admin/definitions'),
      api.get('/title/admin/awards', {
        params: { page, size: PAGE_SIZE, identityId: appliedFilterId ?? undefined },
      }),
    ])
      .then(([pendingRes, definitionsRes, awardsRes]) => {
        if (!active) return
        if ([pendingRes, definitionsRes, awardsRes].some((response) => response.data?.code !== 0)) {
          throw new Error('获取称号数据失败')
        }
        const nextPending = (pendingRes.data?.data ?? []) as TitleRow[]
        const awardData = awardsRes.data?.data ?? {}
        setPending(nextPending)
        setDefinitions((definitionsRes.data?.data ?? []) as Definition[])
        setAwards((awardData.list ?? []) as TitleRow[])
        setTotal(Number(awardData.total ?? 0))
        setReviewTiers((prev) => {
          const next = { ...prev }
          for (const item of nextPending) {
            if (!next[item.id]) next[item.id] = 'normal'
          }
          return next
        })
        setReviewMethods((prev) => {
          const next = { ...prev }
          for (const item of nextPending) {
            if (next[item.id] === undefined) next[item.id] = item.acquisitionMethod || ''
          }
          return next
        })
        setReviewReasons((prev) => {
          const next = { ...prev }
          for (const item of nextPending) {
            if (next[item.id] === undefined) next[item.id] = ''
          }
          return next
        })
      })
      .catch((error) => {
        if (active) setLoadError(apiMessage(error, '获取称号数据失败'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [page, appliedFilterId, refreshToken])

  // If the last row on the last page is revoked, fall back to the previous page.
  useEffect(() => {
    if (!loading && page > 0 && page > totalPages - 1) {
      setPage(totalPages - 1)
    }
  }, [loading, page, totalPages])

  function reload() {
    setRefreshToken((token) => token + 1)
  }

  async function review(item: TitleRow, approved: boolean) {
    if (reviewingId !== null) return
    const note = approved ? '' : window.prompt('请输入驳回原因（可留空）')
    if (note === null) return
    setReviewingId(item.id)
    setNotice(null)
    try {
      const res = await api.post(`/title/admin/review/${item.id}`, {
        approved,
        tier: reviewTiers[item.id] || 'normal',
        note,
        acquisitionMethod: reviewMethods[item.id] ?? '',
        grantReason: reviewReasons[item.id] ?? '',
      })
      if (res.data?.code !== 0) throw new Error(res.data?.message || '审核失败')
      setNotice({ kind: 'ok', text: approved ? '审核通过' : '已驳回' })
      reload()
    } catch (error) {
      setNotice({ kind: 'error', text: apiMessage(error, '审核失败') })
    } finally {
      setReviewingId(null)
    }
  }

  async function submitGrant() {
    if (!recipient || (!selectedTitleId && !newName.trim())) {
      setNotice({ kind: 'error', text: '请选择用户并填写或选择称号' })
      return
    }
    setGranting(true)
    setNotice(null)
    try {
      const url = selectedTitleId ? '/title/admin/grant' : '/title/admin/create'
      const payload = selectedTitleId
        ? { identityId: recipient.id, titleId: selectedTitleId, grantReason: newReason.trim() }
        : {
            identityId: recipient.id,
            name: newName.trim(),
            tier: newTier,
            acquisitionMethod: newMethod.trim(),
            grantReason: newReason.trim(),
          }
      const res = await api.post(url, payload)
      if (res.data?.code !== 0) throw new Error(res.data?.message || '发放失败')
      setNotice({ kind: 'ok', text: '称号已发放' })
      setNewName('')
      setNewReason('')
      reload()
    } catch (error) {
      setNotice({ kind: 'error', text: apiMessage(error, '发放失败') })
    } finally {
      setGranting(false)
    }
  }

  function applyFilter() {
    if (!filterUser) {
      setNotice({ kind: 'error', text: '请先按昵称选择用户' })
      return
    }
    setPage(0)
    setAppliedFilterId(filterUser.id)
    setRefreshToken((token) => token + 1)
  }

  function clearFilter() {
    setFilterUser(null)
    setFilterResetToken((token) => token + 1)
    setAppliedFilterId(null)
    setPage(0)
    setRefreshToken((token) => token + 1)
  }

  function startEdit(item: TitleRow) {
    setEditing(item)
    setEditingMethod(item.acquisitionMethod || '')
    setEditingReason(item.grantReason || '')
  }

  async function saveDetails() {
    if (!editing) return
    setSavingEdit(true)
    setNotice(null)
    try {
      const res = await api.post(`/title/admin/details/${editing.id}`, {
        acquisitionMethod: editingMethod.trim(),
        grantReason: editingReason.trim(),
      })
      if (res.data?.code !== 0) throw new Error(res.data?.message || '保存失败')
      setEditing(null)
      setNotice({ kind: 'ok', text: '称号信息已更新' })
      reload()
    } catch (error) {
      setNotice({ kind: 'error', text: apiMessage(error, '保存失败') })
    } finally {
      setSavingEdit(false)
    }
  }

  async function revoke(item: TitleRow) {
    if (!window.confirm(`确定撤销 ${item.account} 的「${item.name}」吗？记录仍会保留。`)) return
    setRevokingId(item.id)
    setNotice(null)
    try {
      const res = await api.post(`/title/admin/revoke/${item.id}`)
      if (res.data?.code !== 0) throw new Error(res.data?.message || '撤销失败')
      setNotice({ kind: 'ok', text: '称号已撤销' })
      if (editing?.id === item.id) setEditing(null)
      reload()
    } catch (error) {
      setNotice({ kind: 'error', text: apiMessage(error, '撤销失败') })
    } finally {
      setRevokingId(null)
    }
  }

  const busy = reviewingId !== null || granting || savingEdit || revokingId !== null

  return (
    <PageShell
      title="ADMIN · TITLES"
      subtitle="称号审核、发放与记录"
      actions={
        <button className="page-btn" type="button" disabled={loading} onClick={reload}>
          {loading ? '刷新中…' : '刷新'}
        </button>
      }
    >
      {notice && (
        <div
          className={`page-card${notice.kind === 'error' ? ' error' : ''}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 11,
            color: notice.kind === 'error' ? undefined : '#d1fae5',
          }}
        >
          <span>{notice.text}</span>
          <button className="page-btn small" type="button" onClick={() => setNotice(null)}>关闭</button>
        </div>
      )}
      {loadError && <div className="page-card error">{loadError}</div>}

      <section className="page-card">
        <h3>待审核申请</h3>
        {pending.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
              padding: '12px 0',
              borderTop: '1px solid rgba(255,255,255,.12)',
            }}
          >
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <p style={{ margin: 0 }}>
                {item.account} 申请了 <strong>{item.name}</strong>
              </p>
              <p className="meta" style={{ marginTop: 4 }}>{formatTime(item.createdAt)}</p>
            </div>
            <select
              className="page-select"
              aria-label="称号等级"
              value={reviewTiers[item.id] ?? 'normal'}
              disabled={busy}
              onChange={(e) => setReviewTiers((prev) => ({ ...prev, [item.id]: e.target.value }))}
              style={{ minWidth: 96 }}
            >
              {TIER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <input
              className="page-input"
              maxLength={255}
              placeholder="获得方式（选填）"
              value={reviewMethods[item.id] ?? ''}
              disabled={busy}
              onChange={(e) => setReviewMethods((prev) => ({ ...prev, [item.id]: e.target.value }))}
              style={{ width: 170, marginTop: 0 }}
            />
            <input
              className="page-input"
              maxLength={255}
              placeholder="发放原因（选填）"
              value={reviewReasons[item.id] ?? ''}
              disabled={busy}
              onChange={(e) => setReviewReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
              style={{ width: 170, marginTop: 0 }}
            />
            <button
              className="page-btn"
              type="button"
              disabled={busy}
              onClick={() => void review(item, true)}
              style={{ borderColor: 'rgba(52,211,153,.55)', color: '#d1fae5' }}
            >
              {reviewingId === item.id ? '处理中…' : '通过'}
            </button>
            <button
              className="page-btn"
              type="button"
              disabled={busy}
              onClick={() => void review(item, false)}
              style={{ borderColor: 'rgba(251,191,36,.55)', color: '#fde68a' }}
            >
              驳回
            </button>
          </div>
        ))}
        {!pending.length && <p className="meta">{loading ? '载入中…' : '暂无待审核申请'}</p>}
      </section>

      <section className="page-card section-block">
        <h3>创建或再次发放称号</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
          <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
            接收用户（按昵称搜索）
            <UserPicker value={recipient} onChange={setRecipient} />
          </label>
          <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
            已有称号
            <select
              className="page-select"
              value={selectedTitleId}
              onChange={(e) => setSelectedTitleId(Number(e.target.value))}
              style={{ width: '100%', marginTop: 8 }}
            >
              <option value={0}>新建称号</option>
              {definitions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}（{tierLabel(item.tier)}）</option>
              ))}
            </select>
          </label>
          {selectedTitleId === 0 && (
            <>
              <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
                称号文字
                <input
                  className="page-input"
                  maxLength={32}
                  placeholder="最多32字"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
                等级
                <select className="page-select" value={newTier} onChange={(e) => setNewTier(e.target.value)} style={{ width: '100%', marginTop: 8 }}>
                  {TIER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
                获得方式（选填）
                <input
                  className="page-input"
                  maxLength={255}
                  placeholder="称号的获得方式"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                />
              </label>
            </>
          )}
          <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
            发放原因（选填）
            <input
              className="page-input"
              maxLength={255}
              placeholder="本次发放的原因"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
            />
          </label>
        </div>
        <div className="page-actions-row">
          <button className="page-btn primary" type="button" disabled={busy} onClick={() => void submitGrant()}>
            {granting ? '处理中…' : selectedTitleId ? '发放已有称号' : '创建并发放'}
          </button>
        </div>
      </section>

      <section className="page-card section-block">
        <h3>所有称号记录</h3>
        <div className="page-actions-row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'block', flex: '0 1 260px', fontSize: 10, color: '#b9c8d8' }}>
            按昵称筛选用户
            <UserPicker value={filterUser} onChange={setFilterUser} resetToken={filterResetToken} />
          </label>
          <button className="page-btn small" type="button" disabled={loading} onClick={applyFilter}>筛选</button>
          <button className="page-btn small" type="button" disabled={loading} onClick={clearFilter}>查看全部</button>
          {appliedFilterId !== null && <span className="meta">当前筛选：{filterUser?.account || `ID ${appliedFilterId}`}</span>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="page-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>用户</th>
                <th>称号</th>
                <th>状态</th>
                <th>发放时间</th>
                <th>发放原因</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.account} <span className="mono" style={{ color: 'rgba(207,250,254,.55)' }}>#{item.identityId}</span>
                  </td>
                  <td>
                    <TitleBadge name={item.name} tier={item.tier} acquisitionMethod={item.acquisitionMethod} />
                  </td>
                  <td>
                    {statusLabel(item.status)}{item.isEquipped ? ' · 佩戴中' : ''}
                    {item.revokedAt && <span className="meta" style={{ display: 'block' }}>{formatTime(item.revokedAt)}</span>}
                  </td>
                  <td>{formatTime(item.grantedAt)}</td>
                  <td style={{ maxWidth: 220, overflowWrap: 'anywhere' }}>{item.grantReason || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="page-btn small" type="button" disabled={busy} onClick={() => startEdit(item)}>编辑</button>
                      {item.status === 'approved' && (
                        <button
                          className="page-btn small"
                          type="button"
                          disabled={busy}
                          onClick={() => void revoke(item)}
                          style={{ borderColor: 'rgba(248,113,113,.55)', color: '#fecaca' }}
                        >
                          {revokingId === item.id ? '撤销中…' : '撤销'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!awards.length && <p className="meta">{loading ? '载入中…' : '暂无称号记录'}</p>}
        <Pager page={page + 1} totalPages={totalPages} disabled={loading} onChange={(next) => setPage(next - 1)} />

        {editing && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(34,211,238,.2)' }}>
            <h4 style={{ margin: 0, color: '#e0f2fe' }}>编辑 {editing.account} 的 {editing.name}</h4>
            <p className="meta" style={{ marginTop: 4 }}>获得方式属于称号定义，修改后会影响所有获得该称号的用户。</p>
            <div style={{ marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
              <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
                获得方式
                <input
                  className="page-input"
                  maxLength={255}
                  value={editingMethod}
                  onChange={(e) => setEditingMethod(e.target.value)}
                />
              </label>
              <label style={{ display: 'block', fontSize: 10, color: '#b9c8d8' }}>
                本次发放原因
                <input
                  className="page-input"
                  maxLength={255}
                  value={editingReason}
                  onChange={(e) => setEditingReason(e.target.value)}
                />
              </label>
            </div>
            <div className="page-actions-row">
              <button className="page-btn" type="button" disabled={busy} onClick={() => void saveDetails()}>
                {savingEdit ? '保存中…' : '保存'}
              </button>
              <button className="page-btn" type="button" disabled={savingEdit} onClick={() => setEditing(null)}>取消</button>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  )
}
