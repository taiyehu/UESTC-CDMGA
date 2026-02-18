// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 页面组件
import Login from '@/views/login/Login.vue'
import Register from '@/views/register/Register.vue'
import Home from '@/views/home/home.vue'
import Profile from '@/views/profile/profile.vue'
import adminUsers from '@/views/admin/admin-users.vue'
import adminCourses from '@/views/admin/admin-courses.vue'
import score from '@/views/score/score.vue'
import review from '@/views/review/review.vue'
import adminProfiles from '@/views/admin/admin-profiles.vue'
import ranking from '@/views/pages/ranking.vue'
import task from '@/views/pages/task.vue'
import links from '@/views/pages/links.vue'
import activity from '@/views/activity/activity.vue'
import adminActivities from '@/views/admin/admin-activities.vue'
import contestRanking from '@/views/pages/contest-ranking.vue'

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
    path: '/admin-users',
    component: adminUsers,
  },
  {
    path: '/admin-courses',
    component: adminCourses,
  },
  {
    path: '/admin-profiles',
    component: adminProfiles,
  },
  {
    path: '/admin-activities',
    component: adminActivities,
  },
  {
    path: '/review',
    component: review,
  },
  {
    path: '/score',
    component: score,
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
    path: '/links',
    component: links,
  },
  {
    path: '/activity',
    component: activity,
  },
  {
    path: '/contest-ranking',
    component: contestRanking,
  },
]

// 创建 router 实例
const router = createRouter({
  history: createWebHistory(),
  routes,
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
  const adminPaths = [
    '/admin-users',
    '/admin-courses',
    '/admin-profiles',
    '/admin-activities',
    '/review',
  ]

  if (adminPaths.includes(to.path)) {
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
