<template>
  <el-dialog :visible.sync="visible" title="裁剪头像" width="600px">
    <div v-if="imgUrl">
      <vue-cropper
        ref="cropper"
        :img="imgUrl"
        :auto-crop="true"
        :auto-crop-width="240"
        :auto-crop-height="240"
        :fixed="true"
        :fixed-number="[1,1]"
        :can-move="true"
        :can-scale="true"
        :center-box="true"
        :view-mode="1"
        @realTime="updatePreview"
      />
      <div class="action-buttons">
        <el-button @click="scale(1)">放大</el-button>
        <el-button @click="scale(-1)">缩小</el-button>
        <el-button @click="rotate(-90)">左旋</el-button>
        <el-button @click="rotate(90)">右旋</el-button>
        <el-button type="primary" @click="confirm">确定裁剪</el-button>
      </div>
      <div class="preview-container">
        <img :src="previewUrl" style="width:120px;height:120px;border-radius:50%;" />
      </div>
    </div>
    <div v-else style="text-align:center;padding:40px 0;">请选择图片后裁剪</div>
    <span slot="footer" class="dialog-footer">
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
    return { previewUrl: '' }
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
.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.preview-container {
  margin-top: 20px;
  text-align: center;
}
</style>
