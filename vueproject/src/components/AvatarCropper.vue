<template>
  <el-dialog
     v-model:visible="isModalVisible"
    title="裁剪头像"
    :width="dialogWidth"
    teleported
    :modal="true"
    class="'avatar-cropper-dialog'"
    :close-on-click-modal="false"
  >
    <div v-if="imgUrl" class="avatar-cropper-content">
      <vue-cropper
        ref="cropper"
        :img="imgUrl"
        :auto-crop="true"
        :auto-crop-width="cropWidth"
        :auto-crop-height="cropHeight"
        :fixed="true"
        :fixed-number="[1, 1]"
        :can-move="true"
        :can-scale="true"
        :center-box="true"
        :view-mode="1"
        @realTime="updatePreview"
        :style="{
          width: cropWidth + 'px',
          height: cropHeight + 'px',
          margin: 'auto',
        }"
      />
      <div style="height: 40px"></div>
    </div>
    <div v-else style="text-align: center; padding: 40px 0">
      请选择图片后裁剪
    </div>
    <template v-slot:footer>
      <span
        class="dialog-footer"
        style="display: flex; justify-content: center; gap: 16px"
      >
        <el-button @click="scale(1)">放大</el-button>
        <el-button @click="scale(-1)">缩小</el-button>
        <el-button @click="rotate(-90)">左旋</el-button>
        <el-button @click="rotate(90)">右旋</el-button>
        <el-button type="primary" @click="confirm">确定裁剪</el-button>
        <el-button @click="close">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue'
import { VueCropper } from 'vue-cropper'

const props = defineProps<{
  visible?: boolean
  imgUrl?: string
}>()

const emit = defineEmits<{
  (e: 'crop', blob: Blob): void
  (e: 'update:visible', value: boolean): void
}>()

const cropper = ref<any>(null)
const previewUrl = ref<string>('')
const dialogWidth = ref<string>(Math.round((window.innerWidth * 2) / 3) + 'px')
const dialogHeight = ref<string>(Math.round((window.innerHeight * 2) / 3) + 'px')
const cropWidth = ref<number>(Math.round((window.innerWidth * 2) / 3) - 40)
const cropHeight = ref<number>(Math.round((window.innerHeight * 2) / 3) - 40)

// proxy for v-model:visible in template
const isModalVisible = computed<boolean>({
  get: () => !!props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

function updatePreview(data: any): void {
  previewUrl.value = data.url
}

function scale(val: number): void {
  const c = cropper.value
  if (c && typeof c.changeScale === 'function') c.changeScale(val)
}

function rotate(deg: number): void {
  const c = cropper.value
  if (c && typeof c.rotate === 'function') c.rotate(deg)
  else if (c && typeof c.rotateLeft === 'function') (deg < 0 ? c.rotateLeft() : c.rotateRight())
}

function confirm(): void {
  const c = cropper.value
  if (c && typeof c.getCropBlob === 'function') {
    c.getCropBlob((blob: Blob) => {
      emit('crop', blob)
      close()
    })
  } else {
    console.error('裁剪组件未正确导出 getCropBlob 方法')
  }
}

function close(): void {
  emit('update:visible', false)
}

watch(
  () => props.imgUrl,
  () => {
    previewUrl.value = ''
  }
)
</script>

<style scoped>
.avatar-cropper-dialog {
  top: 50% !important;
  transform: translateY(-50%) !important;
  height: calc(66vh) !important;
  max-height: calc(66vh) !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.avatar-cropper-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(66vh - 80px);
}
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>
