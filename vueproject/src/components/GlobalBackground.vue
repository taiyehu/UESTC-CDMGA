<script setup>
import { Motion } from "motion-v"
</script>

<template>
  <div class="fixed inset-0 -z-10 overflow-hidden">

    <!-- 第一层：深色底 -->
    <div
      class="absolute inset-0
             bg-gradient-to-br
             from-[#120018]
             via-[#0e0f1a]
             to-[#050912]"
    />

    <!-- 第二层：流动彩雾 -->
    <Motion
      class="absolute inset-0
             bg-gradient-to-r
             from-cyan-900/30
             via-purple-900/30
             to-pink-900/30
             blur-3xl"
      :animate="{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }"
      :transition="{
        duration: 14,
        repeat: Infinity,
        easing: 'linear'
      }"
      style="background-size: 200% 200%;"
    />

    <!-- 第三层：超慢旋转光环 -->
    <Motion
      class="absolute w-[1200px] h-[1200px]
             rounded-full border border-cyan-500/10"
      style="top:-400px; right:-400px;"
      :animate="{ rotate: 360 }"
      :transition="{
        duration: 120,
        repeat: Infinity,
        easing: 'linear'
      }"
    />

  </div>
</template>