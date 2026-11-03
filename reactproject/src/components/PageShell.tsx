import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

const links = [
  ['/home', '首页'],
  ['/task', '课题'],
  ['/activity', '活动'],
  ['/ranking', '排行'],
  ['/forum', '论坛'],
  ['/awards', '奖品'],
  ['/links', '链接'],
] as const

export default function PageShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}) {
  const location = useLocation()
  const navigate = useNavigate()
  let user: any = null
  let role = ''
  try {
    user = JSON.parse(sessionStorage.getItem('userInfo') || 'null')
    const rawRole = sessionStorage.getItem('role')
    if (rawRole) {
      try {
        const parsedRole = JSON.parse(rawRole)
        role = typeof parsedRole === 'string' ? parsedRole : String(parsedRole?.role ?? '')
      } catch {
        role = rawRole
      }
    }
  } catch {
    user = null
  }
  const adminLinks = [
    ['/admin', '总览'], ['/admin/users', '用户'], ['/admin/courses', '课题'], ['/admin/content-publish', '发布'],
    ['/admin/activities', '活动'], ['/admin/profiles', '资料'], ['/admin/titles', '称号'],
    ['/admin/forum', '论坛'], ['/admin/scores', '成绩'], ['/admin/rank-configs', '排行配置'],
    ['/admin/score-logs', '日志'], ['/admin/bingo-submissions', 'Bingo 审核'],
    ['/admin/bingo-tips', 'Tips'], ['/admin/issues', '题目'], ['/admin/teams', '队伍'],
  ] as const

  function logout() {
    sessionStorage.removeItem('userInfo')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  return (
    <div className="page-shell">
      <div className="bg" aria-hidden="true" />
      <header className="page-top">
        <Link to="/home" className="brand">
          <img src="/club-logo.jpg" alt="" className="brand-mark" />
          <span><b>UESTC CDMGA</b><em>MAIMAI CLUB · 街机舞台</em></span>
        </Link>
        <nav className="page-nav">
          {links.map(([to, label]) => (
            <Link key={to} to={to} className={location.pathname === to || location.pathname.startsWith(`${to}/`) ? 'on' : ''}>{label}</Link>
          ))}
        </nav>
        <div className="page-user">
          {user ? <Link className="user-chip" to={`/profile/${user.id}`}><img src="/club-logo.jpg" alt="" /><b>{user.account || '社员'}</b></Link> : <Link className="user-chip login-chip" to="/login">登录</Link>}
          {role === 'admin' && <Link className="icon-btn" to="/admin" aria-label="进入后台" title="进入后台">⚙</Link>}
          <button className="icon-btn" type="button" onClick={logout} aria-label="退出登录">↪</button>
        </div>
      </header>
      {role === 'admin' && location.pathname.startsWith('/admin') && (
        <nav className="admin-nav" aria-label="后台导航">
          {adminLinks.map(([to, label]) => <Link key={to} to={to} className={to === '/admin' ? (location.pathname === '/admin' ? 'on' : '') : location.pathname.startsWith(to) ? 'on' : ''}>{label}</Link>)}
        </nav>
      )}
      <main className="page-main">
        <div className="page-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
