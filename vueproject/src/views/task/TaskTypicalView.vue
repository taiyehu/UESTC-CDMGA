<template>
  <article class="space-y-5">
    <header class="task-panel text-left">
      <p class="task-category">typical</p>
      <h1 class="task-title">{{ course.title }}</h1>
      <p class="task-time">持续时间：{{ duration }}</p>
      <p class="task-content">{{ course.description || '暂无课题内容。' }}</p>
      <div class="mt-4">
        <TaskScoreAction :course="course" />
      </div>
    </header>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Motion
        v-for="item in items"
        :key="item.id"
        class="subtask-card"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.3, delay: item.id * 0.04 }"
      >
        <div class="subtask-cover" :style="getCoverStyle(item.image)" />
        <div class="p-4 text-left">
          <p class="subtask-level">难度：{{ item.level }}</p>
          <h3 class="subtask-title">#{{ item.id }} {{ item.title }}</h3>
          <p class="subtask-desc">{{ item.description }}</p>
        </div>
      </Motion>
    </section>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'
import type { Course } from '@/api/types'
import { formatDuration, parseTypicalItems, toImageUrl } from './task-utils'
import TaskScoreAction from '@/components/TaskScoreAction.vue'

const props = defineProps<{ course: Course }>()

const duration = computed(() => formatDuration(props.course.startTime, props.course.endTime))
const items = computed(() => parseTypicalItems(props.course))

function getCoverStyle(image?: string) {
  const imageUrl = toImageUrl(image)
  if (!imageUrl) {
    return {
      backgroundImage:
        'linear-gradient(135deg, rgba(34,211,238,0.28), rgba(217,70,239,0.20))',
    }
  }
  return {
    backgroundImage: `url(${imageUrl})`,
  }
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

.subtask-card {
  border-radius: 14px;
  border: 1px solid rgba(34, 211, 238, 0.25);
  background: rgba(17, 24, 39, 0.5);
  overflow: hidden;
  box-shadow: 0 0 16px rgba(34, 211, 238, 0.12);
}

.subtask-cover {
  height: 128px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.subtask-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.55));
}

.subtask-level {
  font-size: 12px;
  color: rgba(165, 243, 252, 0.85);
}

.subtask-title {
  margin-top: 6px;
  font-size: 16px;
  color: #e0f2fe;
}

.subtask-desc {
  margin-top: 8px;
  min-height: 48px;
  color: rgba(207, 250, 254, 0.85);
  line-height: 1.65;
}
</style>
