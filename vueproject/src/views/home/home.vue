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
        <img :src="course.image" alt="课程图片" v-if="course.image" />
      </div>
    </div>


    <!-- 普通用户看到的个人中心按钮 -->
    <router-link to="/profile">
      <el-button style="margin-left:10px">个人中心</el-button>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {fetchCourseData} from "@/api/course";

// 定义响应式变量
const courses = ref([]);
const loading = ref(true);
const error = ref(null);
const courseContainer = ref(null);
let scrollInterval = null;

// 获取课程数据
onMounted(async () => {

  try {
    const response = await fetchCourseData();
    courses.value = response.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
    startAutoScroll();
  }

});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
  }
});

// 启动自动滚动
const startAutoScroll = () => {
  if (courseContainer.value) {
    scrollInterval = setInterval(() => {
      courseContainer.value.scrollTop += 1;
      if (courseContainer.value.scrollTop >= courseContainer.value.scrollHeight - courseContainer.value.clientHeight) {
        courseContainer.value.scrollTop = 0;
      }
    }, 20);
  }
};

// 停止自动滚动
const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
  }
};

// 格式化日期
const formatDate = (date) => {
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('zh-CN', options);
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
</style>
