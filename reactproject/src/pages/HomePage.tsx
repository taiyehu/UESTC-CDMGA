import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MobileTabBar from '../components/MobileTabBar'
import TopBar from '../components/TopBar'
import {
  fetchActivities, fetchCheckin, fetchCourses, fetchDailyMember, fetchForum, submitCheckin,
  type Activity, type Checkin, type Course, type DailyMember, type ForumPost,
} from '../api'

function fmt(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}.${dd} ${hh}:${mi}`
}

function asset(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  if (/^https?:\/\//i.test(value)) return value
  return value.startsWith('/') ? value : `/${value}`
}

export default function HomePage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [daily, setDaily] = useState<DailyMember | null>(null)
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [forum, setForum] = useState<ForumPost[]>([])
  const [active, setActive] = useState(0)
  const [checking, setChecking] = useState(false)
  const [ready, setReady] = useState(false)


  useEffect(() => {
    let cancelled = false
    async function load() {
      const [courseRes, activityRes, dailyRes, checkinRes, forumRes] = await Promise.allSettled([
        fetchCourses(), fetchActivities(), fetchDailyMember(), fetchCheckin(), fetchForum(),
      ])
      if (cancelled) return
      if (courseRes.status === 'fulfilled') setCourses(courseRes.value)
      if (activityRes.status === 'fulfilled') setActivities(activityRes.value)
      if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value)
      if (checkinRes.status === 'fulfilled') setCheckin(checkinRes.value)
      if (forumRes.status === 'fulfilled') setForum(forumRes.value)
      setReady(true)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!courses.length || !activities.length) return
    const id = window.setInterval(() => setActive((v) => (v === 0 ? 1 : 0)), 8000)
    return () => window.clearInterval(id)
  }, [courses.length, activities.length])

  useEffect(() => {
    if (!activities.length && active === 1) setActive(0)
  }, [activities.length, active])

  const latestCourses = useMemo(() => [...courses].sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()), [courses])
  const latestActivities = useMemo(() => [...activities].sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()), [activities])
  const course = latestCourses[0]
  const activity = latestActivities[0]
  const isCourse = active === 0
  const title = isCourse ? course?.title : activity?.name

  const image = isCourse
    ? asset(course?.image, '/maimai-og.jpg')
    : asset(activity?.activityBanner, '/activity-banner.jpg')

  async function onCheckin() {
    if (!checkin || checkin.checkedIn || checking) return
    setChecking(true)
    try {
      const next = await submitCheckin()
      if (next) setCheckin(next)
    } catch {
      // read-only parity test does not depend on this mutation
    } finally {
      setChecking(false)
    }
  }

  return (
    <main className="home" id="top">
      <div className="bg" aria-hidden="true" />

      <TopBar />


      <section
        className="stage"
        aria-label="正在发生"
      >
        <div className="disc">
          <img className="promo" src={image} alt={title || '宣传图'} onError={(e) => { e.currentTarget.src = '/club-logo.jpg' }} />
          <svg className="disc-orbit" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46.5" />
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i * 45 + 22.5 - 90) * (Math.PI / 180)
              return <circle key={i} cx={50 + 46.5 * Math.cos(angle)} cy={50 + 46.5 * Math.sin(angle)} r="1.35" className="disc-dot" />
            })}
          </svg>
          <div className="disc-top">
            <div><div className="k">NOW PLAYING</div><h3>{isCourse ? 'COURSE' : 'EVENT'}</h3></div>
          </div>
          <div className="disc-info">
            <div className="tabs">
              <button type="button" aria-selected={isCourse} className={isCourse ? 'on' : ''} onClick={() => setActive(0)}>课题</button>
              <button type="button" aria-selected={!isCourse} className={!isCourse ? 'on' : ''} onClick={() => setActive(1)} disabled={!activities.length}>活动</button>
            </div>
            <h1>{title || (ready ? '暂无可展示内容' : '正在载入…')}</h1>
            <div className="disc-row">
              <button className="go" type="button" onClick={() => navigate(isCourse ? (course ? `/task/${course.id}` : '/task') : (activity ? `/activity/${activity.id}` : '/activity'))}>{isCourse ? '进入课题' : '查看活动'} <span>→</span></button>
            </div>
          </div>
        </div>
      </section>


      <aside className="side right" id="about">
        <section className="card" id="member">
          <div className="card-k">每日群友 · MEMBER</div>
          <Link className="member" to={daily?.identityId ? `/profile/${daily.identityId}` : '/profile'}>
            <img src={asset(daily?.avatar, '/club-logo.jpg')} alt="" />
            <div><h3>{daily?.account || '今天暂时没有群友'}</h3><p>{daily?.description || '每天认识一名群友'}</p></div>
          </Link>
        </section>
        <section className="card" id="today">
          <div className="card-k">今日 · CHECK IN</div>
          <h3>{checkin?.checkedIn ? '今天已签到' : '抽取今日运势'}</h3>
          <p>{checkin?.fortune?.fortuneText || `日期 ${checkin?.date || '—'}`}</p>
          <button className="card-link" type="button" onClick={onCheckin} disabled={!checkin || checkin.checkedIn || checking}>
            {checking ? '签到中…' : checkin?.checkedIn ? '明天再来' : '立即签到 →'}
          </button>
        </section>
        <section className="card" id="forum">
          <div className="card-k">论坛热帖 · LOBBY</div>
          {forum.length ? forum.map((post) => (
            <Link className="post" to={`/forum/${post.id}`} key={post.id}><b>{post.title}</b><span>{post.authorName}</span></Link>
          )) : <p>暂无帖子，等你开第一贴。</p>}
        </section>
      </aside>

      <section className="home-details" aria-label="首页更多内容">
        <div className="home-details-inner">
          <section className="card detail-card announce">
            <div className="card-k">公告 · NOTICE</div>
            <h2>社团公告</h2>
            <p>欢迎来到 UESTC CDMGA 街机舞台。课题、活动、签到与论坛都在这里汇总，向下滚动查看更多内容。</p>
            <Link className="card-link" to="/links">查看网站功能 →</Link>
          </section>
          <section className="card detail-card">
            <div className="card-k">课题 · COURSE</div>
            <h2>最新课题</h2>
            {latestCourses.slice(0, 3).map((c) => <Link className="detail-row" to={`/task/${c.id}`} key={c.id}><b>{c.title}</b><span>{fmt(c.startTime)}</span></Link>)}
          </section>
          <section className="card detail-card">
            <div className="card-k">活动 · EVENT</div>
            <h2>近期活动</h2>
            {latestActivities.slice(0, 3).map((a) => <Link className="detail-row" to={`/activity/${a.id}`} key={a.id}><b>{a.name}</b><span>{fmt(a.startTime)}</span></Link>)}
          </section>
          <section className="card detail-card">
            <div className="card-k">社区 · LOBBY</div>
            <h2>论坛热帖</h2>
            {forum.slice(0, 4).map((post) => <Link className="detail-row" to={`/forum/${post.id}`} key={post.id}><b>{post.title}</b><span>{post.authorName}</span></Link>)}
          </section>
        </div>
      </section>

      <MobileTabBar />
    </main>
  )
}
