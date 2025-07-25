<template>
  <div>
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

    <!-- 根据用户角色显示不同的按钮 -->
    <div v-if="user.role === 'admin'">
      <router-link to="/admin-users">
        <el-button style="margin-left:10px">用户管理</el-button>
      </router-link>
      <router-link to="/admin-courses">
        <el-button style="margin-left:10px">课题管理</el-button>
      </router-link>
    </div>
    <div>
      <router-link to="/score">
        <el-button style="margin-left:10px">成绩提交</el-button>
      </router-link>
    </div>
    <div>
      <router-link to="/home">
        <el-button style="margin-left:10px">返回主页</el-button>
      </router-link>
    </div>
    
  </div>
  <!-- 如果有其他角色，可以继续添加条件判断 -->
</template>

<script>
export default {
  data() {
    return {
      user: {
        account: "",
        id: null,
        role: "", // 角色信息
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
        role: "", // 确保这里也有 role 字段
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
