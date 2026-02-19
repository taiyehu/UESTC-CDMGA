<template>
  <div class="main-content">
    <h2 style="text-align: center; margin-bottom: 20px">比赛排行榜（总计）</h2>
    <el-table
      :data="pagedRankData"
      style="width: 500px; margin: 0 auto"
      border
      :default-sort="{ prop: 'totalScore', order: 'descending' }"
    >
      <el-table-column type="expand">
        <template v-slot="props">
          <div style="background: #f9f9f9; padding: 10px 0">
            <div
              v-if="props.row.contestScores && props.row.contestScores.length"
              style="display: flex; justify-content: center"
            >
              <div
                v-for="(score, idx) in props.row.contestScores"
                :key="idx"
                style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  margin: 0 24px;
                "
              >
                <span style="font-weight: bold">第{{ idx + 1 }}首分数</span>
                <span style="margin: 8px 0">{{ score.score + 10000000 }}</span>
                <img
                  :src="getImageUrl(score.image)"
                  alt="课题图片"
                  style="
                    width: 60px;
                    height: 60px;
                    border-radius: 6px;
                    cursor: pointer;
                  "
                  @click="handleImageClick(getImageUrl(score.image))"
                />
              </div>
            </div>
            <div v-else>无比赛成绩</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="排名" width="80" align="center">
        <template v-slot="scope">
          {{ (rankCurrentPage - 1) * rankPageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="头像" width="80" align="center">
        <template v-slot="scope">
          <span
            @click="goToProfile(scope.row.identityId)"
            style="cursor: pointer; display: inline-block"
          >
            <el-avatar :src="getImageUrl(scope.row.avatar)" />
          </span>
        </template>
      </el-table-column>
      <el-table-column
        prop="account"
        label="用户名"
        width="160"
        align="center"
      />
      <el-table-column
        prop="totalScore"
        label="总分"
        width="120"
        align="center"
      />
    </el-table>
    <div style="text-align: center; margin-top: 20px">
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
      <el-button
        type="primary"
        style="position: fixed; bottom: 20px; right: 20px"
        >查看课题排行榜</el-button
      >
    </router-link>
    <el-dialog v-model="previewVisible" width="auto" :show-close="true" center>
      <img
        :src="previewImage"
        alt="预览图片"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const rankAllData = ref<any[]>([])
const rankSortedData = ref<any[]>([])
const rankPageSize = ref<number>(10)
const rankCurrentPage = ref<number>(1)
const previewVisible = ref<boolean>(false)
const previewImage = ref<string>('')

const pagedRankData = computed<any[]>(() => {
  const start = (rankCurrentPage.value - 1) * rankPageSize.value
  return rankSortedData.value.slice(start, start + rankPageSize.value)
})

const router = useRouter()

function goToProfile(id: string | number): void {
  router.push(`/profile/${id}`)
}

async function fetchRankData(): Promise<void> {
  try {
    const res = await axios.get('/api/score/contest-scores')
    let data = res.data.data || []
    // 保留原有 totalScore 计算
    const promises = data.map(async (item: any) => {
      const resp = await axios.get('/api/score/contest-score-count', {
        params: { identityId: item.identityId },
      })
      const count = resp.data.data || 0
      item.totalScore += count * 10000000
      item.contestCount = count
      // 新增：获取该用户所有 contest 课题成绩和图片
      console.log('请求contest成绩 identityId:', item.identityId)
      const contestResp = await axios.get(
        '/api/score/contest/contest-scores-by-user',
        {
          params: { identityId: item.identityId },
        }
      )
      item.contestScores = contestResp.data.data || []
      return item
    })
    data = await Promise.all(promises)
    data.sort((a: any, b: any) => b.totalScore - a.totalScore)
    rankAllData.value = data
    rankSortedData.value = data
  } catch (e) {
    ElMessage({ message: '获取排行榜失败', type: 'error' })
  }
}

function handleRankPageChange(page: number): void {
  rankCurrentPage.value = page
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function handleImageClick(imgUrl: string): void {
  previewImage.value = imgUrl
  previewVisible.value = true
}

onMounted(() => {
  fetchRankData()
})
</script>

<style scoped>
.main-content {
  margin-top: var(--navbar-height);
}
</style>
