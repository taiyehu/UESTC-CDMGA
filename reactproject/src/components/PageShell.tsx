import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import MobileTabBar from './MobileTabBar'
import TopBar from './TopBar'

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
  let role = ''
  try {
    const rawRole = sessionStorage.getItem('role')
    if (rawRole) {
      try {
        const parsedRole = JSON.parse(rawRole)
        role = typeof parsedRole === 'string' ? parsedRole : String(parsedRole?.role ?? '')
      } catch { role = rawRole }
    }
  } catch { role = '' }
  const isAdminArea = role === 'admin' && location.pathname.startsWith('/admin')


  return (
    <div className="page-shell">
      <div className="bg" aria-hidden="true" />
      <TopBar />
      {isAdminArea ? <div className="admin-page-body"><AdminSidebar /><main className="page-main">
        <div className="page-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
        {children}
      </main></div> : <main className="page-main">
        <div className="page-head">
          <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
        {children}
      </main>}
      <MobileTabBar />
    </div>
  )
}
