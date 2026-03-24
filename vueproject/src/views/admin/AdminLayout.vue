<template>
  <section class="admin-layout-wrap">
    <el-container class="admin-shell">
      <el-aside width="220px" class="admin-aside">
        <div class="admin-title">管理后台</div>
        <el-menu
          class="admin-menu"
          :default-active="activePath"
          router
          background-color="transparent"
          text-color="#dbeafe"
          active-text-color="#22d3ee"
        >
          <el-menu-item index="/admin/users">用户管理</el-menu-item>
          <el-menu-item index="/admin/courses">课题管理</el-menu-item>
          <el-menu-item index="/admin/content-publish">发布内容</el-menu-item>
          <el-menu-item index="/admin/scores">成绩管理</el-menu-item>
          <el-menu-item index="/admin/score-logs">成绩日志</el-menu-item>
          <el-menu-item index="/admin/bingo-submissions">Bingo提交管理</el-menu-item>
          <el-menu-item index="/admin/bingo-tips">Bingo提示管理</el-menu-item>
          <el-menu-item index="/admin/issues">Issue管理</el-menu-item>
          <el-menu-item index="/admin/teams">队伍管理</el-menu-item>
          <el-menu-item index="/admin/profiles">资料审核</el-menu-item>
          <el-menu-item index="/admin/profiles-passed">已通过资料</el-menu-item>
          <el-menu-item index="/admin/activities">活动管理</el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activePath = computed(() => {
  if (route.path.startsWith('/admin/content-publish')) return '/admin/content-publish'
  if (route.path.startsWith('/admin/courses-publish')) return '/admin/content-publish'
  if (route.path.startsWith('/admin/activities-publish')) return '/admin/content-publish'
  if (route.path.startsWith('/admin/issues')) return '/admin/issues'
  if (route.path.startsWith('/admin/teams')) return '/admin/teams'
  if (route.path.startsWith('/admin/bingo-tips')) return '/admin/bingo-tips'
  return route.path
})
</script>

<style scoped>
.admin-layout-wrap {
  margin-top: calc(var(--navbar-height) + 12px);
  padding: 0 16px 16px;
}

.admin-shell {
  min-height: calc(100vh - var(--navbar-height) - 24px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.2);
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
}

.admin-aside {
  border-right: 1px solid rgba(34, 211, 238, 0.2);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.9));
}

.admin-title {
  padding: 16px 14px;
  font-size: 18px;
  font-weight: 700;
  color: #e0f2fe;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.admin-menu {
  border-right: none;
}

:deep(.el-menu-item) {
  font-weight: 600;
}

.admin-main {
  padding: 18px;
}

@media (max-width: 900px) {
  .admin-shell {
    display: block;
  }

  .admin-aside {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid rgba(34, 211, 238, 0.2);
  }
}
</style>
