<template>
  <component :is="as" class="neon-card" :class="paddingClass">
    <slot />
  </component>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    as?: string
    paddingClass?: string
  }>(),
  {
    as: 'div',
    paddingClass: 'p-4 md:p-6',
  }
)
</script>

<style scoped>
.neon-card {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}

.neon-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.9), rgba(168, 85, 247, 0.86), rgba(244, 114, 182, 0.9));
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
