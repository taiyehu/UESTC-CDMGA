<template>
  <section class="mx-auto max-w-xl px-4 py-12 text-center text-cyan-50">
    <h1 class="mb-5 text-3xl font-bold">活动现场签到</h1>
    <div class="rounded-xl border border-cyan-400/40 bg-slate-900/70 p-8">
      <p v-if="loading">正在核验签到码...</p>
      <p v-else :class="success ? 'text-emerald-300' : 'text-rose-300'">{{ message }}</p>
    </div>
    <button class="mt-6 rounded-lg border border-cyan-400 px-4 py-2" @click="router.push(`/activity/${route.params.activityId}`)">返回活动</button>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const success = ref(false)
const message = ref('')

onMounted(async () => {
  const activityId = Number(route.params.activityId)
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  window.history.replaceState(window.history.state, '', route.path)
  if (!Number.isInteger(activityId) || activityId <= 0 || !token) {
    message.value = '签到码无效，请重新扫描现场二维码'
    loading.value = false
    return
  }
  try {
    const response = await axios.post('/api/sign/checkin', { activityId, token })
    success.value = true
    message.value = response.data.data.alreadyCheckedIn ? '您已完成本次活动签到，无需重复签到。' : '签到成功，已自动获得 10 分！'
  } catch (e: any) {
    message.value = e?.response?.data?.message || '签到失败，请重新扫描现场二维码'
  } finally {
    loading.value = false
  }
})
</script>
