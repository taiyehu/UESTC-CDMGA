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
    <el-dialog :visible.sync="viewDialogVisible" width="50%" @close="closeViewDialog">
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
        <el-button @click="closeViewDialog">退出</el-button>
      </div>
    </el-dialog>

    <!-- 成绩提交弹窗（简化图片上传逻辑） -->
    <el-dialog :visible.sync="submitDialogVisible" title="成绩提交" width="40%" @close="closeSubmitDialog">
      <el-form :model="submitForm" label-width="100px" ref="submitFormRef">
        <el-form-item label="课题名称">
          <el-input v-model="submitForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="submitForm.course_id" disabled></el-input>
        </el-form-item>
        <!-- 简化后的上传区域，仅保留样式，无需实际校验 -->
        <el-form-item label="上传图片">
          <el-upload
              action=""
              :auto-upload="false"
              :file-list="fileList"
              list-type="picture"
              :limit="1">
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">仅作展示，实际提交固定内容</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeSubmitDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认提交</el-button>
      </div>
    </el-dialog>

    <!-- 成绩更新弹窗（简化图片上传逻辑） -->
    <el-dialog :visible.sync="updateDialogVisible" title="成绩更新" width="40%" @close="closeUpdateDialog">
      <el-form :model="updateForm" label-width="100px" ref="updateFormRef">
        <el-form-item label="课题名称">
          <el-input v-model="updateForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="updateForm.course_id" disabled></el-input>
        </el-form-item>
        <!-- 简化后的上传区域，仅保留样式，无需实际校验 -->
        <el-form-item label="上传图片">
          <el-upload
              action=""
              :auto-upload="false"
              :file-list="fileList"
              list-type="picture"
              :limit="1">
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">仅作展示，实际提交固定内容</div>
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

export default {
  data() {
    return {
      courses: [],
      viewDialogVisible: false,
      submitDialogVisible: false,
      updateDialogVisible: false,
      selectedCourse: {},
      submitForm: {
        course_id: '',       // 课程ID
        course_title: '',    // 仅前端显示
        upload_time: ''      // 上传时间
      },
      updateForm: {
        course_id: '',       // 课程ID
        course_title: '',    // 仅前端显示
        upload_time: ''      // 上传时间
      },
      fileList: [],
      submittedCourses: []
    };
  },
  methods: {
    // 获取课题列表
    async fetchCourses() {
      try {
        const response = await fetchAvailablecourseData({page : 1, size: 10})
        this.courses = response.data || [];
        await this.checkSubmittedCourses();
      } catch (error) {
        console.error('获取课题信息失败:', error);
        this.$message.error('获取课题列表失败，请稍后重试');
        this.courses = [];
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
        start_time: this.formatDateTime(course.start_time),
        end_time: this.formatDateTime(course.end_time),
        updated_at: this.formatDateTime(course.updated_at)
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
        upload_time: ''
      };
      this.fileList = [];
      this.submitDialogVisible = true;
    },
    closeSubmitDialog() {
      this.submitDialogVisible = false;
    },
    // 打开更新弹窗
    openUpdateDialog(course) {
      this.updateForm = {
        course_id: course.id,
        course_title: course.title,
        upload_time: ''
      };
      this.fileList = [];
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

        // 3. 构造提交数据，image 固定为 'test'
        const submitData = {
          course_id: this.submitForm.course_id,
          identity_id: identityId,  // 使用正确的用户ID
          upload_time: this.submitForm.upload_time,
          image: 'test' // 固定提交 'test' 字符串
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
        // 1. 获取当前用户ID（从sessionStorage获取，与用户信息页面保持一致）
        const identityId = this.getCurrentIdentityId();
        if (!identityId) {
          this.$message.error('未获取到用户信息，请重新登录');
          return;
        }

        // 2. 补充时间字段（ISO格式）
        this.updateForm.upload_time = new Date().toISOString();

        // 3. 构造更新数据，image 固定为 'test'
        const updateData = {
          point: 0, // 假设这里的分数为0，可根据实际情况修改
          is_scored: false, // 假设这里的评分状态为false，可根据实际情况修改
          remark: null // 假设这里的备注为空，可根据实际情况修改
        };

        // 4. 发送请求
        await handleUpdateScore(updateData,this.updateForm.course_id)

        // 5. 处理成功
        this.$message.success(`课题 "${this.updateForm.course_title}" 的成绩更新成功！`);
        this.closeUpdateDialog();
        this.fetchCourses();
      } catch (error) {
        console.error('更新失败:', error);
        const errorMsg = error.response?.data?.message || '成绩更新失败，请重试';
        this.$message.error(errorMsg);
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
