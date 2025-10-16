<template>
  <div class="main-content">
    <h1>最新课题</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="latestCourse" class="latest-course-banner">
      <h2>{{ latestCourse.title }}</h2>
      <p>类别: {{ latestCourse.category }}</p>
      <p>开始时间: {{ formatDate(latestCourse.startTime) }}</p>
      <p>结束时间: {{ formatDate(latestCourse.endTime) }}</p>
      <p>描述: {{ latestCourse.description }}</p>
      <img
        :src="getImageUrl(latestCourse.image)"
        alt="课程图片"
        v-if="latestCourse.image"
        class="course-image"
      />
      <el-button
        v-if="latestCourse.image"
        size="mini"
        @click="handleImageClick(getImageUrl(latestCourse.image))"
        style="margin-top: 10px;"
      >查看</el-button>
    </div>
    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img :src="previewImage" alt="预览图片" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
  </div>
</template>

<script>
import { fetchCourseData } from "@/api/course";
export default {
  data() {
    return {
      latestCourse: null,
      loading: true,
      error: null,
      previewVisible: false,
      previewImage: '',
    };
  },
  mounted() {
    this.fetchLatestCourse();
  },
  methods: {
    async fetchLatestCourse() {
      try {
        const response = await fetchCourseData();
        let courses = response.data || [];
        // 按开始时间降序排序，最新的在最前面
        courses = courses.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        this.latestCourse = courses.length ? courses[0] : null;
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
    formatDate(date) {
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
    }
  }
};
</script>

<style scoped>
/* 主内容区自动适配导航栏高度，--navbar-height 为全局变量 */
.main-content {
  margin-top: var(--navbar-height);
}
.latest-course-banner {
  border: 2px solid #409EFF;
  border-radius: 12px;
  background: #f5faff;
  padding: 32px;
  margin: 32px auto;
  max-width: 700px;
  box-shadow: 0 2px 8px rgba(64,158,255,0.08);
  text-align: center;
}
.course-image {
  max-width: 300px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin: 20px auto 0 auto;
}
</style>

