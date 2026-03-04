<template>
  <nav
    class="fixed inset-x-0 top-0 z-50 h-(--navbar-height) bg-transparent"
  >
    <!-- 毛玻璃底（保持整体透明） -->
    <div
      class="absolute inset-0 border-b border-white/10 bg-white/5 backdrop-blur-md"
      aria-hidden="true"
    />

    <div class="relative z-10 flex h-full items-center justify-between px-6 md:px-10 lg:px-14">
      <div class="flex items-center gap-2">
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
                class="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95 mix-blend-screen"
                :animate="{ x: ['-100%', '200%'] }"
                :transition="{ duration: 5, repeat: Infinity, ease: 'linear' }"
              />
              <motion.div
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

      <div class="flex items-center gap-4">
        <button
          type="button"
          class="rounded-md bg-purple-600 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-purple-700 active:bg-purple-800"
          @click="logout"
        >
          登出
        </button>

        <button
          type="button"
          class="group inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/40 transition hover:ring-white/70"
          @click="goProfile"
          aria-label="前往个人主页"
        >
          <img
            class="h-full w-full object-cover"
            :src="avatarUrl"
            alt="头像"
            referrerpolicy="no-referrer"
          />
        </button>
      </div>
    </div>

    <!-- 判定线动画：整个区域最下面 -->
    <div
      class="absolute inset-x-0 bottom-0 h-1 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        class="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95 mix-blend-screen"
        :animate="{ x: ['-100%', '200%'] }"
        :transition="{ duration: 5, repeat: Infinity, ease: 'linear' }"
      />
      <motion.div
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
import { ref, onMounted } from 'vue'
import { motion } from 'motion-v'
import { useRouter } from 'vue-router'
import axios from 'axios'
import avatarDefault from '@/assets/default-avatar.png'

const router = useRouter()

const avatarUrl = ref(avatarDefault)

const navLinks = [
  { label: '主页', to: '/home' },
  { label: '课题', to: '/task' },
  { label: '成绩提交', to: '/score' },
  { label: '活动', to: '/activity' },
  { label: '排行榜', to: '/ranking' },
  { label: '网站功能', to: '/links' },
]

function goProfile() {
  router.push('/profile')
}

function logout() {
  sessionStorage.removeItem('userInfo')
  router.push('/login')
}

function getImageUrl(imagePath: string) {
  if (!imagePath) return avatarDefault
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function loadProfile() {
  const userInfo = sessionStorage.getItem('userInfo')
  if (!userInfo) {
    avatarUrl.value = avatarDefault
    return
  }
  const user = JSON.parse(userInfo)
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
})
</script>

<style>
:root {
  --navbar-height: 80px;
}
</style>
