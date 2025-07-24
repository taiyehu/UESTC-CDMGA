<template>
  <div>
    <el-card class="box-card" v-if="courses.length > 0">
      <h2>课题管理</h2>
      <div v-for="(course, index) in courses" :key="course.id" class="course-item">
        <p>课题名称：{{ course.title }} | 课题ID：{{ course.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openDialog(course)" size="small">查看</el-button>
          <el-button type="danger" @click="deleteCourse(course.id)" size="small">删除</el-button>
        </div>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有课题信息</h2>
    </el-card>

    <!-- 课题信息查看弹窗 -->
    <el-dialog :visible.sync="dialogVisible" width="50%" @close="closeDialog">
      <h3>课题信息</h3>
      <el-form :model="selectedCourse" label-width="100px">
        <el-form-item label="课题名称">
          <el-input v-model="selectedCourse.title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="selectedCourse.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题类别">
          <el-input v-model="selectedCourse.category" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题描述">
          <el-input v-model="selectedCourse.description" disabled></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-input v-model="selectedCourse.start_time" disabled></el-input>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-input v-model="selectedCourse.end_time" disabled></el-input>
        </el-form-item>
        <el-form-item label="更新时间">
          <el-input v-model="selectedCourse.updated_at" disabled></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="closeDialog">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {

openDialog(course) {
  this.selectedCourse = { 
    ...course,
    start_time: dayjs(course.start_time).format('YYYY-MM-DD HH:mm:ss'), // 格式化开始时间
    end_time: dayjs(course.end_time).format('YYYY-MM-DD HH:mm:ss'),     // 格式化结束时间
    updated_at: dayjs(course.updated_at).format('YYYY-MM-DD HH:mm:ss')  // 格式化更新时间
  };
  this.dialogVisible = true;
},

  data() {
    return {
      courses: [], // 存储课题信息
      dialogVisible: false, // 控制弹窗显示
      selectedCourse: {} // 存储当前查看的课题信息
    };
  },
  methods: {
    async fetchCourses() {
      try {
        const response = await axios.get('http://localhost:8080/api/course/allcourse'); // 获取课题信息
        this.courses = response.data || [];
      } catch (error) {
        console.error('获取课题信息失败:', error);
        this.courses = [];
      }
    },
    openDialog(course) {
      // 打开弹窗并填充选中的课题信息
      this.selectedCourse = { ...course }; // 使用对象拷贝避免直接引用
      this.dialogVisible = true;
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    async deleteCourse(courseId) {
      try {
        // 调用删除课题的 API
        const response = await axios.delete(`http://localhost:8080/api/course/${courseId}`);
        if (response.status === 200) {
          this.$message.success('课题删除成功');
          // 删除成功后，刷新课题列表
          this.fetchCourses();
        } else {
          this.$message.error('删除失败');
        }
      } catch (error) {
        console.error('删除课题失败:', error);
        this.$message.error('删除失败');
      }
    },
  },
  mounted() {
    this.fetchCourses(); // 在页面加载时获取课题信息
  },
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 600px;
  padding: 20px;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 40px;
}

.course-item p {
  margin-bottom: 20px;
  text-align: left; /* 使课题信息文字左对齐 */
}

.btnGroup {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.el-button {
  margin-left: 10px;
  margin-top: -42px;
}

.el-button:hover {
  background-color: #409EFF;
  color: white;
}

.el-dialog {
  min-width: 500px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
