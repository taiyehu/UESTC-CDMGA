<template>
  <div class="profile-container">
    <el-card class="box-card" shadow="hover" v-if="user.id !== null">
      <div class="profile-header">
        <div class="avatar-select-group">
          <el-avatar
            :size="64"
            :icon="avatarIcon"
            style="background: #409EFF; color: #fff; cursor: pointer;"
            @click.native="onAvatarClick"
          />
        </div>
        <div class="profile-info">
          <h2>欢迎，{{ user.account }}！</h2>
          <p v-if="user.role">角色：<span class="role">{{ user.role }}</span></p>
        </div>
      </div>
      <div class="profile-actions">
        <el-button type="primary" @click="logout" class="profile-btn">登出</el-button>
        <router-link to="/score">
          <el-button type="success" class="profile-btn">成绩提交</el-button>
        </router-link>
        <router-link to="/home">
          <el-button type="info" class="profile-btn">返回主页</el-button>
        </router-link>
      </div>
      <el-divider></el-divider>
    </el-card>
    <el-card class="admin-card" shadow="hover" v-if="user.role === 'admin'">
      <h2>管理员功能</h2>
      <div class="admin-actions">
        <router-link to="/admin-users">
          <el-button type="warning" class="profile-btn">用户管理</el-button>
        </router-link>
        <router-link to="/admin-courses">
          <el-button type="warning" class="profile-btn">课题管理</el-button>
        </router-link>
        <router-link to="/review">
          <el-button type="warning" class="profile-btn">成绩管理</el-button>
        </router-link>
      </div>
    </el-card>
    <el-card class="box-card" shadow="hover" v-else>
      <h2>加载用户信息失败</h2>
      <div class="btnGroup">
        <el-button @click="redirectToLogin" type="primary" size="large">重新登录</el-button>
      </div>
    </el-card>
      <el-dialog title="选择头像" :visible.sync="avatarDialogVisible" width="320px">
      <div class="avatar-options">
        <div
          v-for="item in avatarOptions"
          :key="item.value"
          style="display: inline-block;"
          @click="selectAvatar(item.value)"
        >
          <el-avatar
            :icon="item.value"
            :size="48"
            style="margin: 8px; background: #409EFF; color: #fff; cursor: pointer;"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        account: "",
        id: null,
        role: "",
      },
      loading: true,
      avatarIcon: 'el-icon-user-solid', // 默认头像
      avatarDialogVisible: false,
      avatarOptions: [
        { label: '默认', value: 'el-icon-user-solid' },
        { label: '男孩', value: 'el-icon-user' },
        { label: '女孩', value: 'el-icon-user-filled' },
        { label: '星星', value: 'el-icon-star-on' },
        { label: '消息', value: 'el-icon-message' }
      ]
    };
  },
  methods: {
    logout() {
      sessionStorage.removeItem('userInfo');
      this.$router.push('/login');
    },
    redirectToLogin() {
      this.$router.push('/login');
    },
    selectAvatar(icon) {
      this.avatarIcon = icon;
      this.avatarDialogVisible = false;
    },
    onAvatarClick() {
      this.avatarDialogVisible = true;
      console.log('click');
    }
  },
  mounted() {
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      this.user = JSON.parse(userInfo);
    } else {
      this.user = {
        account: "",
        id: null,
        role: "",
      };
    }
    this.loading = false;
  },
};
</script>

<style scoped>
.avatar-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.avatar-select-group .el-avatar {
  z-index: 10;
}

.profile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80vh;
  background: #f5f7fa;
}
.box-card {
  width: 420px;
  padding: 32px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(64,158,255,0.08);
  margin-bottom: 24px;
}
.admin-card {
  width: 420px;
  padding: 24px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(255,193,7,0.08);
  margin-bottom: 24px;
}
.profile-header {
  display: flex;
  align-items: center;
  justify-content: center; /* 水平居中 */
  margin-bottom: 18px;
}
.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center; /* 垂直居中 */
  margin-left: 18px;
}
.role {
  color: #409EFF;
  font-weight: bold;
}
.profile-actions, .admin-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
  gap: 12px;
}
.profile-btn {
  width: 120px;
  height: 40px;
  font-size: 16px;
}
.el-divider {
  margin: 24px 0 12px 0;
}
h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}
.btnGroup {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.box-card h2,
.admin-card h2 {
  margin-bottom: 40px;
}

.profile-actions,
.admin-actions {
  margin-top: 0;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar-select-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 18px;
}
</style>