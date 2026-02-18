<template>
  <el-dialog :visible.sync="visible" title="裁剪头像" :width="dialogWidth" append-to-body :modal="true" :custom-class="'avatar-cropper-dialog'" :close-on-click-modal="false">
    <div v-if="imgUrl" class="avatar-cropper-content">
      <vue-cropper
        ref="cropper"
        :img="imgUrl"
        :auto-crop="true"
        :auto-crop-width="cropWidth"
        :auto-crop-height="cropHeight"
        :fixed="true"
        :fixed-number="[1,1]"
        :can-move="true"
        :can-scale="true"
        :center-box="true"
        :view-mode="1"
        @realTime="updatePreview"
        :style="{width: cropWidth + 'px', height: cropHeight + 'px', margin: 'auto'}"
      />
      <div style="height:40px;"></div>
    </div>
    <div v-else style="text-align:center;padding:40px 0;">请选择图片后裁剪</div>
    <span slot="footer" class="dialog-footer" style="display:flex;justify-content:center;gap:16px;">
      <el-button @click="scale(1)">放大</el-button>
      <el-button @click="scale(-1)">缩小</el-button>
      <el-button @click="rotate(-90)">左旋</el-button>
      <el-button @click="rotate(90)">右旋</el-button>
      <el-button type="primary" @click="confirm">确定裁剪</el-button>
      <el-button @click="close">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { VueCropper }  from 'vue-cropper' 
// const VueCropper = VueCropperModule.default || VueCropperModule

export default {
  name: 'AvatarCropper',
  components: { VueCropper },
  props: {
    visible: Boolean,
    imgUrl: String
  },
  data() {
    return {
      previewUrl: '',
      dialogWidth: Math.round(window.innerWidth * 2 / 3) + 'px',
      dialogHeight: Math.round(window.innerHeight * 2 / 3) + 'px',
      cropWidth: Math.round(window.innerWidth * 2 / 3) - 40,
      cropHeight: Math.round(window.innerHeight * 2 / 3) - 40
    }
  },
  methods: {
    updatePreview(data) { this.previewUrl = data.url },
    scale(val) {
      const c = this.$refs.cropper
      if (c && typeof c.changeScale === 'function') c.changeScale(val)
    },
    rotate(deg) {
      const c = this.$refs.cropper
      if (c && typeof c.rotate === 'function') c.rotate(deg)
      else if (c && typeof c.rotateLeft === 'function') deg < 0 ? c.rotateLeft() : c.rotateRight()
    },
    confirm() {
      const c = this.$refs.cropper
      if (c && typeof c.getCropBlob === 'function') {
        c.getCropBlob(blob => {
          this.$emit('crop', blob)
          this.close()
        })
      } else {
        console.error('裁剪组件未正确导出 getCropBlob 方法')
      }
    },
    close() { this.$emit('update:visible', false) }
  },
  watch: {
    imgUrl() { this.previewUrl = '' }
  }
}
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
