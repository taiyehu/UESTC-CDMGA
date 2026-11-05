import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import './UserMenu.css'

function sessionUser(): any { try { return JSON.parse(sessionStorage.getItem('userInfo') || 'null') } catch { return null } }
function imageUrl(path?: string | null) { if (!path) return '/club-logo.jpg'; return /^https?:\/\//i.test(path) || path.startsWith('/') ? path : `/${path}` }

export default function UserMenu() {
  const navigate = useNavigate()
  const user = sessionUser()
  const [avatar, setAvatar] = useState('/club-logo.jpg')
  const [open, setOpen] = useState(false)
  const [light, setLight] = useState(() => localStorage.getItem('theme') === 'light')
  const isAdmin = (() => { try { const r = JSON.parse(sessionStorage.getItem('role') || 'null'); return (typeof r === 'string' ? r : r?.role) === 'admin' } catch { return false } })()

  useEffect(() => {
    if (!user?.id) return
    if (user.avatar) setAvatar(imageUrl(user.avatar))
    api.get(`/profile/identity/${user.id}`).then((res) => { const p = res.data?.data ?? res.data; if (p?.avatar) setAvatar(imageUrl(p.avatar)) }).catch(() => {})
  }, [user?.id])

  function toggleTheme() {
    const next = !light
    setLight(next)
    localStorage.setItem('theme', next ? 'light' : 'dark')
    document.documentElement.classList.toggle('light', next)
  }
  function logout() {
    sessionStorage.removeItem('userInfo')
    sessionStorage.removeItem('role')
    setOpen(false)
    navigate('/login')
  }

  if (!user) return <Link className="user-menu guest" to="/login">登录</Link>
  return (
    <div className="user-menu">
      <button className="user-menu-btn" type="button" aria-label="打开用户菜单" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <img src={avatar} alt="用户头像" />
      </button>
      {open && <div className="user-menu-panel">
        <Link to={`/profile/${user.id}`} onClick={() => setOpen(false)}>个人中心</Link>
        {isAdmin && <Link to="/admin" onClick={() => setOpen(false)}>管理</Link>}
        <button type="button" onClick={toggleTheme}>{light ? '深色模式' : '亮色模式'}</button>
        <button type="button" onClick={logout}>登出</button>
      </div>}
    </div>
  )
}
