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
        @realTime="realTime"
      />
      <div class="action-buttons">
        <el-button @click="changeScale(1)">放大</el-button>
        <el-button @click="changeScale(-1)">缩小</el-button>
        <el-button @click="rotateLeft">左旋</el-button>
        <el-button @click="rotateRight">右旋</el-button>
        <el-button type="primary" @click="confirmCrop">确定裁剪</el-button>
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
/* 方案 A：适用于 npm 包 "vue-cropper" （API 与你最初 template 对应） */
import VueCropperModule from 'vue-cropper'
// 兼容导出形式
const VueCropperComponent = VueCropperModule && (VueCropperModule.default || VueCropperModule)

export default {
  name: 'AvatarCropper',
  components: { VueCropper: VueCropperComponent },
  props: {
    visible: Boolean,
    imgUrl: String
  },
  data() {
    return { previewUrl: '' }
  },
  methods: {
    realTime(data) { this.previewUrl = data.url },
    changeScale(val) {
      const c = this.$refs.cropper
      if (c && typeof c.changeScale === 'function') c.changeScale(val)
    },
    rotateLeft() {
      const c = this.$refs.cropper
      if (c && typeof c.rotateLeft === 'function') c.rotateLeft()
    },
    rotateRight() {
      const c = this.$refs.cropper
      if (c && typeof c.rotateRight === 'function') c.rotateRight()
    },
    confirmCrop() {
      const c = this.$refs.cropper
      if (c && typeof c.getCropBlob === 'function') {
        c.getCropBlob(blob => { this.$emit('crop', blob); this.close() })
      } else {
        // 兜底：如果没有 getCropBlob，尝试 getCropData/getCroppedCanvas（不同实现）
        try {
          const canvas = c.getCropData ? c.getCropData() : null
          // 如果需要，你可以在这里做其他兼容处理
        } catch (e) { console.error(e) }
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
