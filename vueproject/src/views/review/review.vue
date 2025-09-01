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
        <el-table-column prop="remark" label="备注" width="250"></el-table-column>
        <el-table-column fixed="right" label="操作" width="120">
          <div v-for="score in unscoredScores" :key="score.id" class="score-item">
            <el-button @click="openDialog(score)" type="text" size="small">查看</el-button>
          </div>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card v-else>
      <h2>没有未审核的成绩信息</h2>
    </el-card>

    <el-dialog :visible.sync="dialogVisible" width="70%" @close="dialogVisible = false">
      <h3>编辑分数</h3>
      <el-table :data="[selectedScore]" >
        <el-table-column prop="course.title" label="课题名称"></el-table-column>
        <el-table-column prop="identity.name" label="用户姓名"></el-table-column>
        <el-table-column label="图片">
          <el-button @click="openPhoto(selectedScore.image)" type="text" size="small"></el-button>
        </el-table-column>
        <el-table-column label="分数">
          <el-input-number v-model="selectedScore.score" placeholder="请输入得分"></el-input-number>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="updateScore(selectedScore)">确 定</el-button>
      </span>
    </el-dialog>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left:10px">返回主页</el-button>
      </router-link>
    </div>
  </div>

</template>

<script>
import {fetchScore, handleUpdateScore} from "@/api/score";
import dayjs from "dayjs";

export default {
  data() {
    return {
      scores: [],
      unscoredScores: [],
      selectedScore: {},
      dialogVisible: false,
      photoVisible: false,
    };
  },
  methods: {
    // 获取所有成绩信息
    async fetchScores() {
      try {
        const response = await fetchScore({ page: 1, pageSize: 10 });
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
    async updateScore(score) {
      try {
        const updateScore = {
          id: score.id,
          point: score.score,
          is_scored: true,
          remark: score.remark,
        }
        await handleUpdateScore(updateScore, updateScore.id)
        // 5. 处理成功
        this.$message.success(`成绩提交成功！`);

        this.dialogVisible = false;
        await this.fetchScores({page: 1, pageSize: 10});
      }catch(error) {
        console.error('提交失败:', error);
        const errorMsg = error.response?.data?.message || '成绩提交失败，请重试';
        this.$message.error(errorMsg);
      }
    },
    // 格式化日期时间
    formatDateTime(row, column, cellValue) {
      if (!cellValue) return '';
      return new Date(cellValue).toLocaleString();
    },
    openDialog(score) {
      console.log(score);
      this.selectedScore = {
        ...score,
        uploadTime: dayjs(score.uploadTime).format('YYYY-MM-DD HH:mm:ss'),
        createAt: dayjs(score.createAt).format('YYYY-MM-DD HH:mm:ss'),
        updateAt: dayjs(score.updateAt).format('YYYY-MM-DD HH:mm:ss'),
      };
      this.dialogVisible = true;
    },
    openPhoto(image) {
      //TODO:添加显示图片的弹窗
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
  width: 1280px;
  padding: 20px;
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

</style>
