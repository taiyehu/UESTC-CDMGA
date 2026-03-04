<template>
  <div class="fixed inset-0 -z-10 overflow-visible">

    <!-- ① 深色渐变基底（整体更暗但不死黑） -->
    <div
      class="absolute inset-0"
      style="
        background: linear-gradient(
          135deg,
          #120018 0%,
          #0e0f1a 40%,
          #050912 100%
        );
      "
    />

    <!-- ② 左上角冷紫光晕（局部，不脏） -->
    <Motion
      class="absolute w-225 h-225 rounded-full"
      style="
        top:-350px;
        left:-350px;
        background: radial-gradient(
          circle,
          rgba(168,85,247,0.18) 0%,
          rgba(168,85,247,0.08) 35%,
          transparent 70%
        );
      "
      :animate="{ scale: [1, 1.05, 1] }"
      :transition="{ duration: 12, repeat: Infinity }"
    />

    <!-- ③ 右下角冷青光晕 -->
    <Motion
      class="absolute w-250 h-250 rounded-full"
      style="
        bottom:-400px;
        right:-400px;
        background: radial-gradient(
          circle,
          rgba(34,211,238,0.15) 0%,
          rgba(34,211,238,0.06) 35%,
          transparent 70%
        );
      "
      :animate="{ scale: [1, 1.08, 1] }"
      :transition="{ duration: 16, repeat: Infinity }"
    />

    <!-- ④ 右上角大 MaimaiRing（不旋转；呼吸由按键光晕提供） -->
    <div class="fixed top-40 right-40 pointer-events-none">
      <MaimaiRing :size="500" />
    </div>

    <div class="fixed bottom-10 left-40 pointer-events-none">
      <MaimaiRing :size="450" />
    </div>


    <!-- ⑥ 轻微暗角（聚焦中间） -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="
        background: radial-gradient(
          1200px circle at center,
          rgba(0,0,0,0) 0%,
          rgba(0,0,0,0) 55%,
          rgba(0,0,0,0.14) 72%,
          rgba(0,0,0,0.26) 88%,
          rgba(0,0,0,0.32) 100%
        );
      "
    />

  </div>
</template>

<script lang="ts" setup>
import { MaimaiRing } from '@/components/effects'
import { Motion } from 'motion-v'
</script>