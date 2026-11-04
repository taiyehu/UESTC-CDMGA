import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { api, fetchOnline, fetchProfile, fetchScoredScores, type ProfileData } from '../api'

export default function ProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)
  const [scores, setScores] = useState<any[]>([])
  const [titles, setTitles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [titleOrder, setTitleOrder] = useState<'newest' | 'oldest'>('newest')
  const [titlePage, setTitlePage] = useState(1)
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('userInfo') || 'null') } catch { return null } })()
  const identityId = Number(id || user?.id)
  const isSelf = Boolean(user && Number(user.id) === identityId)

  useEffect(() => {
    if (!Number.isFinite(identityId)) { setError('用户编号无效'); setLoading(false); return }
    Promise.allSettled([fetchProfile(identityId), fetchOnline(identityId), fetchScoredScores(identityId), api.get(isSelf ? '/title/mine' : `/title/user/${identityId}`)])
      .then(([p, o, s, t]) => {
        if (p.status === 'fulfilled') setProfile(p.value)
        if (o.status === 'fulfilled') setOnline(o.value)
        if (s.status === 'fulfilled') setScores(s.value)
        if (t.status === 'fulfilled') setTitles(Array.isArray(t.value.data?.data) ? t.value.data.data : [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [identityId])

  const visibleTitles = useMemo(() => {
    const filtered = titles.filter((t) => (tierFilter === 'all' || t.tier === tierFilter) && (sourceFilter === 'all' || t.source === sourceFilter))
    return filtered.sort((a, b) => {
      const at = new Date(a.grantedAt || a.createdAt || 0).getTime() || 0
      const bt = new Date(b.grantedAt || b.createdAt || 0).getTime() || 0
      return titleOrder === 'newest' ? bt - at : at - bt
    })
  }, [titles, tierFilter, sourceFilter, titleOrder])
  const titlePages = Math.max(1, Math.ceil(visibleTitles.length / 4))
  const pagedTitles = visibleTitles.slice((Math.min(titlePage, titlePages) - 1) * 4, Math.min(titlePage, titlePages) * 4)
  function titleStatusText(status: string) { return status === 'pending' ? '审核中' : status === 'approved' ? '已发放' : status === 'revoked' ? '已撤销' : '已驳回' }
  function titleSourceText(source: string) { return source === 'registration' ? '注册获得' : source === 'admin_created' ? '管理员颁发' : source === 'user_application' ? '用户申请' : '其他' }
  async function equipTitle(id: number) { try { await api.post(`/title/equip/${id}`); const res = await api.get(isSelf ? '/title/mine' : `/title/user/${identityId}`); setTitles(res.data?.data || []) } catch { /* keep UI */ } }
  async function unequipTitle() { try { await api.post('/title/unequip'); const res = await api.get('/title/mine'); setTitles(res.data?.data || []) } catch { /* keep UI */ } }

  return (
    <PageShell title="PROFILE" subtitle="演出者档案" actions={isSelf ? <><Link className="page-btn primary" to="/profile-setting">编辑资料</Link><Link className="page-btn" to="/profile-setting?tab=titles">申请称号</Link></> : undefined}>
      {loading && <div className="page-card">载入中…</div>}
      {error && <div className="page-card error">{error}</div>}
      {!loading && !error && (
        <div className="profile-layout">
          <section className="page-card profile-card">
            <img className="profile-avatar" src={profile?.avatar || '/club-logo.jpg'} alt="" />
            <h2>{profile?.account || user?.account || `社员 ${identityId}`}</h2>
            <p className="meta">{online === null ? '在线状态未知' : online ? '在线' : '离线'} · {profile?.status === 1 ? '资料已通过' : '资料未完善'}</p>
            <p className="desc">{profile?.description || '暂无个性签名'}</p>
            <p className="meta">{profile?.university || '未填写学校'}</p>
            {isSelf && <div className="page-actions-row"><Link className="page-btn small" to="/profile-setting">修改头像 / 签名 / 补充信息</Link></div>}
          </section>
          <section className="page-card">
            <h3>成绩记录</h3>
            {scores.length ? <div style={{ overflowX: 'auto' }}><table className="page-table"><thead><tr><th>课题</th><th>成绩</th><th>状态</th></tr></thead><tbody>{scores.map((s, i) => <tr key={s.id ?? i}><td>{s.course?.title || s.courseTitle || s.title || `记录 ${i + 1}`}</td><td className="mono" style={{ textAlign: 'center' }}>{s.score ?? s.totalScore ?? '—'}</td><td>{s.isScored === false ? '审核中' : s.isScored ? '已评分' : '—'}</td></tr>)}</tbody></table></div> : <p className="meta">暂无成绩记录</p>}
          </section>
          <section className="page-card" style={{ gridColumn: '1 / -1' }}>
            <div className="page-actions-row" style={{ justifyContent: 'space-between' }}><h3>{isSelf ? '我的称号' : '获得的称号'}</h3>{isSelf && <Link className="page-btn small" to="/profile-setting?tab=titles">申请称号</Link>}</div>
            <div className="title-filters">
              <label>称号等级<select className="page-select" aria-label="按称号等级筛选" value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setTitlePage(1) }}><option value="all">全部等级</option><option value="color">彩色</option><option value="gold">金色</option><option value="silver">银色</option><option value="normal">普通</option></select></label>
              <label>获得类别<select className="page-select" aria-label="按称号获得类别筛选" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setTitlePage(1) }}><option value="all">全部类别</option><option value="registration">注册获得</option><option value="admin_created">管理员颁发</option><option value="user_application">用户申请</option></select></label>
              <label>获得时间<select className="page-select" aria-label="按称号获得时间排序" value={titleOrder} onChange={(e) => { setTitleOrder(e.target.value as 'newest' | 'oldest'); setTitlePage(1) }}><option value="newest">最新在前</option><option value="oldest">最早在前</option></select></label>
            </div>
            {pagedTitles.length ? <div className="profile-titles title-grid">{pagedTitles.map((t) => <div className="profile-title-item" key={t.id}><span className={`profile-title ${t.tier || 'normal'}`}>{t.name}</span><span className="title-meta">{isSelf ? titleStatusText(t.status) : titleSourceText(t.source)}</span><span className="title-meta">{new Date(t.grantedAt || t.createdAt || Date.now()).toLocaleString('zh-CN')}</span>{isSelf && t.status === 'approved' && !t.isEquipped && <button className="page-btn small" type="button" onClick={() => void equipTitle(t.id)}>佩戴</button>}{isSelf && t.isEquipped && <button className="page-btn small" type="button" onClick={() => void unequipTitle()}>取消佩戴</button>}{isSelf && t.status === 'rejected' && t.reviewNote && <span className="title-reject">{t.reviewNote}</span>}</div>)}</div> : <p className="meta">{titles.length ? '没有符合筛选条件的称号' : '暂无称号记录'}</p>}
            {titlePages > 1 && <div className="page-pager"><button className="page-btn small" disabled={titlePage <= 1} onClick={() => setTitlePage((p) => Math.max(1, p - 1))}>上一页</button><span>{Math.min(titlePage, titlePages)} / {titlePages}</span><button className="page-btn small" disabled={titlePage >= titlePages} onClick={() => setTitlePage((p) => Math.min(titlePages, p + 1))}>下一页</button></div>}
          </section>
        </div>
      )}
    </PageShell>
  )
}
