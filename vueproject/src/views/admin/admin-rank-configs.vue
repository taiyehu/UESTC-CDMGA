<template>
  <section class="panel-wrap">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 class="panel-title">排行榜配置管理</h2>
      <p class="text-sm text-cyan-100/80">显示分 = 原始 score + counting_rules</p>
    </header>

    <div class="panel-card mb-4">
      <div class="grid gap-3 md:grid-cols-4">
        <label class="field">
          <span>类别</span>
          <select v-model="category" class="field-input" @change="handleCategoryChange">
            <option value="ranking">ranking</option>
            <option value="contest">contest</option>
          </select>
        </label>
        <label class="field md:col-span-2">
          <span>课题</span>
          <select v-model.number="courseId" class="field-input">
            <option :value="0">请选择课题</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
        </label>
        <label class="field">
          <span>counting_rules</span>
          <input v-model.number="countingRules" type="number" step="0.01" class="field-input" />
        </label>
      </div>
      <div class="mt-3">
        <NeonActionButton @click="saveConfig">保存配置</NeonActionButton>
      </div>
    </div>

    <div class="panel-card overflow-x-auto">
      <table class="w-full min-w-160 text-sm text-cyan-50">
        <thead>
          <tr class="border-b border-cyan-300/30">
            <th class="px-3 py-2 text-left">ID</th>
            <th class="px-3 py-2 text-left">类别</th>
            <th class="px-3 py-2 text-left">课题</th>
            <th class="px-3 py-2 text-left">counting_rules</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in configs" :key="row.id" class="border-b border-white/10">
            <td class="px-3 py-2">{{ row.id }}</td>
            <td class="px-3 py-2">{{ row.category }}</td>
            <td class="px-3 py-2">{{ row.courseTitle }}</td>
            <td class="px-3 py-2">{{ row.countingRules }}</td>
          </tr>
          <tr v-if="!configs.length">
            <td colspan="4" class="px-3 py-6 text-center text-cyan-100/70">暂无配置</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { fetchCourseData } from '@/api/course'
import NeonActionButton from '@/components/NeonActionButton.vue'

interface CourseRow {
  id: number
  title: string
  category: string
}

const category = ref<'ranking' | 'contest'>('ranking')
const courseId = ref<number>(0)
const countingRules = ref<number>(0)
const courses = ref<CourseRow[]>([])
const configs = ref<any[]>([])

async function loadCourses(): Promise<void> {
  try {
    const res = await fetchCourseData()
    const list: CourseRow[] = res.data || []
    courses.value = list.filter((row) => (row.category || '').toLowerCase() === category.value)
    courseId.value = 0
  } catch (e) {
    ElMessage({ message: '获取课题失败', type: 'error' })
  }
}

async function loadConfigs(): Promise<void> {
  try {
    const res = await axios.get('/api/rank/configs')
    configs.value = (res.data.data || []).filter((row: any) => (row.category || '').toLowerCase() === category.value)
  } catch (e) {
    ElMessage({ message: '获取配置失败', type: 'error' })
  }
}

async function saveConfig(): Promise<void> {
  if (!courseId.value) {
    ElMessage({ message: '请选择课题', type: 'warning' })
    return
  }
  try {
    await axios.post('/api/rank/config', {
      courseId: courseId.value,
      countingRules: countingRules.value,
    })
    ElMessage({ message: '保存成功', type: 'success' })
    await loadConfigs()
  } catch (e) {
    ElMessage({ message: '保存失败', type: 'error' })
  }
}

async function handleCategoryChange(): Promise<void> {
  await loadCourses()
  await loadConfigs()
}

onMounted(async () => {
  await loadCourses()
  await loadConfigs()
})
</script>

<style scoped>
.panel-wrap {
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 12px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.45);
}

.panel-title {
  font-size: 20px;
  color: #cffafe;
  font-weight: 700;
}

.panel-card {
  border: 1px solid rgba(34, 211, 238, 0.25);
  border-radius: 10px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #dbeafe;
  font-size: 13px;
}

.field-input {
  border: 1px solid rgba(34, 211, 238, 0.35);
  border-radius: 8px;
  padding: 8px 10px;
  color: #e0f2fe;
  background: rgba(15, 23, 42, 0.7);
}
</style>
