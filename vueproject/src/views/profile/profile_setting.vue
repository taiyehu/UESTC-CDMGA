<template>
  <div class="app-layout">
    <div class="profile-setting-container">
        <el-row :gutter="20">
        <el-col :span="24" style="margin-bottom: 16px">
            <el-button type="text" icon="el-icon-arrow-left" @click="router.back()">
            返回
            </el-button>
        </el-col>
        <el-col :span="4" class="sidebar">
            <el-menu
            default-active="info"
            @select="activeTab = $event"
            class="el-menu-vertical-demo"
            >
            <el-menu-item index="info">我的信息</el-menu-item>
            <el-menu-item index="avatar">我的头像</el-menu-item>
            </el-menu>
        </el-col>
        <el-col :span="20" class="main-content">
            <div v-if="activeTab === 'info'" class="info-section">
            <el-card shadow="hover">
                <h3>编辑个人信息</h3>
                <el-form ref="infoForm" label-width="80px">
                <el-form-item label="签名">
                    <el-input
                    type="textarea"
                    v-model="editProfile.description"
                    maxlength="50"
                    show-word-limit
                    placeholder="输入你的个性签名（50字以内）"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitEditProfile"
                    >保存</el-button
                    >
                </el-form-item>
                </el-form>
            </el-card>
            </div>

            <div v-else-if="activeTab === 'avatar'" class="avatar-section">
            <el-card shadow="hover">
                <h3>更换头像</h3>
                <div class="current-avatar">
                <el-avatar
                    :size="128"
                    :src="getImageUrl(editProfile.avatar || profile.avatar)"
                    style="background: var(--color-surface); color: var(--color-text-primary); cursor: pointer"
                    @click="activeTab = 'avatar'"
                />
                </div>
                <div class="avatar-controls">
                <el-button @click="triggerFileInput">选择头像</el-button>
                <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="onFileChange"
                />
                </div>
                <!-- inline cropper component -->
                <avatar-cropper
                v-model="cropperVisible"
                :imgUrl="cropImgUrl"
                :inline="true"
                @crop="handleAvatarCrop"
                />
            </el-card>
            </div>
        </el-col>
        </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { watch } from 'vue'
import { compressImage } from '@/components/imageCompressor'
import AvatarCropper from '@/components/AvatarCropper.vue'
import defaultAvatar from '@/assets/default-avatar.png'
import { ElMessage } from 'element-plus'

const router = useRouter()

const user = reactive<{ account: string; id: number | null; role: string }>({
  account: '',
  id: null,
  role: '',
})
const profile = reactive<any>({ avatar: '', description: '', status: -1 })
const editProfile = reactive<{ avatar: string; description: string }>({
  avatar: '',
  description: '',
})

const route = useRoute()
const activeTab = ref('info')

// set default tab based on query
if (route.query.tab === 'avatar') {
  activeTab.value = 'avatar'
}

// respond to query changes (in case user navigates back)
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'avatar' || newTab === 'info') {
      activeTab.value = String(newTab)
    }
  }
)

const fileInput = ref<HTMLInputElement | null>(null)
const cropperVisible = ref(false)
const cropImgUrl = ref<string | undefined>(undefined)

// utility
function getImageUrl(imagePath: string) {
  if (!imagePath) return defaultAvatar
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath
  }
  return imagePath.startsWith('/') ? imagePath : '/' + imagePath
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
  cropImgUrl.value = URL.createObjectURL(file)
  cropperVisible.value = true
  input.value = ''
}

async function handleAvatarCrop(croppedBlob: Blob) {
  cropperVisible.value = false
  try {
    const compressedFile = await compressImage(croppedBlob)
    const formData = new FormData()
    formData.append('avatar', compressedFile)
    formData.append('identityId', String(user.id))
    const res = await axios.post('/api/profile/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (res.data && res.data.code === 0) {
      editProfile.avatar = res.data.data
      ElMessage({ message: '头像上传成功', type: 'success' })
      // 提交审核
      await axios.post('/api/profile/submit-avatar-review', {
        userId: user.id,
        avatar: res.data.data,
      })
      ElMessage({ message: '头像已提交审核', type: 'success' })
    } else {
      ElMessage({ message: '头像上传失败', type: 'error' })
    }
  } catch (err) {
    console.error(err)
    ElMessage({ message: '裁剪或上传失败', type: 'error' })
  }
}

function submitEditProfile() {
  if (!editProfile.description || editProfile.description.length > 50) {
    ElMessage({ message: '签名不能为空且不能超过50字', type: 'error' })
    return
  }
  axios
    .put(`/api/profile/${user.id}`, {
      avatar: editProfile.avatar || profile.avatar,
      description: editProfile.description,
      status: 0,
      identityId: user.id,
    })
    .then(() => {
      ElMessage({ message: '资料已提交审核，请等待管理员处理', type: 'success' })
      fetchProfile()
    })
}

function fetchProfile() {
  if (!user.id) return
  axios.get(`/api/profile/identity/${user.id}`).then((res) => {
    if (!res.data || res.data.avatar === undefined) {
      profile.avatar = ''
      profile.description = ''
      profile.status = -1
      ElMessage({ message: '尚未完善个人资料', type: 'info' })
      return
    }
    Object.assign(profile, res.data)
    // initialize editProfile
    editProfile.avatar = res.data.avatar
    editProfile.description = res.data.description
  })
}

onMounted(() => {
  const userInfo = sessionStorage.getItem('userInfo')
  if (userInfo) {
    const parsed = JSON.parse(userInfo)
    user.account = parsed.account
    user.id = parsed.id
    user.role = parsed.role
    fetchProfile()
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.profile-setting-container {
  padding: 20px;
}
.sidebar {
  border-right: 1px solid #ebeef5;
  height: 100%;
}
.main-content {
  padding: 0 20px;
}
.current-avatar {
  margin-bottom: 16px;
}
.avatar-controls {
  margin-bottom: 16px;
}
</style>
