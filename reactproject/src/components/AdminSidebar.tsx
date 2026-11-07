import { Link, useLocation } from 'react-router-dom'

const items = [
  ['/admin', '后台总览'], ['/admin/users', '用户管理'], ['/admin/courses', '课题管理'], ['/admin/content-publish', '发布内容'],
  ['/admin/activities', '活动管理'], ['/admin/scores', '成绩管理'], ['/admin/bingo-submissions', 'Bingo 审核'],
  ['/admin/bingo-tips', 'Bingo 提示'], ['/admin/issues', 'Issue 管理'], ['/admin/teams', '队伍管理'],
  ['/admin/profiles', '资料审核'], ['/admin/profiles-passed', '已通过资料'], ['/admin/titles', '称号管理'],
  ['/admin/forum', '论坛管理'], ['/admin/rank-configs', '排行配置'], ['/admin/score-logs', '成绩日志'],
] as const

export default function AdminSidebar() {
  const { pathname } = useLocation()
  return <aside className="admin-left"><div className="admin-left-title">管理后台</div>{items.map(([to, label]) => <Link key={to} to={to} className={to === '/admin' ? (pathname === '/admin' ? 'on' : '') : pathname.startsWith(to) ? 'on' : ''}>{label}</Link>)}</aside>
}
