import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { fetchOnline, fetchProfile, fetchScoredScores, type ProfileData } from '../api'

export default function ProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [online, setOnline] = useState<boolean | null>(null)
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('userInfo') || 'null') } catch { return null } })()
  const identityId = Number(id || user?.id)

  useEffect(() => {
    if (!Number.isFinite(identityId)) { setError('用户编号无效'); setLoading(false); return }
    Promise.allSettled([fetchProfile(identityId), fetchOnline(identityId), fetchScoredScores(identityId)])
      .then(([p, o, s]) => {
        if (p.status === 'fulfilled') setProfile(p.value)
        if (o.status === 'fulfilled') setOnline(o.value)
        if (s.status === 'fulfilled') setScores(s.value)
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [identityId])

  return (
    <PageShell title="PROFILE" subtitle="演出者档案">
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
          </section>
          <section className="page-card">
            <h3>成绩记录</h3>
            {scores.length ? scores.slice(0, 8).map((s, i) => (
              <div className="score-row" key={s.id ?? i}><span>{s.courseTitle || s.title || `记录 ${i + 1}`}</span><b>{s.score ?? s.totalScore ?? '—'}</b></div>
            )) : <p className="meta">暂无成绩记录</p>}
          </section>
        </div>
      )}
    </PageShell>
  )
}
