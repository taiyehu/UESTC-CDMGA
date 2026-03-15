// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 页面组件
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import Home from '@/views/pages/home.vue'
import Profile from '@/views/profile/profile.vue'
import ProfileSetting from '@/views/profile/profile_setting.vue'
import adminUsers from '@/views/admin/admin-users.vue'
import adminCourses from '@/views/admin/admin-courses.vue'
import adminScores from '@/views/admin/admin-scores.vue'
import adminBingoSubmissions from '@/views/admin/admin-bingo-submissions.vue'
import adminIssues from '@/views/admin/admin-issues.vue'
import adminTeams from '@/views/admin/admin-teams.vue'
import adminProfiles from '@/views/admin/admin-profiles.vue'
import adminProfilesPassed from '@/views/admin/admin-profiles-passed.vue'
import AdminLayout from '@/views/admin/AdminLayout.vue'
import adminCoursesPublish from '@/views/admin/admin-courses-publish.vue'
import adminActivitiesPublish from '@/views/admin/admin-activities-publish.vue'
import ranking from '@/views/pages/ranking.vue'
import task from '@/views/pages/task.vue'
import TaskDetailPage from '@/views/task/TaskDetailPage.vue'
import TaskBingoDetail from '@/views/task/TaskBingoDetail.vue'
import links from '@/views/pages/links.vue'
import activity from '@/views/activity/activity.vue'
import ActivityDetailPage from '@/views/activity/ActivityDetailPage.vue'
import adminActivities from '@/views/admin/admin-activities.vue'
import contestRanking from '@/views/pages/contest-ranking.vue'
import NotFoundPage from '@/views/pages/not-found.vue'

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
        component: adminUsers,
      },
      {
        path: 'courses',
        component: adminCourses,
      },
      {
        path: 'courses-publish',
        component: adminCoursesPublish,
      },
      {
        path: 'profiles',
        component: adminProfiles,
      },
      {
        path: 'profiles-passed',
        component: adminProfilesPassed,
      },
      {
        path: 'activities',
        component: adminActivities,
      },
      {
        path: 'activities-publish',
        component: adminActivitiesPublish,
      },
      {
        path: 'scores',
        component: adminScores,
      },
      {
        path: 'bingo-submissions',
        component: adminBingoSubmissions,
      },
      {
        path: 'issues/:courseId?',
        component: adminIssues,
      },
      {
        path: 'teams/:courseId?',
        component: adminTeams,
      },
    ],
  },
  {
    path: '/ranking',
    component: ranking,
  },
  {
    path: '/task',
    component: task,
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
    component: links,
  },
  {
    path: '/activity',
    component: activity,
  },
  {
    path: '/activity/:id',
    component: ActivityDetailPage,
  },
  {
    path: '/contest-ranking',
    component: contestRanking,
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
