<template>
  <div>
    <el-card class="box-card" v-if="courses.length > 0">
      <h2>成绩提交</h2>
      <div v-for="(course, index) in courses" :key="course.id" class="course-item">
        <p>课题名称：{{ course.title }} | 课题ID：{{ course.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openViewDialog(course)" size="small">查看</el-button>
          <el-button type="success" @click="openSubmitDialog(course)" size="small">提交</el-button>
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

    <!-- 成绩提交弹窗（简化版） -->
    <el-dialog :visible.sync="submitDialogVisible" title="成绩提交" width="40%" @close="closeSubmitDialog">
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="课题名称">
          <el-input v-model="submitForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="submitForm.course_id" disabled></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeSubmitDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认提交</el-button>
      </div>
    </el-dialog>

    <!-- 操作结果提示 -->
    <el-message-box
      :visible.sync="resultVisible"
      :title="resultTitle"
      :message="resultMessage"
      :type="resultType"
      @close="closeResultDialog">
    </el-message-box>
  </div>
</template>

<script>
import {fetchAllCourseData} from "@/api/course";
import {handleSubmitScore} from "@/api/score";

export default {
  data() {
    return {
      courses: [], // 存储课题信息
      viewDialogVisible: false, // 控制查看弹窗显示
      submitDialogVisible: false, // 控制提交弹窗显示
      selectedCourse: {}, // 存储当前查看的课题信息
      submitForm: {
        course_id: '',
        course_title: ''
      },
      resultVisible: false, // 结果弹窗可见性
      resultTitle: '', // 结果弹窗标题
      resultMessage: '', // 结果弹窗消息
      resultType: '' // 结果弹窗类型
    };
  },
  methods: {
    async fetchCourses() {
      try {
        const response = await fetchAllCourseData({page: 1, pageSize: 10}) // 获取课题信息
        this.courses = response.data || [];
      } catch (error) {
        console.error('获取课题信息失败:', error);
        this.courses = [];
      }
    },
    openViewDialog(course) {
      // 打开查看弹窗并填充选中的课题信息
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
    openSubmitDialog(course) {
      // 打开提交弹窗并填充课题信息
      this.submitForm = {
        course_id: course.id,
        course_title: course.title
      };
      this.submitDialogVisible = true;
    },
    closeSubmitDialog() {
      this.submitDialogVisible = false;
    },
    formatDateTime(dateTime) {
      // 格式化日期时间
      if (!dateTime) return '';
      return new Date(dateTime).toLocaleString();
    },
    async handleSubmit() {
      try {
        // 模拟成绩提交API调用（仅传递课题ID）
        const response = await handleSubmitScore(this.submitForm.id)

        // 显示提交成功消息
        this.resultTitle = '提交成功';
        this.resultMessage = `课题 "${this.submitForm.course_title}" 的成绩提交请求已发送！`;
        this.resultType = 'success';
        this.resultVisible = true;

        // 关闭提交窗口
        this.closeSubmitDialog();
      } catch (error) {
        console.error('提交成绩失败:', error);
        this.resultTitle = '提交失败';
        this.resultMessage = '成绩提交过程中出现错误，请重试！';
        this.resultType = 'error';
        this.resultVisible = true;
      }
    },
    closeResultDialog() {
      this.resultVisible = false;
    }
  },
  mounted() {
    this.fetchCourses(); // 在页面加载时获取课题信息
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
