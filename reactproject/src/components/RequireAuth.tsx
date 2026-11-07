import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { api } from '../api'

export default function RequireAuth() {
  const location = useLocation()
  const [state, setState] = useState<'checking' | 'authenticated' | 'anonymous'>('checking')
  const [checkedPath, setCheckedPath] = useState('')

  useEffect(() => {
    let active = true
    api.get('/identity/me').then((res) => {
      const user = res.data?.data ?? res.data
      if (!user?.id) throw new Error('Invalid session')
      sessionStorage.setItem('userInfo', JSON.stringify(user))
      sessionStorage.setItem('role', JSON.stringify(user.role ?? 'user'))
      if (active) {
        setState('authenticated')
        setCheckedPath(location.pathname)
      }
    }).catch(() => {
      sessionStorage.removeItem('userInfo')
      sessionStorage.removeItem('role')
      if (active) {
        setState('anonymous')
        setCheckedPath(location.pathname)
      }
    })
    return () => { active = false }
  }, [location.pathname])

  if (state === 'checking' || checkedPath !== location.pathname) return <div role="status" className="route-auth-loading">正在验证登录状态…</div>
  if (state === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
