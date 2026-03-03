<template>
  <div class="app-layout">
    <el-card class="box-card" v-if="courses.length > 0">
      <h2>成绩提交</h2>
      <div
        v-for="(course) in courses"
        :key="course.id"
        class="course-item"
      >
        <p>课题名称：{{ course.title }} | 课题ID：{{ course.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openViewDialog(course)" size="small"
            >查看</el-button
          >
          <el-tooltip
            v-if="isScored(course.id)"
            content="已经被打过分"
            placement="top"
          >
            <el-button
              :type="isSubmitted(course.id) ? 'warning' : 'success'"
              @click="
                isSubmitted(course.id)
                  ? openUpdateDialog(course)
                  : openSubmitDialog(course)
              "
              size="small"
              :disabled="isScored(course.id)"
            >
              {{ isSubmitted(course.id) ? '更新' : '提交' }}
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            :type="isSubmitted(course.id) ? 'warning' : 'success'"
            @click="
              isSubmitted(course.id)
                ? openUpdateDialog(course)
                : openSubmitDialog(course)
            "
            size="small"
            :disabled="isScored(course.id) && course.category !== 'contest'"
          >
            {{ isSubmitted(course.id) ? '更新' : '提交' }}
          </el-button>
        </div>
      </div>
    </el-card>
    <el-card v-else>
      <h2>没有课题信息</h2>
    </el-card>

    <!-- 课题详情弹窗 -->
    <!-- 课题详情弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="课题详情"
      width="50%"
      @close="closeViewDialog()"
    >
      <el-descriptions border :column="1">
        <el-descriptions-item label="课题名称">
          {{ selectedCourse.title || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="课题类别">
          {{ selectedCourse.category || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="课题描述">
          {{ selectedCourse.description || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="开始时间">
          {{ formatDateTime(selectedCourse.startTime) || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="结束时间">
          {{ formatDateTime(selectedCourse.endTime) || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="最后更新时间">
          {{ formatDateTime(selectedCourse.updatedAt) || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="课题图片">
          <template v-if="selectedCourse.image">
            <img
              :src="getImageUrl(selectedCourse.image)"
              alt="课题图片"
              style="
                width: 160px;
                height: auto;
                border-radius: 4px;
                cursor: pointer;
              "
              @click="handleImageClick(getImageUrl(selectedCourse.image))"
            />
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
      </el-descriptions>

      <h3 v-if="selectedScore" style="margin-top: 20px">成绩信息</h3>
      <el-descriptions v-if="selectedScore" border :column="1">
        <el-descriptions-item label="是否评分">
          {{ selectedScore.isScored ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="得分">
          {{ selectedScore.isScored ? selectedScore.score : '还没打分呢!' }}
        </el-descriptions-item>
        <el-descriptions-item label="成绩图片">
          <template v-if="selectedScore.image">
            <img
              :src="getImageUrl(selectedScore.image)"
              alt="成绩图片"
              style="
                width: 160px;
                height: auto;
                border-radius: 4px;
                cursor: pointer;
              "
              @click="handleImageClick(getImageUrl(selectedScore.image))"
            />
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
      </el-descriptions>

      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" width="auto" :show-close="true" center>
      <img
        :src="previewImage"
        alt="预览图片"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>

    <!-- 成绩提交弹窗-->
    <el-dialog
      v-model="submitDialogVisible"
      title="成绩提交"
      width="40%"
      @close="closeSubmitDialog"
    >
      <el-form :model="submitForm" label-width="100px" ref="submitFormRef">
        <el-form-item label="课题名称">
          <el-input v-model="submitForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="submitForm.course_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            type="textarea"
            v-model="updateForm.remark"
            placeholder="可选，填写补充说明"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/score/upload"
            name="image"
            :file-list="imageFileList"
            list-type="picture-card"
            :on-success="handleImageUploadSuccess"
            :before-upload="beforeImageUpload"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <div class="dialog-footer">
          <el-button @click="closeSubmitDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认提交</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 成绩更新弹窗 -->
    <el-dialog
      v-model="updateDialogVisible"
      title="成绩更新"
      width="40%"
      @close="closeUpdateDialog"
    >
      <el-form :model="updateForm" label-width="100px" ref="updateFormRef">
        <el-form-item label="课题名称">
          <el-input v-model="updateForm.course_title" disabled></el-input>
        </el-form-item>
        <el-form-item label="课题ID">
          <el-input v-model="updateForm.course_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            type="textarea"
            v-model="updateForm.remark"
            placeholder="可选，填写补充说明。提交时请提交课题发布之后游玩的成绩图，不要使用老成绩图！"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/score/upload"
            name="image"
            :file-list="imageFileList"
            list-type="picture-card"
            :on-success="handleImageUpdateSuccess"
          >
            <el-button>点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <div class="dialog-footer">
          <el-button @click="closeUpdateDialog">取消</el-button>
          <el-button type="primary" @click="handleUpdate">确认更新</el-button>
        </div>
      </template>
    </el-dialog>
    <div>
      <router-link to="/profile">
        <el-button style="margin-left: 10px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from 'axios'
import { fetchAvailablecourseData } from '@/api/course'
import { checkSubmitted, handleSubmitScore, handleUpdateScore } from '@/api/score'
import { compressImage } from '@/components/imageCompressor'
import dayjs from 'dayjs'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 状态与数据
const courses = ref<any[]>([])
const viewDialogVisible = ref(false)
const submitDialogVisible = ref(false)
const updateDialogVisible = ref(false)
const previewVisible = ref(false)
const previewImage = ref('')
const selectedCourse = ref<any>({})

const submitForm = reactive<any>({
  course_id: '',
  course_title: '',
  upload_time: '',
  remark: '',
  image: '',
})

const updateForm = reactive<any>({
  course_id: '',
  course_title: '',
  upload_time: '',
  remark: '',
  image: '',
  // may include score_id or create_at
})


const selectedScore = ref<any>({})
const imageFileList = ref<any[]>([])
const submittedCourses = ref<any[]>([])
const ScoredScores = ref<any[]>([])

// 工具函数
function getImageUrl(imagePath?: string) {
  console.log('原始图片路径:', imagePath)
  if (!imagePath) return ''
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function handleImageClick(imgUrl: string) {
  previewImage.value = imgUrl
  previewVisible.value = true
}

// 获取课题列表
async function fetchCourses() {
  try {
    const response = await fetchAvailablecourseData({ page: 1, size: 10 })
    courses.value = response.data.list || []
    submittedCourses.value = []
    ScoredScores.value = []
    await checkSubmittedCourses()
    console.log('后端返回的数据:', response.data.list)
  } catch (error: any) {
    console.error('获取课题信息失败:', error)
    ElMessage({ message: '获取课题列表失败，请稍后重试', type: 'error' })
    courses.value = []
    submittedCourses.value = []
    ScoredScores.value = []
  }
}

// 检查课题是否已提交
async function checkSubmittedCourses() {
  const identityId = getCurrentIdentityId()
  if (!identityId) {
    ElMessage({ message: '未获取到用户信息，请重新登录', type: 'error' })
    return
  }
  for (const course of courses.value) {
    const response = await checkSubmitted(identityId, course.id)
    if (response.data) {
      submittedCourses.value.push(course.id)
      submittedCourses.value.push(course.category)
      const score = await axios.get('/api/score/find', {
        params: { identity_id: identityId, course_id: course.id },
      })
      if (score.data) {
        const ScoredScore = await axios.get(`/api/score/${score.data}`)
        if (ScoredScore.data.isScored && !ScoredScore.data.isDeleted)
          ScoredScores.value.push(ScoredScore.data.course.id)
      }
    }
  }
}

// 判断课题是否已提交
function isSubmitted(courseId: any) {
  return submittedCourses.value.includes(courseId)
}

function isScored(courseId: any) {
  return ScoredScores.value.includes(courseId) && !submittedCourses.value.includes('contest')
}

// 打开查看弹窗
async function openViewDialog(course: any) {
  // 保留多种命名以兼容后端字段
  selectedCourse.value = {
    ...course,
    startTime: dayjs(course.startTime || course.start_time).format('YYYY-MM-DD HH:mm:ss'),
    start_time: dayjs(course.startTime || course.start_time).format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs(course.endTime || course.end_time).format('YYYY-MM-DD HH:mm:ss'),
    end_time: dayjs(course.endTime || course.end_time).format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs(course.updatedAt || course.updated_at).format('YYYY-MM-DD HH:mm:ss'),
    updated_at: dayjs(course.updatedAt || course.updated_at).format('YYYY-MM-DD HH:mm:ss'),
  }

  const identityId = getCurrentIdentityId()
  const response = await axios.get('/api/score/find', {
    params: { identity_id: identityId, course_id: course.id },
  })
  if (response.data) {
    const scoreId = response.data
    selectedScore.value = (await axios.get(`/api/score/${scoreId}`)).data
  } else {
    selectedScore.value = null
  }
  viewDialogVisible.value = true
}

function closeViewDialog() {
  viewDialogVisible.value = false
}

// 打开提交弹窗
function openSubmitDialog(course: any) {
  submitForm.course_id = course.id
  submitForm.course_title = course.title
  submitForm.upload_time = ''
  submitForm.image = ''
  imageFileList.value = []
  submitDialogVisible.value = true
}

function closeSubmitDialog() {
  submitDialogVisible.value = false
}

// 打开更新弹窗
async function openUpdateDialog(course: any) {
  const identityId = getCurrentIdentityId()
  const response = await axios.get('/api/score/find', {
    params: { identity_id: identityId, course_id: course.id },
  })
  updateForm.score_id = response.data
  updateForm.course_id = course.id
  updateForm.course_title = course.title
  updateForm.create_at = course.created_at || course.createAt
  updateForm.upload_time = ''
  updateForm.image = ''
  imageFileList.value = []
  updateDialogVisible.value = true
}

function closeUpdateDialog() {
  updateDialogVisible.value = false
}

// 格式化日期时间
function formatDateTime(dateTime: any) {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString()
}

// 提交处理
async function handleSubmit() {
  try {
    const identityId = getCurrentIdentityId()
    if (!identityId) {
      ElMessage({ message: '未获取到用户信息，请重新登录', type: 'error' })
      return
    }
    submitForm.upload_time = new Date().toISOString()
    const submitData = {
      course_id: submitForm.course_id,
      identity_id: identityId,
      upload_time: submitForm.upload_time,
      image: submitForm.image,
      remark: submitForm.remark,
    }
    await handleSubmitScore(submitData)
    ElMessage({ message: `课题 "${submitForm.course_title}" 的成绩提交成功！`, type: 'success' })
    closeSubmitDialog()
    await fetchCourses()
  } catch (error: any) {
    console.error('提交失败:', error)
    const errorMsg = error.response?.data?.message || '成绩提交失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  }
}

// 更新处理
async function handleUpdate() {
  try {
    updateForm.upload_time = new Date().toISOString()
    const updateData = {
      upload_time: updateForm.upload_time,
      created_at: updateForm.create_at,
      image: updateForm.image,
      score: 0,
      is_scored: false,
      id: updateForm.score_id,
      remark: updateForm.remark,
    }
    await handleUpdateScore(updateData, updateForm.score_id)
    ElMessage({ message: `课题 "${updateForm.course_title}" 的成绩更新成功！`, type: 'success' })
    closeUpdateDialog()
    await fetchCourses()
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || '成绩更新失败，请重试'
    ElMessage({ message: errorMsg, type: 'error' })
  }
}

// 图片上传成功后的回调
function handleImageUploadSuccess(response: any, fileListParam: any[]) {
  console.log('图片上传返回：', response)
  let url = ''
  if (response && response.code === 0) {
    url = response.data
  } else if (response && response.data && response.data.code === 0) {
    url = response.data.data
  }
  if (url) {
    submitForm.image = url
    imageFileList.value = fileListParam
    ElMessage({ message: '图片上传成功', type: 'success' })
  } else {
    ElMessage({ message: response.message || (response.data && response.data.message) || '图片上传失败', type: 'error' })
  }
}

function handleImageUpdateSuccess(response: any, fileListParam: any[]) {
  console.log('图片上传返回：', response)
  let url = ''
  if (response && response.code === 0) {
    url = response.data
  } else if (response && response.data && response.data.code === 0) {
    url = response.data.data
  }
  if (url) {
    updateForm.image = url
    imageFileList.value = fileListParam
    ElMessage({ message: '图片上传成功', type: 'success' })
  } else {
    ElMessage({ message: response.message || (response.data && response.data.message) || '图片上传失败', type: 'error' })
  }
}

function getCurrentIdentityId(): number | null {
  try {
    const userInfo = sessionStorage.getItem('userInfo')
    if (!userInfo) return null
    const user = JSON.parse(userInfo)
    return user.id ? Number(user.id) : null
  } catch (error) {
    console.error('获取用户身份失败:', error)
    return null
  }
}

// 上传前自动压缩图片
async function beforeImageUpload(file: any) {
  try {
    if (!file.type.startsWith('image/')) {
      ElMessage({ message: '只能上传图片文件', type: 'error' })
      return false
    }
    const compressed = await compressImage(file)
    return compressed
  } catch (err: any) {
    ElMessage({ message: '图片压缩失败: ' + err.message, type: 'error' })
    return false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.box-card {
  margin: auto;
  width: 600px;
  padding: 20px;
}
h2 {
  font-size: 24px;
  color: var(--color-text-primary);
  margin-bottom: 40px;
}
.course-item p {
  margin-bottom: 20px;
  text-align: left;
}
.btnGroup {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.el-button {
  margin-left: 10px;
  margin-top: -42px;
}
.el-dialog {
  min-width: 500px;
}
.el-form-item {
  margin-bottom: 20px;
}
.el-upload__tip {
  font-size: 12px;
  color: var(--color-text-primary);
  margin-top: 5px;
}
</style>
