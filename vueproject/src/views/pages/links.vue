<template>
  <div class="links-main">
    <h1 style="text-align:center;margin-bottom:32px;">欢迎来到我的网站</h1>
    <div class="links-grid">
      <div class="link-card" @click="go('card_one/card_one.html')">
        <h2>新抽卡游戏</h2>
        <p>体验全新抽卡玩法，点击进入开始抽卡。</p>
      </div>
      <div class="link-card" @click="go('arcaea_radom/arc_radom.html')">
        <h2>抽arc歌曲</h2>
        <p>随机抽取 Arcaea 歌曲，点击进入抽曲界面。</p>
      </div>
      <div class="link-card" @click="go('arcaea_radom/phi_radom.html')">
        <h2>抽phi歌曲</h2>
        <p>随机抽取 Phigros 歌曲，点击进入抽曲界面。</p>
      </div>
      <div class="link-card" @click="go('draw2guess/draw2guess.html')">
        <h2>猜歌抽曲界面</h2>
        <p>抽曲并猜歌，点击进入游戏。</p>
      </div>
      <div class="link-card" @click="go('docs/SCREEN.html')">
        <h2>转播方案介绍</h2>
        <p>了解简易比赛转播方案，点击查看详细介绍。</p>
      </div>
      <div class="link-card" @click="go('card_drawing/Card_drawing.html')">
        <h2>抽卡游戏</h2>
        <p>经典抽卡游戏，点击进入开始抽卡。</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    go(path) {
      window.open(`https://qglint.github.io/Qcdmga/${path}`, '_blank');
    }
  }
}
</script>

<style scoped>
.links-main {
  padding: 40px 0;
  min-height: 100vh;
  background: #f7f9fa;
}
.links-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.link-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 32px 24px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  text-align: center;
  border: 2px solid #e3eaf2;
}
.link-card:hover {
  box-shadow: 0 4px 24px rgba(64,158,255,0.15);
  border-color: #409EFF;
  transform: translateY(-4px) scale(1.03);
}
.link-card h2 {
  margin-bottom: 16px;
  font-size: 22px;
  color: #409EFF;
}
.link-card p {
  font-size: 16px;
  color: #333;
}
@media (max-width: 900px) {
  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>
