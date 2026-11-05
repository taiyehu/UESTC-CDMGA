import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'
import './TopBar.css'

const links = [
  ['/home', '首页'], ['/task', '课题'], ['/activity', '活动'], ['/ranking', '排行'],
  ['/forum', '论坛'], ['/awards', '奖品'], ['/links', '链接'],
] as const

export default function TopBar() {
  const { pathname } = useLocation()
  return (
    <header className="site-top">
      <Link to="/home" className="site-logo" aria-label="UESTC CDMGA 首页"><img src="/club-logo.jpg" alt="UESTC CDMGA 社团徽章" /></Link>
      <nav className="site-center" aria-label="主导航">
        {links.map(([to, label]) => <Link key={to} to={to} className={pathname === to || (to !== '/home' && pathname.startsWith(`${to}/`)) ? 'on' : ''}>{label}</Link>)}
      </nav>
      <div className="site-actions"><ThemeToggle /><UserMenu /></div>
    </header>
  )
}
