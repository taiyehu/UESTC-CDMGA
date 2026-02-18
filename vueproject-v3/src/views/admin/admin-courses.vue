<template>
  <div>
    <!-- 课题管理部分 -->
    <el-card class="box-card" v-if="courses.length > 0">
      <h2>课题管理</h2>
      <div v-for="(course, index) in courses" :key="course.id" class="course-item">
        <p>课题名称：{{ course.title }} | 课题ID：{{ course.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openDialog(course)" size="small">查看</el-button>
          <el-button type="danger" @click="deleteConfirm(course)" size="small">删除</el-button>
        </div>
      </div>
      <div>
        <el-pagination
            @current-change="handlePageChange"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next">
        </el-pagination>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有课题信息</h2>
    </el-card>

    <el-dialog
        title="警告"
        :visible.sync="confirmDialogVisible"
        width="30%"
        @close="confirmDialogVisible = false">
      <span>确定删除?</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="deleteCourse(selectedCourse.id)" @click.native="confirmDialogVisible = false">确定</el-button>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-button type="primary" @click="openUploadDialog" style="margin-top: 20px">上传课题</el-button>
    <!-- 课题信息查看弹窗 -->
    <el-dialog :visible.sync="dialogVisible" title="课题详情" width="50%" @close="closeDialog">
      <el-descriptions border :column="1">

        <el-descriptions-item label="课题名称">
          {{ selectedCourse.title || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="课题类别">
          {{ selectedCourse.category || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="课题描述">
          {{ selectedCourse.description || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="开始时间">
          {{ selectedCourse.start_time || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="结束时间">
          {{ selectedCourse.end_time || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="最后更新时间">
          {{ selectedCourse.updated_at || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="课题图片">
          <template v-if="selectedCourse.image">
            <img
                :src="getImageUrl(selectedCourse.image)"
                alt="课题图片"
                style="width: 160px; height: auto; border-radius: 4px; cursor: pointer"
                @click="handleImageClick(getImageUrl(selectedCourse.image))"
            />
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
      </el-descriptions>
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
            :before-upload="beforeImageUpload"
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
import { compressImage } from '@/components/imageCompressor'

export default {
  data() {
    return {
      courses: [], // 存储课题信息
      dialogVisible: false, // 控制弹窗显示
      selectedCourse: {}, // 存储当前查看的课题信息
      showUploadForm: false, // 控制上传课题表单显示
      confirmDialogVisible: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
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
    getImageUrl(imagePath) {
      console.log('原始图片路径:', imagePath);
      if (!imagePath) return '';
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      // 只返回相对路径，nginx会自动代理
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    handleImageClick(imgUrl) {
      this.previewImage = imgUrl;
      this.previewVisible = true;
    },
    async fetchCourses() {
      try {
        const response = await fetchAllCourseData({ page:this.currentPage, size:this.pageSize})
        this.courses = response.data.list || [];
        this.total = response.data.total || 0;
      } catch (error) {
        console.error('获取课题信息失败:', error);
        this.courses = [];
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchCourses();
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
    deleteConfirm(course){
      this.selectedCourse = {
        ...course
      };
      this.confirmDialogVisible = true;
    },
    async deleteCourse(courseId) {
      try {
        const response = await deleteCourseData(courseId);
        if (response.status === 204) {
          this.$message.success('课题删除成功');
          await this.fetchCourses();
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

    // 上传前自动压缩图片
    async beforeImageUpload(file) {
      try {
        if (!file.type.startsWith('image/')) {
          this.$message.error('只能上传图片文件');
          return false;
        }
        const compressed = await compressImage(file);
        return compressed;
      } catch (err) {
        this.$message.error('图片压缩失败: ' + err.message);
        return false;
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
          await this.fetchCourses();
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
