<template>
  <div class="admin-inner-nav mb-5 flex flex-wrap items-center gap-2">
    <router-link
      v-for="item in adminLinks"
      :key="item.to"
      :to="item.to"
      class="admin-nav-btn"
      :class="{ 'is-active': route.path === item.to }"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const adminLinks = [
  { label: '用户管理', to: '/admin-users' },
  { label: '课题管理', to: '/admin-courses' },
  { label: '成绩管理', to: '/admin-scores' },
  { label: '资料审核', to: '/admin-profiles' },
  { label: '活动管理', to: '/admin-activities' },
]
</script>

<style scoped>
.admin-nav-btn {
  border-radius: 6px;
  background: rgb(147 51 234);
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  transition: background-color 0.2s ease;
}

.admin-nav-btn:hover {
  background: rgb(126 34 206);
}

.admin-nav-btn.is-active {
  background: rgb(109 40 217);
}
</style>
