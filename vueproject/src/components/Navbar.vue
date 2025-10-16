<template>
  <nav class="navbar">
    <div class="nav-left">
      <router-link class="nav-item" to="/home">主页</router-link>
      <span class="nav-item">课题</span>
      <span class="nav-item">排行榜</span>
      <span class="nav-item">网站功能</span>
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
      const userInfo = sessionStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        // 这里可以根据实际接口获取profile，简化为直接取user.avatar和user.status
        this.profile.avatar = user.avatar || '';
        this.profileStatus = user.status !== undefined ? user.status : -1;
        // 只有审核通过才显示头像，否则用默认
        if (this.profileStatus === 1 && this.profile.avatar) {
          this.avatarUrl = this.getImageUrl(this.profile.avatar);
        } else {
          this.avatarUrl = require('@/assets/default-avatar.png');
        }
      } else {
        this.avatarUrl = require('@/assets/default-avatar.png');
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

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 0 32px;
  height: 56px;
}
.nav-left {
  display: flex;
  align-items: center;
}
.nav-item {
  margin-right: 32px;
  font-size: 16px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
}
.nav-item:hover {
  color: #409EFF;
}
.nav-right {
  display: flex;
  align-items: center;
}
.avatar-menu {
  position: relative;
  cursor: pointer;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
}
.dropdown-content {
  position: absolute;
  right: 0;
  top: 48px;
  background: #fff;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border-radius: 6px;
  z-index: 100;
  display: flex;
  flex-direction: column;
}
.dropdown-item {
  padding: 12px 20px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  font-size: 15px;
}
.dropdown-item:hover {
  background: #f5f5f5;
  color: #409EFF;
}
</style>
