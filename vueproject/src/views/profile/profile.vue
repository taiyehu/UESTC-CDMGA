<template>
  <el-card class="box-card" v-if="user.id !== null">
    <h2>欢迎，{{ user.account }}！您的 ID 为 {{ user.id }}</h2>
    <div class="btnGroup">
      <el-button type="primary" @click="logout" size="large">登出</el-button>
    </div>
  </el-card>
  <el-card class="box-card" v-else>
    <h2>加载用户信息失败</h2>
    <div class="btnGroup">
      <el-button @click="redirectToLogin" size="large">重新登录</el-button>
    </div>
  </el-card>
  
</template>

<script>
export default {
  data() {
    return {
      user: {
        account: "",
        id: null,
      },
      loading: true,
    };
  },
  methods: {
    logout() {
      // 清除本地存储中的用户信息
      sessionStorage.removeItem('userInfo');
      // 跳转到登录页面
      this.$router.push('/login');
    },
    redirectToLogin() {
      this.$router.push('/login');
    }
  },
  mounted() {
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      // 解析存储的 JSON 数据
      this.user = JSON.parse(userInfo);
    } else {
      this.user = {
        account: "",
        id: null,
      };
    }
    this.loading = false;
  },
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 400px;
  padding: 20px;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.btnGroup {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.el-button {
  margin-top: 20px;
}

.el-button:hover {
  background-color: #409EFF;
  color: white;
}
</style>
