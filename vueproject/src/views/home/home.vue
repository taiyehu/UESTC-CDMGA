<template>
  <div>
    <h1>课程列表</h1>

    <!-- 加载中提示 -->
    <div v-if="loading">加载中...</div>

    <!-- 错误提示 -->
    <div v-else-if="error">{{ error }}</div>

    <!-- 课程内容展示 -->
    <div
      v-else
      ref="courseContainer"
      class="course-container"
      @mouseenter="stopAutoScroll"
      @mouseleave="startAutoScroll"
    >
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
        />
        <el-button
          v-if="course.image"
          size="mini"
          @click="handleImageClick(getImageUrl(course.image))"
          style="margin-top: 10px;"
        >查看</el-button>
      </div>
    </div>


    <!-- 普通用户看到的个人中心按钮 -->
    <router-link to="/profile">
      <el-button style="margin-left:10px">个人中心</el-button>
    </router-link>

    <!-- 图片预览弹窗 -->
    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img :src="previewImage" alt="预览图片" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
    <!-- 用户总分排行榜 -->
    <div style="margin-top:40px;">
      <h2 style="text-align:center;margin-bottom:20px;">用户总分排行榜</h2>
      <el-table
        :data="pagedRankData"
        style="width: 500px; margin: 0 auto;"
        border
        :default-sort="{prop: 'totalScore', order: 'descending'}"
      >
        <el-table-column label="排名" width="80" align="center">
          <template #default="scope">
            {{ (rankCurrentPage - 1) * rankPageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="account" label="用户名" width="200" align="center" />
        <el-table-column prop="totalScore" label="总分" width="120" align="center" />
      </el-table>
      <div style="text-align:center;margin-top:20px;">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="rankSortedData.length"
          :page-size="rankPageSize"
          :current-page="rankCurrentPage"
          @current-change="handleRankPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { fetchCourseData } from "@/api/course";

export default {
  data() {
    return {
      courses: [],
      loading: true,
      error: null,
      previewVisible: false,
      previewImage: '',
      rankAllData: [],
      rankSortedData: [],
      pagedRankData: [],
      rankPageSize: 10,
      rankCurrentPage: 1,
      scrollInterval: null,
    };
  },
  mounted() {
    this.fetchCourses();
    this.fetchRankData();
  },
  watch: {
    rankCurrentPage() {
      this.setPagedRankData();
    }
  },
  methods: {
    async fetchCourses() {
      try {
        const response = await fetchCourseData();
        this.courses = response.data;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          this.startAutoScroll();
        });
      }
    },
    async fetchRankData() {
      try {
        const res = await axios.get('/api/score/user-total-scores');
        let data = res.data.data || [];
        data.sort((a, b) => b.totalScore - a.totalScore);
        this.rankAllData = data;
        this.rankSortedData = data;
        this.setPagedRankData();
      } catch (e) {
        this.$message ? this.$message.error('获取排行榜失败') : alert('获取排行榜失败');
      }
    },
    setPagedRankData() {
      const start = (this.rankCurrentPage - 1) * this.rankPageSize;
      this.pagedRankData = this.rankSortedData.slice(start, start + this.rankPageSize);
    },
    handleRankPageChange(page) {
      this.rankCurrentPage = page;
      this.setPagedRankData();
    },
    handleImageClick(imgUrl) {
      this.previewImage = imgUrl;
      this.previewVisible = true;
    },
    startAutoScroll() {
      if (!this.$refs.courseContainer) return;
      this.scrollInterval = setInterval(() => {
        if (!this.$refs.courseContainer) return;
        this.$refs.courseContainer.scrollTop += 1;
        if (
          this.$refs.courseContainer.scrollTop >=
          this.$refs.courseContainer.scrollHeight - this.$refs.courseContainer.clientHeight
        ) {
          clearInterval(this.scrollInterval);
          setTimeout(() => {
            if (this.$refs.courseContainer) {
              this.$refs.courseContainer.scrollTop = 0;
              this.startAutoScroll();
            }
          }, 2000);
        }
      }, 20);
    },
    stopAutoScroll() {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
      }
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
  },
  beforeDestroy() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
    }
  }
};
</script>

<style scoped>
/* 课程容器样式 */
.course-container {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}

/* 课程项样式 */
.course-item {
  margin-bottom: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}

/* 按钮样式调整 */
.el-button {
  margin-left: 10px;
}

.course-image {
  max-width: 200px;
  max-height: 150px;
  width: auto;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>

