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
    if (response.data?.code !== 0 || !response.data?.data) {
      throw new Error(response.data?.message || '签到接口返回了无效结果，请联系管理员')
    }
    success.value = true
    message.value = response.data.data.alreadyCheckedIn ? '您已完成本次活动签到，无需重复签到。' : '签到成功，已自动获得 10 分！'
  } catch (e: any) {
    const status = e?.response?.status
    const serverMessage = e?.response?.data?.message
    if (status === 401) message.value = '登录状态已失效，请重新登录后扫描现场二维码'
    else if (status === 404) message.value = '服务器尚未部署签到接口，请联系管理员'
    else if (status >= 500) message.value = serverMessage || '服务器未能保存签到成绩，请联系管理员检查服务日志'
    else if (serverMessage) message.value = serverMessage
    else if (!e?.isAxiosError && e?.message) message.value = e.message
    else if (!e?.response) message.value = '无法连接签到服务，请检查网络后重新扫描'
    else message.value = e?.message || '签到失败，请联系管理员'
  } finally {
    loading.value = false
  }
})
</script>
