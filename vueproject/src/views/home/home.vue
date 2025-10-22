<template>
  <div class="main-content">
    <div class="banner-carousel" @mouseenter="pauseCarousel" @mouseleave="resumeCarousel(false)">
      <div class="banner-label">
        <span v-if="bannerList[currentIndex].type === 'course'">最新课题</span>
        <span v-else-if="bannerList[currentIndex].type === 'activity'">最新活动</span>
      </div>
      <transition name="carousel-fade" mode="out-in">
        <div v-if="bannerList.length" :key="currentIndex" class="banner-content">
          <!-- 最新课题 -->
          <template v-if="bannerList[currentIndex].type === 'course'">
            <div class="banner-info">
              <h4>{{ bannerList[currentIndex].data.title }}</h4>
              <p>类别: {{ bannerList[currentIndex].data.category }}</p>
              <p>开始时间: {{ formatDate(bannerList[currentIndex].data.startTime) }}</p>
              <p>结束时间: {{ formatDate(bannerList[currentIndex].data.endTime) }}</p>
              <!--<p>描述: {{ bannerList[currentIndex].data.description }}</p>-->
              <img
                :src="getImageUrl(bannerList[currentIndex].data.image)"
                alt="课程图片"
                v-if="bannerList[currentIndex].data.image"
                class="course-image"
              />
              <el-button
                v-if="bannerList[currentIndex].data.image"
                size="mini"
                @click="handleImageClick(getImageUrl(bannerList[currentIndex].data.image))"
                style="margin-top: 10px;"
              >查看</el-button>
            </div>
          </template>
          <!-- 最新活动 -->
          <template v-else-if="bannerList[currentIndex].type === 'activity'">
            <div class="banner-info">
              <el-empty description="敬请期待..." />
            </div>
          </template>
        </div>
      </transition>
      <div class="banner-dots">
        <span v-for="(item, idx) in bannerList" :key="idx" :class="['dot', { active: idx === currentIndex }]" />
      </div>
      <div class="banner-controls" :class="{ show: controlsVisible }">
        <el-button class="banner-btn left" icon="el-icon-arrow-left" @click="prevCard" size="small" />
        <el-button class="banner-btn right" icon="el-icon-arrow-right" @click="nextCard" size="small" />
      </div>
    </div>
    <el-dialog :visible.sync="previewVisible" width="760px" :show-close="true" center @close="resumeCarousel">
      <template v-if="currentCourse">
        <el-form :model="currentCourse" label-width="110px" class="view-form">
          <el-form-item label="课题名称">
            <el-input :value="currentCourse.title || '-'" disabled />
          </el-form-item>

          <el-form-item label="类别">
            <el-input :value="currentCourse.category || '-'" disabled />
          </el-form-item>

          <el-form-item label="开始时间">
            <el-input :value="formatDateTime(currentCourse.startTime)" disabled />
          </el-form-item>

          <el-form-item label="结束时间">
            <el-input :value="formatDateTime(currentCourse.endTime)" disabled />
          </el-form-item>

          <el-form-item label="描述">
            <div style="white-space:pre-wrap;color:#333;">{{ currentCourse.description || '-' }}</div>
          </el-form-item>

          <el-form-item label="图片">
            <div v-if="currentCourse.image">
              <img
                  :src="getImageUrl(currentCourse.image)"
                  alt="课题图片"
                  style="max-width:260px;max-height:160px;border-radius:6px;cursor:pointer;"
                  @click="handleImageClick(getImageUrl(currentCourse.image))"
              />
            </div>
            <div v-else>-</div>
          </el-form-item>
        </el-form>
      </template>

      <div v-else>
        <el-empty description="无课题数据" />
      </div>

      <span slot="footer" class="dialog-footer">
      <el-button @click="previewVisible = false">关闭</el-button>
    </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchCourseData } from "@/api/course";
export default {
  data() {
    return {
      bannerList: [],
      loading: true,
      error: null,
      currentIndex: 0,
      carouselTimer: null,
      previewVisible: false,
      previewImage: '',
      controlsVisible: false,
      pauseCounter: 0, // 新增：暂停计数器
    };
  },
  mounted() {
    this.initBannerList();
  },
  beforeDestroy() {
    this.clearCarouselTimer();
  },
  computed: {
    currentCourse() {
      const item = this.bannerList[this.currentIndex];
      return item && item.type === 'course' ? item.data || null : null;
    }
  },
  methods: {
    async initBannerList() {
      try {
        const response = await fetchCourseData();
        let courses = response.data || [];
        // 只取最新课题
        courses = courses.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        console.log('RELOAD TEST', Date.now())
        const latestCourse = courses.length ? courses[0] : null;
        const bannerArr = [];
        if (latestCourse) {
          bannerArr.push({ type: 'course', data: latestCourse });
        }
        // 活动占位，可扩展为多个
        bannerArr.push({ type: 'activity', data: {} });
        this.bannerList = bannerArr;
        this.startCarousel();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    startCarousel() {
      this.clearCarouselTimer();
      if (this.bannerList.length > 1) {
        this.carouselTimer = setInterval(() => {
          this.nextCard();
        }, 4000);
      }
    },
    pauseCarousel() {
      if (this.pauseCounter === 0) {
        this.clearCarouselTimer();
        this.controlsVisible = true;
      }
      this.pauseCounter++;
    },
    resumeCarousel(force = false) {
      if (force) {
        this.pauseCounter = 0;
      } else if (this.pauseCounter > 0) {
        this.pauseCounter--;
      }
      if (this.pauseCounter === 0) {
        this.startCarousel();
        this.controlsVisible = false;
      }
    },
    clearCarouselTimer() {
      if (this.carouselTimer) {
        clearInterval(this.carouselTimer);
        this.carouselTimer = null;
      }
    },
    nextCard() {
      if (this.bannerList.length) {
        this.currentIndex = (this.currentIndex + 1) % this.bannerList.length;
      }
    },
    prevCard() {
      if (this.bannerList.length) {
        this.currentIndex = (this.currentIndex - 1 + this.bannerList.length) % this.bannerList.length;
      }
    },
    handleImageClick(imgUrl) {
      this.pauseCarousel();
      this.previewImage = imgUrl;
      this.previewVisible = true;
    },
    formatDate(date) {
      const d = new Date(date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return d.toLocaleDateString('zh-CN', options);
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '';
      return new Date(dateTime).toLocaleString();
    },
    getImageUrl(imagePath) {
      if (!imagePath) return '';
      if (/^https?:\/\//.test(imagePath)) {
        return imagePath;
      }
      return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    }
  }
};
</script>

<style scoped>
.main-content {
  margin-top: var(--navbar-height);
  min-height: 60vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.banner-carousel {
  width: 100%;
  max-width: 1100px;
  margin: 140px auto 0 auto;
  background: linear-gradient(135deg, #e3f0ff 0%, #b3d8ff 100%);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(64,158,255,0.22), 0 0 0 6px #eaf6ff inset, 0 1px 12px #fff inset;
  padding: 56px 56px 40px 56px;
  position: relative;
  min-height: 320px;
  overflow: hidden;
}
.banner-label {
  position: absolute;
  top: 24px;
  left: 40px;
  z-index: 10;
  font-size: 2.6rem;
  font-weight: 900;
  color: #2176ff;
  text-shadow: 0 2px 8px #fff, 0 1px 0 #b3d8ff;
  pointer-events: none;
}
.banner-title {
  font-size: 0;
  height: 0;
  overflow: hidden;
}
.banner-content {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  text-align: center;
  margin: 0 auto;
}
.banner-info {
  margin-bottom: 8px;
}
.banner-dots {
  position: absolute;
  left: 24px;
  bottom: 18px;
  display: flex;
  align-items: center;
  z-index: 2;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e0e0e0;
  margin: 0 4px;
  transition: background 0.3s;
  display: inline-block;
}
.dot.active {
  background: #666;
}
.banner-controls {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 3;
}
.banner-controls.show {
  opacity: 1;
  pointer-events: auto;
}
.banner-btn {
  background: rgba(120,120,120,0.35) !important;
  border: none !important;
  border-radius: 4px !important;
  width: 36px !important;
  height: 36px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none !important;
  color: #fff !important;
  font-size: 18px !important;
  transition: background 0.2s;
}
.banner-btn.left {
  margin-left: 8px;
}
.banner-btn.right {
  margin-right: 8px;
}
.banner-btn:hover {
  background: rgba(80,80,80,0.55) !important;
}
.course-image {
  max-width: 300px;
  max-height: 200px;
  width: auto;
  height: auto;
  display: block;
  margin: 20px auto 0 auto;
}
/* 轮播淡入淡出动画 */
.carousel-fade-enter-active, .carousel-fade-leave-active {
  transition: opacity 0.5s;
}
.carousel-fade-enter, .carousel-fade-leave-to {
  opacity: 0;
}
</style>


