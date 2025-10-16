<template>
  <div class="main-content">
    <h2 style="text-align:center;margin-bottom:20px;">用户总分排行榜</h2>
    <el-table
      :data="pagedRankData"
      style="width: 600px; margin: 0 auto;"
      border
      :default-sort="{prop: 'totalScore', order: 'descending'}"
    >
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
        const res = await axios.get('/api/score/user-total-scores');
        let data = res.data.data || [];
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
    }
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
