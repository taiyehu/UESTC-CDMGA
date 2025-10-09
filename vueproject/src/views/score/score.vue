<template>
  <div>
    <el-card class="box-card" v-if="courses.length > 0">
      <h2>成绩提交</h2>
      <div v-for="(course, index) in courses" :key="course.id" class="course-item">
        <p>课题名称：{{ course.title }} | 课题ID：{{ course.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openViewDialog(course)" size="small">查看</el-button>
          <el-button :type="isSubmitted(course.id)? 'warning' : 'success'" @click="isSubmitted(course.id)? openUpdateDialog(course) : openSubmitDialog(course)" size="small">
            {{ isSubmitted(course.id)? '更新' : '提交' }}
          </el-button>
        </div>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有课题信息</h2>
    </el-card>

    <!-- 课题信息查看弹窗 -->
    <!-- 课题详情弹窗 -->
    <el-dialog :visible.sync="viewDialogVisible" title="课题详情" width="50%" @close="closeViewDialog()">
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
          {{ formatDateTime(selectedCourse.start_time) || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="结束时间">
          {{ formatDateTime(selectedCourse.end_time) || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="最后更新时间">
          {{ formatDateTime(selectedCourse.updated_at) || '-' }}
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

      <span slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img :src="previewImage" alt="预览图片" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>


    <!-- 成绩提交弹窗-->
    <el-dialog :visible.sync="submitDialogVisible" title="成绩提交" width="40%" @close="closeSubmitDialog">
      <el-form :model="submitForm" label-width="100px" ref="submitFormRef">
        <el-form-item label="课题名称">
          <el-input v-model="submitForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="submitForm.course_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
              type="textarea"
              v-model="updateForm.remark"
              placeholder="可选，填写补充说明"
              :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
              action="/api/score/upload"
              name="image"
              :file-list="imageFileList"
              list-type="picture-card"
              :on-success="handleImageUploadSuccess"
              >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeSubmitDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认提交</el-button>
      </div>
    </el-dialog>

    <!-- 成绩更新弹窗 -->
    <el-dialog :visible.sync="updateDialogVisible" title="成绩更新" width="40%" @close="closeUpdateDialog">
      <el-form :model="updateForm" label-width="100px" ref="updateFormRef">
        <el-form-item label="课题名称">
          <el-input v-model="updateForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="updateForm.course_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            type="textarea"
            v-model="updateForm.remark"
            placeholder="可选，填写补充说明"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/score/upload"
            name="image"
            :file-list="imageFileList"
            list-type="picture-card"
            :on-success="handleImageUpdateSuccess"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeUpdateDialog">取消</el-button>
        <el-button type="primary" @click="handleUpdate">确认更新</el-button>
      </div>
    </el-dialog>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left: 10px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import {fetchAvailablecourseData} from "@/api/course";
import {checkSubmitted, handleSubmitScore, handleUpdateScore} from "@/api/score";
import dayjs from "dayjs";

export default {
  data() {
    return {
      courses: [],
      viewDialogVisible: false,
      submitDialogVisible: false,
      updateDialogVisible: false,
      previewVisible: false,
      previewImage: '',
      selectedCourse: {},
      submitForm: {
        course_id: '',       // 课程ID
        course_title: '',    // 仅前端显示
        upload_time: '',     // 上传时间
        remark: '',
        image: ''            // 上传的图片
      },
      updateForm: {
        course_id: '',       // 课程ID
        course_title: '',    // 仅前端显示
        upload_time: '',     // 上传时间
        remark: '',
        image: ''            // 上传的图片
      },
      newScore: {
        course_id: '',
        identity_id: '',
        upload_time: '',
        image: '',
        point: 0,
        is_scored: false,
        remark: '',
        created_at: '',
        updated_at: ''
      },
      imageFileList: [],
      fileList: [],
      submittedCourses: []
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
    // 获取课题列表
    async fetchCourses() {
      try {
        const response = await fetchAvailablecourseData({page : 1, size: 10})
        this.courses = response.data || [];
        this.submittedCourses = []; // 清空
        await this.checkSubmittedCourses();
      } catch (error) {
        console.error('获取课题信息失败:', error);
        this.$message.error('获取课题列表失败，请稍后重试');
        this.courses = [];
        this.submittedCourses = [];
      }
    },
    // 检查课程是否已提交
    async checkSubmittedCourses() {
      const identityId = this.getCurrentIdentityId();
      if (!identityId) {
        this.$message.error('未获取到用户信息，请重新登录');
        return;
      }
      for (const course of this.courses) {
        const response = await checkSubmitted(identityId,course.id)
        if (response.data) {
          this.submittedCourses.push(course.id);
        }
      }
    },
    // 判断课程是否已提交
    isSubmitted(courseId) {
      return this.submittedCourses.includes(courseId);
    },
    // 打开查看弹窗
    openViewDialog(course) {
      this.selectedCourse = {
        ...course,
        start_time: dayjs(course.start_time).format('YYYY-MM-DD'),
        end_time: dayjs(course.end_time).format('YYYY-MM-DD'),
        updated_at: dayjs(course.updated_at).format('YYYY-MM-DD'),
      };
      this.viewDialogVisible = true;
    },
    closeViewDialog() {
      this.viewDialogVisible = false;
    },
    // 打开提交弹窗
    openSubmitDialog(course) {
      this.submitForm = {
        course_id: course.id,
        course_title: course.title,
        upload_time: '',
        image: ''
      };
      this.imageFileList = [];
      this.submitDialogVisible = true;
    },
    closeSubmitDialog() {
      this.submitDialogVisible = false;
    },
    // 打开更新弹窗
    async openUpdateDialog(course) {
      const identityId = this.getCurrentIdentityId();
      // 调用后端接口获取score_id
      const response = await axios.get('/api/score/find', {
        params: {
          identity_id: identityId,
          course_id: course.id
        }
      });

      this.updateForm = {
        score_id :response.data.data,
        course_id: course.id,
        course_title: course.title,
        upload_time: '',
        image: ''
      };
      this.imageFileList = [];
      this.updateDialogVisible = true;
    },
    closeUpdateDialog() {
      this.updateDialogVisible = false;
    },
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '';
      return new Date(dateTime).toLocaleString();
    },
    // 提交处理
    async handleSubmit() {
      try {
        // 1. 获取当前用户ID（从sessionStorage获取，与用户信息页面保持一致）
        const identityId = this.getCurrentIdentityId();
        if (!identityId) {
          this.$message.error('未获取到用户信息，请重新登录');
          return;
        }

        // 2. 补充时间字段（ISO格式）
        this.submitForm.upload_time = new Date().toISOString();

        // 3. 构造提交数据
        const submitData = {
          course_id: this.submitForm.course_id,
          identity_id: identityId,
          upload_time: this.submitForm.upload_time,
          image: this.submitForm.image,
          remark: this.submitForm.remark,
        };

        // 4. 发送请求
        await handleSubmitScore(submitData)
        // 5. 处理成功
        this.$message.success(`课题 "${this.submitForm.course_title}" 的成绩提交成功！`);
        this.closeSubmitDialog();
        this.fetchCourses();
      } catch (error) {
        console.error('提交失败:', error);
        const errorMsg = error.response?.data?.message || '成绩提交失败，请重试';
        this.$message.error(errorMsg);
      }
    },
    // 更新处理
    async handleUpdate() {
      try {
        // ...获取identityId等...
        this.updateForm.upload_time = new Date().toISOString();

        // 只需传 image 字段和需要的其他字段
        const updateData = {
          image: this.updateForm.image,
          is_scored: 0,
          id: this.updateForm.score_id,
          remark: this.updateForm.remark,
          //后端方法是put,需要把这里传递的信息补全
        };
        // 这里必须用成绩ID
        await handleUpdateScore(updateData, this.updateForm.score_id);

        this.$message.success(`课题 "${this.updateForm.course_title}" 的成绩更新成功！`);
        this.closeUpdateDialog();
        await this.fetchCourses();
      } catch (error) {
        const errorMsg = error.response?.data?.message || '成绩更新失败，请重试';
        this.$message.error(errorMsg);
      }
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
        this.submitForm.image = url;
        this.imageFileList = fileList;
        this.$message.success('图片上传成功');
      } else {
        this.$message.error((response.message || (response.data && response.data.message)) || '图片上传失败');
      }
    },
    handleImageUpdateSuccess(response, file, fileList) {
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
        this.updateForm.image = url;
        this.imageFileList = fileList;
        this.$message.success('图片上传成功');
      } else {
        this.$message.error((response.message || (response.data && response.data.message)) || '图片上传失败');
      }
    },
    getCurrentIdentityId() {
      try {
        const userInfo = sessionStorage.getItem('userInfo');
        if (!userInfo) return null;

        const user = JSON.parse(userInfo);
        return user.id ? Number(user.id) : null;
      } catch (error) {
        console.error('获取用户身份失败:', error);
        return null;
      }
    }
  },
  mounted() {
    this.fetchCourses();
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

.el-dialog {
  min-width: 500px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-upload__tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}
</style>
