<template>
  <div class="profile-container">
    <el-card class="box-card" shadow="hover" v-if="user.id !== null">
      <div class="profile-header">
        <div class="avatar-select-group">
          <el-avatar
            :size="64"
            :src="profileStatus === 1 ? getImageUrl(profile.avatar) : defaultAvatar"
            style="background: #409EFF; color: #fff; cursor: pointer;"
            @click="openEditDialog"
          />
          <div class="avatar-upload-text">点击头像修改</div>
        </div>
        <div class="profile-info">
          <h2>欢迎，{{ user.account }}！</h2>
          <p v-if="user.role">角色：<span class="role">{{ user.role }}</span></p>
        </div>
      </div>
      <div class="profile-signature">
        <el-input
          v-model="profile.description"
          maxlength="50"
          show-word-limit
          placeholder="输入你的个性签名（50字以内）"
          :disabled="true"
        />
      </div>
      <div class="profile-status">
        <el-tag v-if="profileStatus === 0" type="warning">审核中</el-tag>
        <el-tag v-else-if="profileStatus === 1" type="success">已通过</el-tag>
        <el-tag v-else type="info">未提交</el-tag>
      </div>
      <div v-if="profileStatus !== 1" style="color:#f56c6c;margin-bottom:10px;">
        资料审核通过后才会显示头像和签名
      </div>
      <el-button type="primary" @click="openEditDialog" style="margin-bottom: 16px;">
        修改个人资料
      </el-button>
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
    <el-dialog title="修改个人资料" :visible.sync="editDialogVisible" width="400px">
      <div class="edit-profile-dialog">
        <el-upload
          class="avatar-uploader"
          action="/api/profile/upload-avatar"
          name="avatar"
          :file-list="avatarFileList"
          list-type="picture-card"
          :on-success="handleAvatarUploadSuccess"
          :on-remove="handleAvatarRemove"
          :before-upload="beforeAvatarUpload"
          :data="{identityId: user.id}"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
        <el-avatar
          :size="64"
          :src="getImageUrl(editProfile.avatar)"
          style="background: #409EFF; color: #fff; margin-top: 10px;"
        />
        <el-input
          v-model="editProfile.description"
          maxlength="50"
          show-word-limit
          placeholder="输入你的个性签名（50字以内）"
          style="margin-top: 16px;"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditProfile">提交审核</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      user: {
        account: "",
        id: null,
        role: "",
      },
      profile: {
        avatar: "",
        description: "",
        status: -1,
      },
      profileStatus: -1, // 0审核中 1通过 -1未提交
      defaultAvatar: require('@/assets/default-avatar.png'),
      editDialogVisible: false,
      editProfile: {
        avatar: "",
        description: ""
      },
      avatarFileList: [],
    };
  },
  methods: {
    getImageUrl(imagePath) {
      if (!imagePath) return this.defaultAvatar;
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      // 直接返回相对路径
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    openEditDialog() {
      this.editProfile.avatar = this.profile.avatar;
      this.editProfile.description = this.profile.description;
      // 如果有头像，初始化 fileList
      this.avatarFileList = this.profile.avatar
        ? [{ name: '头像', url: this.getImageUrl(this.profile.avatar) }]
        : [];
      this.editDialogVisible = true;
    },
    logout() {
      sessionStorage.removeItem('userInfo');
      this.$router.push('/login');
    },
    redirectToLogin() {
      this.$router.push('/login');
    },
    fetchProfile() {
      if (!this.user.id) return;
      axios.get(`/api/profile/identity/${this.user.id}`).then(res => {
        if (res.data && res.data.avatar !== undefined) {
          this.profile = res.data;
          this.profileStatus = res.data.status;
        }
      });
    },
    handleDialogAvatarUploadSuccess(response) {
      if (response.code === 0) {
        this.editProfile.avatar = response.data;
        this.$message.success('头像上传成功');
      } else {
        this.$message.error('头像上传失败');
      }
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG) {
        this.$message.error('只能上传 JPG/PNG 格式图片!');
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },
    submitEditProfile() {
      if (!this.editProfile.description || this.editProfile.description.length > 50) {
        this.$message.error('签名不能为空且不能超过50字');
        return;
      }
      // 提交头像和签名审核
      axios.put(`/api/profile/${this.user.id}`, {
        avatar: this.editProfile.avatar,
        description: this.editProfile.description,
        status: 0,
        identityId: this.user.id
      }).then(() => {
        this.$message.success('资料已提交审核，请等待管理员处理');
        this.editDialogVisible = false;
        this.fetchProfile();
      });
    },
    handleAvatarUploadSuccess(response, file, fileList) {
      if (response.code === 0) {
        this.editProfile.avatar = response.data;
        this.avatarFileList = fileList;
        this.$message.success('头像上传成功');
      } else {
        this.$message.error('头像上传失败');
      }
    },
    handleAvatarRemove(file, fileList) {
      this.editProfile.avatar = '';
      this.avatarFileList = fileList;
    },
    fetchProfile() {
      if (!this.user.id) return;
      axios.get(`/api/profile/identity/${this.user.id}`).then(res => {
        console.log('接口返回:', res.data);
        if (res.data && res.data.avatar !== undefined) {
          this.profile = res.data;
          this.profileStatus = res.data.status;
        }
      });
    }
  },
  mounted() {
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      this.user = JSON.parse(userInfo);
      this.fetchProfile();
    }
  }
};
</script>

<style scoped>
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-upload-text {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.profile-signature {
  margin: 18px 0 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-status {
  margin-bottom: 12px;
  text-align: center;
}
</style>