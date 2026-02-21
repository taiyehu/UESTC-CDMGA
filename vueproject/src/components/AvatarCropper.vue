<template>
  <el-dialog
    v-model="isModalVisible"
    title="裁剪头像"
    :width="dialogWidth"
    teleported
    :close-on-click-modal="false"
    class="avatar-cropper-dialog"
  >
    <div v-if="imgUrl" class="cropper-wrapper">
      <Cropper
        ref="cropperRef"
        :src="imgUrl"
        :stencil-props="{
          aspectRatio: 1,
        }"
        :auto-zoom="true"
        :background="false"
        image-restriction="stencil"
        class="cropper"
      />
    </div>

    <div v-else class="empty-tip">
      请选择图片后裁剪
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="zoom(1.1)">放大</el-button>
        <el-button @click="zoom(0.9)">缩小</el-button>
        <el-button @click="rotate(-90)">左旋</el-button>
        <el-button @click="rotate(90)">右旋</el-button>
        <el-button type="primary" @click="confirm">
          确定裁剪
        </el-button>
        <el-button @click="close">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps<{
  visible?: boolean
  imgUrl?: string
}>()

const emit = defineEmits<{
  (e: 'crop', blob: Blob): void
  (e: 'update:visible', value: boolean): void
}>()

const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)

const dialogWidth = `${Math.round((window.innerWidth * 2) / 3)}px`

const isModalVisible = computed({
  get: () => !!props.visible,
  set: v => emit('update:visible', v),
})

function zoom(factor: number) {
  cropperRef.value?.zoom(factor)
}

function rotate(deg: number) {
  cropperRef.value?.rotate(deg)
}

function confirm() {
  const result = cropperRef.value?.getResult()
  if (!result?.canvas) return

  result.canvas.toBlob((blob) => {
    if (!blob) return
    emit('crop', blob)
    close()
  }, 'image/png')
}

function close() {
  emit('update:visible', false)
}

watch(
  () => props.imgUrl,
  () => {
    cropperRef.value?.reset()
  }
)
</script>

<style scoped>
.avatar-cropper-dialog {
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.cropper-wrapper {
  height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cropper {
  width: 100%;
  height: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
}
</style>
