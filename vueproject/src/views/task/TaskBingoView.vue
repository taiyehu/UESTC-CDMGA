<template>
  <article class="space-y-5">
    <header class="task-panel text-left">
      <p class="task-category">bingo</p>
      <h1 class="task-title">{{ course.title }}</h1>
      <p class="task-time">持续时间：{{ duration }}</p>
      <p class="task-content">{{ course.description || '暂无课题内容。' }}</p>
    </header>

    <section class="task-panel">
      <h2 class="mb-4 text-left text-lg font-semibold text-cyan-100">BINGO 5 x 5</h2>
      <div class="grid grid-cols-5 gap-2 md:gap-3">
        <button
          v-for="cellId in cells"
          :key="cellId"
          type="button"
          class="bingo-cell"
          @click="goCell(cellId)"
        >
          B-{{ String(cellId).padStart(2, '0') }}
        </button>
      </div>
    </section>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Course } from '@/api/types'
import { formatDuration } from './task-utils'

const props = defineProps<{ course: Course }>()
const router = useRouter()

const duration = computed(() => formatDuration(props.course.startTime, props.course.endTime))
const cells = Array.from({ length: 25 }, (_, index) => index + 1)

function goCell(cellId: number) {
  router.push(`/task/${props.course.id}/bingo/${cellId}`)
}
</script>

<style scoped>
.task-panel {
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 16px;
  padding: 18px;
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.5), rgba(76, 29, 149, 0.22));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 20px rgba(34, 211, 238, 0.12);
}

.task-category {
  margin-bottom: 6px;
  font-size: 12px;
  text-transform: uppercase;
  color: rgba(34, 211, 238, 0.9);
}

.task-title {
  font-size: clamp(1.4rem, 2vw, 2rem);
  color: #e0f2fe;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.4);
}

.task-time {
  margin-top: 6px;
  color: rgba(186, 230, 253, 0.85);
}

.task-content {
  margin-top: 12px;
  line-height: 1.72;
  color: rgba(236, 254, 255, 0.9);
}

.bingo-cell {
  min-height: 72px;
  border-radius: 10px;
  border: 1px solid rgba(34, 211, 238, 0.55);
  background:
    linear-gradient(145deg, rgba(5, 46, 70, 0.75), rgba(88, 28, 135, 0.55)),
    repeating-linear-gradient(
      to right,
      rgba(255, 255, 255, 0.05),
      rgba(255, 255, 255, 0.05) 1px,
      transparent 2px,
      transparent 6px
    );
  color: #cffafe;
  font-weight: 700;
  letter-spacing: 0.06em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bingo-cell:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 16px rgba(34, 211, 238, 0.45),
    0 0 22px rgba(217, 70, 239, 0.22);
}
</style>
