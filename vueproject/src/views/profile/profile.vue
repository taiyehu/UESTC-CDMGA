<template>
  <div class="profile-container">
    <el-card class="box-card" shadow="hover" v-if="user.id !== null">
      <div class="profile-header">
        <div class="avatar-select-group">
          <template v-if="isSelf">
            <el-tooltip content="点击头像修改" placement="bottom">
              <div
                style="display: inline-block; cursor: pointer"
                @click="openEditDialog"
              >
                <el-avatar
                  :size="128"
                  :src="
                    profileStatus === 1
                      ? getImageUrl(profile.avatar)
                      : defaultAvatar
                  "
                  style="background: #409eff; color: #fff"
                />
              </div>
            </el-tooltip>
          </template>
          <template v-else>
            <el-tooltip content="点击查看大图" placement="bottom">
              <div
                style="display: inline-block; cursor: pointer"
                @click="previewAvatar"
              >
                <el-avatar
                  :size="128"
                  :src="
                    profileStatus === 1
                      ? getImageUrl(profile.avatar)
                      : defaultAvatar
                  "
                  style="background: #409eff; color: #fff"
                />
              </div>
            </el-tooltip>
          </template>
        </div>

        <div class="profile-right">
          <div class="profile-info">
            <h2>{{ profile.account || user.account }}</h2>
          </div>
          <el-tooltip
            :content="getStatusText()"
            placement="bottom"
            effect="dark"
          >
            <div class="profile-signature">
              <el-input
                v-model="profile.description"
                maxlength="50"
                show-word-limit
                placeholder="输入你的个性签名（50字以内）"
                :disabled="true"
              />
            </div>
          </el-tooltip>
          <div
            v-if="profileStatus !== 1"
            style="color: #f56c6c; margin-bottom: 10px"
          >
            资料审核通过后才会显示头像和签名
          </div>
        </div>

        <el-card class="admin-card" shadow="hover" v-if="user.role === 'admin'">
          <h2>管理员功能</h2>
          <div class="admin-actions">
            <router-link to="/admin-users">
              <el-button type="warning" class="profile-btn">用户管理</el-button>
            </router-link>
            <router-link to="/admin-courses">
              <el-button type="warning" class="profile-btn">课题管理</el-button>
            </router-link>
            <router-link to="/review">
              <el-button type="warning" class="profile-btn">成绩管理</el-button>
            </router-link>
            <router-link to="/admin-profiles">
              <el-button type="warning" class="profile-btn">资料审核</el-button>
            </router-link>
          </div>
        </el-card>
      </div>

      <el-divider></el-divider>

      <!-- <div class="profile-actions">
            <router-link to="/score">
              <el-button type="success" class="profile-btn">成绩提交</el-button>
            </router-link>
          </div> -->
    </el-card>

    <el-card class="box-card" shadow="hover" v-else>
      <h2>加载用户信息失败</h2>
      <div class="btnGroup">
        <el-button @click="redirectToLogin" type="primary" size="large"
          >重新登录</el-button
        >
      </div>
    </el-card>

    <!-- 修改资料弹窗 -->
    <el-dialog
      title="修改个人资料"
      v-model="editDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="edit-profile-dialog">
        <el-button @click="triggerFileInput">选择头像</el-button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileChange"
        />

        <!-- AvatarCropper 子组件（确保子组件正确导出） -->
        <avatar-cropper
          v-model:visible="cropperVisible"
          :imgUrl="cropImgUrl"
          @crop="handleAvatarCrop"
        />

        <div style="display: flex; justify-content: center; margin-top: 10px">
          <el-avatar
            :size="64"
            :src="getImageUrl(editProfile.avatar)"
            style="background: #409eff; color: #fff"
          />
        </div>

        <el-input
          v-model="editProfile.description"
          maxlength="50"
          show-word-limit
          placeholder="输入你的个性签名（50字以内）"
          style="margin-top: 16px"
        />
      </div>

      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditProfile"
            >提交审核</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 已完成课题表 -->
    <el-card
      class="box-card"
      shadow="hover"
      v-if="scoredScores.length > 0"
      style="margin-top: 20px"
    >
      <h3>已完成课题及分数</h3>
      <el-table
        :data="scoredScores"
        border
        style="width: 100%; margin-top: 10px"
      >
        <el-table-column prop="course.title" label="课题名称" />
        <el-table-column prop="course.image" label="课题图片" width="120">
          <template v-slot="scope">
            <img
              v-if="scope.row.course && scope.row.course.image"
              :src="getImageUrl(scope.row.course.image)"
              alt="课题图片"
              style="
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 8px;
              "
              @click="previewImage(scope.row.course.image)"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="完成时间" width="180">
          <template v-slot="scope">
            {{
              scope.row.uploadTime
                ? scope.row.uploadTime.replace('T', ' ')
                : '-'
            }}
          </template>
        </el-table-column>
        <el-table-column prop="image" label="成绩图片" width="120">
          <template v-slot="scope">
            <img
              v-if="scope.row.image"
              :src="getImageUrl(scope.row.image)"
              alt="成绩图片"
              style="
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 8px;
              "
              @click="previewImage(scope.row.image)"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="分数" width="100" />
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </el-card>
    <el-collapse
      v-model="activePanels"
      accordion
      @change="onCollapseChange"
      v-if="RatedActivities.length > 0"
    >
      <h3>已参与的活动与分数详情</h3>

      <el-collapse-item
        v-for="activity in RatedActivities"
        :key="activity.id"
        :name="String(activity.id)"
      >
        <!-- 折叠头部 -->
        <template v-slot:title>
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
            "
          >
            <div>{{ activity.title || activity.name }}</div>
            <div style="color: #999; font-size: 12px">
              <span v-if="loadingMap[activity.id]">加载中…</span>
              <span v-else-if="errorMap[activity.id]" style="color: #f56c6c"
                >加载失败</span
              >
            </div>
          </div>
        </template>

        <div class="activity-scores">
          <!-- 根据当前活动 id 从缓存取对应数组（第一次展开时会触发加载） -->
          <div
            v-if="loadingMap[activity.id]"
            style="text-align: center; padding: 16px"
          >
            <span class="spinner" aria-hidden="true"></span> 加载中...
          </div>

          <div
            v-else-if="errorMap[activity.id]"
            style="text-align: center; padding: 12px; color: #f56c6c"
          >
            加载失败：{{ errorMap[activity.id] }}
            <el-button type="text" @click="fetchContestScores(activity.id)"
              >重试</el-button
            >
          </div>

          <el-table
            v-else
            :data="activityScoresMap[activity.id] || []"
            border
            style="width: 100%; margin-top: 10px"
          >
            <el-table-column prop="course.title" label="课题名称" />
            <el-table-column prop="course.image" label="课题图片" width="120">
              <template v-slot="scope">
                <img
                  v-if="scope.row.course && scope.row.course.image"
                  :src="getImageUrl(scope.row.course.image)"
                  alt="课题图片"
                  style="
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 8px;
                  "
                  @click="previewImage(scope.row.course.image)"
                />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="uploadTime" label="完成时间" width="180">
              <template v-slot="scope">
                {{
                  scope.row.uploadTime
                    ? scope.row.uploadTime.replace('T', ' ')
                    : '-'
                }}
              </template>
            </el-table-column>
            <el-table-column prop="image" label="成绩图片" width="120">
              <template v-slot="scope">
                <img
                  v-if="scope.row.image"
                  :src="getImageUrl(scope.row.image)"
                  alt="成绩图片"
                  style="
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 8px;
                  "
                  @click="previewImage(scope.row.image)"
                />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="score"
              label="分数(根据计分规则换算，并非真实分数)"
              width="100"
            />
            <el-table-column prop="remark" label="备注" />
          </el-table>

          <div
            v-if="
              !loadingMap[activity.id] &&
              (!activityScoresMap[activity.id] ||
                !activityScoresMap[activity.id].length)
            "
            style="text-align: center; color: #999; padding: 12px"
          >
            暂无成绩
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 头像预览大图 Dialog -->
    <el-dialog
      v-model="avatarPreviewVisible"
      width="auto"
      :show-close="true"
      center
    >
      <img
        :src="avatarPreviewUrl"
        alt="头像大图"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>

    <el-dialog
      v-model="imagePreviewVisible"
      width="auto"
      :show-close="true"
      center
    >
      <img
        :src="imagePreviewUrl"
        alt="图片预览"
        style="max-width: 90vw; max-height: 80vh; display: block; margin: auto"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { compressImage } from '@/components/imageCompressor'
import AvatarCropper from '@/components/AvatarCropper.vue'
import defaultAvatar from '@/assets/default-avatar.png'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const user = reactive<{ account: string; id: number | null; role: string }>({ account: '', id: null, role: '' })
const profile = reactive<any>({ avatar: '', description: '', status: -1, account: '' })
const profileStatus = ref<number>(-1)
const defaultAvatarRef = defaultAvatar
const editDialogVisible = ref(false)
const editProfile = reactive<{ avatar: string; description: string }>({ avatar: '', description: '' })

// 只保留一个 avatarFileList
const avatarFileList = ref<any[]>([])
const scoredScores = ref<any[]>([])
const contestScores = ref<any[]>([])
const RatedActivities = ref<any[]>([])
const viewUserId = ref<number | null>(null)
const isSelf = ref(false)
const avatarPreviewVisible = ref(false)
const avatarPreviewUrl = ref('')

// 折叠面板相关
const activePanels = ref<string | string[]>('')
const prevActivePanels = ref<any[]>([])

// 缓存每个 activity 的分数数据
const activityScoresMap = reactive<Record<string, any[]>>({})
const loadingMap = reactive<Record<string, boolean>>({})
const errorMap = reactive<Record<string, string | null>>({})

// 裁剪弹窗相关
const cropperVisible = ref(false)
const cropImgUrl = ref<string | null>(null)
const rawAvatarFile = ref<File | null>(null)
const croppedFile = ref<File | null>(null)

const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref('')

const fileInput = ref<HTMLInputElement | null>(null)


// 方法实现
function previewImage(url: string) {
  imagePreviewUrl.value = getImageUrl(url)
  imagePreviewVisible.value = true
}

function handleAvatarUploadSuccess(response: any, file: File | Blob, fileList: any[]) {
  if (response.code === 0) {
    editProfile.avatar = response.data
    avatarFileList.value = fileList
    ElMessage({ message: '头像上传成功', type: 'success' })
  } else {
    ElMessage({ message: '头像上传失败', type: 'error' })
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage({ message: '只能上传 JPG/PNG 图片', type: 'error' })
    return
  }
  rawAvatarFile.value = file
  cropImgUrl.value = URL.createObjectURL(file)
  cropperVisible.value = true
  input.value = ''
}

async function handleAvatarCrop(croppedBlob: Blob) {
  cropperVisible.value = false
  try {
    const compressedFile = await compressImage(croppedBlob)
    croppedFile.value = compressedFile as File
    const formData = new FormData()
    formData.append('avatar', compressedFile)
    formData.append('identityId', String(user.id))
    const res = await axios.post('/api/profile/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    handleAvatarUploadSuccess(res.data, compressedFile as File, [
      { name: '头像', url: res.data.data },
    ])
  } catch (err) {
    console.error(err)
    ElMessage({ message: '裁剪或上传失败', type: 'error' })
  }
  editDialogVisible.value = true
}

function loadProfile() {
  const routeId = route.params.id
  const userInfo = sessionStorage.getItem('userInfo')

  if (routeId) {
    viewUserId.value = parseInt(String(routeId))
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      user.account = parsed.account
      user.id = parsed.id
      user.role = parsed.role
      isSelf.value = user.id == Number(routeId)
    } else {
      isSelf.value = false
    }
  } else if (userInfo) {
    const parsed = JSON.parse(userInfo)
    user.account = parsed.account
    user.id = parsed.id
    user.role = parsed.role
    viewUserId.value = parsed.id
    isSelf.value = true
  } else {
    viewUserId.value = null
    isSelf.value = false
  }

  if (viewUserId.value) {
    fetchProfile()
    fetchScoredScores()
    fetchRatedActivity()
  }
}

function getStatusText() {
  if (profileStatus.value === 0) return '审核中'
  if (profileStatus.value === 1) return '已通过'
  return '未提交'
}

function getImageUrl(imagePath?: string) {
  if (!imagePath) return defaultAvatarRef
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
}

function previewAvatar() {
  avatarPreviewUrl.value = getImageUrl(profile.avatar)
  avatarPreviewVisible.value = true
}

function openEditDialog() {
  editProfile.avatar = profile.avatar
  editProfile.description = profile.description
  avatarFileList.value = profile.avatar ? [{ name: '头像', url: getImageUrl(profile.avatar) }] : []
  editDialogVisible.value = true
}

function handleAvatarRemove(file: any, fileList: any[]) {
  editProfile.avatar = ''
  avatarFileList.value = fileList
}

function logout() {
  sessionStorage.removeItem('userInfo')
  router.push('/login')
}

function redirectToLogin() {
  router.push('/login')
}

function fetchProfile() {
  if (!viewUserId.value) return
  axios.get(`/api/profile/identity/${viewUserId.value}`).then((res) => {
    if (!res.data || res.data.avatar === undefined) {
      profile.avatar = ''
      profile.description = ''
      profile.status = -1
      profile.account = ''
      profileStatus.value = -1
      ElMessage({ message: '该用户尚未完善个人资料', type: 'info' })
      return
    }
    Object.assign(profile, res.data)
    profileStatus.value = res.data.status
  })
}

function submitEditProfile() {
  if (!editProfile.description || editProfile.description.length > 50) {
    ElMessage({ message: '签名不能为空且不能超过50字', type: 'error' })
    return
  }
  axios
    .put(`/api/profile/${user.id}`, {
      avatar: editProfile.avatar,
      description: editProfile.description,
      status: 0,
      identityId: user.id,
    })
    .then(() => {
      ElMessage({ message: '资料已提交审核，请等待管理员处理', type: 'success' })
      editDialogVisible.value = false
      fetchProfile()
    })
}

function onCollapseChange(activeNames: any) {
  const activeArr = Array.isArray(activeNames)
    ? activeNames.map(String)
    : activeNames
    ? [String(activeNames)]
    : []

  const prevArr = Array.isArray(prevActivePanels.value)
    ? prevActivePanels.value.map(String)
    : prevActivePanels.value
    ? [String(prevActivePanels.value)]
    : []

  const newlyOpened = activeArr.filter((name) => !prevArr.includes(name))
  newlyOpened.forEach((name) => {
    const activityId = parseInt(name, 10)
    const activity = RatedActivities.value.find((a) => String(a.id) === name)
    if (activity) {
      fetchContestScores(activity.id)
    }
  })

  prevActivePanels.value = activeArr.slice()
}

function fetchScoredScores() {
  if (!viewUserId.value) return
  axios.get(`/api/score/user-course-scores?identityId=${viewUserId.value}`).then((res) => {
    if (res.data && res.data.code === 0) {
      scoredScores.value = res.data.data || []
    }
  })
}

function fetchRatedActivity() {
  if (!viewUserId.value) return
  axios.get(`/api/activity/rated-activities/${viewUserId.value}`).then((res) => {
    if (res.data) {
      RatedActivities.value = res.data || []
    }
  })
}

async function fetchContestScores(activityId: number) {
  if (!viewUserId.value || !activityId) return
  loadingMap[activityId] = true
  errorMap[activityId] = null
  try {
    const res = await axios.get('/api/score/activity-scores', {
      params: { activityId: activityId, identityId: viewUserId.value },
    })
    let scores: any[] = []
    if (res.data) {
      scores = Array.isArray(res.data) ? res.data : res.data.data || []
    }
    for (let i = 0; i < scores.length; i++) {
      const courseId = scores[i].course && scores[i].course.id
      if (!courseId) continue
      try {
        const ruleRes = await axios.get('/api/activity/rule', {
          params: { activityId: activityId, courseId },
        })
        const rule = ruleRes.data && (ruleRes.data.rule || ruleRes.data)
        if (rule === 'arcaea计分方式') {
          scores[i].score = (scores[i].score || 0) + 10000000
        }
      } catch (e) {
        console.warn('获取计分规则失败，courseId=', courseId, e && e.message)
      }
    }
    activityScoresMap[String(activityId)] = scores
    contestScores.value = scores
  } catch (err: any) {
    const msg = err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message || '加载失败'
    errorMap[activityId] = msg
    activityScoresMap[String(activityId)] = []
    console.error('fetchContestScores 错误:', err)
  } finally {
    loadingMap[activityId] = false
  }
}

onMounted(() => {
  loadProfile()
})

watch(() => route.params.id, () => {
  loadProfile()
})
</script>

<style scoped>
.main-content { margin-top: var(--navbar-height); }
.avatar-uploader { display: flex; flex-direction: column; align-items: center; }
.profile-header { display: flex; align-items: center; margin-bottom: 20px; }
.avatar-select-group { display: flex; flex-direction: column; align-items: center; margin-right: 32px; }
.profile-right { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; margin-top: 16px; }
.profile-info { margin-bottom: 16px; }
.profile-signature { width: 300px; max-width: 100%; margin-bottom: 16px; }
.admin-actions .profile-btn { margin-right: 16px; }
.profile-actions .profile-btn { margin-right: 16px; }
img[alt="课题图片"],
img[alt="成绩图片"] {
  cursor: pointer;
}

/* simple spinner used for loadingMap indicators */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

