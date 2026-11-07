import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BingoGrid from './BingoGrid'
import { api, type Course } from '../api'
import './TaskBingoOverview.css'

type Member = { identityId: number; account: string; avatar?: string }
type TeamPanel = { teamId: number; totalScore?: number; members?: Member[] }
type Tip = { id: number; issueId: number; tip: string; teamId?: number; teamName?: string; createdAt?: string }
type JoinOption = { teamId: number; memberAccounts?: string[]; memberCount?: number }
type InviteOption = { identityId: number; account: string }
type BoardCell = { cellId?: number; issueId?: number; completed?: boolean; maxScore?: number; mark?: string }

function sessionIdentity(): number | null {
  try { const raw = JSON.parse(sessionStorage.getItem('userInfo') || 'null'); const n = Number(raw?.id ?? raw?.identityId ?? raw?.userId); return Number.isFinite(n) && n > 0 ? n : null } catch { return null }
}
function unwrap(res: any) { return res?.data?.data ?? res?.data ?? null }
function listOf(res: any) { const d = unwrap(res); return Array.isArray(d) ? d : Array.isArray(d?.list) ? d.list : [] }
function img(path?: string) { if (!path) return ''; return /^https?:\/\//i.test(path) || path.startsWith('/') ? path : `/${path}` }
function fmtDuration(start?: string, end?: string) { if (!start || !end) return '-'; const a = new Date(start), b = new Date(end); return Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) ? '-' : `${a.toLocaleString('zh-CN')} - ${b.toLocaleString('zh-CN')}` }
function fmtTime(value?: string) { return value ? new Date(value).toLocaleString('zh-CN') : '-' }
function teamMarker(teamId?: number, teamName?: string) { if (Number(teamId) > 0) return `#${teamId}`; const m = String(teamName || '').match(/(\d+)/); return m ? `#${m[1]}` : '-' }
function teamClass(teamId?: number) { const n = Number(teamId); return n % 3 === 1 ? 'team-a' : n % 3 === 2 ? 'team-b' : 'team-c' }

export default function TaskBingoOverview({ course }: { course: Course }) {
  const navigate = useNavigate()
  const identityId = useMemo(sessionIdentity, [])
  const [team, setTeam] = useState<TeamPanel | null>(null)
  const [tips, setTips] = useState<Tip[]>([])
  const [tipsLoading, setTipsLoading] = useState(true)
  const [board, setBoard] = useState<Map<number, BoardCell>>(new Map())
  const [notice, setNotice] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [joinOptions, setJoinOptions] = useState<JoinOption[]>([])
  const [joinSearched, setJoinSearched] = useState(false)
  const [inviteKeyword, setInviteKeyword] = useState('')
  const [inviteOptions, setInviteOptions] = useState<InviteOption[]>([])
  const [inviteTarget, setInviteTarget] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const loadTeam = useCallback(async () => {
    if (!identityId) { setTeam(null); return }
    try {
      const res = await api.get(`/team/course/${course.id}/my`, { params: { identityId } })
      const panel = unwrap(res) as TeamPanel | null
      const teamId = Number(panel?.teamId ?? (panel as any)?.team_id ?? 0)
      const members = Array.isArray(panel?.members) ? panel.members : []
      if (!panel || (!teamId && !members.length)) { setTeam(null); return }
      let total = Number(panel.totalScore || 0)
      try { const s = await api.get(`/team/course/${course.id}/my-score`, { params: { identityId } }); total = Number(unwrap(s) || 0) } catch { /* ignore */ }
      setTeam({ ...panel, teamId, members, totalScore: Number.isFinite(total) ? total : 0 })
    } catch { setTeam(null) }
  }, [course.id, identityId])

  const loadTips = useCallback(async () => {
    setTipsLoading(true)
    try { const res = await api.get(`/bingo-tip/course/${course.id}`, { params: { page: 0, size: 25 } }); setTips(listOf(res).map((x: any) => ({ id: Number(x.id), issueId: Number(x.issueId), tip: String(x.tip || ''), teamId: Number(x.teamId || 0), teamName: String(x.teamName || ''), createdAt: x.createdAt })).filter((x: Tip) => x.id && x.issueId && x.tip)) }
    catch { setTips([]) }
    finally { setTipsLoading(false) }
  }, [course.id])

  const loadBoard = useCallback(async () => {
    if (!identityId) { setBoard(new Map()); return }
    try { const res = await api.get(`/team/course/${course.id}/board-state`, { params: { identityId } }); const cells = Array.isArray(unwrap(res)?.cells) ? unwrap(res).cells : []; const map = new Map<number, BoardCell>(); for (const c of cells) { const id = Number(c.cellId ?? c.issueId ?? 0); if (id) map.set(id, c) } setBoard(map) }
    catch { setBoard(new Map()) }
  }, [course.id, identityId])

  useEffect(() => { void loadTeam(); void loadTips(); void loadBoard() }, [loadTeam, loadTips, loadBoard])

  async function createTeam() {
    if (!identityId || busy) return
    setBusy(true); setNotice('')
    try { await api.post(`/team/course/${course.id}/create`, { identity_id: identityId }); setNotice('队伍创建成功'); await loadTeam() }
    catch (e) { setNotice(e instanceof Error ? e.message : '创建队伍失败') }
    finally { setBusy(false) }
  }

  async function searchJoin() {
    if (!identityId) return
    try { const res = await api.get(`/team/course/${course.id}/join-options`, { params: { identityId, keyword } }); setJoinOptions(listOf(res) as JoinOption[]); setJoinSearched(true) }
    catch (e) { setNotice(e instanceof Error ? e.message : '搜索队伍失败') }
  }

  async function joinTeam(id: number) {
    if (!identityId) return
    setBusy(true)
    try { await api.post(`/team/course/${course.id}/join`, { identity_id: identityId, team_id: id }); setJoinOpen(false); setJoinOptions([]); setJoinSearched(false); setKeyword(''); setNotice('已加入队伍'); await loadTeam(); await loadBoard() }
    catch (e) { setNotice(e instanceof Error ? e.message : '加入队伍失败') }
    finally { setBusy(false) }
  }

  async function searchInvite(value: string) {
    setInviteKeyword(value)
    if (!value.trim()) { setInviteOptions([]); return }
    try { const res = await api.get(`/team/course/${course.id}/member-options`, { params: { keyword: value, size: 20 } }); setInviteOptions(listOf(res) as InviteOption[]) }
    catch { setInviteOptions([]) }
  }

  async function invite() {
    if (!identityId || !inviteTarget) return
    setBusy(true)
    try { await api.post(`/team/course/${course.id}/invite`, { owner_identity_id: identityId, target_identity_id: inviteTarget }); setInviteOpen(false); setInviteOptions([]); setInviteKeyword(''); setInviteTarget(null); setNotice('邀请已发送'); await loadTeam() }
    catch (e) { setNotice(e instanceof Error ? e.message : '邀请失败') }
    finally { setBusy(false) }
  }

  async function leave() {
    if (!identityId) return
    setBusy(true)
    try { await api.post(`/team/course/${course.id}/leave`, { identity_id: identityId }); setLeaveOpen(false); setNotice('已退出队伍'); await loadTeam(); await loadBoard() }
    catch (e) { setNotice(e instanceof Error ? e.message : '退出队伍失败') }
    finally { setBusy(false) }
  }

  const slots = Array.from({ length: 3 }, (_, i) => team?.members?.[i] || null)
  const canLeave = !course.startTime || Date.now() <= new Date(course.startTime).getTime()

  return (
    <article className="bingo-overview">
      <Link className="bingo-back" to="/task">← 返回课题列表</Link>
      <header className="bingo-hero">
        <div>
          <div className="bingo-cat"><span className="bingo-score-legend"><i>5</i><i>3</i><i>2</i></span> BINGO</div>
          <h1>{course.title}</h1>
          <p className="bingo-time">持续时间：{fmtDuration(course.startTime, course.endTime)}</p>
          <p className="bingo-desc">{course.description || '暂无课题内容。'}</p>
        </div>
        <aside className="bingo-team">
          {!identityId ? <p className="bingo-muted">未登录，无法查看队伍信息</p> : !team ? <><p className="bingo-muted">未参加队伍，点击创建或加入队伍</p><div className="bingo-actions"><button className="bingo-btn create" disabled={busy} onClick={() => void createTeam()}>创建</button><button className="bingo-btn join" disabled={busy} onClick={() => setJoinOpen(true)}>加入</button></div></> : <>
            <div className="bingo-team-head"><span>队伍号：#{team.teamId}</span><span>总分：{Number(team.totalScore || 0).toFixed(2)}</span></div>
            <div className="bingo-members">{slots.map((m, i) => <button className={`bingo-member${m ? '' : ' empty'}`} key={i} type="button" onClick={() => { if (!m) setInviteOpen(true) }}>{m?.avatar ? <img src={img(m.avatar)} alt="队员头像" /> : <span className="member-avatar">?</span>}<b>{m?.account || '邀请队员'}</b></button>)}</div>
            <button className="bingo-btn leave" disabled={!canLeave} onClick={() => setLeaveOpen(true)}>{canLeave ? '退出队伍' : '课题已开始，不可退出'}</button>
          </>}
        </aside>
      </header>
      {notice && <div className="bingo-notice">{notice}</div>}
      <section className="bingo-board"><BingoGrid boardState={board} onSelect={(id) => navigate(`/task/${course.id}/bingo/${id}`)} /></section>
      <section className="bingo-tips"><div className="bingo-tips-head"><h3>当前课题提示</h3><span>共 {tips.length} 条</span></div>{tipsLoading ? <p className="bingo-muted">提示加载中...</p> : !tips.length ? <p className="bingo-muted">暂无提示</p> : <div className="bingo-tip-grid">{tips.map((t) => <div className="bingo-tip" key={t.id}><p className="bingo-tip-id">ISSUE {t.issueId} · <span className={`bingo-team-dot ${teamClass(t.teamId)}`}>{teamMarker(t.teamId, t.teamName)}</span></p><p>{t.tip}</p><time>{fmtTime(t.createdAt)}</time></div>)}</div>}</section>

      {joinOpen && <div className="bingo-modal-mask" role="dialog" aria-modal="true" aria-label="加入队伍" onClick={(e) => { if (e.target === e.currentTarget) setJoinOpen(false) }}><div className="bingo-modal"><h3>加入队伍</h3><div className="bingo-search"><input className="page-input" placeholder="搜索队伍ID或队员名称" value={keyword} onChange={(e) => setKeyword(e.target.value)} /><button className="bingo-btn join" onClick={() => void searchJoin()}>搜索</button></div><div className="bingo-join-list">{joinOptions.map((o) => <button key={o.teamId} type="button" onClick={() => void joinTeam(o.teamId)}><span>队伍 #{o.teamId} | {(o.memberAccounts || []).join(' / ') || '暂无成员'} | {o.memberCount || 0}/3</span><b>点击加入</b></button>)}{joinSearched && !joinOptions.length && <p className="bingo-muted">未检索到可加入队伍</p>}</div><button className="bingo-btn" onClick={() => setJoinOpen(false)}>关闭</button></div></div>}
      {inviteOpen && <div className="bingo-modal-mask" role="dialog" aria-modal="true" aria-label="邀请队员" onClick={(e) => { if (e.target === e.currentTarget) setInviteOpen(false) }}><div className="bingo-modal"><h3>邀请队员</h3><input className="page-input" placeholder="输入ID或用户名搜索" value={inviteKeyword} onChange={(e) => void searchInvite(e.target.value)} /><div className="bingo-join-list">{inviteOptions.map((o) => <button type="button" key={o.identityId} className={inviteTarget === o.identityId ? 'selected' : ''} onClick={() => setInviteTarget(o.identityId)}>{o.account} (#{o.identityId})</button>)}</div><div className="bingo-actions"><button className="bingo-btn create" disabled={!inviteTarget || busy} onClick={() => void invite()}>邀请加入</button><button className="bingo-btn" onClick={() => setInviteOpen(false)}>取消</button></div></div></div>}
      {leaveOpen && <div className="bingo-modal-mask" role="dialog" aria-modal="true" aria-label="确认退出队伍" onClick={(e) => { if (e.target === e.currentTarget) setLeaveOpen(false) }}><div className="bingo-modal"><h3>确认退出队伍</h3><p>确认要退出当前队伍吗？</p><div className="bingo-actions"><button className="bingo-btn" onClick={() => setLeaveOpen(false)}>取消</button><button className="bingo-btn leave" disabled={busy} onClick={() => void leave()}>确认退出</button></div></div></div>}
    </article>
  )
}
