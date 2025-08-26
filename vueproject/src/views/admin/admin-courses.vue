<template>
  <div>
    <!-- 课题管理部分 -->
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

    <el-button type="primary" @click="openUploadDialog" style="margin-top: 20px">上传课题</el-button>
    
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

    <!-- 上传课题信息部分 -->
    <el-card class="box-card" v-if="showUploadForm">
      <h2>上传课题</h2>
      <el-form :model="newCourse" label-width="100px">
        <el-form-item label="课题名称">
          <el-input v-model="newCourse.title" placeholder="请输入课题名称"></el-input>
        </el-form-item>
        <el-form-item label="课题类别">
          <el-input v-model="newCourse.category" placeholder="请输入课题种类"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="newCourse.start_time" type="datetime" placeholder="选择开始时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="newCourse.end_time" type="datetime" placeholder="选择截止时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="课题描述">
          <el-input v-model="newCourse.description" placeholder="请输入课题描述"></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/course/upload"
            name="image"
            :file-list="imageFileList"
            list-type="picture-card"
            :on-success="handleImageUploadSuccess"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <el-button @click="showUploadForm = false">取消</el-button>
      <el-button type="primary" @click="uploadCourse">提交课题</el-button>
    </el-card>

    <!-- 返回主页按钮 -->
    <div>
      <router-link to="/profile">
        <el-button type="warning" style="margin-top: 20px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script>
import { fetchAllCourseData, deleteCourseData, uploadCourseData } from '@/api/course'
import dayjs from 'dayjs'
import axios from 'axios'

export default {
  data() {
    return {
      courses: [], // 存储课题信息
      dialogVisible: false, // 控制弹窗显示
      selectedCourse: {}, // 存储当前查看的课题信息
      showUploadForm: false, // 控制上传课题表单显示
      newCourse: {
        title: '',
        category: '',
        start_time: '',
        end_time: '',
        description: '',
        image: ''
      },
      imageFileList: [] // 存储上传的图片文件
    };
  },
  methods: {
    async fetchCourses() {
      try {
        const response = await fetchAllCourseData({ page: 1, pageSize: 10 })
        this.courses = response.data || [];
      } catch (error) {
        console.error('获取课题信息失败:', error);
        this.courses = [];
      }
    },
    openDialog(course) {
      this.selectedCourse = {
        ...course,
        start_time: dayjs(course.start_time).format('YYYY-MM-DD HH:mm:ss'),
        end_time: dayjs(course.end_time).format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs(course.updated_at).format('YYYY-MM-DD HH:mm:ss')
      };
      this.dialogVisible = true;
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    async deleteCourse(courseId) {
      try {
        const response = await deleteCourseData(courseId);
        if (response.status === 204) {
          this.$message.success('课题删除成功');
          this.fetchCourses();
        } else {
          this.$message.error('删除失败');
        }
      } catch (error) {
        console.error('删除课题失败:', error);
        this.$message.error('删除失败');
      }
    },
    // 打开上传表单
    openUploadDialog() {
      this.showUploadForm = true;
    },

    // 图片上传成功后的回调
    handleImageUploadSuccess(response, file, fileList) {
      // 直接打印 response，确认结构
      console.log('图片上传返回：', response);

      // 兼容 axios 和原生结构
      let url = '';
      if (response && response.code === 0) {
        url = response.data;
      } else if (response && response.data && response.data.code === 0) {
        url = response.data.data;
      }

      if (url) {
        this.newCourse.image = url;
        this.imageFileList = fileList;
        this.$message.success('图片上传成功');
      } else {
        this.$message.error((response.message || (response.data && response.data.message)) || '图片上传失败');
      }
    },

    // 上传课题信息，包括图片URL
    async uploadCourse() {
      console.log('提交前的newCourse:', this.newCourse);
      const formattedStartTime = dayjs(this.newCourse.start_time).format('YYYY-MM-DDTHH:mm:ss');
      const formattedEndTime = dayjs(this.newCourse.end_time).format('YYYY-MM-DDTHH:mm:ss');
      const now = dayjs().format('YYYY-MM-DDTHH:mm:ss');
      if (
        !this.newCourse.title ||
        !this.newCourse.category ||
        !this.newCourse.start_time ||
        !this.newCourse.end_time ||
        !this.newCourse.description ||
        !this.newCourse.image
      ) {
        this.$message.error('请填写所有必填项');
        return;
      }

      try {
        const response = await axios.post('/api/course/post', {
          title: this.newCourse.title,
          category: this.newCourse.category,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          description: this.newCourse.description,
          image: this.newCourse.image,
          createTime: now,
          updateTime: now
        });
        console.log('课题上传响应：', response);
        if (response.data.code === 0) {
          this.$message.success('课题上传成功');
          this.showUploadForm = false;
          this.fetchCourses();
        } else {
          this.$message.error(response.data.message || '课题上传失败');
        }
      } catch (error) {
        this.$message.error('上传过程中发生错误');
      }
    }
  },
  mounted() {
    this.fetchCourses(); // 页面加载时获取课题信息
  }
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
  text-align: left;
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
