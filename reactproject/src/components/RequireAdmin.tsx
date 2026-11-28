import { Navigate, Outlet, useOutletContext } from 'react-router-dom'

export default function RequireAdmin() {
  const { user } = useOutletContext<{ user: { role?: string } }>()
  if (user.role !== 'admin') return <Navigate to="/home" replace />
  return <Outlet />
}
