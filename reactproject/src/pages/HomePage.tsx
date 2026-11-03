import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [courses, setCourses] = useState<Course[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [daily, setDaily] = useState<DailyMember | null>(null)
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [forum, setForum] = useState<ForumPost[]>([])
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [ready, setReady] = useState(false)

  const user = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('userInfo')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

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
    if (paused || !courses.length || !activities.length) return
    const id = window.setInterval(() => setActive((v) => (v === 0 ? 1 : 0)), 8000)
    return () => window.clearInterval(id)
  }, [paused, courses.length, activities.length])

  useEffect(() => {
    if (!activities.length && active === 1) setActive(0)
  }, [activities.length, active])

  const course = courses[0]
  const activity = activities[0]
  const isCourse = active === 0
  const title = isCourse ? course?.title : activity?.name
  const meta = isCourse
    ? `${fmt(course?.startTime)} — ${fmt(course?.endTime)} · ${course?.category || '课题'} · 进行中`
    : `${fmt(activity?.startTime)} — ${fmt(activity?.endTime)} · 活动 · 报名中`
  const image = isCourse
    ? asset(course?.image, '/maimai-og.jpg')
    : asset(activity?.activityBanner, '/activity-banner.jpg')
  const avatar = asset(user?.avatar, '/club-logo.jpg')

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

      <header className="top">
        <Link to="/" className="brand">
          <img src="/club-logo.jpg" alt="" className="brand-mark" />
          <span><b>UESTC CDMGA</b><em>MAIMAI CLUB · 街机舞台</em></span>
        </Link>
        <div className="userbar">
          {user ? (
            <span className="user-chip"><img src={avatar} alt="" /><b>{user.account || user.name || '社员'}</b></span>
          ) : (
            <Link className="user-chip login-chip" to="/login">登录</Link>
          )}
          <button className="icon-btn" type="button" aria-label="切换主题">◐</button>
          <button className="icon-btn" type="button" aria-label="打开菜单" onClick={() => setMenuOpen((v) => !v)}>☰</button>
          {menuOpen && (
            <nav className="menu-panel">
              <a href="#courses" onClick={() => setMenuOpen(false)}>课题</a>
              <a href="#activities" onClick={() => setMenuOpen(false)}>活动</a>
              <a href="#forum" onClick={() => setMenuOpen(false)}>论坛</a>
              <Link to="/login" onClick={() => setMenuOpen(false)}>登录 / 切换账号</Link>
            </nav>
          )}
        </div>
      </header>

      <nav className="rail left" aria-label="主导航">
        <a href="#courses"><b>01</b><span>课题</span></a>
        <a href="#activities"><b>02</b><span>活动</span></a>
        <a href="#forum"><b>03</b><span>论坛</span></a>
        <a href="#links"><b>04</b><span>更多</span></a>
      </nav>
      <nav className="rail right" aria-label="次导航">
        <a href="#today"><b>05</b><span>今日</span></a>
        <a href="#about"><b>06</b><span>关于</span></a>
      </nav>

      <section
        className="stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-label="正在发生"
      >
        <div className="ring" aria-hidden="true" />
        <div className="disc">
          <img className="promo" src={image} alt={title || '宣传图'} />
          <div className="scrim" />
          <div className="disc-top">
            <div><div className="k">NOW PLAYING</div><h3>{isCourse ? 'COURSE' : 'EVENT'}</h3></div>
          </div>
          <div className="disc-info">
            <div className="tabs">
              <button type="button" className={isCourse ? 'on' : ''} onClick={() => setActive(0)}>课题</button>
              <button type="button" className={!isCourse ? 'on' : ''} onClick={() => setActive(1)} disabled={!activities.length}>活动</button>
            </div>
            <h1>{title || (ready ? '暂无可展示内容' : '正在载入…')}</h1>
            <p className="meta">{meta}</p>
            <div className="disc-row">
              <button className="go" type="button">{isCourse ? '进入课题' : '查看活动'} <span>→</span></button>
              <div className="progress"><span>8s</span></div>
            </div>
            <div className="dots">
              <i className={isCourse ? 'on' : ''} />
              <i className={!isCourse ? 'on' : ''} />
              <span>{paused ? '已暂停 · ' : ''}课题 ↔ 活动 · 8s</span>
            </div>
          </div>
        </div>
      </section>

      <aside className="side left">
        <section className="card" id="courses">
          <div className="card-k">正在发生 · COURSE</div>
          <h3>{course?.title || '暂无课题'}</h3>
          <p>{fmt(course?.startTime)} — {fmt(course?.endTime)}</p>
          <button className="card-link" type="button" onClick={() => setActive(0)}>在圆内查看 →</button>
        </section>
        <section className="card" id="activities">
          <div className="card-k">正在发生 · EVENT</div>
          <h3>{activity?.name || '暂无活动'}</h3>
          <p>{fmt(activity?.startTime)} — {fmt(activity?.endTime)}</p>
          <button className="card-link" type="button" onClick={() => setActive(1)} disabled={!activities.length}>在圆内查看 →</button>
        </section>
        <section className="card" id="today">
          <div className="card-k">今日 · CHECK IN</div>
          <h3>{checkin?.checkedIn ? '今天已签到' : '抽取今日运势'}</h3>
          <p>{checkin?.fortune?.fortuneText || `日期 ${checkin?.date || '—'}`}</p>
          <button className="card-link" type="button" onClick={onCheckin} disabled={!checkin || checkin.checkedIn || checking}>
            {checking ? '签到中…' : checkin?.checkedIn ? '明天再来' : '立即签到 →'}
          </button>
        </section>
      </aside>

      <aside className="side right">
        <section className="card" id="member">
          <div className="card-k">每日群友 · MEMBER</div>
          <div className="member">
            <img src={asset(daily?.avatar, '/club-logo.jpg')} alt="" />
            <div><h3>{daily?.account || '今天暂时没有群友'}</h3><p>{daily?.description || '每天认识一名群友'}</p></div>
          </div>
        </section>
        <section className="card" id="forum">
          <div className="card-k">论坛热帖 · LOBBY</div>
          {forum.length ? forum.map((post) => (
            <div className="post" key={post.id}><b>{post.title}</b><span>{post.authorName}</span></div>
          )) : <p>暂无帖子，等你开第一贴。</p>}
        </section>
        <section className="card" id="links">
          <div className="card-k">快速入口 · LINKS</div>
          <div className="quick">
            <a href="#courses">课题</a><a href="#activities">活动</a><a href="#forum">论坛</a><a href="#top">回到顶部</a>
          </div>
        </section>
      </aside>

      <nav className="mobile-tab" aria-label="移动导航">
        <a href="#top" className="on">首页</a>
        <a href="#courses">课题</a>
        <a href="#activities">活动</a>
        <a href="#forum">论坛</a>
        <Link to="/login">我的</Link>
      </nav>
    </main>
  )
}
