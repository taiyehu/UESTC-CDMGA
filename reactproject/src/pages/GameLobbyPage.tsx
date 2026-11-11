import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fetchCourseCatalog, type Course } from '../api'
import PageShell from '../components/PageShell'

type Room = { code: string; course_id: number; status: 'waiting' | 'active' | 'ended' }

export default function GameLobbyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [myRoomCode, setMyRoomCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchCourseCatalog().then(list => {
      if (active) setCourses(list.filter(course => String(course.category || '').toLowerCase() === 'board_game'))
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : '课题列表加载失败') })
      .finally(() => { if (active) setLoading(false) })
    api.get('/course/board-game-rooms').then(response => {
      if (active) setRooms(Array.isArray(response.data) ? response.data : [])
    }).catch(() => {})
    fetch('/game-api/rooms', { credentials: 'same-origin' }).then(async response => {
      if (!response.ok) throw Error('房间服务暂不可用')
      return response.json() as Promise<{ myRoomCode: string | null }>
    }).then(data => { if (active) setMyRoomCode(data.myRoomCode) }).catch(() => {})
    return () => { active = false }
  }, [])

  return <PageShell title="桌游课题" subtitle="选择课题查看棋盘和房间" wide>
    {error && <p role="alert" className="page-card error">{error}</p>}
    {myRoomCode && <p className="page-card">已于房间{myRoomCode}中存在队伍</p>}
    {loading && <p className="page-card">正在载入课题…</p>}
    {!loading && !error && courses.length === 0 && <p className="page-card">暂无桌游课题。</p>}
    <div className="page-grid">{courses.map(course => {
      const room = rooms.find(item => Number(item.course_id) === course.id)
      return <Link className="page-card course-card" key={course.id} to={`/task/${course.id}`}>
        {course.image && <div className="thumb" style={{ backgroundImage: `url(${course.image})` }} />}
        <div className="card-k">BOARD GAME {room ? `· 房间 ${room.code}` : ''}</div>
        <h3>{course.title}</h3>
        <p className="desc">{course.description || '暂无描述'}</p>
        <p className="meta">{room ? room.status === 'waiting' ? '等待组队' : room.status === 'active' ? '进行中' : '已结束' : '查看棋盘与房间信息'}</p>
        <span className="page-btn small">进入课题 →</span>
      </Link>
    })}</div>
  </PageShell>
}
