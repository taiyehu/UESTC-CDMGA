import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import MailBadge from './MailBadge'
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
        {links.map(([to, label]) => <Link key={to} to={to} className={pathname === to || (to !== '/home' && pathname.startsWith(`${to}/`)) ? 'on' : ''}>{label}{to === '/forum' && <MailBadge forum />}</Link>)}
      </nav>
      <div className="site-actions"><ThemeToggle /><Link to="/mail" className={`mail-action${pathname === '/mail' ? ' on' : ''}`} aria-label="信箱" title="信箱"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg><MailBadge /></Link><UserMenu /></div>
    </header>
  )
}
