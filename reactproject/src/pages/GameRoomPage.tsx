import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'

type Team = { teamId: number; members: { id: number; account: string }[] }
type Details = { code: string; courseTitle: string; status: 'waiting' | 'active' | 'ended'; role: 'host' | 'team' | 'spectator'; teamId: string | null; canAct: boolean; myIdentityId: number; myTeamId: number | null; initialMoney: number; initialIncome: number; teams: Team[]; seats: { seat: string; teamId: number; operatorAccount: string }[] }

async function request(code: string, action = 'details', method = 'GET', data?: unknown) {
  const response = await fetch(`/game-api/rooms/${code}/${action}`, { method, credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) })
  if (!response.headers.get('content-type')?.includes('application/json')) throw Error(`桌游服务暂不可用（HTTP ${response.status}）`)
  const result = await response.json()
  if (!response.ok) throw Error(result.error || '请求失败')
  return result
}

function normalizeDetails(value: Details): Details {
  if (value.status === 'waiting' && !Array.isArray(value.teams)) throw Error('桌游服务尚未更新，请重启桌游服务')
  return { ...value, teams: Array.isArray(value.teams) ? value.teams : [], seats: Array.isArray(value.seats) ? value.seats : [], initialMoney: value.initialMoney ?? 200, initialIncome: value.initialIncome ?? 30 }
}

export default function GameRoomPage({ roomCode, embedded = false }: { roomCode?: string; embedded?: boolean } = {}) {
  const params = useParams()
  const code = roomCode || params.code || ''
  const [details, setDetails] = useState<Details | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [money, setMoney] = useState(200)
  const [income, setIncome] = useState(30)

  useEffect(() => {
    let active = true
    let first = true
    setDetails(null)
    const load = () => request(code).then(value => { if (active) { const next = normalizeDetails(value); setDetails(next); if (first) { setMoney(next.initialMoney); setIncome(next.initialIncome); first = false } setError('') } }).catch(e => { if (active) setError(e.message) })
    void load()
    const timer = window.setInterval(() => { if (active) void load() }, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [code])

  async function act(action: string, data?: unknown) {
    setBusy(true); setError('')
    try {
      await request(code, action, 'POST', data)
      setDetails(normalizeDetails(await request(code)))
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  async function end() {
    if (!window.confirm('确定结束房间？结束后只能查看记录。')) return
    await act('end')
  }

  if (details?.status === 'active' || details?.status === 'ended') return <div style={{ height: embedded ? '75dvh' : '100dvh', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '5px 12px', background: '#20212b', color: 'white', display: 'flex', gap: 16 }}>
      <Link to="/game" style={{ color: 'white' }}>← 房间列表</Link>
      <span>{details.courseTitle} · {details.code}</span>
      <span>{details.status === 'ended' ? '已结束 · 只读' : details.role === 'host' ? '裁判' : `${details.teamId} 队${details.canAct ? '操作者' : '观战'}`}</span>
      {details.status === 'active' && details.role === 'host' && <button disabled={busy} onClick={() => void end()}>结束房间</button>}
      {error && <span role="alert">{error}</span>}
    </div>
    <iframe key={details.status} title="桌游" src={`/game-client/?room=${details.code}`} style={{ flex: 1, width: '100%', border: 0 }} />
  </div>

  const content = <>
    {!embedded && <p><Link to="/game">← 返回房间列表</Link></p>}
    <div className="page-card" style={{ marginBottom: 20, textAlign: 'center' }}>
      <img src="/board-game-map.svg" alt="桌游棋盘" style={{ display: 'block', width: '100%', maxWidth: 900, margin: '0 auto' }} />
      <p className="meta">游戏开始后，这里会显示可操作的实时棋盘。</p>
    </div>
    {error && <p role="alert" className="page-card error">{error}</p>}
    {!details && !error && <p>正在读取房间…</p>}
    {details?.status === 'waiting' && <>
      <section className="panel" style={{ padding: 24, marginBottom: 20 }}>
        <h2>等待组队 · {details.teams.length}/3</h2>
        <p>每支队伍最多三人。三支未解散队伍齐全后，裁判可以开始游戏。</p>
        {details.role === 'host' && <button type="button" disabled={busy || details.teams.length !== 3} onClick={() => void act('start')}>开始游戏</button>}
        {details.role === 'host' && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <label>初始金钱 <input className="page-input" type="number" min={0} max={1000000} value={money} onChange={e => setMoney(Number(e.target.value))} /></label>
          <label>初始收入 <input className="page-input" type="number" min={0} max={1000000} value={income} onChange={e => setIncome(Number(e.target.value))} /></label>
          <button type="button" disabled={busy} onClick={() => void act('settings', { initialMoney: money, initialIncome: income })}>保存设置</button>
        </div>}
        {details.role !== 'host' && !details.myTeamId && details.teams.length < 3 && <button type="button" disabled={busy} onClick={() => void act('create-team')}>创建队伍</button>}
        {details.myTeamId && <button type="button" disabled={busy} onClick={() => void act('leave-team')}>退出队伍</button>}
      </section>
      <div className="page-grid">{details.teams.map(team => <section className="page-card" key={team.teamId}>
        <h3>队伍 #{team.teamId}</h3>
        <p>{team.members.map(member => member.account).join('、')}</p>
        <p className="meta">{team.members.length}/3 人</p>
        {!details.myTeamId && details.role !== 'host' && team.members.length < 3 && <button type="button" disabled={busy} onClick={() => void act('join-team', { teamId: team.teamId })}>加入队伍</button>}
        {(details.role === 'host' || team.members[0]?.id === details.myIdentityId) && <button type="button" disabled={busy} onClick={() => { if (window.confirm(`确定解散队伍 #${team.teamId}？`)) void act('disband-team', { teamId: team.teamId }) }}>解散队伍</button>}
      </section>)}</div>
    </>}
  </>
  return embedded ? content : <PageShell title={`房间 ${code}`} subtitle={details?.courseTitle} wide>{content}</PageShell>
}
