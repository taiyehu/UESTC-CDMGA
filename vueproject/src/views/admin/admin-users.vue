<template>
    <div>
        <!-- 用户列表 -->
        <el-table :data="users" style="width: 100%" border>
        <el-table-column label="用户名" prop="account"></el-table-column>
        <el-table-column label="ID" prop="id"></el-table-column>
        <el-table-column label="角色" prop="role"></el-table-column>
        <el-table-column label="操作">
            <template slot-scope="scope">
            <el-button @click="viewUser(scope.row.id)" size="small" type="primary">查看</el-button>
            <el-button @click="deleteUser(scope.row.id)" size="small" type="danger" style="margin-left: 10px">删除</el-button>
            </template>
        </el-table-column>
        </el-table>

    <!-- 如果没有用户，显示提示 -->
        <div v-if="users.length === 0" style="text-align: center; margin-top: 20px;">
            <p>暂无用户数据。</p>
        </div>
    </div>
</template>

<script>
import { ElTable, ElTableColumn, ElButton } from 'element-ui'; // element-plus -> element-ui

export default {
    components: {
        ElTable,
        ElTableColumn,
        ElButton,
    },
    data() {
        return {
            users: [],  // 存储从后端获取的用户数据
        };
    },
    methods: {
        // 从后端接口获取用户数据
        fetchUsers() {
            // 从后端获取用户数据，使用 axios 或其他 HTTP 库
            this.$axios.get('/api/identity').then(response => {
                this.users = response.data; // 假设返回的用户数据存放在 response.data
            }).catch(error => {
                this.$message.error("获取用户数据失败！");
                console.error(error);
            });
        },
        // 删除用户
        deleteUser(userId) {
            // 确认是否删除
            this.$confirm('确定要删除这个用户吗？', '警告', {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 后端接口为 DELETE /api/identity/{userId}
                this.$axios.delete(`/api/identity/${userId}`).then(() => {
                    // 删除成功后，重新获取用户列表
                    this.fetchUsers();
                    this.$message.success('用户删除成功！');
                }).catch(error => {
                    this.$message.error('删除用户失败！');
                    console.error(error);
                });
            }).catch(() => {
                this.$message.info('删除操作已取消');
            });
        },
        // 查看用户信息
        viewUser(userId) {
            // 假设我们跳转到用户详情页面
            this.$router.push({ name: 'userDetail', params: { userId } });
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
        // 页面加载时获取用户数据
        this.fetchUsers();
    },
};

</script>

<style scoped>
.el-button {
    margin-right: 10px;
}
</style>
