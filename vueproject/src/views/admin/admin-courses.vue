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
        <el-form-item label="截止时间">
          <el-date-picker v-model="newCourse.end_time" type="datetime" placeholder="选择截止时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/course/upload"
            :before-upload="beforeUpload"
            :file-list="imageFileList"
            list-type="picture-card"
            @success="handleImageUploadSuccess"
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
        end_time: '',
        image: '' // 存储上传图片的路径
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
      // 假设返回的图片URL是response.data
      this.newCourse.image = response.data;  // 将图片URL保存到newCourse.image
    },

    // 文件上传前的操作
    beforeUpload(file) {
      const formData = new FormData();
      formData.append('image', file);  // 添加图片到formData

      // 上传文件时，手动将 FormData 提交
      this.$axios.post('/api/course/upload', formData)
        .then(response => {
          console.log('上传成功', response);
          this.handleImageUploadSuccess(response, file);  // 处理上传成功后的回调
        })
        .catch(error => {
          console.error('上传失败', error);
        });

      return false;  // 阻止默认上传行为
    },

    // 上传课题信息，包括图片URL
    async uploadCourse() {
      if (!this.newCourse.title || !this.newCourse.category || !this.newCourse.end_time || !this.newCourse.image) {
        this.$message.error('请填写所有必填项');
        return;
      }

      try {
        // 使用 FormData 提交数据
        const formData = new FormData();
        formData.append('title', this.newCourse.title);
        formData.append('category', this.newCourse.category);
        formData.append('end_time', dayjs(this.newCourse.end_time).format('YYYY-MM-DD HH:mm:ss'));
        formData.append('image', this.newCourse.image);  // 将图片URL添加到formData

        const response = await axios.post('/api/course/post', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',  // 确保Content-Type是multipart/form-data
          },
        });

        if (response.data.success) {
          this.$message.success('课题上传成功');
          this.showUploadForm = false;  // 关闭上传表单
          this.fetchCourses();  // 刷新课题列表
        } else {
          this.$message.error('课题上传失败');
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
