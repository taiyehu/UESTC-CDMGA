<script lang="ts" setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'  // 引入 motion-v

const props = defineProps({
  size: { type: Number, default: 420 },
})

const keyCount = 8
const keyAngle = 18
const gapAngle = 27
const stepAngle = keyAngle + gapAngle

// =============================
// 【按键颜色】你可以在这里调整
// - keyColor：按键色块（18°）的颜色/透明度
// =============================
// 更深、更克制的紫色（降低透明度与“霓虹感”）
const keyColor = 'rgba(147,51,234,0.28)'

// 环形遮罩：按键“嵌入环中”
const ringMask =
  'radial-gradient(circle, transparent 52%, black 53%)'

function keySegmentGradient(index: number) {
  const start = index * stepAngle
  const end = start + keyAngle

  return `conic-gradient(from 0deg,
    transparent 0deg ${start}deg,
    ${keyColor} ${start}deg ${end}deg,
    transparent ${end}deg 360deg
  )`
}

const keyGradients = computed(() =>
  Array.from({ length: keyCount }, (_, i) => keySegmentGradient(i))
)

</script>

<template>
  <Motion
    class="relative pointer-events-none"
    :style="{
      width: size + 'px',
      height: size + 'px'
    }"
    :animate="{
      rotate: '360deg', // 设置旋转动画
    }"
    :transition="{
      duration: 90, // 动画持续时间（越大越慢）
      repeat: Infinity, // 循环
      ease: 'linear',
    }"
  >
    <!-- 霓虹科技环底：轻微发光效果 -->
    <div
      class="absolute inset-0 rounded-full"
      :style="{
        mask: ringMask,
        WebkitMask: ringMask,
        // 【毛玻璃/材质/发光】如果还觉得亮，就继续把这里 alpha 调低
        background:
          'radial-gradient(circle, rgba(147,51,234,0.03) 25%, rgba(147,51,234,0.08) 55%, rgba(147,51,234,0.14) 100%)',
        boxShadow: '0 0 18px rgba(147,51,234,0.14), 0 0 40px rgba(147,51,234,0.18)',
      }"
    />
    
    <!-- 8个按键：色块 / 透明 / 色块 / 透明...（本体不动） -->
    <div
      v-for="(bg, i) in keyGradients"
      :key="`key-${i}`"
      class="absolute inset-0 rounded-full"
      :style="{
        background: bg,
        mask: ringMask,
        WebkitMask: ringMask,
      }"
    />
  </Motion>
</template>