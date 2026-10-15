<template>
  <span class="title-badge" :class="[`title-${tier}`, { 'title-compact': compact }]" :title="acquisitionMethod || '暂无获得方式'" tabindex="0">{{ name }}</span>
</template>

<script lang="ts" setup>
defineProps<{ name: string; tier: string; acquisitionMethod?: string | null; compact?: boolean }>()
</script>

<style scoped>
.title-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(103, 232, 249, 0.5);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
  color: #cffafe;
  background: linear-gradient(120deg, rgba(8, 47, 73, 0.9), rgba(14, 116, 144, 0.55));
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.2), 0 0 14px rgba(34, 211, 238, 0.2);
}
.title-compact { zoom: .5; }

.title-silver {
  color: #f8fafc;
  border-color: #cbd5e1;
  background: linear-gradient(120deg, #475569, #94a3b8, #334155);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.5), 0 0 14px rgba(203, 213, 225, 0.3);
}

.title-gold {
  color: #422006;
  border-color: #fde68a;
  background: linear-gradient(120deg, #b45309, #fef08a, #f59e0b);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.65), 0 0 18px rgba(251, 191, 36, 0.45);
}

.title-color {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.75);
  background: linear-gradient(100deg, #0891b2, #7c3aed, #db2777, #0891b2);
  background-size: 300% 100%;
  animation: title-shimmer 7s linear infinite;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.4), 0 0 20px rgba(217, 70, 239, 0.42);
}

@keyframes title-shimmer {
  to { background-position: 300% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .title-color { animation: none; }
}
</style>
