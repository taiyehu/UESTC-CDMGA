<template>
  <div class="app-layout">
    <h1>活动列表</h1>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
      >
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
        <div class="btn-group" style="text-align: center">
          <el-button
            type="success"
            @click="handleCourseView(activity)"
            size="small"
            >查看关联课题</el-button
          >
          <el-button
            type="success"
            @click="handleScoreBoardView(activity)"
            size="small"
            >查看活动排行榜</el-button
          >
        </div>
      </div>
    </div>
    <el-dialog v-model="previewVisible" width="auto" :show-close="true" center>
      <img
        :src="previewImage"
        alt="预览图片"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>
    <!-- 查看弹窗 -->
    <el-dialog v-model="viewDialogVisible" title="活动详情" width="40%">
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
          style="max-width: 200px"
        />
        <div v-if="currentActivity.activityFile">
          <a
            :href="getImageUrl(currentActivity.activityFile)"
            :download="getFileName(currentActivity.activityFile)"
            @click.prevent="downloadFile(currentActivity.activityFile)"
            style="color: var(--color-text-primary); text-decoration: underline; cursor: pointer"
            >下载活动文件</a
          >
        </div>
      </div>
    </el-dialog>
    <el-dialog
      v-model="viewCourseVisible"
      title="关联课题详情"
      width="80%"
      onclose="viewCourseVisible = false"
    >
      <el-table :data="assocCourses">
        <el-table-column prop="title" label="课题名称" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="rule" label="计分规则" />
        <el-table-column label="图片">
          <template v-slot="scope">
            <img
              :src="getImageUrl(scope.row.image)"
              alt="课题图片"
              style="
                max-width: 160px;
                max-height: 120px;
                border-radius: 6px;
                cursor: pointer;
              "
              @click="handleImageClick(getImageUrl(scope.row.image))"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="viewScoreBoardVisible"
      title="课题排行榜"
      width="80%"
      onclose="viewScoreBoardVisible = false"
    >
      <el-table
        :data="pagedRankData"
        style="width: 600px; margin: 0 auto"
        border
        :default-sort="{ prop: 'totalScore', order: 'descending' }"
      >
        <el-table-column type="expand">
          <template v-slot="props">
            <div style="background: var(--color-surface); padding: 10px 0">
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
                  <span style="margin: 8px 0">{{
                    score.score + 10000000
                  }}</span>
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
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const activities = ref<any[]>([])
const assocCourses = ref<any[]>([])
const activitiesScore = ref<any[]>([])
const loading = ref<boolean>(true)
const error = ref<string | null>(null)
const rankAllData = ref<any[]>([])
const rankSortedData = ref<any[]>([])
const rankPageSize = ref<number>(10)
const rankCurrentPage = ref<number>(1)
const previewVisible = ref<boolean>(false)
const previewImage = ref<string>('')
const viewDialogVisible = ref<boolean>(false)
const viewCourseVisible = ref<boolean>(false)
const viewScoreBoardVisible = ref<boolean>(false)
const currentActivity = ref<any | null>(null)

const pagedRankData = computed<any[]>(() => {
  const start = (rankCurrentPage.value - 1) * rankPageSize.value
  return rankSortedData.value.slice(start, start + rankPageSize.value)
})

const router = useRouter()

async function fetchActivities(): Promise<void> {
  try {
    const response = await axios.get('/api/activity/list')
    if (response.data.list) {
      activities.value = response.data.list
    } else if (Array.isArray(response.data)) {
      activities.value = response.data
    } else {
      activities.value = []
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function fetchAssocCourses(): Promise<void> {
  try {
    const id = currentActivity.value?.id
    if (!id) return
    const response = await axios.get(`/api/activity/assoc-activity-courses/${id}`)
    if (response.data.list) {
      assocCourses.value = response.data.list
      viewCourseVisible.value = true
    } else if (Array.isArray(response.data)) {
      assocCourses.value = response.data
      viewCourseVisible.value = true
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function handleImageClick(imgUrl: string): void {
  previewImage.value = imgUrl
  previewVisible.value = true
}

function handleCourseView(activity: any): void {
  currentActivity.value = activity
  assocCourses.value = []
  fetchAssocCourses()
  viewCourseVisible.value = true
}

function handleView(activity: any): void {
  currentActivity.value = activity
  viewDialogVisible.value = true
}

function formatDate(date: any): string {
  if (!date) return '-'
  const d = new Date(date)
    const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return d.toLocaleDateString('zh-CN', options)
}

function getImageUrl(imagePath?: string): string {
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function getFileName(filePath?: string): string {
  if (!filePath) return ''
  return filePath.split('/').pop() || ''
}

function downloadFile(filePath?: string): void {
  if (!filePath) return
  const url = getImageUrl(filePath)
  const a = document.createElement('a')
  a.href = url
  a.download = getFileName(filePath)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function goToProfile(id: string | number): void {
  router.push(`/profile/${id}`)
}

async function fetchRankData(): Promise<void> {
  try {
    if (!currentActivity.value) return
    const res = await axios.get(`/api/score/activity-totalScores/${currentActivity.value.id}`)
    let data = res.data.data || []
    const promises = data.map(async (item: any) => {
      const resp = await axios.get('/api/score/activity-scores', {
        params: {
          activityId: currentActivity.value.id,
          identityId: item.identityId,
        },
      })
      activitiesScore.value = resp.data || []
      const count = activitiesScore.value.length
      item.totalScore += count * 10000000
      item.contestCount = count
      item.contestScores = resp.data || []
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

function handleScoreBoardView(activity: any): void {
  currentActivity.value = activity
  fetchRankData()
  viewScoreBoardVisible.value = true
}

onMounted(() => {
  fetchActivities()
})
</script>

<style scoped>

.activity-item {
  margin-bottom: 32px;
  border: 1px solid var(--color-border);
  padding: 20px;
  border-radius: 8px;
  background-color: var(--color-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
