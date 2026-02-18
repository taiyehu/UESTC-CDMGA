<template>
  <div class="main-content">
    <h2 style="text-align:center;margin-bottom:20px;">比赛排行榜（总计）</h2>
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
    <router-link to="/ranking">
        <el-button type="primary" style="position: fixed; bottom: 20px; right: 20px;">查看课题排行榜</el-button>
    </router-link>
    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img :src="previewImage" alt="预览图片" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
    </el-dialog>
  </div>

</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      rankAllData: [],
      rankSortedData: [],
      pagedRankData: [],
      rankPageSize: 10,
      rankCurrentPage: 1,
      previewVisible: false,
      previewImage: '',
    };
  },
  mounted() {
    this.fetchRankData();
  },
  watch: {
    rankCurrentPage() {
      this.setPagedRankData();
    }
  },
  methods: {
    goToProfile(id) {
      this.$router.push(`/profile/${id}`);
    },
    async fetchRankData() {
      try {
        const res = await axios.get('/api/score/contest-scores');
        let data = res.data.data || [];
        // 保留原有 totalScore 计算
        const promises = data.map(async item => {
          const resp = await axios.get('/api/score/contest-score-count', {
            params: { identityId: item.identityId }
          });
          const count = resp.data.data || 0;
          item.totalScore += count * 10000000;
          item.contestCount = count;
          // 新增：获取该用户所有 contest 课题成绩和图片
          console.log('请求contest成绩 identityId:', item.identityId);
          const contestResp = await axios.get('/api/score/contest/contest-scores-by-user', {
            params: { identityId: item.identityId }
          });
          item.contestScores = contestResp.data.data || [];
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
  }
}
</script>

<style scoped>
/* 主内容区自动适配导航栏高度，--navbar-height 为全局变量 */
.main-content {
  margin-top: var(--navbar-height);
}
/* 排行榜样式可根据需要自定义 */
</style>
