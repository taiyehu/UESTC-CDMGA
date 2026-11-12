import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Course } from '../api'
import GameRoomPage from '../pages/GameRoomPage'

type Room = { code: string; course_id: number }

export default function BoardGameCourseOverview({ course }: { course: Course }) {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [otherRoomCode, setOtherRoomCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width:700px), (max-width:950px) and (max-height:520px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width:700px), (max-width:950px) and (max-height:520px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setRoomCode(null)
    setError('')
    api.get('/course/board-game-rooms').then(response => {
      if (!active) return
      const rooms = Array.isArray(response.data) ? response.data as Room[] : []
      setRoomCode(rooms.find(room => Number(room.course_id) === course.id)?.code || null)
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : '房间服务暂不可用') })
      .finally(() => { if (active) setLoading(false) })
    fetch('/game-api/rooms', { credentials: 'same-origin' }).then(async response => {
      if (!response.ok) throw Error('房间服务暂不可用')
      return response.json() as Promise<{ myRoomCode: string | null }>
    }).then(result => { if (active) setOtherRoomCode(result.myRoomCode) }).catch(() => {})
    return () => { active = false }
  }, [course.id])

  const blocked = Boolean(roomCode && otherRoomCode && roomCode !== otherRoomCode)
  return <>
    <div className="page-actions-row"><Link className="page-btn" to="/game">← 返回桌游课题</Link></div>
    <section className="page-card" style={{ marginBottom: 20 }}>
      <div className="card-k">BOARD GAME</div>
      <h2>{course.title}</h2>
      <p className="desc">{course.description || '暂无课题描述'}</p>
      {roomCode && <p className="meta">房间 {roomCode}</p>}
    </section>
    {loading && <p className="page-card">正在读取房间…</p>}
    {error && <p className="page-card error" role="alert">{error}。棋盘预览仍可查看，请确认桌游服务已启动。</p>}
    {!loading && !error && !roomCode && <p className="page-card error">此课题尚无房间，请检查房间迁移。</p>}
    {blocked && <p className="page-card" role="alert">已于房间{otherRoomCode}中存在队伍</p>}
    {roomCode && !blocked ? mobile ? <Link className="page-btn primary" to={`/game/rooms/${roomCode}`}>进入桌游房间 →</Link> : <GameRoomPage roomCode={roomCode} embedded /> : <div className="page-card" style={{ textAlign: 'center' }}><img src="/board-game-map.svg" alt="桌游棋盘" style={{ display: 'block', width: '100%', maxWidth: 900, margin: '0 auto' }} /></div>}
  </>
}
