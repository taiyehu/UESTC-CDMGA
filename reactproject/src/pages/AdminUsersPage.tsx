import { useCallback, useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type UserRow = {
  id: number
  account: string
  role: string
}

type Notice = { type: 'ok' | 'error'; text: string }

const PAGE_SIZE = 10
const center = { textAlign: 'center' } as const

function roleText(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  const role = value as { name?: string; roleName?: string }
  return String(role.name ?? role.roleName ?? '—')
}

function toUserRow(raw: any): UserRow {
  return {
    id: Number(raw?.id ?? raw?.identityId ?? 0),
    account: String(raw?.account || raw?.username || '—'),
    role: roleText(raw?.role),
  }
}

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  if (message) return message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [jump, setJump] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async (targetPage: number, silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await api.get('/identity/allaccount', { params: { page: targetPage - 1, size: PAGE_SIZE } })
      const payload = res.data ?? {}
      const list = Array.isArray(payload.list)
        ? payload.list
        : Array.isArray(payload.data?.list)
          ? payload.data.list
          : []
      setRows(list.map((item: any) => toUserRow(item)))
      setTotal(Number(payload.total ?? payload.data?.total ?? 0) || 0)
    } catch (e) {
      setRows([])
      setTotal(0)
      setError(errorMessage(e, '获取用户信息失败'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(page)
  }, [page, load])

  function goPage(target: number) {
    const next = Math.min(totalPages, Math.max(1, Math.trunc(target) || 1))
    setJump('')
    if (next === page) {
      void load(next)
      return
    }
    setPage(next)
  }

  function jumpTo() {
    if (jump.trim() === '') return
    const target = Number(jump)
    if (!Number.isFinite(target)) return
    goPage(target)
  }

  async function deleteUser(userId: number) {
    if (!window.confirm('确定删除该用户吗？')) return
    setDeletingId(userId)
    try {
      const res = await api.delete(`/identity/${userId}`)
      if (res.status === 204 || res.data?.code === 0) {
        setNotice({ type: 'ok', text: '用户删除成功' })
        if (rows.length === 1 && page > 1) {
          setJump('')
          setPage(page - 1)
        } else {
          await load(page, true)
        }
      } else {
        setNotice({ type: 'error', text: '删除失败' })
      }
    } catch {
      setNotice({ type: 'error', text: '删除失败' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageShell
      title="ADMIN · USERS"
      subtitle="账号列表 · 删除账号"
      actions={
        <button className="page-btn" type="button" disabled={loading} onClick={() => void load(page)}>
          刷新
        </button>
      }
    >
      {notice && (
        <div className={`page-card${notice.type === 'error' ? ' error' : ''}`} style={{ marginBottom: 12 }}>
          {notice.text}
        </div>
      )}

      {loading && <div className="page-card">载入中…</div>}
      {!loading && error && <div className="page-card error">{error}</div>}
      {!loading && !error && !rows.length && <div className="page-card">暂无用户</div>}

      {!loading && !error && rows.length > 0 && (
        <div className="page-card" style={{ overflowX: 'auto' }}>
          <table className="page-table">
            <thead>
              <tr>
                <th style={center}>用户ID</th>
                <th style={center}>账号</th>
                <th style={center}>角色</th>
                <th style={center}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className="mono" style={center}>{user.id}</td>
                  <td style={center}>{user.account}</td>
                  <td style={center}>{user.role}</td>
                  <td style={center}>
                    <button
                      className="page-btn small"
                      type="button"
                      style={{ borderColor: 'rgba(255,143,163,.55)', color: '#FF8FA3' }}
                      disabled={deletingId === user.id}
                      onClick={() => void deleteUser(user.id)}
                    >
                      {deletingId === user.id ? '删除中…' : '删除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="page-pager">
          <span className="meta">共 {total} 条</span>
          <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => goPage(1)}>首页</button>
          <button className="page-btn small" type="button" disabled={page <= 1} onClick={() => goPage(page - 1)}>上一页</button>
          <span className="mono">{page} / {totalPages}</span>
          <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>下一页</button>
          <button className="page-btn small" type="button" disabled={page >= totalPages} onClick={() => goPage(totalPages)}>尾页</button>
          <input
            className="page-input"
            type="number"
            min={1}
            max={totalPages}
            placeholder="页码"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') jumpTo() }}
            style={{ width: 72, marginTop: 0 }}
          />
          <button className="page-btn small" type="button" onClick={jumpTo} disabled={loading}>跳转</button>
        </div>
      )}
    </PageShell>
  )
}
