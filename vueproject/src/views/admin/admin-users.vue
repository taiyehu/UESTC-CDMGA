<template>
  <div>
    <el-card class="box-card" v-if="users.length > 0">
      <h2>用户管理</h2>
      <div v-for="(user, index) in users" :key="user.id" class="user-item">
        <p>账号：{{ user.account }} | 用户ID：{{ user.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openDialog(user)" size="small"
            >查看</el-button
          >
          <el-button type="danger" @click="deleteUser(user.id)" size="small"
            >删除</el-button
          >
        </div>
      </div>
      <div>
        <el-pagination
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
        >
        </el-pagination>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有用户信息</h2>
    </el-card>

    <!-- 用户信息查看弹窗 -->
    <el-dialog v-model="dialogVisible" width="50%" @close="closeDialog">
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
      <template v-slot:footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="closeDialog">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left: 10px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { fetchUsersData, deleteUserData } from '@/api/user'
import { ElMessage } from 'element-plus'

const users = ref<any[]>([])
const dialogVisible = ref(false)
const selectedUser = reactive<any>({})
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

async function fetchUsers() {
  try {
    const response = await fetchUsersData({ page: currentPage.value, pageSize: pageSize.value })
    users.value = response.data.list || []
    total.value = response.data.total || 0
  } catch (error) {
    console.error('获取用户信息失败:', error)
    users.value = []
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchUsers()
}

function openDialog(user: any) {
  // 打开弹窗并填充选中的用户信息
  Object.assign(selectedUser, user)
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

async function deleteUser(userId: any) {
  try {
    const response = await deleteUserData(userId)
    if (response.status === 204) {
      ElMessage({ message: '用户删除成功', type: 'success' })
      await fetchUsers()
    } else {
      ElMessage({ message: '删除失败', type: 'error' })
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    ElMessage({ message: '删除失败', type: 'error' })
  }
}

onMounted(() => {
  fetchUsers()
})
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
.user-item p {
  margin-bottom: 20px;
}
.user-item p {
  text-align: left;
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
  background-color: #409eff;
  color: white;
}
.el-dialog {
  min-width: 500px;
}
.el-form-item {
  margin-bottom: 20px;
}
</style>
