// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// 页面组件（懒加载，降低首包体积）
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const Home = () => import('@/views/pages/home.vue')
const Profile = () => import('@/views/profile/profile.vue')
const ProfileSetting = () => import('@/views/profile/profile_setting.vue')
const AdminUsers = () => import('@/views/admin/admin-users.vue')
const AdminCourses = () => import('@/views/admin/admin-courses.vue')
const AdminScores = () => import('@/views/admin/admin-scores.vue')
const AdminRankConfigs = () => import('@/views/admin/admin-rank-configs.vue')
const AdminScoreLogs = () => import('@/views/admin/admin-score-logs.vue')
const AdminBingoSubmissions = () => import('@/views/admin/admin-bingo-submissions.vue')
const AdminBingoTips = () => import('@/views/admin/admin-bingo-tips.vue')
const AdminIssues = () => import('@/views/admin/admin-issues.vue')
const AdminTeams = () => import('@/views/admin/admin-teams.vue')
const AdminProfiles = () => import('@/views/admin/admin-profiles.vue')
const AdminProfilesPassed = () => import('@/views/admin/admin-profiles-passed.vue')
const AdminTitles = () => import('@/views/admin/admin-titles.vue')
const AdminLayout = () => import('@/views/admin/AdminLayout.vue')
const AdminContentPublish = () => import('@/views/admin/admin-content-publish.vue')
const Ranking = () => import('@/views/pages/ranking.vue')
const RankingNew = () => import('@/views/pages/ranking-new.vue')
const Task = () => import('@/views/pages/task.vue')
const Awards = () => import('@/views/pages/awards.vue')
const TaskDetailPage = () => import('@/views/task/TaskDetailPage.vue')
const TaskBingoDetail = () => import('@/views/task/TaskBingoDetail.vue')
const Links = () => import('@/views/pages/links.vue')
const Activity = () => import('@/views/activity/activity.vue')
const ActivityDetailPage = () => import('@/views/activity/ActivityDetailPage.vue')
const SignDisplayPage = () => import('@/views/activity/SignDisplayPage.vue')
const SignCheckinPage = () => import('@/views/activity/SignCheckinPage.vue')
const SignScannerPage = () => import('@/views/activity/SignScannerPage.vue')
const AdminActivities = () => import('@/views/admin/admin-activities.vue')
const ContestRanking = () => import('@/views/pages/contest-ranking.vue')
const NotFoundPage = () => import('@/views/pages/not-found.vue')
const Forum = () => import('@/views/forum/forum.vue')
const ForumPost = () => import('@/views/forum/forum-post.vue')
const AdminForum = () => import('@/views/admin/admin-forum.vue')

// 路由表
const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/register',
    component: Register,
  },
  {
    path: '/home',
    component: Home,
  },
  {
    path: '/profile/:id?',
    name: 'Profile',
    component: Profile,
  },
  {
    path: '/profile-setting',
    name: 'ProfileSetting',
    component: ProfileSetting,
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/admin/users',
      },
      {
        path: 'users',
        component: AdminUsers,
      },
      {
        path: 'courses',
        component: AdminCourses,
      },
      {
        path: 'content-publish',
        component: AdminContentPublish,
      },
      {
        path: 'profiles',
        component: AdminProfiles,
      },
      {
        path: 'profiles-passed',
        component: AdminProfilesPassed,
      },
      {
        path: 'titles',
        component: AdminTitles,
      },
      {
        path: 'forum',
        component: AdminForum,
      },
      {
        path: 'activities',
        component: AdminActivities,
      },
      {
        path: 'courses-publish',
        redirect: '/admin/content-publish',
      },
      {
        path: 'activities-publish',
        redirect: '/admin/content-publish',
      },
      {
        path: 'scores',
        component: AdminScores,
      },
      {
        path: 'rank-configs',
        component: AdminRankConfigs,
      },
      {
        path: 'score-logs',
        component: AdminScoreLogs,
      },
      {
        path: 'bingo-submissions',
        component: AdminBingoSubmissions,
      },
      {
        path: 'bingo-tips/:courseId?',
        component: AdminBingoTips,
      },
      {
        path: 'issues/:courseId?',
        component: AdminIssues,
      },
      {
        path: 'teams/:courseId?',
        component: AdminTeams,
      },
    ],
  },
  {
    path: '/ranking',
    component: Ranking,
  },
  {
    path: '/ranking-new',
    component: RankingNew,
  },
  {
    path: '/task',
    component: Task,
  },
  {
    path: '/awards',
    component: Awards,
  },
  {
    path: '/task/:id',
    component: TaskDetailPage,
  },
  {
    path: '/task/:id/bingo/:cellId',
    component: TaskBingoDetail,
  },
  {
    path: '/links',
    component: Links,
  },
  {
    path: '/forum',
    component: Forum,
  },
  {
    path: '/forum/:id',
    component: ForumPost,
  },
  {
    path: '/activity',
    component: Activity,
  },
  {
    path: '/activity/:id',
    component: ActivityDetailPage,
  },
  {
    path: '/activity/:id/sign-display',
    component: SignDisplayPage,
  },
  {
    path: '/sign/:activityId',
    component: SignCheckinPage,
  },
  {
    path: '/scan',
    component: SignScannerPage,
  },
  {
    path: '/contest-ranking',
    component: ContestRanking,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
  },
]

// 创建 router 实例
const router = createRouter({
  history: createWebHistory(),
  routes: routes as unknown as any,
})

/**
 * 全局前置守卫
 */
router.beforeEach(async (to) => {
  const publicRoute = to.path === '/login' || to.path === '/register'
  let serverUser: any = null

  if (!publicRoute) {
    try {
      const response = await request.get('/identity/me')
      serverUser = response.data?.data ?? response.data
      if (!serverUser?.id) throw new Error('Invalid session')
      sessionStorage.setItem('userInfo', JSON.stringify(serverUser))
      sessionStorage.setItem('role', JSON.stringify(serverUser.role ?? 'user'))
    } catch {
      sessionStorage.removeItem('userInfo')
      sessionStorage.removeItem('role')
    }
  }

  if (!publicRoute && !serverUser) {
    ElMessage.warning('请先登录！')
    return to.path.startsWith('/sign/') ? { path: '/login', query: { redirect: to.fullPath } } : '/login'
  }

  // 管理员权限控制
  if (to.path.startsWith('/admin') || to.path.endsWith('/sign-display')) {
    // 更稳健地解析 role：兼容纯文本和 JSON 字符串，优先在已登录的前提下读取
    if (serverUser?.role !== 'admin') {
      ElMessage.warning('需要管理员权限')
      return '/home'
    }
  }
})

export default router
