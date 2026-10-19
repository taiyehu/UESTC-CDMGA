<template>
  <div class="profile-setting-page mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="PROFILE SETTING">
        PROFILE SETTING
      </h1>
    </header>
    <NeonCard class="relative">
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
            <button type="button" class="tab-item mt-2 w-full rounded-xl px-3 py-2 text-left" :class="activeTab === 'titles' ? 'is-active' : ''" @click="activeTab = 'titles'">
              申请称号
            </button>
          </div>
        </aside>

        <section class="relative px-1 md:px-4">
          <div v-if="activeTab === 'info'" class="info-section">
            <div class="edit-card gradient-shell rounded-2xl bg-slate-900/50 p-4 backdrop-blur-xl md:p-5">
              <h3 class="text-xl font-semibold text-cyan-50">编辑个人信息</h3>
              <label class="mt-3 block text-cyan-100/85">头像</label>
              <img class="avatar-image mt-2" :src="previewAvatarUrl || getImageUrl(profile.avatar)" alt="头像预览" />
              <div class="mt-3">
                <NeonActionButton variant="blue" :disabled="saving" @click="triggerFileInput">选择并裁剪头像</NeonActionButton>
                <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFileChange" />
              </div>
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
                <NeonActionButton variant="green" :disabled="saving" @click="submitEditProfile">{{ saving ? '提交中...' : '保存并提交审核' }}</NeonActionButton>
              </div>
            </div>
          </div>
          <div v-else-if="activeTab === 'titles'" class="edit-card gradient-shell rounded-2xl bg-slate-900/50 p-4 backdrop-blur-xl md:p-5">
            <h3 class="text-xl font-semibold text-cyan-50">申请称号</h3>
            <p class="mt-2 text-sm text-cyan-100/75">管理员审核通过后，可在个人界面佩戴。</p>
            <p class="mt-4 text-cyan-100/85">称号文字</p>
            <NeonInput v-model="newTitleName" class="mt-2" :maxlength="32" :show-count="true" placeholder="输入称号文字（32字以内）" />
            <p class="mt-4 text-cyan-100/85">获得方式（选填）</p>
            <NeonInput v-model="acquisitionMethod" class="mt-2" :textarea="true" :maxlength="255" :show-count="true" placeholder="描述这项称号的获得方式" />
            <div class="mt-4">
              <NeonActionButton variant="green" @click="applyTitle">提交申请</NeonActionButton>
            </div>
          </div>
        </section>
      </div>
    </NeonCard>

    <div
      v-if="cropperVisible"
      class="fixed inset-0 z-120 flex items-center justify-center bg-black/70 px-4"
      @click="cropperVisible = false"
    >
      <div class="cropper-modal-shell" @click.stop>
        <div class="cropper-modal-header">
          <h4>裁剪头像</h4>
          <button type="button" class="cropper-close" @click="cropperVisible = false">关闭</button>
        </div>
        <avatar-cropper
          :visible="cropperVisible"
          :imgUrl="cropImgUrl"
          :inline="true"
          @update:visible="cropperVisible = $event"
          @crop="handleAvatarCrop"
        />
      </div>
    </div>
    <div class="mb-4">
      <NeonActionButton @click="router.back()">返回</NeonActionButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { watch } from 'vue'
import { optimizeImage } from '@/utils/compression'
import AvatarCropper from '@/components/AvatarCropper.vue'
import defaultAvatar from '@/assets/default-avatar.png'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonActionButton from '@/components/NeonActionButton.vue'

const router = useRouter()

const user = reactive<{ account: string; id: number | null; role: string }>({
  account: '',
  id: null,
  role: '',
})
const profile = reactive<any>({ avatar: '', description: '', status: -1 })
const editProfile = reactive<{ description: string }>({
  description: '',
})
const newTitleName = ref('')
const acquisitionMethod = ref('')

const route = useRoute()
const activeTab = ref('info')

// set default tab based on query
if (route.query.tab === 'titles') {
  activeTab.value = 'titles'
}

// respond to query changes (in case user navigates back)
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'avatar' || newTab === 'info' || newTab === 'titles') {
      activeTab.value = newTab === 'avatar' ? 'info' : String(newTab)
    }
  }
)

const fileInput = ref<HTMLInputElement | null>(null)
const cropperVisible = ref(false)
const cropImgUrl = ref<string | undefined>(undefined)
const previewAvatarUrl = ref('')
const pendingAvatar = ref<File | null>(null)
const saving = ref(false)

// utility
function getImageUrl(imagePath: string) {
  if (!imagePath) return defaultAvatar
  if (/^https?:\/\//.test(imagePath) || imagePath.startsWith('blob:')) {
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
  if (cropImgUrl.value) URL.revokeObjectURL(cropImgUrl.value)
  cropImgUrl.value = URL.createObjectURL(file)
  cropperVisible.value = true
  input.value = ''
}

async function handleAvatarCrop(croppedBlob: Blob) {
  cropperVisible.value = false
  try {
    pendingAvatar.value = await optimizeImage(croppedBlob, { maxSide: 256, quality: 0.84 })
    if (previewAvatarUrl.value) URL.revokeObjectURL(previewAvatarUrl.value)
    previewAvatarUrl.value = URL.createObjectURL(pendingAvatar.value)
    ElMessage.info('头像已裁剪，请点击保存并提交审核')
  } catch (err) {
    console.error(err)
    ElMessage.error('头像处理失败，请重试')
  }
}

async function submitEditProfile() {
  if (!user.id || saving.value) return
  if (editProfile.description.length > 50) {
    ElMessage({ message: '签名不能超过50字', type: 'error' })
    return
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('description', editProfile.description)
    if (pendingAvatar.value) formData.append('avatar', pendingAvatar.value)
    const response = await axios.put(`/api/profile/${user.id}`, formData)
    if (response.data?.code !== 0) throw new Error(response.data?.message || '提交失败')
    pendingAvatar.value = null
    if (previewAvatarUrl.value) URL.revokeObjectURL(previewAvatarUrl.value)
    previewAvatarUrl.value = ''
    ElMessage.success('资料已提交审核，请等待管理员处理')
    fetchProfile()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || error.message || '资料提交失败')
  } finally {
    saving.value = false
  }
}

async function applyTitle(): Promise<void> {
  if (!newTitleName.value.trim()) {
    ElMessage.warning('请输入称号文字')
    return
  }
  try {
    const response = await axios.post('/api/title/apply', {
      name: newTitleName.value.trim(), acquisitionMethod: acquisitionMethod.value.trim() || null,
    })
    if (response.data?.code !== 0) throw new Error(response.data?.message)
    newTitleName.value = ''
    acquisitionMethod.value = ''
    ElMessage.success('称号申请已提交')
  } catch (error: any) {
    ElMessage.error(error.message || '申请失败')
  }
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
    editProfile.description = res.data.description || ''
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

onUnmounted(() => {
  if (cropImgUrl.value) URL.revokeObjectURL(cropImgUrl.value)
  if (previewAvatarUrl.value) URL.revokeObjectURL(previewAvatarUrl.value)
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

.cropper-modal-shell {
  width: min(92vw, 920px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(11, 27, 49, 0.95);
  backdrop-filter: blur(10px);
  padding: 14px;
}

.cropper-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #d8f3ff;
}

.cropper-close {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  padding: 4px 10px;
}
</style>
