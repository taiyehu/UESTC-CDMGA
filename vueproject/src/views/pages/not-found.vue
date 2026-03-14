<template>
  <section class="relative mx-auto max-w-4xl px-4 pb-12 pt-10 md:px-8">
    <div class="not-found-panel text-center">
      <p class="code">404</p>
      <h1 class="title">页面不存在</h1>
      <p class="desc">当前路由无效，{{ countdown }} 秒后将自动返回首页。</p>
      <button type="button" class="back-btn mt-6" @click="goHome">立即返回首页</button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(5)
let timeoutTimer: ReturnType<typeof setTimeout> | null = null
let intervalTimer: ReturnType<typeof setInterval> | null = null

function goHome(): void {
  router.replace('/home')
}

onMounted(() => {
  timeoutTimer = setTimeout(() => {
    goHome()
  }, 5000)

  intervalTimer = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1
    }
  }, 1000)
})

onUnmounted(() => {
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
  if (intervalTimer) {
    clearInterval(intervalTimer)
    intervalTimer = null
  }
})
</script>

<style scoped>
.not-found-panel {
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 16px;
  padding: 32px 20px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.6), rgba(23, 12, 42, 0.52));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
}

.code {
  font-size: clamp(3rem, 9vw, 6rem);
  line-height: 1;
  font-weight: 800;
  color: #a5f3fc;
  text-shadow: 0 0 22px rgba(34, 211, 238, 0.35);
}

.title {
  margin-top: 10px;
  font-size: clamp(1.4rem, 3vw, 2rem);
  color: #e2e8f0;
}

.desc {
  margin-top: 8px;
  color: rgba(207, 250, 254, 0.82);
}

.back-btn {
  border: 1px solid rgba(34, 211, 238, 0.7);
  border-radius: 10px;
  padding: 9px 14px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
}
</style>
