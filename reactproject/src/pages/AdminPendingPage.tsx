import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function AdminPendingPage() {
  return (
    <PageShell title="ADMIN · 404" subtitle="页面不存在">
      <div className="page-card">
        <div className="card-k">NOT FOUND</div>
        <h3>没有这个后台页面</h3>
        <p className="desc">请从后台导航进入用户、课题、活动、成绩、称号或论坛管理。</p>
        <div className="page-actions-row"><Link className="page-btn primary" to="/admin/users">返回后台</Link><Link className="page-btn" to="/home">返回首页</Link></div>
      </div>
    </PageShell>
  )
}
