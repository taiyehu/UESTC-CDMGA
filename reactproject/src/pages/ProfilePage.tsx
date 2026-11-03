import { useEffect, useState } from 'react'
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
            <div className="page-actions-row" style={{ justifyContent: 'space-between' }}><h3>称号</h3>{isSelf && <Link className="page-btn small" to="/profile-setting?tab=titles">申请称号</Link>}</div>
            {titles.length ? <div className="profile-titles">{titles.map((t) => <span className={`profile-title ${t.tier || 'normal'}`} key={t.id}>{t.name}<em>{t.status === 'approved' ? '已发放' : t.status === 'pending' ? '审核中' : t.status || ''}</em></span>)}</div> : <p className="meta">暂无称号记录</p>}
          </section>
        </div>
      )}
    </PageShell>
  )
}
