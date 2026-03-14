<template>
  <article class="space-y-5">
    <header class="task-panel text-left">
      <p class="task-category">{{ categoryLabel }}</p>
      <h1 class="task-title">{{ course.title }}</h1>
      <p class="task-time">持续时间：{{ duration }}</p>
      <p class="task-content">{{ course.description || '暂无课题内容。' }}</p>
      <div v-if="showScoreAction" class="mt-4">
        <TaskScoreAction :course="course" />
      </div>
    </header>

    <Motion
      class="task-panel overflow-hidden"
      :initial="{ opacity: 0, y: 14 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4 }"
    >
      <div class="legacy-image-wrap">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="course.title"
          class="legacy-image"
        />
        <div v-else class="legacy-empty">该课题尚未上传图片</div>
      </div>
    </Motion>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Motion } from 'motion-v'
import type { Course } from '@/api/types'
import { formatDuration, toImageUrl } from './task-utils'
import TaskScoreAction from '@/components/TaskScoreAction.vue'

const props = withDefaults(
  defineProps<{
    course: Course
    showScoreAction?: boolean
    categoryLabel?: string
  }>(),
  {
    showScoreAction: true,
    categoryLabel: 'legacy',
  }
)

const duration = computed(() => formatDuration(props.course.startTime, props.course.endTime))
const imageUrl = computed(() => toImageUrl(props.course.image))
const categoryLabel = computed(() => props.categoryLabel)
const showScoreAction = computed(() => props.showScoreAction)
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

.legacy-image-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  padding: 10px;
  min-height: 280px;
  background: radial-gradient(circle at 50% 50%, rgba(126, 34, 206, 0.24), rgba(17, 24, 39, 0.72) 70%);
}

.legacy-image-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 58%, rgba(147, 51, 234, 0.36) 100%);
}

.legacy-image-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(34, 211, 238, 0.07), rgba(217, 70, 239, 0.15)),
    repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.05),
      rgba(255, 255, 255, 0.05) 1px,
      transparent 2px,
      transparent 5px
    );
}

.legacy-image {
  width: 100%;
  height: min(65vh, 640px);
  object-fit: contain;
}

.legacy-empty {
  min-height: 280px;
  display: grid;
  place-items: center;
  color: rgba(165, 243, 252, 0.76);
}
</style>
