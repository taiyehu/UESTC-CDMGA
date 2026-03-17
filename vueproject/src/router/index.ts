// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 页面组件（懒加载，降低首包体积）
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const Home = () => import('@/views/pages/home.vue')
const Profile = () => import('@/views/profile/profile.vue')
const ProfileSetting = () => import('@/views/profile/profile_setting.vue')
const AdminUsers = () => import('@/views/admin/admin-users.vue')
const AdminCourses = () => import('@/views/admin/admin-courses.vue')
const AdminScores = () => import('@/views/admin/admin-scores.vue')
const AdminScoreLogs = () => import('@/views/admin/admin-score-logs.vue')
const AdminBingoSubmissions = () => import('@/views/admin/admin-bingo-submissions.vue')
const AdminIssues = () => import('@/views/admin/admin-issues.vue')
const AdminTeams = () => import('@/views/admin/admin-teams.vue')
const AdminProfiles = () => import('@/views/admin/admin-profiles.vue')
const AdminProfilesPassed = () => import('@/views/admin/admin-profiles-passed.vue')
const AdminLayout = () => import('@/views/admin/AdminLayout.vue')
const AdminContentPublish = () => import('@/views/admin/admin-content-publish.vue')
const Ranking = () => import('@/views/pages/ranking.vue')
const Task = () => import('@/views/pages/task.vue')
const TaskDetailPage = () => import('@/views/task/TaskDetailPage.vue')
const TaskBingoDetail = () => import('@/views/task/TaskBingoDetail.vue')
const Links = () => import('@/views/pages/links.vue')
const Activity = () => import('@/views/activity/activity.vue')
const ActivityDetailPage = () => import('@/views/activity/ActivityDetailPage.vue')
const AdminActivities = () => import('@/views/admin/admin-activities.vue')
const ContestRanking = () => import('@/views/pages/contest-ranking.vue')
const NotFoundPage = () => import('@/views/pages/not-found.vue')

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
        path: 'score-logs',
        component: AdminScoreLogs,
      },
      {
        path: 'bingo-submissions',
        component: AdminBingoSubmissions,
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
    path: '/task',
    component: Task,
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
    path: '/activity',
    component: Activity,
  },
  {
    path: '/activity/:id',
    component: ActivityDetailPage,
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
router.beforeEach((to) => {
  const userInfo = sessionStorage.getItem('userInfo')
  const isAuthenticated = !!userInfo

  // 未登录拦截
  if (to.path !== '/login' && to.path !== '/register' && !isAuthenticated) {
    ElMessage.warning('请先登录！')
    return '/login'
  }

  // 管理员权限控制
  if (to.path.startsWith('/admin')) {
    // 更稳健地解析 role：兼容纯文本和 JSON 字符串，优先在已登录的前提下读取
    let userRole: string | null = null
    if (userInfo) {
      const roleRaw = sessionStorage.getItem('role')
      if (roleRaw) {
        try {
          const parsed = JSON.parse(roleRaw)
          if (typeof parsed === 'string') {
            userRole = parsed
          } else if (parsed && typeof parsed === 'object') {
            // 如果存的是对象，尝试取字段 'role' 或 'name'
            userRole = String(
              parsed.role ?? parsed.name ?? JSON.stringify(parsed)
            )
          } else {
            userRole = String(parsed)
          }
        } catch (e) {
          // 不是合法 JSON，直接使用原始字符串
          userRole = roleRaw
        }
      }
    }

    if (userRole !== 'admin') {
      ElMessage.warning('需要管理员权限')
      return '/home'
    }
  }
})

export default router
