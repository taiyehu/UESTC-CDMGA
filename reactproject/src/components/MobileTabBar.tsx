import { Link, useLocation } from 'react-router-dom'

function sessionUser(): any { try { return JSON.parse(sessionStorage.getItem('userInfo') || 'null') } catch { return null } }

export default function MobileTabBar() {
  const { pathname } = useLocation()
  const user = sessionUser()
  const items = [
    ['/home', '首页'],
    ['/task', '课题'],
    ['/activity', '活动'],
    ['/forum', '论坛'],
    ['/scan', '扫码'],
    [user?.id ? `/profile/${user.id}` : '/login', '我的'],
  ] as const
  return <nav className="mobile-tab" aria-label="移动导航">{items.map(([to, label]) => <Link key={label} to={to} className={pathname === to || (to !== '/home' && pathname.startsWith(`${to}/`)) ? 'on' : ''}>{label}</Link>)}</nav>
}
