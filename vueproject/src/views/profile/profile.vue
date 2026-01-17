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
          <el-tooltip :content="getStatusText()" placement="bottom" effect="dark">
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

      <!-- <div class="profile-actions">
        <router-link to="/score">
          <el-button type="success" class="profile-btn">成绩提交</el-button>
        </router-link>
      </div> -->
    </el-card>

    <el-card class="box-card" shadow="hover" v-else>
      <h2>加载用户信息失败</h2>
      <div class="btnGroup">
        <el-button @click="redirectToLogin" type="primary" size="large">重新登录</el-button>
      </div>
    </el-card>

    <!-- 修改资料弹窗 -->
    <el-dialog title="修改个人资料" :visible.sync="editDialogVisible" width="400px" :close-on-click-modal="false">
      <div class="edit-profile-dialog">
        <el-button @click="triggerFileInput">选择头像</el-button>
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />

        <!-- AvatarCropper 子组件（确保子组件正确导出） -->
        <avatar-cropper
          :visible.sync="cropperVisible"
          :imgUrl="cropImgUrl"
          @crop="handleAvatarCrop"
        />

          <div style="display:flex;justify-content:center;margin-top:10px;">
            <el-avatar
              :size="64"
              :src="getImageUrl(editProfile.avatar)"
              style="background: #409EFF; color: #fff;"
            />
          </div>

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

    <!-- 已完成课题表 -->
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
              @click="previewImage(scope.row.course.image)"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="完成时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.uploadTime ? scope.row.uploadTime.replace('T', ' ') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="image" label="成绩图片" width="120">
          <template slot-scope="scope">
            <img
              v-if="scope.row.image"
              :src="getImageUrl(scope.row.image)"
              alt="成绩图片"
              style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
              @click="previewImage(scope.row.image)"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="分数" width="100" />
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </el-card>
    <el-collapse
        v-model="activePanels"
        accordion
        @change="onCollapseChange"
        v-if="RatedActivities.length > 0"
    >
      <h3>已参与的活动与分数详情</h3>

      <el-collapse-item
          v-for="activity in RatedActivities"
          :key="activity.id"
          :name="String(activity.id)">
      <!-- 折叠头部 -->
      <template slot="title">
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
          <div>{{ activity.title || activity.name }}</div>
          <div style="color:#999;font-size:12px;">
            <span v-if="loadingMap[activity.id]">加载中…</span>
            <span v-else-if="errorMap[activity.id]" style="color:#f56c6c;">加载失败</span>
          </div>
        </div>
      </template>

      <div class="activity-scores">
        <!-- 根据当前活动 id 从缓存取对应数组（第一次展开时会触发加载） -->
        <div v-if="loadingMap[activity.id]" style="text-align:center;padding:16px">
          <el-spinner /> 加载中...
        </div>

        <div v-else-if="errorMap[activity.id]" style="text-align:center;padding:12px;color:#f56c6c;">
          加载失败：{{ errorMap[activity.id] }}
          <el-button type="text" @click="fetchContestScores(activity.id)">重试</el-button>
        </div>

        <el-table
            v-else
            :data="activityScoresMap[activity.id] || []"
            border
            style="width: 100%; margin-top: 10px;"
        >
          <el-table-column prop="course.title" label="课题名称" />
          <el-table-column prop="course.image" label="课题图片" width="120">
            <template slot-scope="scope">
              <img
                  v-if="scope.row.course && scope.row.course.image"
                  :src="getImageUrl(scope.row.course.image)"
                  alt="课题图片"
                  style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                  @click="previewImage(scope.row.course.image)"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="uploadTime" label="完成时间" width="180">
            <template slot-scope="scope">
              {{ scope.row.uploadTime ? scope.row.uploadTime.replace('T', ' ') : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="image" label="成绩图片" width="120">
            <template slot-scope="scope">
              <img
                  v-if="scope.row.image"
                  :src="getImageUrl(scope.row.image)"
                  alt="成绩图片"
                  style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                  @click="previewImage(scope.row.image)"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="分数(根据计分规则换算，并非真实分数)" width="100" />
          <el-table-column prop="remark" label="备注" />
        </el-table>

        <div v-if="!loadingMap[activity.id] && (!activityScoresMap[activity.id] || !activityScoresMap[activity.id].length)" style="text-align:center;color:#999;padding:12px;">
          暂无成绩
        </div>
      </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 头像预览大图 Dialog -->
    <el-dialog :visible.sync="avatarPreviewVisible" width="auto" :show-close="true" center>
      <img :src="avatarPreviewUrl" alt="头像大图" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>

    <el-dialog :visible.sync="imagePreviewVisible" width="auto" :show-close="true" center>
      <img :src="imagePreviewUrl" alt="图片预览" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
  </div>

</template>

<script>
import router from '@/router';
import axios from 'axios';
import { compressImage } from '@/components/imageCompressor';
import AvatarCropper from '@/components/AvatarCropper.vue';
import ContestRanking from "@/views/pages/contest-ranking.vue";

export default {
  computed: {
    ContestRanking() {
      return ContestRanking
    }
  },
  components: { AvatarCropper },
  data() {
    return {
      user: { account: "", id: null, role: "" },
      profile: { avatar: "", description: "", status: -1 },
      profileStatus: -1, // 0审核中 1通过 -1未提交
      defaultAvatar: require('@/assets/default-avatar.png'),
      editDialogVisible: false,
      editProfile: { avatar: "", description: "" },

      // 只保留一个 avatarFileList
      avatarFileList: [],
      scoredScores: [],
      contestScores: [],
      RatedActivities: [],
      viewUserId: null,
      isSelf: false,
      avatarPreviewVisible: false,
      avatarPreviewUrl: '',

      // v-model 绑定的变量：当前展开的面板（因为 accordion=true，这里是单个字符串或空字符串）
      activePanels: '',

      // 保存上一次 active，用于判断新展开的是哪一项（非手风琴模式时会是数组）
      prevActivePanels: [],

      // 缓存每个 activity 的分数数据： { [activityId]: [score, ...] }
      activityScoresMap: {},

      // 加载状态与错误缓存，按 activityId 存
      loadingMap: {},
      errorMap: {},

      // 裁剪弹窗相关
      cropperVisible: false,
      cropImgUrl: null,
      rawAvatarFile: null,
      croppedFile: null,

      imagePreviewVisible: false,
      imagePreviewUrl: '',
    };
  },
  methods: {
    previewImage(url) {
      this.imagePreviewUrl = this.getImageUrl(url);
      this.imagePreviewVisible = true;
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
    triggerFileInput() { this.$refs.fileInput.click() },
    onFileChange(e) {
      const file = e.target.files[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        this.$message.error('只能上传 JPG/PNG 图片')
        return
      }
      this.rawAvatarFile = file
      this.cropImgUrl = URL.createObjectURL(file)
      this.cropperVisible = true
      e.target.value = ''
    },
    async handleAvatarCrop(croppedBlob) {
      this.cropperVisible = false;
      // 压缩图片，调用 compressImage(file, targetSize)
      try {
        const compressedFile = await compressImage(croppedBlob);
        this.croppedFile = compressedFile;
        // 上传压缩后的图片
        const formData = new FormData();
        formData.append('avatar', compressedFile);
        formData.append('identityId', this.user.id);
        const res = await axios.post('/api/profile/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.handleAvatarUploadSuccess(res.data, compressedFile, [{ name: '头像', url: res.data.data }]);
      } catch (err) {
        console.error(err);
        this.$message.error('裁剪或上传失败');
      }
      this.editDialogVisible = true;
    },
    loadProfile() {
      const routeId = this.$route.params.id;
      let userInfo = sessionStorage.getItem('userInfo');

      if (routeId) {
        this.viewUserId = parseInt(routeId);
        if (userInfo) {
          this.user = JSON.parse(userInfo);
          this.isSelf = this.user.id == routeId;
        } else {
          this.isSelf = false;
        }
      } else if (userInfo) {
        this.user = JSON.parse(userInfo);
        this.viewUserId = this.user.id;
        this.isSelf = true;
      } else {
        this.viewUserId = null;
        this.isSelf = false;
      }

      if (this.viewUserId) {
        this.fetchProfile();
        this.fetchScoredScores();
        this.fetchRatedActivity();
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

    handleAvatarRemove(file, fileList) {
      this.editProfile.avatar = '';
      this.avatarFileList = fileList;
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
        // 如果后端返回 null 或没有 avatar 字段，说明 profile 不存在
        if (!res.data || res.data.avatar === undefined) {
          // 清空 profile，显示未完善资料提示
          this.profile = { avatar: '', description: '', status: -1, account: '' };
          this.profileStatus = -1;
          // 可选：显示提示
          this.$message.info('该用户尚未完善个人资料');
          return;
        }
        // 正常赋值
        this.profile = res.data;
        this.profileStatus = res.data.status;
      });
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
    // el-collapse 的 @change 回调，参数 activeNames（因为 accordion=true，这里会是 string）
    // 如果 accordion=false，activeNames 是数组
    onCollapseChange(activeNames) {
      // 规范化为数组方便比较
      const activeArr = Array.isArray(activeNames) ? activeNames.map(String) : (activeNames ? [String(activeNames)] : []);
      const prevArr = Array.isArray(this.prevActivePanels) ? this.prevActivePanels.map(String) : (this.prevActivePanels ? [String(this.prevActivePanels)] : []);

      // 找到新打开（activeArr 中存在但 prevArr 不存在）的项
      const newlyOpened = activeArr.filter(name => !prevArr.includes(name));

      // 对每个新打开的 name，触发加载（name 是 String(activity.id)）
      newlyOpened.forEach(name => {
        const activityId = parseInt(name, 10);
        const activity = this.RatedActivities.find(a => String(a.id) === name);
        if (activity) {
          this.fetchContestScores(activity.id);
        }
      });

      // 更新 prevActivePanels
      this.prevActivePanels = activeArr.slice();
    },
    fetchScoredScores() {
      if (!this.viewUserId) return;
      axios.get(`/api/score/user-course-scores?identityId=${this.viewUserId}`).then(res => {
        if (res.data && res.data.code === 0) {
          this.scoredScores = res.data.data || [];
        }
      });
    },
    fetchRatedActivity() {
      if (!this.viewUserId) return;
      axios.get(`/api/activity/rated-activities/${this.viewUserId}`).then(res => {
        if (res.data) {
          this.RatedActivities = res.data || [];
        }
      })
    },
    async fetchContestScores(activityId) {
      if (!this.viewUserId || !activityId) return;

      // 设置 loading / error 状态
      this.$set(this.loadingMap, activityId, true);
      this.$set(this.errorMap, activityId, null);

      try {
        const res = await axios.get('/api/score/activity-scores', {
          params: { activityId: activityId, identityId: this.viewUserId }
        });

        // 兼容后端不同返回结构
        let scores = [];
        if (res.data) {
          scores = Array.isArray(res.data) ? res.data : (res.data.data || []);
        }

        // 为每条成绩尝试获取计分规则（单次失败不影响整体）
        for (let i = 0; i < scores.length; i++) {
          const courseId = scores[i].course && scores[i].course.id;
          if (!courseId) continue;
          try {
            const ruleRes = await axios.get('/api/activity/rule', { params: { activityId,courseId } });
            const rule = ruleRes.data && (ruleRes.data.rule || ruleRes.data);
            if (rule === 'arcaea计分方式') {
              scores[i].score = (scores[i].score || 0) + 10000000;
            }
          } catch (e) {
            // 忽略单个规则请求错误，记录到控制台以便排查
            console.warn('获取计分规则失败，courseId=', courseId, e && e.message);
          }
        }

        // 保存结果到活动缓存并兼容旧字段
        this.$set(this.activityScoresMap, activityId, scores);
        this.contestScores = scores;
      } catch (err) {
        const msg = err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : (err.message || '加载失败');
        this.$set(this.errorMap, activityId, msg);
        this.$set(this.activityScoresMap, activityId, []);
        console.error('fetchContestScores 错误:', err);
      } finally {
        this.$set(this.loadingMap, activityId, false);
      }
    }

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
.main-content { margin-top: var(--navbar-height); }
.avatar-uploader { display: flex; flex-direction: column; align-items: center; }
.profile-header { display: flex; align-items: center; margin-bottom: 20px; }
.avatar-select-group { display: flex; flex-direction: column; align-items: center; margin-right: 32px; }
.profile-right { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; margin-top: 16px; }
.profile-info { margin-bottom: 16px; }
.profile-signature { width: 300px; max-width: 100%; margin-bottom: 16px; }
.admin-actions .profile-btn { margin-right: 16px; }
.profile-actions .profile-btn { margin-right: 16px; }
img[alt="课题图片"],
img[alt="成绩图片"] {
  cursor: pointer;
}
</style>
