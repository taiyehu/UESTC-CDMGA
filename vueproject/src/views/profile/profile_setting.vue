<template>
  <div class="profile-setting-page mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="PROFILE SETTING">
        PROFILE SETTING
      </h1>
    </header>
    <NeonCard class="relative">
      <div class="mb-4">
        <button type="button" class="neon-button" @click="router.back()">返回</button>
      </div>

      <div class="settings-grid">
        <aside class="relative pr-2 md:pr-4">
          <div class="menu-shell rounded-2xl bg-slate-900/50 backdrop-blur-xl p-2">
            <button
              type="button"
              class="tab-item w-full rounded-xl px-3 py-2 text-left"
              :class="activeTab === 'info' ? 'is-active' : ''"
              @click="activeTab = 'info'"
            >
              我的信息
            </button>
            <button
              type="button"
              class="tab-item mt-2 w-full rounded-xl px-3 py-2 text-left"
              :class="activeTab === 'avatar' ? 'is-active' : ''"
              @click="activeTab = 'avatar'"
            >
              我的头像
            </button>
          </div>
        </aside>

        <section class="relative px-1 md:px-4">
          <div v-if="activeTab === 'info'" class="info-section">
            <div class="edit-card gradient-shell rounded-2xl bg-slate-900/50 p-4 backdrop-blur-xl md:p-5">
              <h3 class="text-xl font-semibold text-cyan-50">编辑个人信息</h3>
              <label class="mt-3 block text-cyan-100/85">签名</label>
              <NeonInput
                v-model="editProfile.description"
                class="mt-2"
                :textarea="true"
                :maxlength="50"
                :show-count="true"
                placeholder="输入你的个性签名（50字以内）"
              />
              <div class="mt-4">
                <button type="button" class="neon-button" @click="submitEditProfile">保存</button>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'avatar'" class="avatar-section">
            <div class="edit-card gradient-shell rounded-2xl bg-slate-900/50 p-4 backdrop-blur-xl md:p-5">
              <h3 class="text-xl font-semibold text-cyan-50">更换头像</h3>
              <div class="mb-4">
                <img
                  class="avatar-image"
                  :src="getImageUrl(editProfile.avatar || profile.avatar)"
                  alt="头像预览"
                  @click="activeTab = 'avatar'"
                />
              </div>
              <div class="mb-4">
                <button type="button" class="neon-button" @click="triggerFileInput">选择头像</button>
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
            </div>
          </div>
        </section>
      </div>
    </NeonCard>
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
import NeonCard from '@/components/NeonCard.vue'
import NeonInput from '@/components/NeonInput.vue'

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
.glitch-title {
  position: relative;
  display: inline-block;
  letter-spacing: 0.12em;
  line-height: 1;
  background-image: linear-gradient(135deg, #22d3ee 0%, #9333ea 40%, #c026d3 62%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 16px rgba(139, 92, 246, 0.38);
}

.profile-setting-page {
  font-size: 16px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .settings-grid {
    grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
    gap: 18px;
  }
}

.neon-button {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.neon-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.86), rgba(168, 85, 247, 0.82), rgba(244, 114, 182, 0.88));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.tab-item {
  color: rgba(207, 250, 254, 0.92);
  border: 1px solid transparent;
  transition: background-color 0.2s ease;
}

.tab-item.is-active {
  background: rgba(34, 211, 238, 0.2);
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glitch-title::before {
  color: rgba(34, 211, 238, 0.45);
  transform: translateX(1px);
  clip-path: polygon(0 4%, 100% 0, 100% 38%, 0 42%);
}

.glitch-title::after {
  color: rgba(192, 38, 211, 0.82);
  transform: translateX(-1px);
  clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 96%);
}

.menu-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.menu-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.8), rgba(168, 85, 247, 0.76), rgba(244, 114, 182, 0.8));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.gradient-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.gradient-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.78), rgba(168, 85, 247, 0.74), rgba(244, 114, 182, 0.78));
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.avatar-image {
  width: 128px;
  height: 128px;
  object-fit: cover;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
}
</style>
