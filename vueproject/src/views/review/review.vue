<template>
  <div>
    <el-card class="box-card" v-if="unscoredScores.length > 0">
      <h2>未审核成绩查看</h2>

      <el-table :data="unscoredScores" stripe>
        <el-table-column prop="id" label="成绩ID"></el-table-column>
        <el-table-column prop="course.title" label="课题名称"></el-table-column>
        <el-table-column prop="identity.account" label="用户名"></el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" :formatter="formatDateTime"></el-table-column>
        <el-table-column prop="score" label="分数"></el-table-column>
        <el-table-column label="图片" width="200">
          <template #default="scope">
            <img
                v-if="scope.row.image"
                :src="getImageUrl(scope.row.image)"
                alt="点击查看"
                style="width: 120px; height: auto; border-radius: 4px; cursor: pointer"
                @click="handleImageClick(getImageUrl(scope.row.image))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="isScored" label="是否评分">
          <template #default="scope">
            {{ scope.row.isScored ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="250"></el-table-column>
        <el-table-column fixed="right" label="操作" width="120">
          <template #default="scope">
            <el-button @click="openDialog(scope.row)" type="primary" icon="el-icon-edit" circle size="small"></el-button>
            <el-button @click="openDeleteDialog(scope.row)" type="danger" icon="el-icon-delete" circle size="small"></el-button>
          </template>
        </el-table-column>
      </el-table>
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
      <h2>没有未审核的成绩信息</h2>
    </el-card>
    <!--TODO:优化表单结构-->
    <el-dialog :visible.sync="dialogVisible" width="70%" @close="dialogVisible = false">
      <h3>编辑分数</h3>
      <el-table :data="[selectedScore]" >
        <el-table-column prop="course.title" label="课题名称"></el-table-column>
        <el-table-column prop="identity.account" label="用户姓名"></el-table-column>
        <el-table-column label="成绩图片" width="200">
          <template #default="scope">
            <img
                v-if="scope.row.image"
                :src="getImageUrl(scope.row.image)"
                alt="成绩图片"
                style="width: 120px; height: auto; border-radius: 4px; cursor: pointer"
                @click="handleImageClick(getImageUrl(scope.row.image))"
            />
          </template>
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

    <el-dialog :visible.sync="deleteDialogVisible" title="确认删除成绩" width="30%">
      <span>确定删除成绩？删除后用户需重新提交</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDeleteScore">确定删除</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="previewVisible" width="auto" :show-close="true" center>
      <img
          :src="previewImage"
          alt="预览图片"
          style="max-width: 90vw; max-height: 80vh; display: block; margin: auto;"
      />
    </el-dialog>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left:10px">返回主页</el-button>
      </router-link>
    </div>
  </div>

</template>

<script>
import {fetchUnScoredScores, handleUpdateScore} from "@/api/score";
import dayjs from "dayjs";


export default {
  data() {
    return {
      unscoredScores: [],
      selectedScore: {},
      dialogVisible: false,
      previewVisible: false,
      previewImage: '',
      deleteDialogVisible: false,
      deleteScoreId: null,
      currentPage: 1,
      pageSize: 10,
      total: 0,
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
    // 获取所有成绩信息
    async fetchScores() {
      try {
        const response = await fetchUnScoredScores({ page: this.currentPage, pageSize: this.pageSize });
        this.unscoredScores = response.data.list || [];
        this.total = response.data.total || 0;
        console.log(this.unscoredScores);
      } catch (error) {
        console.error('获取成绩信息失败:', error);
        this.$message.error('获取成绩列表失败，请稍后重试');
        this.unscoredScores = [];
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchScores()
    },
    async updateScore(score) {
    try {
      const updateScore = {
        id: score.id,
        upload_time: dayjs(score.uploadTime).format('YYYY-MM-DDTHH:mm:ss'),
        image: score.image,
        point: score.score,
        is_scored: true,
        remark: score.remark,
      }
      await handleUpdateScore(updateScore, updateScore.id)
      this.$message.success(`成绩提交成功！`);
      this.dialogVisible = false;
      await this.fetchScores({page: 1, pageSize: 10});
    } catch(error) {
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
    openDeleteDialog(score) {
      this.deleteScoreId = score.id;
      this.deleteDialogVisible = true;
    },
    async handleDeleteScore() {
      try {
        await this.$axios.delete(`/api/score/delete/${this.deleteScoreId}`);
        this.$message.success('成绩删除成功');
        this.deleteDialogVisible = false;
        await this.fetchScores();
      } catch (error) {
        this.$message.error('成绩删除失败');
      }
    },
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
