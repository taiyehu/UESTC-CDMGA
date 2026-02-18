<template>
  <nav class="navbar">
    <div class="nav-left">
      <router-link class="nav-item" to="/home">主页</router-link>
      <router-link class="nav-item" to="/task">课题</router-link>
      <router-link class="nav-item" to="/score">成绩提交</router-link>
      <router-link class="nav-item" to="/activity">活动</router-link>
      <router-link class="nav-item" to="/ranking">排行榜</router-link>
      <router-link class="nav-item" to="/links">网站功能</router-link>
    </div>
    <div class="nav-right">
      <div class="avatar-menu" @click.stop="toggleMenu">
        <img class="avatar" :src="avatarUrl" alt="头像" />
        <div v-if="menuOpen" class="dropdown-content">
          <router-link class="dropdown-item" to="/profile">个人主页</router-link>
          <a class="dropdown-item" @click="logout">登出</a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import avatarDefault from '@/assets/default-avatar.png'

const router = useRouter()

const menuOpen = ref(false)
const avatarUrl = ref(avatarDefault)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!document.querySelector('.navbar')?.contains(target)) {
    menuOpen.value = false
  }
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
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
:root {
  --navbar-height: 80px;
}
</style>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #000000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0 120px;
  height: var(--navbar-height);
}
.nav-left {
  display: flex;
  align-items: center;
  margin-left: 12px;
}
.nav-item {
  margin-right: 48px;
  font-size: 22px;
  color: #ffffff;
  text-decoration: none;
  cursor: pointer;
  letter-spacing: 2px;
}
.nav-item:last-child {
  margin-right: 0;
}
.nav-item:hover {
  color: #409eff;
}
.nav-right {
  display: flex;
  align-items: center;
  margin-right: 12px;
}
.avatar-menu {
  position: relative;
  cursor: pointer;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}
.dropdown-content {
  position: absolute;
  right: 0;
  top: 60px;
  background: #fff;
  min-width: 140px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}
.dropdown-item {
  padding: 16px 24px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  font-size: 18px;
}
.dropdown-item:hover {
  background: #f5f5f5;
  color: #409eff;
}
</style>
