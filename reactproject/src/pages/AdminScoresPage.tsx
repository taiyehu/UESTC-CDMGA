import { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import { api } from '../api'

type ScoreRow = {
  id: number
  uploadTime?: string | null
  image?: string | null
  score?: number | null
  isScored?: boolean | null
  remark?: string | null
  course?: {
    id?: number
    title?: string
    category?: string | null
    award?: { cost?: number } | null
  } | null
  identity?: {
    account?: string | null
  } | null
}

const PAGE_SIZE = 5

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN')
}

function formatUploadTime(value?: string | null): string {
  const date = value ? new Date(value) : new Date()
  const safe = Number.isNaN(date.getTime()) ? new Date() : date
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${safe.getFullYear()}-${pad(safe.getMonth() + 1)}-${pad(safe.getDate())}T${pad(safe.getHours())}:${pad(safe.getMinutes())}:${pad(safe.getSeconds())}`
}

function awardCost(score: ScoreRow): number {
  return Number(score.course?.award?.cost ?? 0)
}

export default function AdminScoresPage() {
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(scores.length / PAGE_SIZE))
  const pagedScores = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return scores.slice(start, start + PAGE_SIZE)
  }, [scores, page])

  async function loadScores(): Promise<void> {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/score/unscored-non-bingo', { params: { page: 0, size: 1000 } })
      const list: ScoreRow[] = res.data?.list ?? res.data?.data?.list ?? []
      setScores(Array.isArray(list) ? list : [])

      const nextDrafts: Record<number, string> = {}
      for (const item of Array.isArray(list) ? list : []) {
        nextDrafts[item.id] = item.score == null ? '' : String(item.score)
      }
      setDrafts(nextDrafts)
      setPage(1)
    } catch (e) {
      setScores([])
      setError(e instanceof Error ? `获取成绩列表失败：${e.message}` : '获取成绩列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadScores()
  }, [])

  function setDraft(scoreId: number, value: string): void {
    setDrafts((prev) => ({ ...prev, [scoreId]: value }))
  }

  function changePage(target: number): void {
    setPage(Math.min(totalPages, Math.max(1, target)))
  }

  async function updateScore(score: ScoreRow): Promise<void> {
    setNotice(null)
    const raw = drafts[score.id]
    let point = score.course?.category === 'award' ? -awardCost(score) : Number(raw)
    if (!Number.isFinite(point)) {
      setNotice({ type: 'error', text: '请输入有效分数' })
      return
    }
    if (score.course?.category === 'contest') {
      point -= 10000000
    }

    const payload = {
      id: score.id,
      upload_time: formatUploadTime(score.uploadTime),
      image: score.image,
      point,
      is_scored: true,
      remark: score.remark,
    }

    setBusyId(score.id)
    try {
      const res = await api.put(`/score/update/${score.id}`, payload)
      if (res.data?.code !== undefined && res.data.code !== 0) {
        throw new Error(res.data?.message || '成绩提交失败，请重试')
      }
      setNotice({ type: 'ok', text: '成绩提交成功' })
      await loadScores()
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setNotice({ type: 'error', text: message || (e instanceof Error ? e.message : '成绩提交失败，请重试') })
    } finally {
      setBusyId(null)
    }
  }

  async function rejectAward(score: ScoreRow): Promise<void> {
    const reason = window.prompt('请输入驳回原因（可留空）', '')
    if (reason === null) return

    setNotice(null)
    setBusyId(score.id)
    try {
      const res = await api.put(`/score/award/${score.id}/reject`, { reason })
      if (res.data?.code !== 0) throw new Error(res.data?.message || '驳回失败')
      setNotice({ type: 'ok', text: '兑换申请已驳回' })
      await loadScores()
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setNotice({ type: 'error', text: message || (e instanceof Error ? e.message : '驳回失败') })
    } finally {
      setBusyId(null)
    }
  }

  async function rejectScore(score: ScoreRow): Promise<void> {
    const reason = window.prompt('请输入未通过理由', '')
    if (reason === null) return
    if (!reason.trim()) { setNotice({ type: 'error', text: '请填写未通过理由' }); return }
    setNotice(null)
    setBusyId(score.id)
    try {
      const res = await api.put(`/score/${score.id}/reject`, { reason: reason.trim() })
      if (res.data?.code !== 0) throw new Error(res.data?.message || '驳回失败')
      setNotice({ type: 'ok', text: '已驳回并通知用户' })
      await loadScores()
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setNotice({ type: 'error', text: message || (e instanceof Error ? e.message : '驳回失败') })
    } finally { setBusyId(null) }
  }

  async function deleteScore(scoreId: number): Promise<void> {
    if (!window.confirm('确定删除成绩？删除后用户需重新提交')) return

    setNotice(null)
    setBusyId(scoreId)
    try {
      await api.delete(`/score/delete/${scoreId}`)
      setNotice({ type: 'ok', text: '成绩删除成功' })
      await loadScores()
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? `成绩删除失败：${e.message}` : '成绩删除失败' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageShell
      title="ADMIN · SCORES"
      subtitle="课题成绩与奖品审核"
      actions={<button className="page-btn" type="button" disabled={loading} onClick={() => void loadScores()}>刷新</button>}
    >
      {notice && <div className={`page-card${notice.type === 'error' ? ' error' : ''}`}>{notice.text}</div>}
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !scores.length && <div className="page-card">暂无待审核成绩</div>}

      {!loading && !error && !!scores.length && (
        <div className="page-card" style={{ overflowX: 'auto' }}>
          <table className="page-table">
            <thead>
              <tr>
                <th>成绩ID</th>
                <th>课题名称</th>
                <th>用户名</th>
                <th>上传时间</th>
                <th>图片</th>
                <th>备注</th>
                <th>评分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedScores.map((score) => {
                const imageUrl = getImageUrl(score.image)
                const isAward = score.course?.category === 'award'
                const busy = busyId === score.id
                return (
                  <tr key={score.id}>
                    <td>{score.id}</td>
                    <td>{score.course?.title || '-'}</td>
                    <td>{score.identity?.account || '-'}</td>
                    <td>{formatDateTime(score.uploadTime)}</td>
                    <td>
                      {imageUrl ? (
                        <img
                          loading="lazy"
                          src={imageUrl}
                          alt="成绩图片"
                          onClick={() => setPreview(imageUrl)}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid rgba(34, 211, 238, 0.35)',
                            cursor: 'zoom-in',
                          }}
                        />
                      ) : '-'}
                    </td>
                    <td>
                      <p
                        title={score.remark || '-'}
                        style={{ maxWidth: 280, margin: '0 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {score.remark || '-'}
                      </p>
                    </td>
                    <td>
                      {isAward ? (
                        <span>消耗 {awardCost(score)} 分</span>
                      ) : (
                        <input
                          className="page-input"
                          style={{ width: 96, margin: '0 auto', textAlign: 'center' }}
                          placeholder="分数"
                          value={drafts[score.id] ?? ''}
                          onChange={(e) => setDraft(score.id, e.target.value)}
                        />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                        <button className="page-btn small" type="button" disabled={busy} onClick={() => void updateScore(score)}>
                          通过
                        </button>
                        {isAward && (
                          <button className="page-btn small" type="button" disabled={busy} onClick={() => void rejectAward(score)}>
                            驳回
                          </button>
                        )}
                        {!isAward && <button className="page-btn small" type="button" disabled={busy} onClick={() => void rejectScore(score)}>驳回</button>}
                        <button className="page-btn small" type="button" disabled={busy} onClick={() => void deleteScore(score.id)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="page-pager">
        <button className="page-btn" type="button" disabled={page <= 1} onClick={() => changePage(1)}>
          首页
        </button>
        <button className="page-btn" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>
          上一页
        </button>
        <span>{page} / {totalPages}（共 {scores.length} 条）</span>
        <button className="page-btn" type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>
          下一页
        </button>
        <button className="page-btn" type="button" disabled={page >= totalPages} onClick={() => changePage(totalPages)}>
          尾页
        </button>
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 6, 23, 0.72)',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(900px, 96vw)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}
          >
            <button className="page-btn" type="button" onClick={() => setPreview(null)}>关闭</button>
            <img
              src={preview}
              alt="图片预览"
              style={{ width: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: 10 }}
            />
          </div>
        </div>
      )}
    </PageShell>
  )
}
