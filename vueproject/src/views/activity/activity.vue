<template>
  <div class="main-content">
    <h1>活动列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div v-for="activity in activities" :key="activity.id" class="activity-item">
        <h2>{{ activity.name }}</h2>
        <p>描述: {{ activity.description }}</p>
        <p>开始时间: {{ formatDate(activity.startTime) }}</p>
        <p>结束时间: {{ formatDate(activity.endTime) }}</p>
        <img
          :src="getImageUrl(activity.activityBanner)"
          alt="活动宣传图"
          v-if="activity.activityBanner"
          class="activity-image"
          @click="handleView(activity)"
        />
      </div>
    </div>
    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img :src="previewImage" alt="预览图片" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
    <!-- 查看弹窗 -->
    <el-dialog :visible.sync="viewDialogVisible" title="活动详情" width="40%">
      <div v-if="currentActivity">
        <h2>{{ currentActivity.name }}</h2>
        <p>描述: {{ currentActivity.description }}</p>
        <p>开始时间: {{ formatDate(currentActivity.startTime) }}</p>
        <p>结束时间: {{ formatDate(currentActivity.endTime) }}</p>
        <img
          :src="getImageUrl(currentActivity.activityBanner)"
          alt="活动宣传图"
          v-if="currentActivity.activityBanner"
          class="activity-image"
          style="max-width:200px;"
        />
        <div v-if="currentActivity.activityFile">
            <a
                :href="getImageUrl(currentActivity.activityFile)"
                :download="getFileName(currentActivity.activityFile)"
                @click.prevent="downloadFile(currentActivity.activityFile)"
                style="color: #409EFF; text-decoration: underline; cursor: pointer;"
            >下载活动文件</a>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      activities: [],
      loading: true,
      error: null,
      previewVisible: false,
      previewImage: '',
      viewDialogVisible: false,
      currentActivity: null
    };
  },
  mounted() {
    this.fetchActivities();
  },
  methods: {
    async fetchActivities() {
      try {
        const response = await axios.get('/api/activity/list');
        if (response.data.list) {
          this.activities = response.data.list;
        } else if (Array.isArray(response.data)) {
          this.activities = response.data;
        } else {
          this.activities = [];
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    handleImageClick(imgUrl) {
      this.previewImage = imgUrl;
      this.previewVisible = true;
    },
    handleView(activity) {
      this.currentActivity = activity;
      this.viewDialogVisible = true;
    },
    formatDate(date) {
      if (!date) return '-';
      const d = new Date(date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return d.toLocaleDateString('zh-CN', options);
    },
    getImageUrl(imagePath) {
      if (!imagePath) return '';
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    getFileName(filePath) {
        if (!filePath) return '';
        return filePath.split('/').pop();
    },
    downloadFile(filePath) {
        const url = this.getImageUrl(filePath);
        // 创建隐藏a标签实现下载
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getFileName(filePath);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
  }
};
</script>

<style scoped>
.main-content {
  margin-top: var(--navbar-height);
}
.activity-item {
  margin-bottom: 32px;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.activity-image {
  max-width: 300px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
}
.btn-group {
  margin-top: 16px;
  display: flex;
  margin-left: auto;
}
</style>