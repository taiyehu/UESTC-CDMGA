<template>
  <div>
    <el-card class="box-card" v-if="unscoredScores.length > 0">
      <h2>未审核成绩查看</h2>

      <el-table :data="unscoredScores" stripe>
        <el-table-column prop="id" label="成绩ID"></el-table-column>
        <el-table-column prop="course.title" label="课题名称"></el-table-column>
        <el-table-column
          prop="identity.account"
          label="用户名"
        ></el-table-column>
        <el-table-column
          prop="uploadTime"
          label="上传时间"
          :formatter="formatDateTime"
        ></el-table-column>
        <el-table-column prop="score" label="分数"></el-table-column>
        <el-table-column label="图片" width="200">
          <template #default="scope">
            <img
              v-if="scope.row.image"
              :src="getImageUrl(scope.row.image)"
              alt="点击查看"
              style="
                width: 120px;
                height: auto;
                border-radius: 4px;
                cursor: pointer;
              "
              @click="handleImageClick(getImageUrl(scope.row.image))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="isScored" label="是否评分">
          <template #default="scope">
            {{ scope.row.isScored ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="remark"
          label="备注"
          width="250"
        ></el-table-column>
        <el-table-column fixed="right" label="操作" width="120">
          <template #default="scope">
            <el-button
              @click="openDialog(scope.row)"
              type="primary"
              :icon="ElIconEdit"
              circle
              size="small"
            ></el-button>
            <el-button
              @click="openDeleteDialog(scope.row)"
              type="danger"
              :icon="ElIconDelete"
              circle
              size="small"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>
      <div>
        <el-pagination
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
        >
        </el-pagination>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有未审核的成绩信息</h2>
    </el-card>
    <!--TODO:优化表单结构-->
    <el-dialog
      v-model="dialogVisible"
      width="70%"
      @close="dialogVisible = false"
    >
      <h3>编辑分数</h3>
      <el-table :data="[selectedScore]">
        <el-table-column prop="course.title" label="课题名称"></el-table-column>
        <el-table-column
          prop="identity.account"
          label="用户姓名"
        ></el-table-column>
        <el-table-column label="成绩图片" width="200">
          <template #default="scope">
            <img
              v-if="scope.row.image"
              :src="getImageUrl(scope.row.image)"
              alt="成绩图片"
              style="
                width: 120px;
                height: auto;
                border-radius: 4px;
                cursor: pointer;
              "
              @click="handleImageClick(getImageUrl(scope.row.image))"
            />
          </template>
        </el-table-column>
        <el-table-column label="分数">
          <el-input-number
            v-model="selectedScore.score"
            placeholder="请输入得分"
          ></el-input-number>
        </el-table-column>
      </el-table>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="updateScore(selectedScore)"
            >确 定</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="确认删除成绩" width="30%">
      <span>确定删除成绩？删除后用户需重新提交</span>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleDeleteScore"
            >确定删除</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" width="auto" :show-close="true" center>
      <img
        :src="previewImage"
        alt="预览图片"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left: 10px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Edit as ElIconEdit, Delete as ElIconDelete } from '@element-plus/icons-vue'
import { fetchUnScoredScores, handleUpdateScore } from '@/api/score'
import dayjs from 'dayjs'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 数据与状态
const unscoredScores = ref<any[]>([])
const selectedScore = ref<any>({})
const dialogVisible = ref(false)
const previewVisible = ref(false)
const previewImage = ref('')
const deleteDialogVisible = ref(false)
const deleteScoreId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const ElIconEditRef = ElIconEdit
const ElIconDeleteRef = ElIconDelete

// 获取图片 URL，保留日志用于调试
function getImageUrl(imagePath?: string) {
  console.log('原始图片路径:', imagePath)
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  // 只返回相对路径，nginx会自动代理
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function handleImageClick(imgUrl: string) {
  previewImage.value = imgUrl
  previewVisible.value = true
}

// 获取所有成绩信息
async function fetchScores() {
  try {
    const response = await fetchUnScoredScores({ page: currentPage.value, pageSize: pageSize.value })
    unscoredScores.value = response.data.list || []
    total.value = response.data.total || 0
    console.log(unscoredScores.value)
  } catch (error: any) {
    console.error('获取成绩信息失败:', error)
    ElMessage({ message: '获取成绩列表失败，请稍后重试', type: 'error' })
    unscoredScores.value = []
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchScores()
}

async function updateScore(score: any) {
  try {
    let point: number = score.score
    // 判断是否为 contest 类型
    if (score.course && score.course.category === 'contest') {
      point = parseFloat(point) - 10000000
    }
    const updatePayload = {
      id: score.id,
      upload_time: dayjs(score.uploadTime).format('YYYY-MM-DDTHH:mm:ss'),
      image: score.image,
      point: parseFloat(point), // 转为 float
      is_scored: true,
      remark: score.remark,
    }
    await handleUpdateScore(updatePayload, updatePayload.id)
    ElMessage({ message: '成绩提交成功！', type: 'success' })
    dialogVisible.value = false
    // 提交后刷新第一页
    currentPage.value = 1
    await fetchScores()
  } catch (error: any) {
    console.error('提交失败:', error)
    const errorMsg = error.response?.data?.message || '成绩提交失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  }
}

// 格式化日期时间
function formatDateTime(row: any, column: any, cellValue: any) {
  if (!cellValue) return ''
  return new Date(cellValue).toLocaleString()
}

function openDialog(score: any) {
  console.log(score)
  selectedScore.value = {
    ...score,
    uploadTime: dayjs(score.uploadTime).format('YYYY-MM-DD HH:mm:ss'),
    createAt: dayjs(score.createAt).format('YYYY-MM-DD HH:mm:ss'),
    updateAt: dayjs(score.updateAt).format('YYYY-MM-DD HH:mm:ss'),
  }
  dialogVisible.value = true
}

function openDeleteDialog(score: any) {
  deleteScoreId.value = score.id
  deleteDialogVisible.value = true
}

async function handleDeleteScore() {
  try {
    await axios.delete(`/api/score/delete/${deleteScoreId.value}`)
    ElMessage({ message: '成绩删除成功', type: 'success' })
    deleteDialogVisible.value = false
    await fetchScores()
  } catch (error) {
    ElMessage({ message: '成绩删除失败', type: 'error' })
  }
}

onMounted(() => {
  fetchScores()
})
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
