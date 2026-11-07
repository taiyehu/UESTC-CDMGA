import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PageShell from '../components/PageShell'
import { api } from '../api'

type BingoRow = {
  id: number
  taskId: string
  courseName: string
  account: string
  teamId: string
  uploadTime: string
  uploadTimeRaw: string
  image: string
  method: string
  remark: string
  issueId?: number | null
}

type Notice = { kind: 'ok' | 'warn' | 'error'; text: string } | null

const PAGE_SIZE = 5

const CENTER = { textAlign: 'center' as const }

function normalizeUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function extractTaskId(item: any): string {
  if (item?.issueId !== undefined && item?.issueId !== null && item?.issueId !== '') {
    return String(item.issueId)
  }
  const remark = item?.remark
  if (!remark) return '-'
  const matched = String(remark).match(/#(\d+)/)
  return matched?.[1] || '-'
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ')
  return date.toLocaleString('zh-CN')
}

function apiMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string } | null
  if (err?.response?.data?.message) return err.response.data.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function AdminBingoSubmissionsPage() {
  const [rows, setRows] = useState<BingoRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [pendingStatus, setPendingStatus] = useState<Record<number, number | undefined>>({})
  const [previewImage, setPreviewImage] = useState('')

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    if (!previewImage) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPreviewImage('')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previewImage])

  async function fetchBingoRows() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/score/unscored-bingo', { params: { page: 0, size: 1000 } })
      if (typeof res.data?.code === 'number' && res.data.code !== 0) {
        throw new Error(res.data?.message || '获取 Bingo 提交失败')
      }
      const payload = res.data?.data ?? res.data ?? {}
      const list: any[] = Array.isArray(payload) ? payload : Array.isArray(payload.list) ? payload.list : []
      const mapped: BingoRow[] = list.map((item: any) => ({
        id: Number(item.id),
        taskId: extractTaskId(item),
        courseName: String(item?.courseName || item?.course?.title || '-'),
        account: String(item?.account || item?.identity?.account || '-'),
        teamId: item?.teamId === null || item?.teamId === undefined ? '-' : String(item.teamId),
        uploadTime: formatDateTime(item.uploadTime),
        uploadTimeRaw: item.uploadTime || '',
        image: normalizeUrl(item.image),
        method: String(item?.remark || '-'),
        remark: String(item?.remark || ''),
        issueId: item?.issueId ?? null,
      }))
      setRows(mapped)
      setCurrentPage(1)
    } catch (err) {
      setRows([])
      setCurrentPage(1)
      setError(apiMessage(err, '获取 Bingo 提交失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBingoRows()
    // Fetch once on mount; use the refresh button for manual reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reviewScore(row: BingoRow, status: number) {
    if (pendingStatus[row.id]) return
    setPendingStatus((prev) => ({ ...prev, [row.id]: status }))
    setNotice(null)
    try {
      const res = await api.put(`/score/update/${row.id}`, {
        upload_time: row.uploadTimeRaw,
        image: row.image,
        point: status,
        is_scored: true,
        issue_id: row.issueId,
        remark: row.remark,
      })
      if (typeof res.data?.code === 'number' && res.data.code !== 0) {
        throw new Error(res.data?.message || '处理失败，请重试')
      }
      // Drop the handled row locally instead of re-fetching the whole queue.
      setRows((prev) => prev.filter((item) => item.id !== row.id))
      setNotice({ kind: status === 2 ? 'ok' : 'warn', text: `成绩 ${row.id} 已处理` })
    } catch (err) {
      setNotice({ kind: 'error', text: apiMessage(err, '处理失败，请重试') })
    } finally {
      setPendingStatus((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
    }
  }

  function handlePageChange(next: number) {
    setCurrentPage(Math.min(totalPages, Math.max(1, next)))
  }

  const noticeColor = notice?.kind === 'error' ? '#ff8fa3' : notice?.kind === 'warn' ? '#fde68a' : '#d1fae5'

  return (
    <PageShell
      title="ADMIN · BINGO"
      subtitle="待审核的 Bingo 题目提交"
      actions={
        <button className="page-btn" type="button" disabled={loading} onClick={() => void fetchBingoRows()}>
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
            color: noticeColor,
          }}
        >
          <span>{notice.text}</span>
          <button className="page-btn small" type="button" onClick={() => setNotice(null)}>关闭</button>
        </div>
      )}

      {loading && <div className="page-card">载入中…</div>}
      {!loading && error && (
        <div className="page-card error">
          <p style={{ margin: 0 }}>{error}</p>
          <div className="page-actions-row">
            <button className="page-btn" type="button" onClick={() => void fetchBingoRows()}>重试</button>
          </div>
        </div>
      )}
      {!loading && !error && !rows.length && <div className="page-card">暂无待审核的 Bingo 提交</div>}

      {!!rows.length && (
        <div className="page-card" style={{ overflowX: 'auto' }}>
          <table className="page-table" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th style={CENTER}>成绩ID</th>
                <th style={CENTER}>题目ID</th>
                <th style={CENTER}>课题名称</th>
                <th style={CENTER}>用户名</th>
                <th style={CENTER}>Team ID</th>
                <th style={CENTER}>上传时间</th>
                <th style={CENTER}>图片</th>
                <th style={CENTER}>补充说明</th>
                <th style={CENTER}>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                const busyStatus = pendingStatus[row.id]
                const busy = Boolean(busyStatus)
                return (
                  <tr key={row.id}>
                    <td className="mono" style={CENTER}>{row.id}</td>
                    <td className="mono" style={CENTER}>{row.taskId}</td>
                    <td style={CENTER}>{row.courseName}</td>
                    <td style={CENTER}>{row.account}</td>
                    <td className="mono" style={CENTER}>{row.teamId}</td>
                    <td style={CENTER}>{row.uploadTime}</td>
                    <td style={CENTER}>
                      {row.image ? (
                        <img
                          loading="lazy"
                          src={row.image}
                          alt="提交图片"
                          onClick={() => setPreviewImage(row.image)}
                          style={{
                            width: 64,
                            height: 64,
                            margin: '0 auto',
                            display: 'block',
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid rgba(34,211,238,.35)',
                            cursor: 'zoom-in',
                          }}
                        />
                      ) : '-'}
                    </td>
                    <td style={{ textAlign: 'left', overflowWrap: 'anywhere' }}>{row.method}</td>
                    <td style={CENTER}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 8 }}>
                        <button
                          className="page-btn small"
                          type="button"
                          disabled={busy}
                          onClick={() => void reviewScore(row, 2)}
                          style={{
                            borderColor: 'rgba(52,211,153,.55)',
                            color: '#d1fae5',
                            boxShadow: busyStatus === 2 ? '0 0 12px rgba(34,211,238,.45)' : undefined,
                          }}
                        >
                          {busyStatus === 2 ? '处理中…' : '通过'}
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                          <button
                            className="page-btn small"
                            type="button"
                            disabled={busy}
                            onClick={() => void reviewScore(row, -2)}
                            style={{
                              borderColor: 'rgba(251,191,36,.55)',
                              color: '#fde68a',
                              boxShadow: busyStatus === -2 ? '0 0 12px rgba(34,211,238,.45)' : undefined,
                            }}
                          >
                            {busyStatus === -2 ? '处理中…' : '曲目不对'}
                          </button>
                          <button
                            className="page-btn small"
                            type="button"
                            disabled={busy}
                            onClick={() => void reviewScore(row, -1)}
                            style={{
                              borderColor: 'rgba(248,113,113,.55)',
                              color: '#fecaca',
                              boxShadow: busyStatus === -1 ? '0 0 12px rgba(34,211,238,.45)' : undefined,
                            }}
                          >
                            {busyStatus === -1 ? '处理中…' : '游玩方式不对'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="page-pager" style={{ flexWrap: 'wrap' }}>
        <button className="page-btn small" type="button" disabled={currentPage <= 1} onClick={() => handlePageChange(1)}>首页</button>
        <button className="page-btn small" type="button" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>上一页</button>
        <span className="mono">{currentPage} / {totalPages}</span>
        <button className="page-btn small" type="button" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)}>下一页</button>
        <button className="page-btn small" type="button" disabled={currentPage >= totalPages} onClick={() => handlePageChange(totalPages)}>尾页</button>
      </div>

      {previewImage && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          onClick={(event) => { if (event.target === event.currentTarget) setPreviewImage('') }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2,6,23,.72)',
            padding: 20,
          }}
        >
          <div style={{ width: 'min(900px,96vw)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <button className="page-btn" type="button" onClick={() => setPreviewImage('')} style={{ marginBottom: 12 }}>关闭</button>
            <img
              src={previewImage}
              alt="图片预览"
              style={{ width: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: 10 }}
            />
          </div>
        </div>,
        document.body,
      )}
    </PageShell>
  )
}
