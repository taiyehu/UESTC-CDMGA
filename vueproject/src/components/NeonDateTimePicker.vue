<template>
  <div class="picker-wrap">
    <el-date-picker
      :model-value="modelValue"
      type="datetime"
      :placeholder="placeholder"
      value-format="YYYY-MM-DDTHH:mm:ss"
      format="YYYY-MM-DD HH:mm:ss"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue: string | null
    placeholder?: string
  }>(),
  {
    modelValue: null,
    placeholder: '请选择时间',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

function onUpdate(value: string | null): void {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.picker-wrap {
  position: relative;
  border-radius: 12px;
  background: rgba(7, 24, 46, 0.58);
}

.picker-wrap::before {
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

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
  border: none;
}

:deep(.el-input__inner) {
  color: #e0f7ff;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(207, 250, 254, 0.6);
}

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  color: rgba(207, 250, 254, 0.8);
}
</style>
