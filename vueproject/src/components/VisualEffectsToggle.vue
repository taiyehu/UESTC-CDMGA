<template>
  <button
    v-if="!isMobileBrowser"
    type="button"
    class="visual-effects-toggle"
    role="switch"
    :aria-checked="!isMobileLite"
    :aria-label="`视觉效果${isMobileLite ? '已关闭' : '已开启'}，点击切换`"
    @click="toggleEffects"
  >
    视觉效果：{{ isMobileLite ? '关' : '开' }}
  </button>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { isMobileBrowser, isMobileLite, toggleDesktopVisualEffects } from '@/utils/visualMode'

const route = useRoute()
const router = useRouter()

function toggleEffects(): void {
  toggleDesktopVisualEffects()
  if (route.query.visual) {
    const query = { ...route.query }
    delete query.visual
    void router.replace({ path: route.path, query, hash: route.hash })
  }
}
</script>

<style scoped>
.visual-effects-toggle {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid rgba(103, 232, 249, 0.5);
  border-radius: 10px;
  background: rgba(8, 47, 73, 0.86);
  color: #ecfeff;
  font: inherit;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.visual-effects-toggle:focus-visible {
  outline: 2px solid #67e8f9;
  outline-offset: 2px;
}
</style>
