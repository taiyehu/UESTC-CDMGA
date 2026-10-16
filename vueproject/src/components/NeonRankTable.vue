<template>
  <div class="rank-table-wrap">
    <div
      ref="scroller"
      class="rank-table-shell overflow-x-auto rounded-xl bg-slate-900/40"
      @scroll="updateScrollHint"
    >
      <table class="w-full text-cyan-50" :class="[minWidthClass, textSizeClass]">
        <thead class="bg-cyan-300/12">
          <slot name="head" />
        </thead>
        <tbody>
          <slot />
        </tbody>
      </table>
    </div>
    <!-- 窄屏溢出提示：左右渐隐 + 文案 -->
    <div v-if="overflow" class="scroll-fade-left" :class="{ 'is-hidden': atStart }" aria-hidden="true" />
    <div v-if="overflow" class="scroll-fade-right" :class="{ 'is-hidden': atEnd }" aria-hidden="true" />
    <p v-if="overflow" class="scroll-tip">← 左右滑动查看全部 {{ columnCount }} 列 →</p>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'

withDefaults(
  defineProps<{
    minWidthClass?: string
    textSizeClass?: string
  }>(),
  {
    minWidthClass: 'min-w-160',
    textSizeClass: 'text-lg',
  }
)

const scroller = ref<HTMLElement | null>(null)
const overflow = ref(false)
const atStart = ref(true)
const atEnd = ref(false)
const columnCount = ref(0)

function measure() {
  const el = scroller.value
  if (!el) return
  const table = el.querySelector('table')
  columnCount.value = table ? table.querySelectorAll('thead th').length : 0
  overflow.value = el.scrollWidth > el.clientWidth + 1
  updateScrollHint()
}

function updateScrollHint() {
  const el = scroller.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft >= max - 1
  // 内容能放下时不再提示
  if (max <= 1) overflow.value = false
  else overflow.value = true
}

let ro: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  measure()
  ro = new ResizeObserver(() => measure())
  if (scroller.value) ro.observe(scroller.value)
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<style scoped>
.rank-table-wrap {
  position: relative;
  text-align: left;
}

.rank-table-shell {
  position: relative;
  scrollbar-width: thin;
}

.scroll-fade-left,
.scroll-fade-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  pointer-events: none;
  z-index: 2;
  transition: opacity 0.2s ease;
}

.scroll-fade-left {
  left: 0;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  background: linear-gradient(to right, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0));
}

.scroll-fade-right {
  right: 0;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  background: linear-gradient(to left, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0));
}

.scroll-fade-left.is-hidden,
.scroll-fade-right.is-hidden {
  opacity: 0;
}

.scroll-tip {
  margin: 8px 0 0;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: rgba(224, 247, 255, 0.6);
  text-align: center;
}

:deep(thead th) {
  color: rgba(224, 247, 255, 0.95);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.rank-table-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.7), rgba(168, 85, 247, 0.68), rgba(244, 114, 182, 0.72));
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
</style>
