import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import BingoGrid from '../components/BingoGrid'
import '../components/TaskBingoOverview.css'
import { api, fetchCourseById, type Course } from '../api'

type BingoItem = { id: number; title: string; description: string }
type IssueRecord = { text?: string; image?: string; file?: string; songName?: string }
type TipItem = { id: number; tip: string; teamId: number; teamName?: string; createdAt?: string }
type BoardCell = { maxScore: number; myCompleted: boolean; myScore: number }
type ScoreRow = { id: number; uploadTime?: string; image?: string; remark?: string; isScored?: boolean; score?: number }
type ScoreStatus = 'connecting' | 'no-team' | 'pending' | 'ready' | 'done'
type Feedback = { type: 'ok' | 'error'; message: string }
type SelectedItem = BingoItem & { image?: string; file?: string; songName?: string }
type PentagonNode = { id: number; url: string; position?: string }

const TEAM_STYLES: CSSProperties[] = [
  {
    color: '#f8fafc',
    background: 'linear-gradient(145deg, rgba(30,64,175,.85), rgba(37,99,235,.78))',
    borderColor: 'rgba(96,165,250,.85)',
  },
  {
    color: '#ecfeff',
    background: 'linear-gradient(145deg, rgba(13,148,136,.85), rgba(20,184,166,.78))',
    borderColor: 'rgba(45,212,191,.85)',
  },
  {
    color: '#fff7ed',
    background: 'linear-gradient(145deg, rgba(180,83,9,.85), rgba(234,88,12,.78))',
    borderColor: 'rgba(251,146,60,.85)',
  },
]

function tryParseJson(source: string): unknown {
  try {
    return JSON.parse(source)
  } catch {
    return null
  }
}

function parseBingoItems(course: Course): BingoItem[] {
  const raw = String(course.description ?? '').trim()
  const parsed = raw ? tryParseJson(raw) : null

  let items: unknown[] = []
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).bingoItems)) {
    items = (parsed as { bingoItems: unknown[] }).bingoItems
  } else if (Array.isArray(parsed)) {
    items = parsed
  }

  if (!items.length) {
    return Array.from({ length: 25 }, (_, index) => {
      const id = index + 1
      return {
        id,
        title: `${course.title} Bingo ${id}`,
        description: '该 Bingo 题目暂未配置具体内容。',
      }
    })
  }

  return Array.from({ length: 25 }, (_, index) => {
    const id = index + 1
    const item = items[index]
    const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    return {
      id,
      title: String(record.title ?? `${course.title} Bingo ${id}`),
      description: String(record.description ?? '该 Bingo 题目暂未配置具体内容。'),
    }
  })
}

function normalizeCourse(raw: Course): Course {
  const record = raw as Course & Record<string, unknown>
  return {
    ...raw,
    title: String(record.title ?? ''),
    category: record.category != null ? String(record.category) : '',
    startTime: String(record.startTime ?? record.start_time ?? ''),
    endTime: String(record.endTime ?? record.end_time ?? ''),
    description: String(record.description ?? ''),
    image: String(record.image ?? ''),
  }
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN')
}

function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

function toUrl(path?: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

function isAudioFile(path?: string): boolean {
  const clean = (String(path || '').split('?')[0] || '').toLowerCase()
  return /\.(mp3|wav|ogg|m4a|flac|aac)$/.test(clean)
}

function formatTeamMarker(teamId?: number, teamName?: string): string {
  if (Number.isFinite(Number(teamId)) && Number(teamId) > 0) return `Team #${Number(teamId)}`
  const text = String(teamName || '').trim()
  const matched = text.match(/(\d+)/)
  return matched ? `Team #${matched[1]}` : '-'
}

function teamBadgeStyle(teamId?: number, teamName?: string): CSSProperties {
  const marker = formatTeamMarker(teamId, teamName)
  const num = Number((marker.match(/(\d+)/) || [])[1])
  const mod = Number.isFinite(num) && num > 0 ? num % 3 : 1
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    padding: '2px 8px',
    borderRadius: 999,
    border: '1px solid',
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    ...TEAM_STYLES[mod === 1 ? 0 : mod === 2 ? 1 : 2],
  }
}


function normalizeScoreRow(item: any): ScoreRow {
  return {
    id: Number(item?.id ?? 0),
    uploadTime: String(item?.uploadTime ?? item?.upload_time ?? ''),
    image: String(item?.image ?? ''),
    remark: String(item?.remark ?? ''),
    isScored: Boolean(item?.isScored ?? item?.is_scored),
    score: Number(item?.score ?? 0),
  }
}

function scoreRowText(row: ScoreRow): string {
  if (!row.isScored) return '审核中'
  const value = Number(row.score)
  if (value === -2) return '曲目不对'
  if (value === -1) return '方法不对'
  if (value > 0) return `${value}分`
  return '-'
}

function normalizePuzzleNodes(input: unknown[]): PentagonNode[] {
  const map = new Map<number, PentagonNode>()
  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const id = Number(record.id)
    const url = String(record.url || '').trim()
    if (!Number.isFinite(id) || id < 1 || id > 5 || !url) continue
    map.set(id, {
      id,
      url,
      position: record.position ? String(record.position) : undefined,
    })
  }
  return Array.from(map.values()).sort((a, b) => a.id - b.id)
}

async function optimizeImage(
  input: File,
  { maxSide, quality, format = 'image/webp' }: { maxSide: number; quality: number; format?: 'image/webp' | 'image/jpeg' },
): Promise<File> {
  if (!input.type.startsWith('image/') || ['image/svg+xml', 'image/gif'].includes(input.type)) return input

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(input)
  } catch {
    return input
  }

  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) return input
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality))
    if (!blob || blob.type !== format) return input
    if (scale === 1 && blob.size >= input.size) return input
    return new File(
      [blob],
      `${input.name.replace(/\.[^.]+$/, '')}.${format === 'image/jpeg' ? 'jpg' : 'webp'}`,
      { type: format },
    )
  } finally {
    bitmap.close()
  }
}


/**
 * Bingo issue detail. Loads the course, its 25 issue attachments, the current
 * team score, board colouring and bingo tips, and provides a compact score
 * submission form for the active issue.
 */
export default function TaskBingoDetailPage() {
  const { id, cellId: cellParam } = useParams()
  const navigate = useNavigate()

  const courseId = Number(id)
  const rawCellId = Number(cellParam)
  const cellId = Number.isFinite(rawCellId) ? Math.max(1, Math.min(25, Math.trunc(rawCellId))) : 1

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userInfo') || 'null')
    } catch {
      return null
    }
  }, [])
  const identityId = useMemo(() => {
    const value = Number(currentUser?.id ?? currentUser?.identityId ?? currentUser?.userId)
    return Number.isFinite(value) && value > 0 ? value : null
  }, [currentUser])

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [issueMap, setIssueMap] = useState<Map<number, IssueRecord>>(new Map())
  const [issueMarks, setIssueMarks] = useState<Map<number, string>>(new Map())
  const [myTeamId, setMyTeamId] = useState<number | null>(null)
  const [myTeamScore, setMyTeamScore] = useState(0)
  const [boardState, setBoardState] = useState<Map<number, BoardCell>>(new Map())
  const [currentTips, setCurrentTips] = useState<TipItem[]>([])
  const [isPentagonPuzzle, setIsPentagonPuzzle] = useState(false)
  const [pentagonNodes, setPentagonNodes] = useState<PentagonNode[]>([])
  const [pentagonDataUrl, setPentagonDataUrl] = useState('')

  const [teamRefresh, setTeamRefresh] = useState(0)
  const [scoreRefresh, setScoreRefresh] = useState(0)
  const [history, setHistory] = useState<ScoreRow[]>([])
  const [scoreStatus, setScoreStatus] = useState<ScoreStatus>('connecting')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [remark, setRemark] = useState('')
  const [image, setImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000)
    return () => clearInterval(timer)
  }, [])

  // Course + issue attachments.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setCourse(null)
    setIssueMap(new Map())
    setIssueMarks(new Map())

    if (!Number.isFinite(courseId) || courseId <= 0) {
      setError('课题 id 无效')
      setLoading(false)
      return
    }

    async function load() {
      try {
        const data = await fetchCourseById(courseId)
        if (cancelled) return
        if (!data) {
          setError('未找到对应课题数据')
          return
        }
        setCourse(normalizeCourse(data))

        try {
          const response = await api.get(`/issue/course/${courseId}`, { params: { page: 0, size: 25 } })
          if (cancelled) return
          const list = extractList(response.data)
          const nextMap = new Map<number, IssueRecord>()
          const nextMarks = new Map<number, string>()
          for (const item of list) {
            const issueId = Number(item?.issueId ?? item?.issue_id ?? item?.id)
            if (!Number.isFinite(issueId) || issueId <= 0) continue
            const text = String(item?.text ?? '')
            const imagePath = String(item?.image ?? '')
            const file = String(item?.file ?? '')
            const songName = String(item?.songName ?? item?.song_name ?? '')
            nextMap.set(issueId, { text, image: imagePath, file, songName })
            if (songName.trim()) nextMarks.set(issueId, songName.trim())
          }
          setIssueMap(nextMap)
          setIssueMarks(nextMarks)
        } catch {
          if (!cancelled) {
            setIssueMap(new Map())
            setIssueMarks(new Map())
          }
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [courseId])

  // Team panel, team score and bingo board state.
  useEffect(() => {
    let cancelled = false

    if (!identityId || !Number.isFinite(courseId) || courseId <= 0) {
      setMyTeamId(null)
      setMyTeamScore(0)
      setBoardState(new Map())
      return
    }

    async function load() {
      try {
        const panelResponse = await api.get(`/team/course/${courseId}/my`, { params: { identityId } })
        if (cancelled) return
        const panel = panelResponse.data?.code === 0
          ? panelResponse.data.data
          : (panelResponse.data && !('code' in panelResponse.data) ? panelResponse.data : null)
        const teamId = Number(panel?.teamId ?? panel?.team_id ?? 0) || null
        setMyTeamId(teamId)

        if (teamId) {
          try {
            const scoreResponse = await api.get(`/team/course/${courseId}/my-score`, { params: { identityId } })
            if (cancelled) return
            const score = scoreResponse.data?.code === 0
              ? Number(scoreResponse.data.data || 0)
              : Number(scoreResponse.data || 0)
            setMyTeamScore(Number.isFinite(score) ? score : 0)
          } catch {
            if (!cancelled) setMyTeamScore(0)
          }
        } else {
          setMyTeamScore(0)
        }
      } catch {
        if (!cancelled) {
          setMyTeamId(null)
          setMyTeamScore(0)
        }
      }

      try {
        const boardResponse = await api.get(`/team/course/${courseId}/board-state`, { params: { identityId } })
        if (cancelled) return
        const payload = boardResponse.data?.code === 0 ? boardResponse.data.data : boardResponse.data
        const cells = Array.isArray(payload?.cells) ? payload.cells : []
        const next = new Map<number, BoardCell>()
        for (const item of cells) {
          const issueId = Number(item?.issueId ?? item?.issue_id)
          const maxScore = Number(item?.maxScore ?? item?.max_score)
          if (!Number.isFinite(issueId) || issueId < 1 || issueId > 25) continue
          if (![2, 3, 5, 10, 15].includes(maxScore)) continue
          next.set(issueId, {
            maxScore,
            myCompleted: Boolean(item?.myCompleted ?? item?.my_completed),
            myScore: Number(item?.myScore ?? item?.my_score ?? 0),
          })
        }
        setBoardState(next)
      } catch {
        if (!cancelled) setBoardState(new Map())
      }
    }

    void load()
    return () => { cancelled = true }
  }, [courseId, identityId, teamRefresh])

  // Bingo tips and the current issue's submission state.
  useEffect(() => {
    let cancelled = false
    setCurrentTips([])
    setScoreStatus('connecting')

    if (!Number.isFinite(courseId) || courseId <= 0) return

    async function load() {
      try {
        const response = await api.get(`/bingo-tip/course/${courseId}/issue/${cellId}`)
        if (cancelled) return
        const payload = response.data?.code === 0 ? response.data.data : response.data
        const list = Array.isArray(payload) ? payload : []
        setCurrentTips(
          list
            .map((item: any) => ({
              id: Number(item?.id),
              tip: String(item?.tip || '').trim(),
              teamId: Number(item?.teamId ?? item?.team_id ?? 0),
              teamName: String(item?.teamName ?? item?.team_name ?? ''),
              createdAt: item?.createdAt ?? item?.created_at,
            }))
            .filter((item: TipItem) => Number.isFinite(item.id) && item.id > 0 && Boolean(item.tip)),
        )
      } catch {
        if (!cancelled) setCurrentTips([])
      }

      if (!identityId) {
        if (!cancelled) {
          setScoreStatus('no-team')
          setHistory([])
        }
        return
      }

      try {
        let response
        try {
          response = await api.get('/score/history/bingo-issue', { params: { identity_id: identityId, course_id: courseId, issue_id: cellId } })
        } catch {
          response = await api.get('/score/history', { params: { identity_id: identityId, course_id: courseId, issue_id: cellId } })
        }
        if (cancelled) return
        const payload = response.data?.data ?? response.data
        const rows = Array.isArray(payload?.list) ? payload.list : Array.isArray(payload) ? payload : []
        const normalized: ScoreRow[] = rows.map((item: any) => normalizeScoreRow(item))
        const teamFlag = payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'hasTeam')
          ? Boolean(payload.hasTeam)
          : true
        const hasPending = normalized.some((row) => !row.isScored)
        const hasPositive = normalized.some((row) => Number(row.score) > 0)
        setHistory(normalized)
        setScoreStatus(!teamFlag ? 'no-team' : hasPending ? 'pending' : hasPositive ? 'done' : 'ready')
      } catch {
        if (!cancelled) {
          setHistory([])
          setScoreStatus('no-team')
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [courseId, cellId, identityId, scoreRefresh])

  // Reset the submit form whenever the active issue changes.
  useEffect(() => {
    setSubmitOpen(false)
    setFeedback(null)
    setRemark(`[#${cellId}] `)
    setImage('')
  }, [cellId])

  const bingoItems = useMemo(() => (course ? parseBingoItems(course) : []), [course])

  const selectedItem = useMemo<SelectedItem>(() => {
    if (!course) {
      return { id: cellId, title: '', description: '', image: '', file: '', songName: '' }
    }
    const base = bingoItems[cellId - 1] ?? {
      id: cellId,
      title: `${course.title} Bingo ${cellId}`,
      description: '该 Bingo 题目暂未配置具体内容。',
    }
    const issue = issueMap.get(cellId)
    return {
      ...base,
      description: issue?.text?.trim() ? String(issue.text) : base.description,
      image: issue?.image || '',
      file: issue?.file || '',
      songName: issue?.songName || '',
    }
  }, [course, bingoItems, cellId, issueMap])

  const duration = useMemo(
    () => (course ? formatDuration(course.startTime, course.endTime) : ''),
    [course],
  )

  const detailHeading = course ? `${course.title}-ISSUE ${cellId}` : `ISSUE ${cellId}`
  const audioAttachment = isAudioFile(selectedItem.file)

  // Pentagon Puzzle descriptors are JSON attachments; expose their clue links.
  useEffect(() => {
    let cancelled = false
    setIsPentagonPuzzle(false)
    setPentagonNodes([])
    setPentagonDataUrl('')

    const filePath = String(selectedItem.file || '').trim()
    if (!filePath) return
    const cleanPath = (filePath.split('?')[0] || '').toLowerCase()
    if (!cleanPath.endsWith('.json')) return

    const url = toUrl(filePath)
    async function detect() {
      try {
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as Record<string, unknown>
        const puzzle = data?.['Pentagon Puzzle']
        if (Array.isArray(puzzle)) {
          if (cancelled) return
          setPentagonDataUrl(url)
          setIsPentagonPuzzle(true)
          setPentagonNodes(normalizePuzzleNodes(puzzle))
        }
      } catch {
        // Not a Pentagon Puzzle descriptor; fall back to a normal attachment link.
      }
    }

    void detect()
    return () => { cancelled = true }
  }, [selectedItem.file])

  const startMs = course ? new Date(course.startTime).getTime() : Number.NaN
  const endMs = course ? new Date(course.endTime).getTime() : Number.NaN
  const beforeStart = Number.isFinite(startMs) && now < startMs
  const afterEnd = Number.isFinite(endMs) && now > endMs

  const scoreButtonText = (() => {
    if (beforeStart) return '等待课题开始'
    if (afterEnd) return '课题已结束'
    if (scoreStatus === 'connecting') return '等待连接'
    if (scoreStatus === 'no-team') return '请先加入队伍'
    if (scoreStatus === 'pending') return '成绩审核中'
    if (scoreStatus === 'done') return '已完成'
    return history.length > 0 ? `重新提交第${cellId}题` : `提交第${cellId}题`
  })()
  const scoreDisabled = beforeStart || afterEnd || scoreStatus !== 'ready'

  const scoreStatusText = (() => {
    if (scoreStatus === 'connecting') return '正在连接成绩服务...'
    if (scoreStatus === 'no-team') return '未加入队伍或未获取到用户信息'
    if (scoreStatus === 'pending') return '已提交，等待管理员审核'
    if (scoreStatus === 'done') return '本题已完成'
    return '可以提交本题成绩'
  })()

  function openSubmitForm() {
    if (scoreDisabled) return
    setRemark(`[#${cellId}] `)
    setImage('')
    setFeedback(null)
    setSubmitOpen(true)
  }

  async function onScoreImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: '只能上传图片文件。' })
      return
    }

    setUploading(true)
    setFeedback(null)
    try {
      const optimized = await optimizeImage(file, { maxSide: 1920, quality: 0.88 })
      const formData = new FormData()
      formData.append('image', optimized, optimized.name)
      const response = await api.post('/score/upload', formData)
      const data = response.data
      const url = data?.code === 0 ? String(data.data || '') : (data?.data?.code === 0 ? String(data.data.data || '') : '')
      if (!url) throw new Error(data?.message || '图片上传失败')
      setImage(url)
      setFeedback({ type: 'ok', message: '图片上传成功。' })
    } catch (cause) {
      const errorObject = cause as { response?: { data?: { message?: string } }; message?: string }
      setFeedback({
        type: 'error',
        message: errorObject.response?.data?.message || errorObject.message || '图片上传失败',
      })
    } finally {
      setUploading(false)
    }
  }

  async function submitScore() {
    if (!course) return
    if (!identityId) {
      setFeedback({ type: 'error', message: '未获取到用户信息，请重新登录' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      const response = await api.post('/score/post', {
        course_id: String(course.id),
        identity_id: identityId,
        issue_id: cellId,
        upload_time: formatLocalDateTime(new Date()),
        image,
        remark,
      })
      if (response.data?.code !== undefined && response.data.code !== 0) {
        throw new Error(response.data?.message || '成绩提交失败，请重试')
      }
      setFeedback({ type: 'ok', message: '成绩提交成功' })
      setSubmitOpen(false)
      setImage('')
      setScoreRefresh((value) => value + 1)
      setTeamRefresh((value) => value + 1)
    } catch (cause) {
      const errorObject = cause as { response?: { data?: { message?: string } }; message?: string }
      setFeedback({
        type: 'error',
        message: errorObject.response?.data?.message || errorObject.message || '成绩提交失败，请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  function jumpTo(nextCell: number) {
    navigate(`/task/${courseId}/bingo/${nextCell}`)
  }

  return (
    <PageShell
      title={`BINGO · ISSUE ${cellId}`}
      subtitle={course?.title || 'Bingo mission'}
      actions={(
        <>
          <button className="page-btn" type="button" onClick={() => navigate(`/task/${courseId}`)}>返回 Bingo 面板</button>
          <button className="page-btn" type="button" onClick={() => navigate('/task')}>返回课题列表</button>
        </>
      )}
    >
      {loading && <div className="page-card">Bingo 题目加载中...</div>}
      {!loading && error && <div className="page-card error">{error}</div>}
      {!loading && !error && !course && <div className="page-card">课题不存在或已被删除。</div>}

      {course && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 }}>
          <article className="page-card" style={{ flex: '1 1 560px', minWidth: 0 }}>
            <div className="card-k">BINGO MISSION</div>
            <h2 style={{ marginTop: 6 }}>{detailHeading}</h2>
            <p className="meta" style={{ marginTop: 6 }}>所属课题：{course.title}</p>
            <p className="meta" style={{ marginTop: 4 }}>持续时间：{duration}</p>

            <section className="section-block">
              <div className="card-k">题目描述</div>
              <p className="desc" style={{ marginTop: 8, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', display: 'block', WebkitLineClamp: 'unset' }}>
                {selectedItem.description}
              </p>
            </section>

            <section className="section-block">
              <div className="card-k">当前提示</div>
              {currentTips.length === 0 ? (
                <p className="meta">暂无提示</p>
              ) : (
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {currentTips.map((tip) => (
                    <div
                      key={tip.id}
                      style={{
                        border: '1px solid rgba(34,211,238,.2)',
                        borderRadius: 8,
                        padding: 8,
                        background: 'rgba(15,23,42,.35)',
                      }}
                    >
                      <p className="meta" style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={teamBadgeStyle(tip.teamId, tip.teamName)}>{formatTeamMarker(tip.teamId, tip.teamName)}</span>
                        <span>· {formatDateTime(tip.createdAt)}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{tip.tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!isPentagonPuzzle && selectedItem.image && (
              <section className="section-block">
                <div className="card-k">题目图片</div>
                <img
                  src={toUrl(selectedItem.image)}
                  alt="Bingo 题目"
                  onClick={() => setPreview(toUrl(selectedItem.image))}
                  style={{
                    display: 'block',
                    width: 'min(100%, 560px)',
                    marginTop: 8,
                    borderRadius: 12,
                    border: '1px solid rgba(34,211,238,.25)',
                    cursor: 'zoom-in',
                  }}
                />
              </section>
            )}

            {!isPentagonPuzzle && selectedItem.file && (
              <section className="section-block page-card" style={{ padding: 14 }}>
                <div className="card-k">题目附件</div>
                {audioAttachment ? (
                  <audio controls preload="none" src={toUrl(selectedItem.file)} style={{ width: '100%', marginTop: 8 }} />
                ) : (
                  <p style={{ margin: '8px 0 0' }}>
                    <a href={toUrl(selectedItem.file)} target="_blank" rel="noreferrer" style={{ color: '#67e8f9', textDecoration: 'underline' }}>
                      查看附件文件
                    </a>
                  </p>
                )}
              </section>
            )}

            {isPentagonPuzzle && (
              <section className="section-block page-card" style={{ padding: 14 }}>
                <div className="card-k">PENTAGON PUZZLE</div>
                <p className="desc" style={{ marginTop: 8 }}>
                  本题为五角星拼图。点击下方线索链接获取对应位置的提示。
                </p>
                {pentagonNodes.length === 0 ? (
                  <p className="meta">暂无可用的线索链接。</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 8 }}>
                    {pentagonNodes.map((node) => (
                      <a
                        key={node.id}
                        className="page-btn"
                        href={node.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ justifyContent: 'flex-start' }}
                      >
                        第 {node.id} 题线索{node.position ? ` · ${node.position}` : ''}
                      </a>
                    ))}
                  </div>
                )}
                {pentagonDataUrl && (
                  <p className="meta" style={{ marginTop: 8 }}>
                    数据：<a href={pentagonDataUrl} target="_blank" rel="noreferrer" style={{ color: '#67e8f9' }}>原始 JSON</a>
                  </p>
                )}
              </section>
            )}

            <section className="section-block page-card" style={{ padding: 14 }}>
              <div className="card-k">MY SCORE</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                <p className="meta" style={{ margin: 0 }}>{scoreStatusText}</p>
                <button
                  className="page-btn primary"
                  type="button"
                  disabled={scoreDisabled || submitting}
                  onClick={() => (submitOpen ? setSubmitOpen(false) : openSubmitForm())}
                >
                  {submitOpen ? '收起提交表单' : scoreButtonText}
                </button>
              </div>

              {feedback && (
                <p style={{ margin: '10px 0 0', fontSize: 11, color: feedback.type === 'error' ? '#fda4af' : '#a5f3fc' }}>
                  {feedback.message}
                </p>
              )}

              {submitOpen && (
                <div style={{ marginTop: 12 }}>
                  <div className="page-actions-row" style={{ margin: '0 0 6px' }}>
                    <label className="page-btn" style={{ cursor: 'pointer' }}>
                      {uploading ? '上传中...' : '选择图片'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        style={{ display: 'none' }}
                        onChange={(event) => { void onScoreImageSelected(event) }}
                      />
                    </label>
                    {image && (
                      <button className="page-btn" type="button" onClick={() => setImage('')}>移除图片</button>
                    )}
                  </div>
                  {image && (
                    <img
                      src={toUrl(image)}
                      alt="成绩图片预览"
                      style={{ display: 'block', width: 120, borderRadius: 8, marginTop: 6 }}
                    />
                  )}
                  <label className="meta" style={{ display: 'block', marginTop: 10 }}>补充说明</label>
                  <textarea
                    className="page-input area"
                    value={remark}
                    maxLength={500}
                    placeholder="可选，填写补充说明"
                    onChange={(event) => setRemark(event.target.value)}
                  />
                  <div className="page-actions-row" style={{ justifyContent: 'flex-end' }}>
                    <button className="page-btn" type="button" onClick={() => setSubmitOpen(false)}>取消</button>
                    <button
                      className="page-btn primary"
                      type="button"
                      disabled={submitting || uploading}
                      onClick={() => { void submitScore() }}
                    >
                      {submitting ? '提交中...' : '确认提交'}
                    </button>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="section-block">
                  <div className="card-k">本题提交记录</div>
                  <table className="page-table">
                    <thead>
                      <tr>
                        <th>提交时间</th>
                        <th>状态</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDateTime(row.uploadTime)}</td>
                          <td>{scoreRowText(row)}</td>
                          <td>{row.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="page-actions-row" style={{ marginTop: 18 }}>
              <button className="page-btn" type="button" disabled={cellId <= 1} onClick={() => jumpTo(cellId - 1)}>
                上一题
              </button>
              <button className="page-btn" type="button" disabled={cellId >= 25} onClick={() => jumpTo(cellId + 1)}>
                下一题
              </button>
            </div>
          </article>

          <aside className="page-card" style={{ flex: '0 0 300px', maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p className="meta" style={{ margin: 0 }}>TEAM：{myTeamId ? `#${myTeamId}` : '-'}</p>
              <p className="meta" style={{ margin: 0 }}>总分：{Number(myTeamScore || 0).toFixed(2)}</p>
            </div>
            <div style={{ marginTop: 12 }}>
              <BingoGrid
                activeCell={cellId}
                boardState={boardState}
                issueMarks={issueMarks}
                compact
                onSelect={jumpTo}
              />
            </div>
            <p className="meta" style={{ marginTop: 10 }}>
              方块数字为本题分值；已完成会显示题目标识。
            </p>
          </aside>
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview('')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(2,6,23,.82)',
          }}
        >
          <img
            src={preview}
            alt="预览图片"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '86vh', borderRadius: 10 }}
          />
        </div>
      )}
    </PageShell>
  )
}
