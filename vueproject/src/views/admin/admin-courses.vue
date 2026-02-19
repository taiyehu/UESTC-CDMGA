<template>
  <div>
    <!-- 课题管理部分 -->
    <el-card class="box-card" v-if="courses.length > 0">
      <h2>课题管理</h2>
      <div
        v-for="(course, index) in courses"
        :key="course.id"
        class="course-item"
      >
        <p>课题名称：{{ course.title }} | 课题ID：{{ course.id }}</p>
        <div class="btnGroup">
          <el-button type="primary" @click="openDialog(course)" size="small"
            >查看</el-button
          >
          <el-button type="danger" @click="deleteConfirm(course)" size="small"
            >删除</el-button
          >
        </div>
      </div>
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
      <h2>没有课题信息</h2>
    </el-card>

    <el-dialog
      title="警告"
      v-model="confirmDialogVisible"
      width="30%"
      @close="confirmDialogVisible = false"
    >
      <span>确定删除?</span>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button type="danger" @click="deleteAndCloseCourse">确定</el-button>
          <el-button @click="confirmDialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>

    <el-button type="primary" @click="openUploadDialog" style="margin-top: 20px"
      >上传课题</el-button
    >
    <!-- 课题信息查看弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="课题详情"
      width="50%"
      @close="closeDialog"
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
          {{ selectedCourse.start_time || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="结束时间">
          {{ selectedCourse.end_time || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="最后更新时间">
          {{ selectedCourse.updated_at || '-' }}
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
    </el-dialog>

    <!-- 上传课题信息部分 -->
    <el-card class="box-card" v-if="showUploadForm">
      <h2>上传课题</h2>
      <el-form :model="newCourse" label-width="100px">
        <el-form-item label="课题名称">
          <el-input
            v-model="newCourse.title"
            placeholder="请输入课题名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="课题类别">
          <el-input
            v-model="newCourse.category"
            placeholder="请输入课题种类"
          ></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="newCourse.start_time"
            type="datetime"
            placeholder="选择开始时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="newCourse.end_time"
            type="datetime"
            placeholder="选择截止时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="课题描述">
          <el-input
            v-model="newCourse.description"
            placeholder="请输入课题描述"
          ></el-input>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/api/course/upload"
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
      <el-button @click="showUploadForm = false">取消</el-button>
      <el-button type="primary" @click="uploadCourse">提交课题</el-button>
    </el-card>

    <!-- 返回主页按钮 -->
    <div>
      <router-link to="/profile">
        <el-button type="warning" style="margin-top: 20px">返回主页</el-button>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { fetchAllCourseData, deleteCourseData } from '@/api/course'
import dayjs from 'dayjs'
import axios from 'axios'
import { compressImage } from '@/components/imageCompressor'
import { ElMessage } from 'element-plus'

const courses = ref<any[]>([])
const dialogVisible = ref(false)
const selectedCourse = ref<any>({})
const showUploadForm = ref(false)
const confirmDialogVisible = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const newCourse = reactive<any>({
  title: '',
  category: '',
  start_time: '',
  end_time: '',
  description: '',
  image: '',
})
const imageFileList = ref<any[]>([])
const previewImage = ref('')
const previewVisible = ref(false)

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

async function fetchCourses() {
  try {
    const response = await fetchAllCourseData({ page: currentPage.value, size: pageSize.value })
    courses.value = response.data.list || []
    total.value = response.data.total || 0
  } catch (error) {
    console.error('获取课题信息失败:', error)
    courses.value = []
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchCourses()
}

function openDialog(course: any) {
  selectedCourse.value = {
    ...course,
    start_time: dayjs(course.start_time).format('YYYY-MM-DD HH:mm:ss'),
    end_time: dayjs(course.end_time).format('YYYY-MM-DD HH:mm:ss'),
    updated_at: dayjs(course.updated_at).format('YYYY-MM-DD HH:mm:ss'),
  }
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

function deleteConfirm(course: any) {
  selectedCourse.value = { ...course }
  confirmDialogVisible.value = true
}

async function deleteCourse(courseId: any) {
  try {
    const response = await deleteCourseData(courseId)
    if (response.status === 204) {
      ElMessage({ message: '课题删除成功', type: 'success' })
      await fetchCourses()
    } else {
      ElMessage({ message: '删除失败', type: 'error' })
    }
  } catch (error) {
    console.error('删除课题失败:', error)
    ElMessage({ message: '删除失败', type: 'error' })
  }
}

function openUploadDialog() {
  showUploadForm.value = true
}

function handleImageUploadSuccess(response: any, file: any, fileListParam: any[]) {
  console.log('图片上传返回：', response)
  let url = ''
  if (response && response.code === 0) {
    url = response.data
  } else if (response && response.data && response.data.code === 0) {
    url = response.data.data
  }
  if (url) {
    newCourse.image = url
    imageFileList.value = fileListParam
    ElMessage({ message: '图片上传成功', type: 'success' })
  } else {
    ElMessage({ message: response.message || (response.data && response.data.message) || '图片上传失败', type: 'error' })
  }
}

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

async function uploadCourse() {
  console.log('提交前的newCourse:', newCourse)
  const formattedStartTime = dayjs(newCourse.start_time).format('YYYY-MM-DDTHH:mm:ss')
  const formattedEndTime = dayjs(newCourse.end_time).format('YYYY-MM-DDTHH:mm:ss')
  const now = dayjs().format('YYYY-MM-DDTHH:mm:ss')
  if (!newCourse.title || !newCourse.category || !newCourse.start_time || !newCourse.end_time || !newCourse.description || !newCourse.image) {
    ElMessage({ message: '请填写所有必填项', type: 'error' })
    return
  }
  try {
    const response = await axios.post('/api/course/post', {
      title: newCourse.title,
      category: newCourse.category,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      description: newCourse.description,
      image: newCourse.image,
      createTime: now,
      updateTime: now,
    })
    console.log('课题上传响应：', response)
    if (response.data.code === 0) {
      ElMessage({ message: '课题上传成功', type: 'success' })
      showUploadForm.value = false
      await fetchCourses()
    } else {
      ElMessage({ message: response.data.message || '课题上传失败', type: 'error' })
    }
  } catch (error) {
    ElMessage({ message: '上传过程中发生错误', type: 'error' })
  }
}

async function deleteAndCloseCourse() {
  await deleteCourse(selectedCourse.value.id)
  confirmDialogVisible.value = false
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
  color: #333;
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
.el-button:hover {
  background-color: #409eff;
  color: white;
}
.el-dialog {
  min-width: 500px;
}
.el-form-item {
  margin-bottom: 20px;
}
</style>
