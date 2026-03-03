<template>
  <div class="app-layout">
    <h2 style="text-align: center; margin-bottom: 20px">用户总分排行榜</h2>
    <el-table
      :data="pagedRankData"
      style="width: 440px; margin: 0 auto"
      border
      :default-sort="{ prop: 'totalScore', order: 'descending' }"
    >
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
    <router-link to="/contest-ranking">
      <el-button
        type="primary"
        style="position: fixed; bottom: 20px; right: 20px"
        >查看比赛排行榜</el-button
      >
    </router-link>
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
    const res = await axios.get('/api/score/user-total-scores')
    let data = res.data.data || []
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

onMounted(() => {
  fetchRankData()
})
</script>

<style scoped>

</style>
