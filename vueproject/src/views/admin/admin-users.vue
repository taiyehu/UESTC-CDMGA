<template>
  <div>
    <el-card class="box-card" v-if="users.length > 0">
      <h2>用户管理</h2>
      <div v-for="(user, index) in users" :key="user.id" class="user-item">
        <p>账号：{{ user.account }} | 用户ID：{{ user.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openDialog(user)" size="small">查看</el-button>
          <el-button type="danger" @click="deleteUser(user.id)" size="small">删除</el-button>
        </div>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有用户信息</h2>
    </el-card>

    <!-- 用户信息查看弹窗 -->
    <el-dialog :visible.sync="dialogVisible" width="50%" @close="closeDialog">
      <h3>用户信息</h3>
      <el-form :model="selectedUser" label-width="100px">
        <el-form-item label="账号">
          <el-input v-model="selectedUser.account" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="selectedUser.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="selectedUser.role" disabled></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="closeDialog">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      users: [], // 存储用户信息
      dialogVisible: false, // 控制弹窗显示
      selectedUser: {} // 存储当前查看的用户信息
    };
  },
  methods: {
    async fetchUsers() {
        console.log(this.$axios);
      try {
        const response = await this.$axios.get('http://localhost:8080/api/identity/allaccount');
        this.users = response.data || [];
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.users = [];
      }
    },
    openDialog(user) {
      // 打开弹窗并填充选中的用户信息
      this.selectedUser = { ...user }; // 使用对象拷贝避免直接引用
      this.dialogVisible = true;
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    async deleteUser(userId) {
      try {
        // 调用删除用户的 API
        const response = await this.$axios.delete(`http://localhost:8080/api/identity/${userId}`);
        if (response.status === 204) {
          this.$message.success('用户删除成功');
          // 删除成功后，刷新用户列表
          this.fetchUsers();
        } else {
          this.$message.error('删除失败');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        this.$message.error('删除失败');
      }
    },
  },
  mounted() {
    this.fetchUsers();
  },
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 600px;
  padding: 20px;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 40px;
}

.user-item p{
  margin-bottom: 20px;
}

.user-item p {
  text-align: left; /* 使用户信息文字左对齐 */
}

.btnGroup {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.el-button {
  margin-left: 10px;
  position: relative;
  top: -42px;
}

.el-button:hover {
  background-color: #409EFF;
  color: white;
}

.el-dialog {
  min-width: 500px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
