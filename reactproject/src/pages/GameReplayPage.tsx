import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import './GameReplayPage.css'

type TeamId = 'A' | 'B' | 'C'
type Card = { id?: string; name: string; image?: string; move?: number }
type RecordStep = { id: string; team: TeamId; round: number; from: string; route: string[]; card?: Card; usedCard?: Card; events?: Card[]; misfortune?: Card[] }
type TeamState = { score: number; money: number; income: number; round: number; position: string; hand?: Card[]; deckCount: number; discardCount: number; discardTop?: Card | null; deckCards?: Card[]; discardCards?: Card[] }
type CardViewer = { kind: 'hand' | 'deck' | 'discard'; title: string; cards: Card[]; selected: Card | null }
type Battle = { id: string; round: number; node: string; first: string; second: string | null; status: string; startedAt?: number | null; winner?: string }
type Effect = { id: string; kind: 'event' | 'misfortune'; team: TeamId; cards: Card[] }
type CardFlow = { id: string; team: string; spent: Card; drawn: Card }
type State = { teams: Record<TeamId, TeamState>; mapView: Record<TeamId, { node: string; ghost?: boolean }>; pos: Record<string, [number, number]>; records: RecordStep[]; battles: Battle[]; effects: Effect[]; cardFlows: CardFlow[]; endgame: { result?: { winner?: string; winners?: string[] } } }
type Frame = { seq: number; seat: TeamId | null; action: string; payload: Record<string, unknown>; state: State; before?: State | null; effect?: Effect; battle?: Battle }
type Overview = { code: string; courseTitle: string; rounds: { round: number; steps: number }[]; result?: { winner?: string; winners?: string[]; reason?: string }; scoreChanges: { team: string; round: number; amount: number; reason: string }[]; highlights: { round: number; team: string; text: string }[]; teams: Record<TeamId, { score: number; money: number; income: number }> }

const actionNames: Record<string, string> = {
  start: '对局开始', move: '移动并抽牌', 'extra-move': '额外移动', roll: '掷骰', 'use-card': '使用手牌', 'skip-use': '不使用手牌', 'resolve-challenge': '挑战结算', 'card-target': '选择目标', 'discard-target-card': '丢弃目标手牌', 'redraw-card': '重新抽牌', 'card-reroll': '重新掷骰', teleport: '传送', 'discard-card': '弃牌', 'house-action': '使用建筑', bid: '竞标出价', 'misfortune-target': '选择厄运目标', 'misfortune-pick': '选择厄运牌', 'reserve-member': '预定出战队员', 'end-turn': '结束回合', 'force-end-turn': '裁判强制结束回合', money: '裁判调整金钱', score: '裁判调整积分', battle: '战斗结算', end: '对局结束', 'counter-response': '卡牌反制',
  'select-card': '选择移动牌', 'choose-route': '选择路线', 'discard-move-card': '打出并弃置移动牌', 'settle-move': '结算移动与格子', 'draw-card': '补充手牌', 'effect-event': '触发事件', 'effect-misfortune': '触发厄运', 'battle-start': '触发战斗',
}

function expandFrames(source: Frame[]): Frame[] {
  return source.flatMap(frame => {
    const newEffects = frame.state.effects.filter(effect => !frame.before?.effects.some(old => old.id === effect.id))
    const newBattles = frame.state.battles.filter(battle => (battle.startedAt || battle.status === '待结算') && !frame.before?.battles.some(old => old.id === battle.id && (old.startedAt || old.status === '待结算' || old.status === '已结算')))
    const isMove = ['move', 'extra-move'].includes(frame.action)
    const before = frame.before || frame.state
    const steps: Frame[] = isMove ? [
      { ...frame, action: 'select-card', state: before },
      { ...frame, action: 'choose-route', state: before },
      { ...frame, action: 'discard-move-card', state: before },
      frame,
      { ...frame, action: 'settle-move' },
    ] : [frame]
    steps.push(...newEffects.map(effect => ({ ...frame, action: `effect-${effect.kind}`, effect })))
    steps.push(...newBattles.map(battle => ({ ...frame, action: 'battle-start', battle })))
    if (isMove || frame.action === 'use-card') steps.push({ ...frame, action: 'draw-card' })
    return steps
  })
}

async function readReplay(code: string, query = '') {
  const response = await fetch(`/game-api/rooms/${code}/replay${query}`, { credentials: 'same-origin' })
  const data = await response.json()
  if (!response.ok) throw Error(data.error || '重放读取失败')
  return data
}

function describe(frame: Frame) {
  const { action, payload, state, seat } = frame
  if (action === 'select-card') return `手牌：${frame.state.teams[seat!].hand?.find(card => card.id === payload.cardId)?.name || String(payload.cardId || '')}`
  if (action === 'move' || action === 'extra-move' || action === 'choose-route') {
    const record = state.records.findLast(r => r.team === seat && r.round === (action === 'move' ? state.teams[seat!].round : r.round))
    const route = Array.isArray(payload.route) ? payload.route.join(' → ') : record?.route.join(' → ')
    return route ? `路线：${route}` : ''
  }
  if (action === 'battle') {
    const battle = state.battles.find(b => b.id === payload.id)
    return battle?.winner ? `${battle.winner} 队获胜` : String(payload.winner || '')
  }
  if (action === 'roll') return `点数：${String(payload.value ?? '')}`
  if (action === 'draw-card') return '补充一张手牌'
  if (action === 'effect-event' || action === 'effect-misfortune') return `${frame.effect?.team || seat} 队 · ${frame.effect?.cards.map(card => card.name).join('、') || '已抵消'}`
  if (action === 'battle-start') return `第 ${frame.battle?.round} 回合 · ${frame.battle?.node} 战斗开始`
  if (action === 'settle-move') {
    const battle = state.battles.find(item => !frame.before?.battles.some(previous => previous.id === item.id))
    if (battle) return `战斗开始 · 第 ${battle.round} 回合`
    const record = [...state.records].reverse().find(item => item.team === seat)
    return record?.events?.length ? `触发事件：${record.events.map(card => card.name).join('、')}` : record?.misfortune?.length ? `触发厄运：${record.misfortune.map(card => card.name).join('、')}` : '结算经过格子与落点效果'
  }
  if (action === 'score' || action === 'money') return `${String(payload.team ?? '')} 队：${String(payload.value ?? '')}`
  return ''
}

export default function GameReplayPage() {
  const { code = '' } = useParams()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [round, setRound] = useState(1)
  const [view, setView] = useState<TeamId>('A')
  const [frames, setFrames] = useState<Frame[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [animatedMarker, setAnimatedMarker] = useState<{ key: string; team: TeamId; node: string } | null>(null)
  const [finishedStage, setFinishedStage] = useState('')
  const [cardViewer, setCardViewer] = useState<CardViewer | null>(null)

  useEffect(() => { setCardViewer(null) }, [code, round, view])
  useEffect(() => {
    if (!cardViewer) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setCardViewer(null) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [cardViewer])

  useEffect(() => {
    let active = true
    setLoading(true)
    readReplay(code).then((data: Overview) => {
      if (!active) return
      setOverview(data)
      setRound(data.rounds[0]?.round ?? 1)
      setError('')
    }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [code])

  useEffect(() => {
    if (!overview) return
    let active = true
    setPlaying(false)
    readReplay(code, `?round=${round}&view=${view}`).then((data: { frames: Frame[] }) => {
      if (!active) return
      const expanded = expandFrames(data.frames)
      setFrames(expanded)
      setIndex(current => Math.min(current, Math.max(0, expanded.length - 1)))
      setError('')
    }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [code, overview, round, view])

  const frame = frames[index]
  const state = frame?.state
  const resourceState = frame && ['move', 'extra-move'].includes(frame.action) && frame.before ? frame.before : state
  const stageKey = `${round}-${view}-${index}-${frame?.seq || 0}-${frame?.action || ''}`

  useEffect(() => {
    setAnimatedMarker(null)
    setFinishedStage('')
    if (!frame) return
    const timers: number[] = []
    if (frame.seat && ['move', 'extra-move'].includes(frame.action) && Array.isArray(frame.payload.route)) {
      const path = frame.payload.route.filter((node): node is string => typeof node === 'string')
      const start = frame.before?.teams[frame.seat]?.position
      if (start) setAnimatedMarker({ key: stageKey, team: frame.seat, node: start })
      path.forEach((node, i) => timers.push(window.setTimeout(() => setAnimatedMarker({ key: stageKey, team: frame.seat!, node }), 130 + i * 240)))
      timers.push(window.setTimeout(() => setFinishedStage(stageKey), 250 + path.length * 240))
    } else if (['discard-move-card', 'use-card', 'draw-card', 'effect-event', 'effect-misfortune', 'battle-start', 'battle'].includes(frame.action)) {
      timers.push(window.setTimeout(() => setFinishedStage(stageKey), 950))
    }
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [frame, stageKey])

  useEffect(() => {
    if (!playing || index >= frames.length - 1) { if (playing) setPlaying(false); return }
    const next = frames[index + 1]
    const previousTeam = [...frames.slice(0, index + 1)].reverse().find(step => step.seat)?.seat
    const pause = next.seat && previousTeam && previousTeam !== next.seat ? 2000 : 1000
    const pathLength = ['move', 'extra-move'].includes(frames[index].action) && Array.isArray(frames[index].payload.route) ? frames[index].payload.route.length : 0
    const delay = Math.max(pause, pathLength ? 350 + pathLength * 240 : 0)
    const timer = window.setTimeout(() => setIndex(i => i + 1), delay)
    return () => window.clearTimeout(timer)
  }, [playing, index, frames])

  const roundIndex = overview?.rounds.findIndex(item => item.round === round) ?? -1
  const recentRecord = frame?.seat ? [...(state?.records || [])].reverse().find(r => r.team === frame.seat && r.round === round) : undefined
  const newFlow = frame?.seat ? state?.cardFlows.find(flow => flow.team === frame.seat && !frame.before?.cardFlows.some(previous => previous.id === flow.id)) : undefined
  const route = frame && ['move', 'extra-move', 'choose-route'].includes(frame.action) ? (Array.isArray(frame.payload.route) ? frame.payload.route as string[] : recentRecord?.route || []) : []
  const routeFrom = frame?.seat ? frame.before?.teams[frame.seat]?.position || recentRecord?.from : undefined
  const spentCard = frame?.seat ? frame.before?.teams[frame.seat]?.hand?.find(card => card.id === frame.payload.cardId) || newFlow?.spent || (['move', 'extra-move'].includes(frame.action) ? recentRecord?.card : recentRecord?.usedCard) : undefined
  const showCinematic = frame && finishedStage !== stageKey && ['discard-move-card', 'use-card', 'draw-card', 'effect-event', 'effect-misfortune', 'battle-start', 'battle'].includes(frame.action)
  const concealedDrawId = newFlow && (frame?.action !== 'draw-card' || showCinematic) ? newFlow.drawn.id : undefined
  const activeBattle = frame?.battle || (frame?.action === 'battle' ? state?.battles.find(battle => battle.id === frame.payload.id) : undefined)
  const battleTeams = activeBattle ? [activeBattle.first, activeBattle.second].map(recordId => state?.records.find(record => record.id === recordId)?.team || '?') : []

  function selectRound(value: number) { setPlaying(false); setFrames([]); setIndex(0); setRound(value) }
  function openCard(card: Card) { setPlaying(false); setCardViewer({ kind: 'hand', title: `${view} 队手牌`, cards: [card], selected: card }) }
  function openPile(kind: 'deck' | 'discard') {
    if (!state) return
    setPlaying(false)
    setCardViewer({ kind, title: `${view} 队${kind === 'deck' ? '抽牌堆' : '弃牌堆'}`, cards: kind === 'deck' ? state.teams[view].deckCards || [] : state.teams[view].discardCards || [], selected: null })
  }

  return <PageShell title="对局回顾与重放" subtitle={overview ? `${overview.courseTitle} · 房间 ${overview.code}` : '读取对局'} wide>
    <div className="page-actions-row"><Link className="page-btn" to="/game">← 返回房间列表</Link><Link className="page-btn" to={`/game/rooms/${code}`}>房间页面</Link></div>
    {loading && <p className="page-card">正在读取对局…</p>}
    {error && <p className="page-card error" role="alert">{error}</p>}
    {overview && <>
      <section className="page-card replay-summary">
        <div><h2>对局结果</h2><p>{overview.result?.winner ? `${overview.result.winner} 队获胜` : overview.result?.winners?.length ? `${overview.result.winners.join('、')} 队并列第一` : '对局已结束'}</p></div>
        {(['A', 'B', 'C'] as TeamId[]).map(id => <div key={id}><strong>{id} 队</strong><b>{overview.teams[id]?.score ?? 0} 分</b><small>金钱 {overview.teams[id]?.money ?? 0} · 收入 {overview.teams[id]?.income ?? 0}</small></div>)}
      </section>
      <section className="page-card replay-controls" aria-label="重放控制">
        <label>回合 <select value={round} onChange={e => selectRound(Number(e.target.value))}>{overview.rounds.map(item => <option key={item.round} value={item.round}>第 {item.round} 回合</option>)}</select></label>
        <label>观看视角 <select value={view} onChange={e => setView(e.target.value as TeamId)}>{(['A', 'B', 'C'] as TeamId[]).map(id => <option key={id} value={id}>{id} 队</option>)}</select></label>
        <button type="button" onClick={() => setPlaying(value => !value)} disabled={!frames.length || index >= frames.length - 1}>{playing ? '暂停' : '播放'}</button>
        <button type="button" onClick={() => { setPlaying(false); setIndex(i => Math.max(0, i - 1)) }} disabled={index === 0}>上一步</button>
        <button type="button" onClick={() => { setPlaying(false); setIndex(i => Math.min(frames.length - 1, i + 1)) }} disabled={index >= frames.length - 1}>下一步</button>
        <button type="button" onClick={() => selectRound(overview.rounds[roundIndex + 1].round)} disabled={roundIndex < 0 || roundIndex >= overview.rounds.length - 1}>下一回合</button>
        <span>步骤 {frames.length ? index + 1 : 0}/{frames.length} · 同队 1 秒，换队 2 秒</span>
      </section>
      {frame && state && <div className="replay-layout">
        <section className="page-card replay-board">
          <h2>第 {round} 回合 · {frame.seat ? `${frame.seat} 队` : '裁判'} · {actionNames[frame.action] || frame.action}</h2>
          <p>{describe(frame)}</p>
          <div className="replay-map"><object data="/game-client/map.svg?v=background-2" type="image/svg+xml" aria-label="桌游棋盘" />
            {resourceState && <div className="replay-resource-card" aria-label={`${view} 队视角下的队伍资源`}>
              <div className="replay-resource-title"><strong>队伍资源</strong><small>{view} 队视角</small></div>
              <div className="replay-resource-columns"><span>队伍</span><span>积分</span><span>金钱</span><span>收入</span></div>
              {(['A', 'B', 'C'] as TeamId[]).map(id => <div key={id} className={`replay-resource-row${frame.seat === id ? ' acting' : ''}${view === id ? ' viewing' : ''}`}><strong>{id} 队</strong><b>{resourceState.teams[id].score}</b><span>{resourceState.teams[id].money}</span><span>{resourceState.teams[id].income}</span></div>)}
            </div>}
            {routeFrom && route.length > 0 && <svg className={frame.action === 'choose-route' ? 'replay-route-choice' : 'replay-route-motion'} viewBox="-3350 -1800 7500 5000" preserveAspectRatio="none" aria-hidden="true"><polyline points={[routeFrom, ...route].map(node => state.pos[node]?.join(',')).filter(Boolean).join(' ')} fill="none" stroke="#ffbd4a" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            {frame.action === 'choose-route' && route.length > 0 && state.pos[route.at(-1)!] && <span className="replay-destination" style={{ left: `${(state.pos[route.at(-1)!][0] + 3350) / 7500 * 100}%`, top: `${(state.pos[route.at(-1)!][1] + 1800) / 5000 * 100}%` }} aria-label={`选择终点 ${route.at(-1)}`} />}
            {(['A', 'B', 'C'] as TeamId[]).map(id => { const node = animatedMarker?.key === stageKey && animatedMarker.team === id ? animatedMarker.node : frame.seat === id && ['move', 'extra-move'].includes(frame.action) && routeFrom ? routeFrom : state.mapView[id]?.node, pos = node ? state.pos[node] : undefined; return pos && <span key={id} className={`replay-marker replay-marker-${id}${state.mapView[id].ghost ? ' ghost' : ''}`} style={{ left: `${(pos[0] + 3350) / 7500 * 100}%`, top: `${(pos[1] + 1800) / 5000 * 100}%` }} title={`${id} 队 · ${node}`}>{id}</span> })}
          </div>
        </section>
        <aside className="page-card replay-detail">
          <div className="replay-hand-header"><h2>{view} 队手牌</h2><span>金钱 {state.teams[view].money} · 收入 {state.teams[view].income}</span></div>
          <div className="replay-hand" aria-label={`${view} 队当时的手牌`}>{state.teams[view].hand?.filter(card => card.id !== concealedDrawId).map((card, i) => <button type="button" key={`${card.id}-${i}`} className={`replay-hand-card${frame.action === 'select-card' && card.id === frame.payload.cardId ? ' replay-selected-card' : ''}`} title={`放大查看 ${card.name}`} onClick={() => openCard(card)}>{card.image && <img src={card.image} alt={card.name} />}<span>{card.name} · {card.move === 7 ? '?' : card.move ?? '?'} 步</span></button>)}</div>
          <div className="replay-piles" aria-label="牌堆状态"><button type="button" className={`replay-pile${state.teams[view].deckCount ? '' : ' empty'}`} onClick={() => openPile('deck')} aria-label={`查看抽牌堆，共 ${state.teams[view].deckCount} 张`}><div className="replay-pile-stack">✦</div><span>抽牌堆 <b>{state.teams[view].deckCount}</b></span></button><button type="button" className={`replay-pile${state.teams[view].discardCount ? '' : ' empty'}`} onClick={() => openPile('discard')} aria-label={`查看弃牌堆，共 ${state.teams[view].discardCount} 张`}><div className="replay-pile-stack">{state.teams[view].discardTop?.image ? <img src={state.teams[view].discardTop.image} alt={state.teams[view].discardTop.name} /> : '—'}</div><span>弃牌堆 <b>{state.teams[view].discardCount}</b></span></button></div>
          {['move', 'settle-move'].includes(frame.action) && recentRecord?.card && <p>移动牌：{recentRecord.card.name}</p>}
          {frame.action === 'draw-card' && newFlow && <p>抽到：{newFlow.drawn.name}</p>}
          {recentRecord?.events?.length ? <p>事件：{recentRecord.events.map(card => card.name).join('、')}</p> : null}
          {recentRecord?.misfortune?.length ? <p>厄运：{recentRecord.misfortune.map(card => card.name).join('、')}</p> : null}
        </aside>
      </div>}
      <section className="page-card replay-timeline"><h2>本回合步骤</h2><div>{frames.map((step, i) => <button type="button" key={`${step.seq}-${i}`} className={i === index ? 'active' : ''} onClick={() => { setPlaying(false); setIndex(i) }}>{step.seat ? `${step.seat} 队` : '裁判'} · {actionNames[step.action] || step.action}</button>)}</div></section>
      <section className="page-card replay-score-history"><h2>关键事件</h2><div>{overview.highlights.map((item, i) => <button type="button" key={i} onClick={() => selectRound(item.round)}>第 {item.round} 回合 · {item.team} 队 {item.text}</button>)}</div></section>
      <section className="page-card replay-score-history"><h2>积分变化</h2><div>{overview.scoreChanges.map((item, i) => <span key={i}>第 {item.round} 回合 · {item.team} 队 {item.amount > 0 ? '+' : ''}{item.amount} · {item.reason}</span>)}</div></section>
      {frame && showCinematic && <div className={`replay-cinematic replay-cinematic-${frame.action}`} aria-live="polite">
        {['discard-move-card', 'use-card'].includes(frame.action) && <div className="replay-cinematic-card"><strong>{frame.seat} 队打出卡牌</strong>{spentCard?.image ? <img src={spentCard.image} alt={spentCard.name} /> : <div className="replay-card-back">✦</div>}<span>{spentCard?.name || '打出卡牌'} → 弃牌堆</span></div>}
        {['discard-move-card', 'use-card'].includes(frame.action) && <div className="replay-discard-pile" aria-hidden="true">弃牌堆</div>}
        {frame.action === 'draw-card' && <div className="replay-cinematic-card"><strong>{frame.seat} 队补充手牌</strong>{newFlow?.drawn.image ? <img src={newFlow.drawn.image} alt={newFlow.drawn.name} /> : <div className="replay-card-back">✦</div>}<span>{newFlow?.drawn.name || '抽取一张手牌'}</span></div>}
        {frame.effect && <div className="replay-cinematic-effect"><strong>{frame.effect.kind === 'event' ? '触发事件' : '触发厄运'}</strong><p>{frame.effect.team} 队</p><div>{frame.effect.cards.length ? frame.effect.cards.map((card, i) => card.image ? <img key={`${card.id}-${i}`} src={card.image} alt={card.name} /> : <span key={`${card.id}-${i}`}>{card.name}</span>) : <span>已抵消</span>}</div></div>}
        {['battle-start', 'battle'].includes(frame.action) && <div className="replay-cinematic-battle"><strong>{frame.action === 'battle' ? '战斗结算' : '触发战斗'}</strong><div><span>{battleTeams[0] || '?'} 队</span><b>⚔</b><span>{battleTeams[1] || '?'} 队</span></div><p>第 {activeBattle?.round || round} 回合 · {activeBattle?.node || '对战'}{activeBattle?.winner || frame.action === 'battle' && frame.payload.winner ? ` · ${activeBattle?.winner || frame.payload.winner} 队获胜` : ''}</p></div>}
      </div>}
      {cardViewer && <div className="replay-card-viewer" role="presentation" onClick={() => setCardViewer(null)}><div className="replay-card-viewer-body" role="dialog" aria-modal="true" aria-label={cardViewer.title} onClick={event => event.stopPropagation()}>
        <div className="replay-card-viewer-header"><h2>{cardViewer.selected?.name || `${cardViewer.title} · ${cardViewer.cards.length} 张`}</h2><button type="button" autoFocus onClick={() => setCardViewer(null)}>关闭</button></div>
        {cardViewer.selected ? <div className="replay-card-viewer-selected">{cardViewer.selected.image ? <img src={cardViewer.selected.image} alt={cardViewer.selected.name} /> : <p>{cardViewer.selected.name}</p>}{cardViewer.kind !== 'hand' && <button type="button" onClick={() => setCardViewer(current => current && { ...current, selected: null })}>返回牌堆</button>}</div> : cardViewer.cards.length ? <div className="replay-card-viewer-grid">{cardViewer.cards.map((card, i) => <button type="button" key={`${card.id}-${i}`} onClick={() => setCardViewer(current => current && { ...current, selected: card })}>{card.image && <img src={card.image} alt="" />}<span>{card.name}</span></button>)}</div> : <p className="replay-card-viewer-empty">暂无卡牌</p>}
      </div></div>}
    </>}
  </PageShell>
}
