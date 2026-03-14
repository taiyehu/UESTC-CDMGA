<template>
  <label class="neon-input-wrap" :class="{ 'is-disabled': disabled }">
    <textarea
      v-if="textarea"
      class="neon-input neon-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      @input="onInput"
    />
    <input
      v-else
      class="neon-input"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :readonly="readonly"
      @input="onInput"
    />
    <span v-if="showCount && typeof maxlength === 'number'" class="count-text">
      {{ (modelValue || '').length }}/{{ maxlength }}
    </span>
  </label>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    maxlength?: number
    textarea?: boolean
    rows?: number
    showCount?: boolean
  }>(),
  {
    placeholder: '',
    disabled: false,
    readonly: false,
    textarea: false,
    rows: 3,
    showCount: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.neon-input-wrap {
  position: relative;
  display: block;
  border: 1px solid transparent;
  border-radius: 12px;
  background: rgba(7, 24, 46, 0.58);
}

.neon-input-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.78), rgba(168, 85, 247, 0.74), rgba(244, 114, 182, 0.78));
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

.neon-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #e0f7ff;
  padding: 10px 12px;
  font-size: 15px;
  outline: none;
}

.neon-input::placeholder {
  color: rgba(207, 250, 254, 0.6);
}

.neon-textarea {
  min-height: 88px;
  resize: vertical;
}

.count-text {
  display: block;
  text-align: right;
  color: rgba(207, 250, 254, 0.72);
  font-size: 12px;
  padding: 0 12px 8px;
}

.is-disabled {
  opacity: 0.78;
}
</style>
