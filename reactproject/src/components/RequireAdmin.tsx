import { Navigate, Outlet } from 'react-router-dom'

function readRole(): string | null {
  const raw = sessionStorage.getItem('role')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string') return parsed
    if (parsed && typeof parsed === 'object') return String(parsed.role ?? parsed.name ?? '')
    return String(parsed)
  } catch {
    return raw
  }
}

export default function RequireAdmin() {
  const loggedIn = Boolean(sessionStorage.getItem('userInfo'))
  if (!loggedIn) return <Navigate to="/login" replace />
  if (readRole() !== 'admin') return <Navigate to="/home" replace />
  return <Outlet />
}
