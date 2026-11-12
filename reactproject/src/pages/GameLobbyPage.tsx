import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCourseCatalog, type Course } from '../api'
import PageShell from '../components/PageShell'

type Room = { code: string; course_id: number; status: 'waiting' | 'active' | 'ended'; team_count: number }
type CourseRoom = { course: Course; room?: Room }

export default function GameLobbyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [myRoomCode, setMyRoomCode] = useState<string | null>(null)
  const [view, setView] = useState<'current' | 'ended'>('current')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadRooms = async () => {
      const response = await fetch('/game-api/rooms', { credentials: 'same-origin' })
      if (!response.ok) throw Error('房间服务暂不可用')
      const data = await response.json() as { rooms: Room[]; myRoomCode: string | null }
      if (active) {
        setRooms(Array.isArray(data.rooms) ? data.rooms : [])
        setMyRoomCode(data.myRoomCode)
      }
    }
    Promise.all([
      fetchCourseCatalog(),
      loadRooms(),
    ]).then(([list]) => {
      if (!active) return
      setCourses(list.filter(course => String(course.category || '').toLowerCase() === 'board_game'))
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : '课题列表加载失败') })
      .finally(() => { if (active) setLoading(false) })
    const timer = window.setInterval(() => { void loadRooms().catch(() => {}) }, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const entries: CourseRoom[] = courses.map(course => ({ course, room: rooms.find(room => Number(room.course_id) === course.id) }))
  const waiting = entries.filter(item => item.room?.status === 'waiting')
  const active = entries.filter(item => item.room?.status === 'active')
  const missing = entries.filter(item => !item.room)
  const ended = entries.filter(item => item.room?.status === 'ended')

  function cards(items: CourseRoom[]) {
    return <div className="page-grid">{items.map(({ course, room }) => <Link className="page-card course-card" key={course.id} to={`/task/${course.id}`}>
      <div className="thumb game-course-cover" style={{ backgroundImage: `url(${course.image || '/club-logo.jpg'})` }}>
        {room?.status === 'waiting' && <span className="game-team-count" aria-label={`已组建 ${Number(room.team_count) || 0} 支队伍，共需 3 支`}>{Number(room.team_count) || 0}/3</span>}
      </div>
      <div className="card-k">BOARD GAME {room ? `· 房间 ${room.code}` : ''}</div>
      <h3>{course.title}</h3>
      <p className="desc">{course.description || '暂无描述'}</p>
      <p className="meta">{room ? room.status === 'waiting' ? '等待组队' : room.status === 'active' ? '进行中' : '已结束' : '房间待创建'}</p>
      <span className="page-btn small">进入课题 →</span>
    </Link>)}</div>
  }

  return <PageShell title="桌游课题" subtitle="选择课题查看棋盘和房间" wide>
    {error && <p role="alert" className="page-card error">{error}</p>}
    {myRoomCode && <p className="page-card">已于房间{myRoomCode}中存在队伍</p>}
    {loading && <p className="page-card">正在载入课题…</p>}
    {!loading && !error && courses.length === 0 && <p className="page-card">暂无桌游课题。</p>}
    {!loading && !error && courses.length > 0 && <>
      <div className="page-actions-row" role="tablist" aria-label="桌游课题状态">
        <button type="button" role="tab" aria-selected={view === 'current'} className={view === 'current' ? 'page-btn primary' : 'page-btn'} onClick={() => setView('current')}>等待组队 / 进行中</button>
        <button type="button" role="tab" aria-selected={view === 'ended'} className={view === 'ended' ? 'page-btn primary' : 'page-btn'} onClick={() => setView('ended')}>已结束</button>
      </div>
      {view === 'current' ? <>
        <section className="game-course-section"><h2>等待组队</h2>{waiting.length ? cards(waiting) : <p className="page-card">暂无等待组队的课题。</p>}</section>
        <section className="game-course-section"><h2>进行中</h2>{active.length ? cards(active) : <p className="page-card">暂无进行中的课题。</p>}</section>
        {missing.length > 0 && <section className="game-course-section"><h2>房间待创建</h2>{cards(missing)}</section>}
      </> : <section className="game-course-section"><h2>已结束</h2>{ended.length ? cards(ended) : <p className="page-card">暂无已结束的课题。</p>}</section>}
    </>}
  </PageShell>
}
