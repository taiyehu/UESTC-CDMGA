import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { api } from '../api'
import AuthLoadingPage from './AuthLoadingPage'

type VerifiedUser = { id: number; role?: string }
type SessionState =
  | { status: 'checking' }
  | { status: 'authenticated'; user: VerifiedUser }
  | { status: 'anonymous' }
  | { status: 'error' }

export default function RequireAuth() {
  const location = useLocation()
  const [session, setSession] = useState<SessionState>({ status: 'checking' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    api.get('/identity/me', { signal: controller.signal }).then((res) => {
      if (!active) return
      const user = (res.data?.data ?? res.data) as VerifiedUser | null
      if (!user?.id) {
        sessionStorage.removeItem('userInfo')
        sessionStorage.removeItem('role')
        setSession({ status: 'anonymous' })
        return
      }
      sessionStorage.setItem('userInfo', JSON.stringify(user))
      sessionStorage.setItem('role', JSON.stringify(user.role ?? 'user'))
      setSession({ status: 'authenticated', user })
    }).catch((error: { response?: { status?: number } }) => {
      if (!active) return
      if (error.response?.status === 401 || error.response?.status === 403) {
        sessionStorage.removeItem('userInfo')
        sessionStorage.removeItem('role')
        setSession({ status: 'anonymous' })
      } else {
        setSession({ status: 'error' })
      }
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [attempt])

  if (session.status === 'checking') return <AuthLoadingPage />
  if (session.status === 'error') {
    return <AuthLoadingPage error onRetry={() => {
      setSession({ status: 'checking' })
      setAttempt((value) => value + 1)
    }} />
  }
  if (session.status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet context={{ user: session.user }} />
}
