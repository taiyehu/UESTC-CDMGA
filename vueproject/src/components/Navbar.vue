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

<script>
import axios from 'axios';
export default {
  data() {
    return {
      menuOpen: false,
      avatarUrl: require('@/assets/default-avatar.png'),
      profile: {
        avatar: '',
        status: -1,
      },
      profileStatus: -1,
    };
  },
  mounted() {
    this.loadProfile();
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    getImageUrl(imagePath) {
      if (!imagePath) return require('@/assets/default-avatar.png');
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    loadProfile() {
      try {
        const userInfo = sessionStorage.getItem('userInfo');
        if (!userInfo) {
          this.avatarUrl = require('@/assets/default-avatar.png');
          return;
        }
        const user = JSON.parse(userInfo);
        const avatar = user.avatar || user.avatarUrl || (user.profile && user.profile.avatar) || '';
        const status = Number(user.status ?? (user.profile && user.profile.status) ?? -1);
        if (status === 1 && avatar) {
          this.avatarUrl = this.getImageUrl(avatar);
        } else {
          // 如果 sessionStorage 没 avatar，尝试从后端拉取一次（可能首次登录未写入）
          this.avatarUrl = require('@/assets/default-avatar.png');
          if (!avatar) {
            this.fetchProfileFromServer(user.id || user.identityId);
          }
        }
      } catch (e) {
        console.error('Navbar.loadProfile parse error', e);
        this.avatarUrl = require('@/assets/default-avatar.png');
      }
    },
    async fetchProfileFromServer(identityId) {
      if (!identityId) return;
      try {
        const res = await axios.get(`/api/profile/identity/${identityId}`);
        // 适配后端返回格式，如果是 {code:..., data:...} 请调整取值
        const profile = res.data && res.data.data ? res.data.data : res.data;
        const avatar = profile && (profile.avatar || profile.avatarUrl);
        const status = Number((profile && profile.status) ?? -1);
        if (status === 1 && avatar) {
          this.avatarUrl = this.getImageUrl(avatar);
        }
      } catch (err) {
        console.debug('fetchProfileFromServer failed', err);
      }
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    handleClickOutside(e) {
      if (!this.$el.contains(e.target)) {
        this.menuOpen = false;
      }
    },
    logout() {
      sessionStorage.removeItem('userInfo');
      this.$router.push('/login');
    }
  }
}
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
  color: #409EFF;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
  color: #409EFF;
}
</style>
