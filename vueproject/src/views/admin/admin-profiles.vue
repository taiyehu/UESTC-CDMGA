<template>
  <div>
    <!-- 用户资料管理 -->
    <el-card class="box-card" v-if="profiles.length > 0">
      <h2>用户资料管理</h2>
      <div v-for="profile in profiles" :key="profile.id" class="profile-item">
        <div class="profile-info">
          <el-avatar :src="getImageUrl(profile.avatar)" :size="64" style="margin-right: 16px;" />
          <div>
            <p>用户名：{{ profile.account || '-' }}</p>
            <p>用户ID：{{ profile.identityId }}</p>
            <p>签名：{{ profile.description || '-' }}</p>
            <p>头衔：{{ profile.title || '-' }}</p>
            <p>
              状态：
              <el-tag v-if="profile.status === 0" type="warning">审核中</el-tag>
              <el-tag v-else-if="profile.status === 1" type="success">已通过</el-tag>
              <el-tag v-else type="info">未提交</el-tag>
            </p>
          </div>
        </div>
        <div class="btnGroup">
          <el-button type="primary" size="small" @click="openDialog(profile)">查看/审核</el-button>
          <el-button type="danger" size="small" @click="deleteConfirm(profile)">删除</el-button>
        </div>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有用户资料</h2>
    </el-card>

    <!-- 删除确认弹窗 -->
    <el-dialog
      title="警告"
      :visible.sync="confirmDialogVisible"
      width="30%"
      @close="confirmDialogVisible = false">
      <span>确定删除该用户资料?</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="deleteProfile(selectedProfile.id)" @click.native="confirmDialogVisible = false">确定</el-button>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
      </span>
    </el-dialog>
    <!-- 已通过用户资料弹窗 -->
    <el-dialog
      title="已通过用户资料"
      :visible.sync="passedDialogVisible"
      width="50%"
      @close="passedDialogVisible = false"
      >
      <div v-if="passedProfiles.length > 0">
        <div v-for="profile in passedProfiles" :key="profile.id" class="profile-item">
          <div class="profile-info">
            <el-avatar :src="getImageUrl(profile.avatar)" :size="64" style="margin-right: 16px;" />
            <div>
              <p>用户名：{{ profile.account || '-' }}</p>
              <p>用户ID：{{ profile.identityId }}</p>
              <p>签名：{{ profile.description || '-' }}</p>
              <p>头衔：{{ profile.title || '-' }}</p>
              <p>
                状态：
                <el-tag v-if="profile.status === 0" type="warning">审核中</el-tag>
                <el-tag v-else-if="profile.status === 1" type="success">已通过</el-tag>
                <el-tag v-else type="info">未提交</el-tag>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p>没有已通过的用户资料</p>
      </div>
    </el-dialog>

    <!-- 资料详情/审核弹窗 -->
    <el-dialog :visible.sync="dialogVisible" title="用户资料详情" width="40%" @close="closeDialog">
      <el-descriptions border :column="1">
        <el-descriptions-item label="用户ID">{{ selectedProfile.identityId }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <img
            :src="getImageUrl(selectedProfile.avatar)"
            alt="头像"
            style="width: 80px; height: 80px; border-radius: 50%;"
          />
        </el-descriptions-item>
        <el-descriptions-item label="签名">{{ selectedProfile.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="头衔">{{ selectedProfile.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="selectedProfile.status === 0" type="warning">审核中</el-tag>
          <el-tag v-else-if="selectedProfile.status === 1" type="success">已通过</el-tag>
          <el-tag v-else type="info">未提交</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px;">
        <el-button v-if="selectedProfile.status === 0" type="success" @click="approveProfile(selectedProfile)">通过审核</el-button>
        <el-button v-if="selectedProfile.status === 0" type="danger" @click="rejectProfile(selectedProfile)">驳回</el-button>
      </div>
    </el-dialog>

    <div>
        <el-button type="primary" @click="checkPassedProfiles" style="margin-top: 20px">查看已通过用户资料</el-button>
    </div>
    <!-- 返回主页按钮 -->
    <div>
      <router-link to="/profile">
        <el-button type="warning" style="margin-top: 20px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      profiles: [],
      dialogVisible: false,
      confirmDialogVisible: false,
      selectedProfile: {},
      passedDialogVisible: false,
      passedProfiles: [],
    };
  },
  methods: {
    // 查看已通过用户资料
    checkPassedProfiles() {
      return axios.get('/api/profile/all-passed')
        .then(response => {
          this.profiles = response.data || [];
        })
        .catch(() => {
          this.$message.error('获取已通过用户资料失败');
          this.profiles = [];
        });
    },
    async checkPassedProfiles() {
      try {
        const response = await axios.get('/api/profile/all-passed');
        this.passedProfiles = response.data || [];
        this.passedDialogVisible = true;
      } catch (error) {
        this.$message.error('获取已通过用户资料失败');
        this.passedProfiles = [];
      }
    },
    // 获取图片URL
    getImageUrl(imagePath) {
      if (!imagePath) return require('@/assets/default-avatar.png');
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    // 获取所有用户资料
    async fetchProfiles() {
      try {
        const response = await axios.get('/api/profile/all');
        this.profiles = response.data || [];
      } catch (error) {
        this.$message.error('获取用户资料失败');
        this.profiles = [];
      }
    },
    openDialog(profile) {
      this.selectedProfile = { ...profile };
      this.dialogVisible = true;
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    deleteConfirm(profile) {
      this.selectedProfile = { ...profile };
      this.confirmDialogVisible = true;
    },
    async deleteProfile(profileId) {
      try {
        const response = await axios.delete(`/api/profile/${profileId}`);
        if (response.status === 204 || (response.data && response.data.code === 0)) {
          this.$message.success('用户资料删除成功');
          await this.fetchProfiles();
        } else {
          this.$message.success('删除成功');
          this.dialogVisible = false;
        }
      } catch (error) {
        this.$message.error('删除失败');
      }
    },
    // 审核通过
    async approveProfile(profile) {
      try {
        const response = await axios.put(`/api/profile/${profile.id}`, {
          ...profile,
          status: 1
        });
        if (response.data && response.data.code === 0) {
          this.$message.success('审核通过');
          this.dialogVisible = false;
          await this.fetchProfiles();
        } else {
          this.$message.success('操作成功');
          this.dialogVisible = false;
          await this.fetchProfiles();
        }
      } catch (error) {
        this.$message.error('操作失败');
      }
    },
    // 审核驳回
    async rejectProfile(profile) {
      try {
        const response = await axios.put(`/api/profile/${profile.id}`, {
          ...profile,
          status: -1
        });
        if (response.data && response.data.code === 0) {
          this.$message.success('已驳回');
          this.dialogVisible = false;
          await this.fetchProfiles();
        } else {
          this.$message.error('操作失败');
        }
      } catch (error) {
        this.$message.error('操作失败');
      }
    }
  },
  mounted() {
    this.fetchProfiles();
  }
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 700px;
  padding: 20px;
}
h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 40px;
}
.profile-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}
.profile-info {
  display: flex;
  align-items: center;
}
.btnGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.el-button {
  margin-top: 0;
}
</style>
