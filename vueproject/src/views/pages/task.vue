<template>
  <div class="main-content">
    <h1>课题列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div v-for="course in courses" :key="course.id" class="course-item">
        <h2>{{ course.title }}</h2>
        <p>类别: {{ course.category }}</p>
        <p>开始时间: {{ formatDate(course.startTime) }}</p>
        <p>结束时间: {{ formatDate(course.endTime) }}</p>
        <p>描述: {{ course.description }}</p>
        <img
          :src="getImageUrl(course.image)"
          alt="课程图片"
          v-if="course.image"
          class="course-image"
          @click="handleImageClick(getImageUrl(course.image))"
        />
        
      </div>
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
      courses: [],
      loading: true,
      error: null,
      previewVisible: false,
      previewImage: '',
    };
  },
  mounted() {
    this.fetchCourses();
  },
  methods: {
    async fetchCourses() {
      try {
        const response = await fetchCourseData();
        let courses = response.data || [];
        // 按开始时间倒序排列
        this.courses = courses.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
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
.course-item {
  margin-bottom: 32px;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.course-image {
  max-width: 300px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
}
</style>
