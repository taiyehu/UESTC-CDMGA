<template>
  <nav
    class="fixed inset-x-0 top-0 z-50 h-(--navbar-height) isolate bg-transparent"
    @keydown.esc="mobileMenuOpen = false"
  >
    <!-- 毛玻璃底（保持整体透明） -->
    <div
      class="absolute inset-0 border-b border-cyan-200/20 bg-slate-950/96"
      aria-hidden="true"
    />

    <div
      class="absolute inset-0 bg-linear-to-r from-cyan-400/4 via-fuchsia-400/3 to-cyan-400/4"
      aria-hidden="true"
    />

    <div class="relative z-10 flex h-full items-center justify-between px-4 lg:px-14">
      <div class="hidden items-center gap-2 lg:flex">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          custom
          v-slot="{ href, navigate, isActive }"
        >
          <a
            :href="href"
            @click="navigate"
            class="relative inline-flex items-center px-3 py-2 text-lg tracking-wide text-white/90 transition-colors hover:text-white"
          >
            <span>{{ link.label }}</span>

            <!-- 选中路由：流光下标（移植 JudgmentLine 思路） -->
            <span
              v-if="isActive"
              class="absolute -bottom-1 left-2 right-2 h-0.75 overflow-hidden rounded-full"
            >
              <motion.div
                v-if="!isMobileLite"
                class="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95 mix-blend-screen"
                :animate="{ x: ['-100%', '200%'] }"
                :transition="{ duration: 5, repeat: Infinity, ease: 'linear' }"
              />
              <motion.div
                v-if="!isMobileLite"
                class="absolute inset-0 bg-linear-to-r from-transparent via-fuchsia-400 to-transparent opacity-95 mix-blend-screen"
                :animate="{ x: ['200%', '-100%'] }"
                :transition="{ duration: 6, repeat: Infinity, ease: 'linear' }"
              />
              <span
                class="absolute inset-0 bg-linear-to-r from-purple-500/45 via-cyan-500/70 to-pink-500/45"
              />
            </span>
          </a>
        </router-link>
      </div>

      <div class="hidden items-center gap-4 lg:flex">
        <VisualEffectsToggle />
        <NeonActionButton
          v-if="isAdmin"
          variant="violet"
          @click="goAdmin"
        >
          管理
        </NeonActionButton>

        <NeonActionButton
          variant="violet"
          @click="logout"
        >
          登出
        </NeonActionButton>

        <button
          type="button"
          class="group inline-flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-2 ring-white/40 transition hover:ring-white/70"
          @click="goProfile"
          aria-label="进入个人界面"
          title="进入个人界面"
        >
          <img
            class="h-full w-full object-cover"
            :src="avatarUrl"
            alt="头像"
            referrerpolicy="no-referrer"
          />
        </button>
      </div>

      <div class="flex w-full items-center justify-between lg:hidden">
        <button
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-lg px-3 text-base text-cyan-50 focus-visible:outline-2 focus-visible:outline-cyan-300"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-nav-menu"
          :aria-label="mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span aria-hidden="true" class="text-xl leading-none">{{ mobileMenuOpen ? '×' : '☰' }}</span>
          <span>菜单</span>
        </button>
        <router-link to="/scan" class="inline-flex h-11 items-center rounded-lg border border-cyan-400/60 px-3 text-sm font-semibold text-cyan-50" @click="mobileMenuOpen = false">扫码签到</router-link>
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/40 focus-visible:outline-2 focus-visible:outline-cyan-300"
          @click="goProfile"
          aria-label="进入个人界面"
        >
          <img class="h-full w-full object-cover" :src="avatarUrl" alt="头像" referrerpolicy="no-referrer" />
        </button>
      </div>
    </div>

    <div
      v-if="mobileMenuOpen"
      id="mobile-nav-menu"
      class="absolute inset-x-0 top-full z-20 max-h-[calc(100dvh-var(--navbar-height))] overflow-y-auto border-b border-cyan-200/30 bg-slate-950/98 px-4 py-3 shadow-xl lg:hidden"
    >
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="flex min-h-11 items-center rounded-lg px-3 text-left text-base text-cyan-50"
        :class="route.path === link.to || route.path.startsWith(`${link.to}/`) ? 'bg-cyan-300/15 font-semibold' : ''"
        @click="mobileMenuOpen = false"
      >
        {{ link.label }}
      </router-link>
      <button v-if="isAdmin" type="button" class="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-base text-cyan-50" @click="goAdmin">管理</button>
      <VisualEffectsToggle class="w-full justify-start" />
      <button type="button" class="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-base text-cyan-50" @click="logout">登出</button>
    </div>

    <!-- 判定线动画：整个区域最下面 -->
    <div
      class="absolute inset-x-0 bottom-0 h-1 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        v-if="!isMobileLite"
        class="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95 mix-blend-screen"
        :animate="{ x: ['-100%', '200%'] }"
        :transition="{ duration: 5, repeat: Infinity, ease: 'linear' }"
      />
      <motion.div
        v-if="!isMobileLite"
        class="absolute inset-0 bg-linear-to-r from-transparent via-fuchsia-400 to-transparent opacity-95 mix-blend-screen"
        :animate="{ x: ['200%', '-100%'] }"
        :transition="{ duration: 6, repeat: Infinity, ease: 'linear' }"
      />
      <div
        class="absolute inset-0 bg-linear-to-r from-purple-500/45 via-cyan-500/70 to-pink-500/45"
      />
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { motion } from 'motion-v'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import avatarDefault from '@/assets/default-avatar.png'
import NeonActionButton from '@/components/NeonActionButton.vue'
import VisualEffectsToggle from '@/components/VisualEffectsToggle.vue'
import { isMobileLite } from '@/utils/visualMode'

const router = useRouter()
const route = useRoute()

const avatarUrl = ref(avatarDefault)
const isAdmin = ref(false)
const mobileMenuOpen = ref(false)
let heartbeatTimer: number | null = null

const navLinks = [
  { label: '主页', to: '/home' },
  { label: '课题', to: '/task' },
  { label: '活动', to: '/activity' },
  { label: '排行榜', to: '/ranking' },
  { label: '论坛', to: '/forum' },
  { label: '奖品', to: '/awards' },
  { label: '网站功能', to: '/links' },
]

function goProfile() {
  mobileMenuOpen.value = false
  router.push('/profile')
}

function goAdmin() {
  mobileMenuOpen.value = false
  router.push('/admin/users')
}

function logout() {
  mobileMenuOpen.value = false
  axios.post('/api/identity/logout').catch(() => {})
  sessionStorage.removeItem('userInfo')
  sessionStorage.removeItem('role')
  router.push('/login')
}

function getImageUrl(imagePath: string) {
  if (!imagePath) return avatarDefault
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function loadProfile() {
  const userInfo = sessionStorage.getItem('userInfo')
  const roleRaw = sessionStorage.getItem('role')
  isAdmin.value = false

  if (roleRaw) {
    try {
      const parsed = JSON.parse(roleRaw)
      isAdmin.value = String(parsed?.role ?? parsed?.name ?? parsed) === 'admin'
    } catch (e) {
      isAdmin.value = roleRaw === 'admin'
    }
  }

  if (!userInfo) {
    avatarUrl.value = avatarDefault
    return
  }
  const user = JSON.parse(userInfo)
  if (!isAdmin.value) {
    isAdmin.value = String(user.role ?? '') === 'admin'
  }
  const avatar =
    user.avatar || user.avatarUrl || (user.profile && user.profile.avatar) || ''
  const status = Number(
    user.status ?? (user.profile && user.profile.status) ?? -1
  )
  if (status === 1 && avatar) {
    avatarUrl.value = getImageUrl(avatar)
  } else if (!avatar) {
    fetchProfileFromServer(user.id || user.identityId)
  }
}

async function fetchProfileFromServer(identityId: string | number) {
  if (!identityId) return
  try {
    const res = await axios.get(`/api/profile/identity/${identityId}`)
    const profile = res.data?.data || res.data
    const avatar = profile?.avatar || profile?.avatarUrl
    const status = Number(profile?.status ?? -1)
    if (status === 1 && avatar) {
      avatarUrl.value = getImageUrl(avatar)
    }
  } catch (err) {
    console.debug('fetchProfileFromServer failed', err)
  }
}

onMounted(() => {
  loadProfile()
  axios.post('/api/identity/heartbeat').catch(() => {})
  heartbeatTimer = window.setInterval(() => {
    axios.post('/api/identity/heartbeat').catch(() => {})
  }, 60000)
})

onBeforeUnmount(() => {
  if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer)
})

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<style>
:root {
  --navbar-height: 80px;
}

@media (max-width: 1023px) {
  :root {
    --navbar-height: 60px;
  }
}
</style>
