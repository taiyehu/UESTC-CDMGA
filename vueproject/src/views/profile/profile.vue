<template>
  <div class="profile-container">
    <el-card class="box-card" shadow="hover" v-if="user.id !== null">
      <div class="profile-header">
        <div class="avatar-select-group">
        <template v-if="isSelf">
          <el-tooltip content="点击头像修改" placement="bottom">
            <div style="display:inline-block;cursor:pointer;" @click="openEditDialog">
              <el-avatar
                :size="128"
                :src="profileStatus === 1 ? getImageUrl(profile.avatar) : defaultAvatar"
                style="background: #409EFF; color: #fff;"
              />
            </div>
          </el-tooltip>
        </template>
        <template v-else>
          <el-tooltip content="点击查看大图" placement="bottom">
            <div style="display:inline-block;cursor:pointer;" @click="previewAvatar">
              <el-avatar
                :size="128"
                :src="profileStatus === 1 ? getImageUrl(profile.avatar) : defaultAvatar"
                style="background: #409EFF; color: #fff;"
              />
            </div>
          </el-tooltip>
        </template>
      </div>
        <div class="profile-right">
          <div class="profile-info">
            <h2>{{ profile.account || user.account }}</h2>
          </div>
          <el-tooltip
            :content="getStatusText()"
            placement="bottom"
            effect="dark"
          >
            <div class="profile-signature">
              <el-input
                v-model="profile.description"
                maxlength="50"
                show-word-limit
                placeholder="输入你的个性签名（50字以内）"
                :disabled="true"
              />
            </div>
          </el-tooltip>
          <div v-if="profileStatus !== 1" style="color:#f56c6c;margin-bottom:10px;">
            资料审核通过后才会显示头像和签名
          </div>
        </div>
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
            <router-link to="/admin-profiles">
              <el-button type="warning" class="profile-btn">资料审核</el-button>
            </router-link>
          </div>
        </el-card>
      </div>
      <el-divider></el-divider>
    <div class="profile-actions">
      <router-link to="/score">
        <el-button type="success" class="profile-btn">成绩提交</el-button>
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
    <el-card class="box-card" shadow="hover" v-if="scoredScores.length > 0" style="margin-top: 20px;">
      <h3>已完成课题及分数</h3>
      <el-table :data="scoredScores" border style="width: 100%; margin-top: 10px;">
        <el-table-column prop="course.title" label="课题名称" />
        <el-table-column prop="course.image" label="课题图片" width="120">
          <template slot-scope="scope">
            <img
              v-if="scope.row.course && scope.row.course.image"
              :src="getImageUrl(scope.row.course.image)"
              alt="课题图片"
              style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="完成时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.uploadTime ? scope.row.uploadTime.replace('T', ' ') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分数" width="100" />
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </el-card>
    <el-dialog :visible.sync="avatarPreviewVisible" width="auto" :show-close="true" center>
      <img :src="avatarPreviewUrl" alt="头像大图" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
  </div>
</template>

<script>
import router from '@/router';
import axios from 'axios';
import { compressImage } from '@/components/imageCompressor'

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
      scoredScores: [],
      viewUserId: null, // 当前查看的用户id
      isSelf: false,    // 是否是自己
      avatarPreviewVisible: false,
      avatarPreviewUrl: '',
    };
  },
  methods: {
    loadProfile() {
      // 如果有路由参数，优先用参数，否则用当前登录用户
      const routeId = this.$route.params.id;
      let userInfo = sessionStorage.getItem('userInfo');
      if (routeId) {
        // 查看别人
        this.viewUserId = parseInt(routeId);
        if (userInfo) {
          this.user = JSON.parse(userInfo); // ← 新增
          this.isSelf = this.user.id == routeId;
        } else {
          this.isSelf = false;
        }
      } else if (userInfo) {
        // 查看自己
        this.user = JSON.parse(userInfo); // ← 新增
        this.viewUserId = this.user.id;
        this.isSelf = true;
      } else {
        this.viewUserId = null;
        this.isSelf = false;
      }
      if (this.viewUserId) {
        this.fetchProfile();
        this.fetchScoredScores();
      }
    },
    getStatusText() {
      if (this.profileStatus === 0) return '审核中';
      if (this.profileStatus === 1) return '已通过';
      return '未提交';
    },
    getImageUrl(imagePath) {
      if (!imagePath) return this.defaultAvatar;
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      // 直接返回相对路径
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    previewAvatar() {
      this.avatarPreviewUrl = this.getImageUrl(this.profile.avatar);
      this.avatarPreviewVisible = true;
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
      if (!this.viewUserId) return;
      axios.get(`/api/profile/identity/${this.viewUserId}`).then(res => {
        if (res.data && res.data.avatar !== undefined) {
          this.profile = res.data;
          this.profileStatus = res.data.status;
        }
      });
    },
    async beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJPG) {
        this.$message.error('只能上传 JPG/PNG 格式图片!');
        return false;
      }
      // 自动压缩到1M以内
      return await compressImage(file)
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
    fetchScoredScores() {
      if (!this.viewUserId) return;
      axios.get(`/api/score/user-scored-scores?identityId=${this.viewUserId}`).then(res => {
        if (res.data && res.data.code === 0) {
          this.scoredScores = res.data.data || [];
        }
      });
    },
    
  },
  mounted() {
    this.loadProfile();
  },
  watch: {
    '$route.params.id': 'loadProfile'
  }
};
</script>

<style scoped>
/* 主内容区自动适配导航栏高度，--navbar-height 为全局变量 */
.main-content {
  margin-top: var(--navbar-height);
}
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.avatar-select-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 32px;
}
.profile-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center; /* 新增：让子元素居中 */
  margin-top: 16px;
}
.profile-info {
  margin-bottom: 16px;
}
.profile-signature {
  width: 100px;
  max-width: 100%;
  margin-bottom: 16px;
}
.admin-actions .profile-btn {
  margin-right: 16px;
}
.profile-actions .profile-btn {
  margin-right: 16px;
}
</style>