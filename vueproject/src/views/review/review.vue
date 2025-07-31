<template>
  <div>
    <el-card class="box-card" v-if="unscoredScores.length > 0">
      <h2>未审核成绩查看</h2>
      <el-table :data="unscoredScores" stripe>
        <el-table-column prop="id" label="成绩ID"></el-table-column>
        <el-table-column prop="course.title" label="课题名称"></el-table-column>
        <el-table-column prop="identity.name" label="用户姓名"></el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" :formatter="formatDateTime"></el-table-column>
        <el-table-column prop="score" label="分数"></el-table-column>
        <el-table-column prop="isScored" label="是否评分">
          <template #default="scope">
            {{ scope.row.isScored ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
    </el-card>
    <el-card v-else>
      <h2>没有未审核的成绩信息</h2>
    </el-card>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left:10px">返回主页</el-button>
      </router-link>
  </div>
  </div>
  
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      scores: [],
      unscoredScores: []
    };
  },
  methods: {
    // 获取所有成绩信息
    async fetchScores() {
      try {
        const response = await axios.get('http://localhost:8080/api/score/');
        this.scores = response.data || [];
        // 过滤出未被审核的成绩
        this.unscoredScores = this.scores.filter(score =>!score.isScored);
      } catch (error) {
        console.error('获取成绩信息失败:', error);
        this.$message.error('获取成绩列表失败，请稍后重试');
        this.scores = [];
        this.unscoredScores = [];
      }
    },
    // 格式化日期时间
    formatDateTime(row, column, cellValue) {
      if (!cellValue) return '';
      return new Date(cellValue).toLocaleString();
    }
  },
  mounted() {
    this.fetchScores();
  }
};
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 800px;
  padding: 20px;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.el-table {
  margin-top: 20px;
}
</style>