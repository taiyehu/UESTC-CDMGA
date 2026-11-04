import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import PageShell from '../components/PageShell'
import TaskBingoOverview from '../components/TaskBingoOverview'
import { fetchCourseById, type Course } from '../api'

type ScoreHistory = { id: number; uploadTime?: string; image?: string; remark?: string; isScored?: boolean; score?: number }
type TypicalItem = { id: number; title: string; description: string; image?: string; file?: string; level: string }
type IssueItem = { issueId: number; image?: string; text?: string; file?: string; songName?: string }

const LEVELS = ['简单', '一般', '困难']

function parseTypicalItems(course: Course): TypicalItem[] {
  const raw = String(course.description ?? '').trim()
  let source: unknown[] = []
  try {
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) source = parsed
    else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).typicalItems)) source = (parsed as { typicalItems: unknown[] }).typicalItems
    else if (raw.includes('|')) source = raw.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [id, title, description, image] = line.split('|'); return { id: Number(id), title, description, image } })
  } catch { source = [] }
  if (!source.length) source = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, title: `${course.title} - 子课题 ${i + 1}`, description: '该子课题暂未填写具体描述。', level: LEVELS[i] ?? '困难' }))
  return source.slice(0, 6).map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return { id: Number(record.id) || index + 1, title: String(record.title ?? `子课题 ${index + 1}`), description: String(record.description ?? ''), image: record.image ? String(record.image) : '', file: record.file ? String(record.file) : '', level: String(record.level ?? LEVELS[index] ?? '困难') }
  })
}
function resolveAsset(path?: string) { if (!path) return ''; return /^https?:\/\//i.test(path) || path.startsWith('blob:') ? path : path.startsWith('/') ? path : `/${path}` }
function isAudio(path?: string) { return /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(String(path || '').split('?')[0]) }

export default function TaskDetailPage() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scoreOpen, setScoreOpen] = useState(false)
  const [scoreImage, setScoreImage] = useState('')
  const [scoreRemark, setScoreRemark] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scoreFeedback, setScoreFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<ScoreHistory[]>([])
  const [scoreId, setScoreId] = useState(0)
  const [issues, setIssues] = useState<Map<number, IssueItem>>(new Map())

  function identityId() { try { const u = JSON.parse(sessionStorage.getItem('userInfo') || 'null'); return Number(u?.id || u?.identityId || 0) } catch { return 0 } }

  async function loadIssues(courseId: number) {
    try {
      const res = await api.get(`/issue/course/${courseId}`, { params: { page: 0, size: 6 } })
      const list = Array.isArray(res.data?.list) ? res.data.list : Array.isArray(res.data?.data?.list) ? res.data.data.list : []
      const next = new Map<number, IssueItem>()
      for (const item of list) { const id = Number(item?.issueId); if (Number.isFinite(id)) next.set(id, { issueId: id, image: item?.image || '', text: item?.text || '', file: item?.file || '', songName: item?.songName || '' }) }
      setIssues(next)
    } catch { setIssues(new Map()) }
  }

  async function loadScoreState(courseId: number) {
    const uid = identityId(); if (!uid) return
    try { const ex = await api.get('/score/exists', { params: { identityId: uid, courseId } }); setSubmitted(Boolean(ex.data)) } catch { setSubmitted(false) }
    try { const h = await api.get('/score/history', { params: { identity_id: uid, course_id: courseId } }); const rows = h.data?.list || []; setHistory(rows); setScoreId(Number(rows[0]?.id || 0)) } catch { setHistory([]); setScoreId(0) }
  }

  useEffect(() => {
    const courseId = Number(id)
    if (!Number.isFinite(courseId)) { setError('课题编号无效'); setLoading(false); return }
    fetchCourseById(courseId)
      .then((data) => { setCourse(data); if (data) { void loadScoreState(courseId); void loadIssues(courseId) } })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  async function uploadScoreImage(file?: File) {
    if (!file) return
    setUploading(true); setScoreFeedback('')
    try {
      const form = new FormData(); form.append('image', file)
      const res = await api.post('/score/upload', form)
      if (res.data?.code !== 0) throw new Error(res.data?.message || '上传失败')
      setScoreImage(String(res.data.data || ''))
    } catch (e) { setScoreFeedback(e instanceof Error ? e.message : '上传失败') }
    finally { setUploading(false) }
  }

  async function submitScore() {
    if (!course) return
    const raw = sessionStorage.getItem('userInfo')
    let identityId = 0
    try { const u = raw ? JSON.parse(raw) : null; identityId = Number(u?.id || u?.identityId || 0) } catch { identityId = 0 }
    if (!identityId) { setScoreFeedback('登录状态失效，请重新登录'); return }
    if (!course.award && !scoreImage && !history[0]?.image) { setScoreFeedback('请先上传成绩图片'); return }
    const d = new Date(); const p = (n: number) => String(n).padStart(2, '0')
    const uploadTime = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    setSubmitting(true); setScoreFeedback('')
    try {
      const res = submitted && scoreId
        ? await api.put(`/score/update/${scoreId}`, { upload_time: uploadTime, image: scoreImage, remark: scoreRemark })
        : await api.post('/score/post', { course_id: course.id, identity_id: identityId, upload_time: uploadTime, image: course.award ? course.image || '' : scoreImage, remark: scoreRemark })
      if (res.data?.code !== 0) throw new Error(res.data?.message || '提交失败')
      setScoreFeedback(course.award ? '兑换申请已提交' : (submitted ? '成绩已更新' : '成绩提交成功'))
      setScoreImage(''); setScoreRemark(''); await loadScoreState(course.id)
    } catch (e) { setScoreFeedback(e instanceof Error ? e.message : '成绩提交失败，请重试') }
    finally { setSubmitting(false) }
  }

  const category = String(course?.category || '').trim().toLowerCase()
  if (course && category === 'bingo') return <PageShell title="TASK DETAIL" subtitle={course.title}><TaskBingoOverview course={course} /></PageShell>
  const typicalItems = course && category === 'typical' ? parseTypicalItems(course).map((item) => {
    const issue = issues.get(item.id)
    return { ...item, title: issue?.songName?.trim() ? issue.songName : item.title, description: issue?.text?.trim() ? issue.text : item.description, image: issue?.image || item.image || '', file: issue?.file || '' }
  }) : []

  return (
    <PageShell title="TASK DETAIL" subtitle={course?.title}>
      <div className="page-actions-row"><Link className="page-btn" to="/task">← 返回课题</Link></div>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && !course && <div className="page-card">课题不存在</div>}
      {course && (
        <div className="detail-grid">
          <div className="page-card detail-cover" style={{ backgroundImage: `url(${course.image || '/maimai-og.jpg'})` }} />
          <div className="page-card">
            <div className="card-k">{String(course.category || '课题').toUpperCase()}</div>
            <h2>{course.title}</h2>
            <p className="meta">{course.startTime} — {course.endTime}</p>
            <p className="desc">{course.description || '暂无课题描述'}</p>
            {course.award && <p className="meta">兑换积分：{course.award.cost ?? '-'} · 剩余 {course.award.remainingStock ?? 0}/{course.award.totalStock ?? 0}</p>}
            <div className="page-actions-row">
              {String(course.category || '').toLowerCase().includes('bingo') ? <Link className="page-btn primary" to={`/task/${course.id}/bingo/1`}>进入 Bingo 网格</Link> : <button className="page-btn primary" type="button" onClick={() => { setScoreFeedback(''); const latest = history[0]; if (submitted && latest) { setScoreImage(latest.image || ''); setScoreRemark(latest.remark || '') } else { setScoreImage(''); setScoreRemark('') }; setScoreOpen(true) }}>{course.award ? '申请兑换' : submitted ? '更新成绩' : '提交成绩'}</button>}
              <Link className="page-btn" to="/task">返回列表</Link>
            </div>
          </div>
        </div>
      )}
      {category === 'sign' && <div className="page-card"><div className="card-k">SIGN</div><h3>现场签到课题</h3><p className="desc">请在活动现场扫描动态二维码签到，成功后自动获得 10 分。</p></div>}
      {typicalItems.length > 0 && <section className="task-subtasks">
        <div className="page-actions-row" style={{ justifyContent: 'space-between' }}><h2>子课题</h2><span className="meta">共 {typicalItems.length} 项</span></div>
        <div className="page-grid">
          {typicalItems.map((item) => <article className="page-card subtask-card" key={item.id}>
            <div className="subtask-cover" style={item.image ? { backgroundImage: `url(${resolveAsset(item.image)})` } : undefined} />
            <div className="subtask-body"><div className="card-k">难度：{item.level}</div><h3>#{item.id} {item.title}</h3><p className="desc">{item.description || '暂无描述'}</p>
              {item.file && (isAudio(item.file) ? <audio controls preload="none" src={resolveAsset(item.file)} /> : <a className="page-btn small" href={resolveAsset(item.file)} target="_blank" rel="noreferrer">查看附件</a>)}
            </div>
          </article>)}
        </div>
      </section>}
      {!!history.length && <section className="page-card score-history">
        <div className="card-k">MY SUBMISSIONS</div>
        <h3>我的提交</h3>
        <div className="score-history-list">
          {history.map((row) => <div className="score-history-row" key={row.id}>
            <span>{row.uploadTime ? new Date(row.uploadTime).toLocaleString('zh-CN') : '-'}</span>
            <span>{row.isScored ? `${row.score ?? 0} 分` : '审核中'}</span>
            <span>{row.remark || '-'}</span>
            {row.image && <a href={row.image} target="_blank" rel="noreferrer">图片</a>}
          </div>)}
        </div>
      </section>}
      {scoreOpen && (
        <div className="score-modal-mask" onClick={(e) => { if (e.target === e.currentTarget && !submitting) setScoreOpen(false) }}>
          <div className="score-modal" role="dialog" aria-modal="true" aria-label={course?.award ? '申请兑换' : submitted ? '更新成绩' : '提交成绩'}>
            <div className="score-modal-head"><div><div className="card-k">SCORE SUBMIT</div><h2>{course?.award ? '申请兑换' : submitted ? '更新成绩' : '提交成绩'}</h2></div><button className="icon-btn" type="button" aria-label="关闭" onClick={() => setScoreOpen(false)}>×</button></div>
            <p className="meta">{course?.title}</p>
            {!course?.award && <><label className="score-label">成绩图片</label><input className="score-file" type="file" accept="image/*" onChange={(e) => void uploadScoreImage(e.target.files?.[0])} />{uploading && <p className="meta">上传中…</p>}{scoreImage && <img className="score-preview" src={scoreImage} alt="成绩预览" />}</>}
            <label className="score-label">补充说明</label>
            <textarea className="page-input area" maxLength={500} placeholder="可选，填写补充说明" value={scoreRemark} onChange={(e) => setScoreRemark(e.target.value)} />
            {scoreFeedback && <div className={scoreFeedback.includes('成功') || scoreFeedback.includes('提交') ? 'score-feedback ok' : 'score-feedback error'}>{scoreFeedback}</div>}
            <div className="page-actions-row"><button className="page-btn primary" type="button" disabled={submitting || uploading} onClick={() => void submitScore()}>{submitting ? '提交中…' : course?.award ? '提交申请' : submitted ? '确认更新' : '确认提交'}</button><button className="page-btn" type="button" disabled={submitting} onClick={() => setScoreOpen(false)}>取消</button></div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
