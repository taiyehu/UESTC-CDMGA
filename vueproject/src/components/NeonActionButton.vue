<template>
  <button
    :type="type"
    class="neon-action-btn"
    :class="[`variant-${variant}`, `size-${size}`]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'neon' | 'gray' | 'cyan' | 'green' | 'blue' | 'yellow' | 'gold' | 'red'
    size?: 'sm' | 'md'
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'neon',
    size: 'md',
    disabled: false,
  }
)

defineEmits<{
  (event: 'click', payload: MouseEvent): void
}>()
</script>

<style scoped>
.neon-action-btn {
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
</style>
