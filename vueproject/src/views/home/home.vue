<template>
  <div>
    <h1>课程列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else ref="courseContainer" class="course-container"
         @mouseenter="stopAutoScroll"
         @mouseleave="startAutoScroll">
      <div v-for="course in courses" :key="course.id" class="course-item">
        <h2>{{ course.title }}</h2>
        <p>类别: {{ course.category }}</p>
        <p>开始时间: {{ course.startTime }}</p>
        <p>结束时间: {{ course.endTime }}</p>
        <p>描述: {{ course.description }}</p>
        <img :src="course.image" alt="课程图片" v-if="course.image" />
      </div>
    </div>
    <router-link to="/profile">
      <el-button style="margin-left:10px">个人中心</el-button>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

// 定义响应式变量，用于存储课程列表数据
const courses = ref([]);
const loading = ref(true);
const error = ref(null);
// 获取课程容器的 DOM 元素引用
const courseContainer = ref(null);
// 定义定时器变量
let scrollInterval = null;

// 在组件挂载时获取课程数据
onMounted(async () => {
  try {
    // 发送 GET 请求到后端 API 获取课程数据
    const response = await axios.get('http://localhost:8080/api/course/');
    courses.value = response.data;
  } catch (err) {
    // 处理请求错误
    error.value = err.message;
  } finally {
    // 无论请求成功还是失败，都停止加载状态
    loading.value = false;
    // 启动自动滚动
    startAutoScroll();
  }
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
  }
});

// 启动自动滚动的函数
const startAutoScroll = () => {
  if (courseContainer.value) {
    scrollInterval = setInterval(() => {
      // 每次滚动 1 像素
      courseContainer.value.scrollTop += 1;
      // 当滚动到底部时，重置滚动位置到顶部
      if (courseContainer.value.scrollTop >= courseContainer.value.scrollHeight - courseContainer.value.clientHeight) {
        courseContainer.value.scrollTop = 0;
      }
    }, 20); // 每 20 毫秒滚动一次
  }
};

// 停止自动滚动的函数
const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
  }
};
</script>

<style scoped>
/* 课程容器样式 */
.course-container {
  height: 300px; /* 设置容器高度 */
  overflow-y: auto; /* 显示垂直滚动条，允许鼠标滚轮滚动 */
  border: 1px solid #ccc; /* 添加边框 */
  padding: 10px; /* 添加内边距 */
}

/* 课程项样式 */
.course-item {
  margin-bottom: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}
</style>
