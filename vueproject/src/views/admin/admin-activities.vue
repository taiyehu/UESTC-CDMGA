<template>
  <div>
    <el-card class="box-card" v-if="activities.length > 0">
      <h2>活动管理</h2>
      <div v-for="activity in activities" :key="activity.id" class="activity-item">
        <p>活动名称：{{ activity.name }} | 活动ID：{{ activity.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openDialog(activity)" size="small">查看</el-button>
          <el-button type="danger" @click="deleteConfirm(activity)" size="small">删除</el-button>
        </div>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有活动信息</h2>
    </el-card>

    <el-dialog
      title="警告"
      :visible.sync="confirmDialogVisible"
      width="30%"
      @close="confirmDialogVisible = false">
      <span>确定删除?</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="deleteActivity(selectedActivity.id)" @click.native="confirmDialogVisible = false">确定</el-button>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
      </span>
    </el-dialog>

    <el-button type="primary" @click="openUploadDialog" style="margin-top: 20px">发布活动</el-button>

    <!-- 活动信息查看弹窗 -->
    <el-dialog :visible.sync="dialogVisible" title="活动详情" width="50%" @close="closeDialog">
      <el-descriptions border :column="1">
        <el-descriptions-item label="活动名称">
          {{ selectedActivity.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="活动描述">
          {{ selectedActivity.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ selectedActivity.startTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ selectedActivity.endTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="最后更新时间">
          {{ selectedActivity.updatedAt || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="活动宣传图">
          <template v-if="selectedActivity.activityBanner">
            <img
              :src="getImageUrl(selectedActivity.activityBanner)"
              alt="活动宣传图"
              style="width: 160px; height: auto; border-radius: 4px; cursor: pointer"
              @click="handleImageClick(getImageUrl(selectedActivity.activityBanner))"
            />
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
        <el-descriptions-item label="活动文件">
          <template v-if="selectedActivity.activityFile">
            <a :href="getImageUrl(selectedActivity.activityFile)" target="_blank">下载活动文件</a>
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 发布活动表单 -->
    <el-card class="box-card" v-if="showUploadForm">
      <h2>发布活动</h2>
      <el-form :model="newActivity" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="newActivity.name" placeholder="请输入活动名称"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="newActivity.startTime" type="datetime" placeholder="选择开始时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="newActivity.endTime" type="datetime" placeholder="选择结束时间"></el-date-picker>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="newActivity.description" placeholder="请输入活动描述"></el-input>
        </el-form-item>
        <el-form-item label="上传宣传图">
          <el-upload
            action="/api/activity/uploadBanner"
            name="banner"
            :file-list="bannerFileList"
            list-type="picture-card"
            :on-success="handleBannerUploadSuccess"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            action="/api/activity/uploadFile"
            name="file"
            :file-list="fileFileList"
            :on-success="handleFileUploadSuccess"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <el-button @click="showUploadForm = false">取消</el-button>
      <el-button type="primary" @click="uploadActivity">提交活动</el-button>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      activities: [],
      dialogVisible: false,
      selectedActivity: {},
      showUploadForm: false,
      confirmDialogVisible: false,
      newActivity: {
        name: '',
        startTime: '',
        endTime: '',
        description: '',
        activityBanner: '',
        activityFile: ''
      },
      bannerFileList: [],
      fileFileList: []
    };
  },
  methods: {
    getImageUrl(imagePath) {
      if (!imagePath) return '';
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    handleImageClick(imgUrl) {
      this.previewImage = imgUrl;
      this.previewVisible = true;
    },
    async fetchActivities() {
      try {
        const response = await axios.get('/api/activity/list');
        this.activities = response.data.list || [];
      } catch (error) {
        this.activities = [];
      }
    },
    openDialog(activity) {
      this.selectedActivity = activity;
      this.dialogVisible = true;
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    deleteConfirm(activity) {
      this.selectedActivity = activity;
      this.confirmDialogVisible = true;
    },
    async deleteActivity(activityId) {
      try {
        await axios.delete(`/api/activity/${activityId}`);
        this.$message.success('活动删除成功');
        await this.fetchActivities();
      } catch (error) {
        this.$message.error('删除失败');
      }
    },
    openUploadDialog() {
      this.showUploadForm = true;
    },
    handleBannerUploadSuccess(response, file, fileList) {
      if (response && response.code === 0) {
        this.newActivity.activityBanner = response.data;
        this.bannerFileList = fileList;
        this.$message.success('宣传图上传成功');
      } else {
        this.$message.error('宣传图上传失败');
      }
    },
    handleFileUploadSuccess(response, file, fileList) {
      if (response && response.code === 0) {
        this.newActivity.activityFile = response.data;
        this.fileFileList = fileList;
        this.$message.success('文件上传成功');
      } else {
        this.$message.error('文件上传失败');
      }
    },
    async uploadActivity() {
      if (
        !this.newActivity.name ||
        !this.newActivity.startTime ||
        !this.newActivity.endTime ||
        !this.newActivity.description ||
        !this.newActivity.activityBanner ||
        !this.newActivity.activityFile
      ) {
        this.$message.error('请填写所有必填项');
        return;
      }
      try {
        await axios.post('/api/activity/post', this.newActivity);
        this.$message.success('活动上传成功');
        this.showUploadForm = false;
        await this.fetchActivities();
      } catch (error) {
        this.$message.error('上传过程中发生错误');
      }
    }
  },
  mounted() {
    this.fetchActivities();
  }
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 600px;
  padding: 20px;
}
.activity-item {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.btnGroup {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>