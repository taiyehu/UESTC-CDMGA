<template>
  <button
    :type="type"
    class="neon-action-btn"
    :class="[`variant-${variant}`, `size-${size}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="loading-dot" aria-hidden="true" />
    <slot />
  </button>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'neon' | 'gray' | 'cyan' | 'green' | 'blue' | 'yellow' | 'gold' | 'red' | 'violet' | 'auth-primary' | 'auth-secondary' | 'profile-outline'
    size?: 'sm' | 'md'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    type: 'button',
    variant: 'neon',
    size: 'md',
    disabled: false,
    loading: false,
  }
)

defineEmits<{
  (event: 'click', payload: MouseEvent): void
}>()
</script>

<style scoped>
.neon-action-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(34, 211, 238, 0.65);
  border-radius: 10px;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
  transition: box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease;
}

.neon-action-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 18px rgba(217, 70, 239, 0.18);
}

.neon-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: none;
}

.size-md {
  padding: 8px 14px;
}

.size-sm {
  padding: 6px 10px;
  border-radius: 8px;
}

.variant-cyan {
  border-color: rgba(34, 211, 238, 0.65);
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
}

.variant-neon {
  border-color: rgba(34, 211, 238, 0.65);
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
}

.variant-gray {
  border-color: rgba(148, 163, 184, 0.55);
  color: rgba(226, 232, 240, 0.92);
  background: rgba(51, 65, 85, 0.52);
}

.variant-green {
  border-color: rgba(16, 185, 129, 0.7);
  color: #d1fae5;
  background: rgba(6, 78, 59, 0.55);
}

.variant-blue {
  border-color: rgba(56, 189, 248, 0.7);
  color: #bae6fd;
  background: rgba(12, 74, 110, 0.6);
}

.variant-yellow {
  border-color: rgba(251, 191, 36, 0.7);
  color: #fde68a;
  background: rgba(120, 53, 15, 0.5);
}

.variant-gold {
  border-color: rgba(251, 191, 36, 0.8);
  color: #fff8d6;
  background: linear-gradient(145deg, rgba(245, 193, 49, 0.74), rgba(213, 154, 18, 0.62));
}

.variant-red {
  border-color: rgba(248, 113, 113, 0.62);
  color: #fecaca;
  background: rgba(127, 29, 29, 0.52);
}

.variant-violet {
  border-color: rgba(196, 181, 253, 0.72);
  color: #f3e8ff;
  background: linear-gradient(145deg, rgba(147, 51, 234, 0.52), rgba(126, 34, 206, 0.44));
}

.variant-auth-primary {
  border-color: rgba(132, 223, 255, 0.5);
  color: #f6fdff;
  text-shadow: 0 0 8px rgba(199, 234, 255, 0.38);
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.64), rgba(147, 51, 234, 0.58), rgba(244, 114, 182, 0.64));
  box-shadow:
    inset 0 0 0 1px rgba(232, 250, 255, 0.12),
    0 0 14px rgba(56, 189, 248, 0.18),
    0 0 24px rgba(217, 70, 239, 0.15);
}

.variant-auth-secondary {
  border-color: rgba(139, 212, 255, 0.38);
  color: rgba(227, 242, 255, 0.94);
  background: rgba(19, 48, 86, 0.62);
}

.variant-profile-outline {
  border-color: transparent;
  color: #cffafe;
  background: rgba(8, 47, 73, 0.58);
}

.variant-profile-outline::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.86), rgba(168, 85, 247, 0.82), rgba(244, 114, 182, 0.88));
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

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.42);
  border-top-color: rgba(255, 255, 255, 0.95);
  animation: btn-spin 0.7s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
