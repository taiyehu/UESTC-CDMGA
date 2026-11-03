import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'

const sections = [
  { to: '/admin/users', title: '用户', desc: '账号列表、分页与删除' },
  { to: '/admin/profiles', title: '资料审核', desc: '待审核资料通过、驳回、删除' },
  { to: '/admin/profiles-passed', title: '已通过资料', desc: '已通过资料查询与筛选' },
  { to: '/admin/courses', title: '课题管理', desc: '编辑、封面、删除课题' },
  { to: '/admin/content-publish', title: '发布内容', desc: '发布课题或活动' },
  { to: '/admin/activities', title: '活动管理', desc: '关联签到课题、删除活动' },
  { to: '/admin/scores', title: '成绩审核', desc: '常规成绩评分与删除' },
  { to: '/admin/bingo-submissions', title: 'Bingo 审核', desc: 'Bingo 提交通过/曲目/方式' },
  { to: '/admin/bingo-tips', title: 'Bingo 提示', desc: '按课题配置解锁提示' },
  { to: '/admin/issues', title: '题目管理', desc: 'Typical / Bingo issue 配置' },
  { to: '/admin/teams', title: '队伍管理', desc: 'Bingo 队伍成员维护' },
  { to: '/admin/rank-configs', title: '排行配置', desc: 'counting_rules 与课题' },
  { to: '/admin/score-logs', title: '成绩日志', desc: '按课题/用户/状态查询' },
  { to: '/admin/titles', title: '称号管理', desc: '审核、发放、编辑、撤销' },
  { to: '/admin/forum', title: '论坛审核', desc: '举报、帖子保留/删除' },
] as const

export default function AdminDashboardPage() {
  return (
    <PageShell title="ADMIN" subtitle="后台总览 · 所有管理模块">
      <div className="page-card" style={{ marginBottom: 16 }}>
        <div className="card-k">CONTROL ROOM</div>
        <h2 style={{ marginTop: 6 }}>后台管理</h2>
        <p className="desc">从这里进入全部管理页面；顶部后台导航也会一直显示。</p>
      </div>
      <div className="admin-grid">
        {sections.map((item) => <Link className="page-card admin-card" to={item.to} key={item.to}><div className="card-k">{item.to.replace('/admin/', '').toUpperCase()}</div><h3>{item.title}</h3><p className="desc">{item.desc}</p><span className="admin-go">进入 →</span></Link>)}
      </div>
    </PageShell>
  )
}
