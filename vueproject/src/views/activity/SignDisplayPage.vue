<template>
  <section class="mx-auto max-w-3xl px-4 py-8 text-center text-cyan-50">
    <h1 class="mb-4 text-3xl font-bold">现场签到</h1>
    <p class="mb-6">请参加者使用手机登录后扫描下方二维码。每人签到一次，自动获得 10 分。</p>
    <div v-if="error" class="rounded-xl border border-rose-400 p-5 text-rose-200">{{ error }}</div>
    <div v-else class="mx-auto w-fit rounded-2xl bg-white p-5">
      <img v-if="image" :src="image" alt="现场签到动态二维码" class="h-80 w-80 max-w-full" />
      <div v-else class="flex h-80 w-80 items-center justify-center text-slate-600">二维码生成中...</div>
    </div>
    <p class="mt-5 text-cyan-100/80">二维码每 30 秒自动更新，请扫描当前屏幕上的二维码。</p>
    <button class="mt-5 rounded-lg border border-cyan-400 px-4 py-2" @click="router.push(`/activity/${route.params.id}`)">返回活动</button>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const image = ref('')
const error = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

async function refresh() {
  const id = Number(route.params.id)
  if (!Number.isInteger(id) || id <= 0) { error.value = '活动 ID 无效'; return }
  try {
    const response = await axios.get(`/api/sign/qr/${id}`, { params: { origin: window.location.origin } })
    image.value = response.data.data.image
    error.value = ''
    const delay = Math.max(1000, Number(response.data.data.expiresAt) - Date.now() + 100)
    timer = setTimeout(refresh, delay)
  } catch (e: any) {
    image.value = ''
    error.value = e?.response?.data?.message || '二维码生成失败'
    timer = setTimeout(refresh, 5000)
  }
}

onMounted(refresh)
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>
