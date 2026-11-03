import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

export default function AdminPendingPage() {
  return (
    <PageShell title="ADMIN" subtitle="后台迁移中">
      <div className="page-card">
        <h3>后台页面尚未迁移</h3>
        <p className="desc">本次迁移先完成公开页、课题、活动、排行、论坛、个人与登录注册。后台 14 个管理页仍在 Vue 旧站，下一步批量迁移。</p>
        <div className="page-actions-row"><Link className="page-btn" to="/home">返回首页</Link></div>
      </div>
    </PageShell>
  )
}
