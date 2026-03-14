<template>
  <div class="rank-table-shell overflow-x-auto rounded-xl bg-slate-900/40">
    <table class="w-full text-cyan-50" :class="[minWidthClass, textSizeClass]">
      <thead class="bg-cyan-300/12">
        <slot name="head" />
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
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
</script>

<style scoped>
.rank-table-shell {
  position: relative;
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
