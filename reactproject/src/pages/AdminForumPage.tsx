import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

type Tab = 'reports' | 'posts'
type ContentType = 'post' | 'reply'
type Decision = 'retain' | 'delete'

type ReportRow = {
  id: number
  postId?: number | null
  replyId?: number | null
  replyPostId?: number | null
  reporterName?: string
  reason?: string
  detail?: string | null
  status?: string
  targetText?: string
  createdAt?: string
}

type PostRow = {
  id: number
  title?: string
  status?: string
  authorName?: string
  createdAt?: string
  replyCount?: number
}

type ActionRow = {
  id: number
  createdAt?: string
  operatorName?: string | null
  action?: string
  previousStatus?: string
  newStatus?: string
  reason?: string | null
}

type EditRow = {
  id: number
  createdAt?: string
  editorName?: string | null
  oldTitle?: string | null
  newTitle?: string | null
  oldContent?: string | null
  newContent?: string | null
}

type ActionsDialog = { kind: 'actions'; loading: boolean; error: string; rows: ActionRow[] }
type EditsDialog = { kind: 'edits'; loading: boolean; error: string; rows: EditRow[] }
type DialogState = ActionsDialog | EditsDialog | null

const PAGE_SIZE = 20

const STATUS_TEXT: Record<string, string> = {
  pending: '待处理',
  retained: '已保留',
  deleted: '已删除',
  visible: '可见',
  hidden: '已隐藏',
}

function statusText(status?: string): string {
  if (!status) return '-'
  return STATUS_TEXT[status] || status
}

function formatTime(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN')
}

function errorText(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }
  return error instanceof Error ? error.message : '请求失败'
}

function unwrap<T>(response: { data?: any }): T {
  const body = response.data
  if (!body || body.code !== 0) throw new Error(body?.message || '请求失败')
  return body.data as T
}

export default function AdminForumPage() {
  const [tab, setTab] = useState<Tab>('reports')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<(ReportRow | PostRow)[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const dialogSeq = useRef(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const request =
      tab === 'reports'
        ? api.get('/forum/admin/reports', { params: { page, size: PAGE_SIZE } })
        : api.get('/forum/admin/posts', { params: { page, size: PAGE_SIZE } })

    request
      .then((response) => {
        if (cancelled) return
        const data = unwrap<{ list?: (ReportRow | PostRow)[]; total?: number }>(response)
        setRows(Array.isArray(data?.list) ? data.list : [])
        setTotal(Number(data?.total) || 0)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setRows([])
        setTotal(0)
        setError(errorText(e) || '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tab, page, reloadKey])

  function switchTab(next: Tab) {
    if (next === tab) return
    setTab(next)
    setPage(0)
    setNotice(null)
  }

  function closeDialog() {
    dialogSeq.current += 1
    setDialog(null)
  }

  async function showActions(type: ContentType, id: number) {
    const seq = ++dialogSeq.current
    setDialog({ kind: 'actions', loading: true, error: '', rows: [] })
    try {
      const list = unwrap<ActionRow[]>(await api.get(`/forum/admin/${type}/${id}/actions`))
      if (seq !== dialogSeq.current) return
      setDialog({ kind: 'actions', loading: false, error: '', rows: Array.isArray(list) ? list : [] })
    } catch (e) {
      if (seq !== dialogSeq.current) return
      setDialog({ kind: 'actions', loading: false, error: errorText(e) || '加载失败', rows: [] })
    }
  }

  async function showEdits(type: ContentType, id: number) {
    const seq = ++dialogSeq.current
    setDialog({ kind: 'edits', loading: true, error: '', rows: [] })
    try {
      const list = unwrap<EditRow[]>(await api.get(`/forum/admin/${type}/${id}/edits`))
      if (seq !== dialogSeq.current) return
      setDialog({ kind: 'edits', loading: false, error: '', rows: Array.isArray(list) ? list : [] })
    } catch (e) {
      if (seq !== dialogSeq.current) return
      setDialog({ kind: 'edits', loading: false, error: errorText(e) || '加载失败', rows: [] })
    }
  }

  async function moderate(type: ContentType, id: number, decision: Decision) {
    const title = decision === 'delete' ? '删除内容' : '保留内容'
    const answer = window.prompt(`请填写处理原因（${title}，1 至 500 字）`)
    if (answer === null) return
    const reason = answer.trim()
    if (!reason || reason.length > 500) {
      setNotice({ text: '请输入 1 至 500 字的处理原因', error: true })
      return
    }

    setNotice(null)
    try {
      unwrap(await api.post(`/forum/admin/${type}/${id}/moderate`, { decision, reason }))
      setNotice({ text: decision === 'delete' ? '已删除该内容' : '已保留该内容', error: false })
      setReloadKey((value) => value + 1)
    } catch (e) {
      setNotice({ text: errorText(e) || '处理失败', error: true })
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <PageShell title="ADMIN · FORUM" subtitle="举报与帖子审核">
      <div className="page-actions-row">
        <button
          type="button"
          className={tab === 'reports' ? 'page-btn primary' : 'page-btn'}
          onClick={() => switchTab('reports')}
        >
          举报记录
        </button>
        <button
          type="button"
          className={tab === 'posts' ? 'page-btn primary' : 'page-btn'}
          onClick={() => switchTab('posts')}
        >
          全部帖子
        </button>
      </div>

      {notice && <div className={notice.error ? 'page-card error' : 'page-card'}>{notice.text}</div>}
      {error && <div className="page-card error">{error}</div>}
      {loading && <div className="page-card">正在加载…</div>}

      {!loading && !error && (
        <div className="forum-list">
          {!rows.length && <div className="page-card">暂无记录</div>}

          {tab === 'reports' &&
            (rows as ReportRow[]).map((item) => {
              const type: ContentType = item.postId ? 'post' : 'reply'
              const targetId = item.postId || item.replyId || 0
              const forumTarget = item.postId || item.replyPostId
              return (
                <div className="page-card" key={item.id}>
                  <div className="page-actions-row">
                    <strong>{item.postId ? '帖子' : '回复'} #{targetId}</strong>
                    <span className="meta" style={{ color: item.status === 'pending' ? '#fbbf24' : '#a5f3fc' }}>
                      {statusText(item.status)}
                    </span>
                    <span className="meta">{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="post-content">{item.targetText || '（无内容摘要）'}</p>
                  <p className="meta">
                    {item.reporterName || '匿名用户'} 举报：{item.reason || '未填写原因'}
                    {item.detail ? ` · ${item.detail}` : ''}
                  </p>
                  <div className="page-actions-row">
                    <Link className="page-btn" to={forumTarget ? `/forum/${forumTarget}` : '/forum'}>
                      查看内容
                    </Link>
                    <button type="button" className="page-btn" onClick={() => void showActions(type, targetId)}>
                      操作记录
                    </button>
                    <button type="button" className="page-btn" onClick={() => void showEdits(type, targetId)}>
                      修改历史
                    </button>
                    {item.status === 'pending' && (
                      <>
                        <button type="button" className="page-btn" onClick={() => void moderate(type, targetId, 'retain')}>
                          保留
                        </button>
                        <button
                          type="button"
                          className="page-btn"
                          style={{ color: '#FF8FA3' }}
                          onClick={() => void moderate(type, targetId, 'delete')}
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

          {tab === 'posts' &&
            (rows as PostRow[]).map((item) => (
              <div className="page-card" key={item.id}>
                <div className="page-actions-row">
                  <Link to={`/forum/${item.id}`} style={{ color: 'var(--cyan)' }}>
                    <strong>#{item.id} {item.title || '（无标题）'}</strong>
                  </Link>
                  <span className="meta" style={{ color: item.status === 'deleted' ? '#fda4af' : '#fbbf24' }}>
                    {statusText(item.status)}
                  </span>
                </div>
                <p className="meta">
                  {item.authorName || '未知作者'} · {formatTime(item.createdAt)} · {Number(item.replyCount) || 0} 条可见回复
                </p>
                <div className="page-actions-row">
                  <button type="button" className="page-btn" onClick={() => void showActions('post', item.id)}>
                    操作记录
                  </button>
                  <button type="button" className="page-btn" onClick={() => void showEdits('post', item.id)}>
                    修改历史
                  </button>
                  {item.status !== 'deleted' && (
                    <>
                      <button type="button" className="page-btn" onClick={() => void moderate('post', item.id, 'retain')}>
                        保留
                      </button>
                      <button
                        type="button"
                        className="page-btn"
                        style={{ color: '#FF8FA3' }}
                        onClick={() => void moderate('post', item.id, 'delete')}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="page-pager">
          <button type="button" className="page-btn" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
            上一页
          </button>
          <span>{page + 1} / {pageCount}</span>
          <button
            type="button"
            className="page-btn"
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((value) => value + 1)}
          >
            下一页
          </button>
        </div>
      )}

      {dialog && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background: 'rgba(3,10,18,.72)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="page-card"
            style={{ width: 'min(90vw, 750px)', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="page-actions-row" style={{ justifyContent: 'space-between' }}>
              <h3>{dialog.kind === 'actions' ? '操作记录' : '修改历史'}</h3>
              <button type="button" className="page-btn" onClick={closeDialog}>关闭</button>
            </div>

            {dialog.loading && <p className="meta">正在加载…</p>}
            {!dialog.loading && dialog.error && <p className="page-card error">{dialog.error}</p>}
            {!dialog.loading && !dialog.error && !dialog.rows.length && (
              <p className="meta">{dialog.kind === 'actions' ? '暂无操作记录' : '暂无修改记录'}</p>
            )}

            {!dialog.loading && !dialog.error && dialog.kind === 'actions' && dialog.rows.map((action) => (
              <div
                key={action.id}
                style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}
              >
                <p className="meta">
                  {formatTime(action.createdAt)} · {action.operatorName || '系统'} · {action.action || '-'}（
                  {action.previousStatus || '-'} → {action.newStatus || '-'}）
                </p>
                {action.reason && <p className="meta">{action.reason}</p>}
              </div>
            ))}

            {!dialog.loading && !dialog.error && dialog.kind === 'edits' && dialog.rows.map((edit) => (
              <div
                key={edit.id}
                style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}
              >
                <p className="meta">{formatTime(edit.createdAt)} · {edit.editorName || '未知编辑者'}</p>
                {edit.oldTitle !== null && edit.oldTitle !== undefined && (
                  <p className="meta">标题：{edit.oldTitle} → {edit.newTitle ?? ''}</p>
                )}
                <p className="post-content">原内容：{edit.oldContent ?? ''}</p>
                <p className="post-content">修改后：{edit.newContent ?? ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}
