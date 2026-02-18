<template>
  <div class="main-content">
    <h1>活动列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div v-for="activity in activities" :key="activity.id" class="activity-item">
        <h2>{{ activity.name }}</h2>
        <p>描述: {{ activity.description }}</p>
        <p>开始时间: {{ formatDate(activity.startTime) }}</p>
        <p>结束时间: {{ formatDate(activity.endTime) }}</p>
        <img
          :src="getImageUrl(activity.activityBanner)"
          alt="活动宣传图"
          v-if="activity.activityBanner"
          class="activity-image"
          @click="handleView(activity)"
        />
        <div class="btn-group" style="text-align: center;">
          <el-button type="success" @click="handleCourseView(activity)" size="small">查看关联课题</el-button>
          <el-button type="success" @click="handleScoreBoardView(activity)" size="small">查看活动排行榜</el-button>
        </div>
      </div>
    </div>
    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img :src="previewImage" alt="预览图片" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
    <!-- 查看弹窗 -->
    <el-dialog :visible.sync="viewDialogVisible" title="活动详情" width="40%" >
      <div v-if="currentActivity">
        <h2>{{ currentActivity.name }}</h2>
        <p>描述: {{ currentActivity.description }}</p>
        <p>开始时间: {{ formatDate(currentActivity.startTime) }}</p>
        <p>结束时间: {{ formatDate(currentActivity.endTime) }}</p>
        <img
          :src="getImageUrl(currentActivity.activityBanner)"
          alt="活动宣传图"
          v-if="currentActivity.activityBanner"
          class="activity-image"
          style="max-width:200px;"
        />
        <div v-if="currentActivity.activityFile">
            <a
                :href="getImageUrl(currentActivity.activityFile)"
                :download="getFileName(currentActivity.activityFile)"
                @click.prevent="downloadFile(currentActivity.activityFile)"
                style="color: #409EFF; text-decoration: underline; cursor: pointer;"
            >下载活动文件</a>
        </div>
      </div>
    </el-dialog>
    <el-dialog :visible.sync="viewCourseVisible" title="关联课题详情" width="80%" onclose="viewCourseVisible = false">
      <el-table :data="assocCourses">
        <el-table-column prop="title" label="课题名称" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="rule" label="计分规则" />
        <el-table-column label="图片">
          <template slot-scope="scope">
            <img
              :src="getImageUrl(scope.row.image)"
              alt="课题图片"
              style="max-width:160px;max-height:120px;border-radius:6px;cursor:pointer;"
              @click="handleImageClick(getImageUrl(scope.row.image))"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog :visible.sync="viewScoreBoardVisible" title="课题排行榜" width="80%" onclose="viewScoreBoardVisible = false">
      <el-table
          :data="pagedRankData"
          style="width: 600px; margin: 0 auto;"
          border
          :default-sort="{prop: 'totalScore', order: 'descending'}"
      >
        <el-table-column type="expand">
          <template slot-scope="props">
            <div style="background:#f9f9f9;padding:10px 0;">
              <div v-if="props.row.contestScores && props.row.contestScores.length" style="display:flex;justify-content:center;">
                <div v-for="(score, idx) in props.row.contestScores" :key="idx" style="display:flex;flex-direction:column;align-items:center;margin:0 24px;">
                  <span style="font-weight:bold;">第{{ idx + 1 }}首分数</span>
                  <span style="margin:8px 0;">{{ score.score + 10000000}}</span>
                  <img
                      :src="getImageUrl(score.image)"
                      alt="课题图片"
                      style="width:60px;height:60px;border-radius:6px;cursor:pointer;"
                      @click="handleImageClick(getImageUrl(score.image))"
                  />
                </div>
              </div>
              <div v-else>无比赛成绩</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="排名" width="80" align="center">
          <template slot-scope="scope">
            {{ (rankCurrentPage - 1) * rankPageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="头像" width="80" align="center">
          <template slot-scope="scope">
        <span @click="goToProfile(scope.row.identityId)" style="cursor:pointer;display:inline-block;">
          <el-avatar :src="getImageUrl(scope.row.avatar)" />
        </span>
          </template>
        </el-table-column>
        <el-table-column prop="account" label="用户名" width="160" align="center" />
        <el-table-column prop="totalScore" label="总分" width="120" align="center" />
      </el-table>
      <div style="text-align:center;margin-top:20px;">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="rankSortedData.length"
            :page-size="rankPageSize"
            :current-page="rankCurrentPage"
            @current-change="handleRankPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      activities: [],
      assocCourses: [],
      activitiesScore: [],
      loading: true,
      error: null,
      rankAllData: [],
      rankSortedData: [],
      pagedRankData: [],
      rankPageSize: 10,
      rankCurrentPage: 1,
      previewVisible: false,
      previewImage: '',
      viewDialogVisible: false,
      viewCourseVisible: false,
      viewScoreBoardVisible: false,
      currentActivity: null
    };
  },
  mounted() {
    this.fetchActivities();
  },
  watch: {
    rankCurrentPage() {
      this.setPagedRankData();
    }
  },
  methods: {
    async fetchActivities() {
      try {
        const response = await axios.get('/api/activity/list');
        if (response.data.list) {
          this.activities = response.data.list;
        } else if (Array.isArray(response.data)) {
          this.activities = response.data;
        } else {
          this.activities = [];
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchAssocCourses() {
      try {
        const id = this.currentActivity.id;
        const response = await axios.get(`/api/activity/assoc-activity-courses/${id}`);
        if (response.data.list) {
          this.assocCourses = response.data.list;
          this.viewCourseVisible = true;
        } else if (Array.isArray(response.data)) {
          this.assocCourses = response.data;
          this.viewCourseVisible = true;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    handleImageClick(imgUrl) {
      this.previewImage = imgUrl;
      this.previewVisible = true;
    },
    handleCourseView(activity) {
      this.currentActivity = activity;
      this.assocCourses = [];
      this.fetchAssocCourses();
      this.viewCourseVisible = true;
    },

    handleView(activity) {
      this.currentActivity = activity;
      this.viewDialogVisible = true;
    },
    formatDate(date) {
      if (!date) return '-';
      const d = new Date(date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return d.toLocaleDateString('zh-CN', options);
    },
    getImageUrl(imagePath) {
      if (!imagePath) return '';
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    },
    getFileName(filePath) {
        if (!filePath) return '';
        return filePath.split('/').pop();
    },
    downloadFile(filePath) {
        const url = this.getImageUrl(filePath);
        // 创建隐藏a标签实现下载
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getFileName(filePath);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    goToProfile(id) {
      this.$router.push(`/profile/${id}`);
    },
    async fetchRankData() {
      try {

        const res = await axios.get(`/api/score/activity-totalScores/${this.currentActivity.id}`);
        let data = res.data.data || [];
        // 保留原有 totalScore 计算
        const promises = data.map(async item => {
          const resp = await axios.get('/api/score/activity-scores', {
            params: { activityId: this.currentActivity.id, identityId: item.identityId }
          });
          this.activitiesScore = resp.data || [];
          const count = this.activitiesScore.length;
          item.totalScore += count * 10000000;
          item.contestCount = count;
          item.contestScores = resp.data || [];
          return item;
        });
        data = await Promise.all(promises);
        data.sort((a, b) => b.totalScore - a.totalScore);
        this.rankAllData = data;
        this.rankSortedData = data;
        this.setPagedRankData();
      } catch (e) {
        this.$message ? this.$message.error('获取排行榜失败') : alert('获取排行榜失败');
      }
    },
    setPagedRankData() {
      const start = (this.rankCurrentPage - 1) * this.rankPageSize;
      this.pagedRankData = this.rankSortedData.slice(start, start + this.rankPageSize);
    },
    handleRankPageChange(page) {
      this.rankCurrentPage = page;
      this.setPagedRankData();
    },
    handleScoreBoardView(activity){
      this.currentActivity = activity;
      this.fetchRankData();
      this.viewScoreBoardVisible = true;
    }
  }
};
</script>

<style scoped>
.main-content {
  margin-top: var(--navbar-height);
}
.activity-item {
  margin-bottom: 32px;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.activity-image {
  max-width: 300px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
}
.btn-group {
  margin-top: 16px;
  display: flex;
  margin-left: auto;
}
</style>
