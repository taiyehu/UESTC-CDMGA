// 此文件专门负责项目的路由
import Vue from 'vue'
import VueRouter from 'vue-router'
import { Message } from 'element-ui'

// 引入组件
import Login from '../views/login/Login.vue'
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


// 使用VueRouter插件
Vue.use(VueRouter)

// 创建路由器实例
const router = new VueRouter({
    mode: 'history',    // 路由模式，该模式不会在地址中显示井号#
    routes: [
        {
            path: '/',          // 路径
            redirect: '/login'  // 重定向
        },
        {
            path: '/login',     // 路径
            component: Login    // 跳转到的组件
        },
        {
            path: '/home',      // 路径
            component: Home     // 跳转到的组件
        },
        {
            path: '/register',
            component: Register
        },
        {
            path:'/profile',
            component: Profile
        },
        {
            path:'/admin-users',
            component: adminUsers
        },
        {
            path:'/admin-courses',
            component: adminCourses
        },
        {
            path: '/review',
            component: review
        },
        {
            path: '/score',
            component: score
        },
        {
            path: '/admin-profiles',
            component: adminProfiles
        },
        {
            path: '/ranking',
            component: ranking
        },
        {
            path: '/task',
            component: task
        },
        {
            path: '/links',
            component: links
        },
        {
        path: '/profile/:id?',
        name: 'Profile',
        component: () => import('@/views/profile/profile.vue')
        }
    ]
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!sessionStorage.getItem('userInfo')

    // 如果路由要跳转到除了登录和注册的界面的话就判断是否已经登录
    if (to.path !== '/login' && to.path !== '/register' && !isAuthenticated) {
        Message({
            message: '请先登录！',
            type: 'warning'
        })
        next({ path: '/login' })
    } else {
        next()
    }
})

export default router
