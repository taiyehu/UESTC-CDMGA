<template>
  <section class="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-8">
    <header class="mb-8 text-center">
      <h1 class="glitch-title text-5xl font-semibold md:text-7xl" data-text="LINKS">
        LINKS
      </h1>
    </header>

    <div class="hud-card p-6 md:p-8">
      <header class="mb-7 text-center">
        <h2 class="text-2xl font-semibold tracking-[0.08em] text-cyan-50 md:text-3xl">功能组件</h2>
        <p class="mt-2 text-cyan-100/80">Cyber Links Hub</p>
      </header>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          class="hud-tile group p-6 text-left"
          @click="go('card_one/card_one.html')"
        >
          <h2 class="mb-3 text-xl font-semibold text-cyan-50">抽卡Debuff对决</h2>
          <p class="text-sm leading-6 text-cyan-50/85">体验全新抽卡对决玩法，点击进入开始抽卡。</p>
        </button>

        <button
          type="button"
          class="hud-tile group p-6 text-left"
          @click="go('arcaea_radom/arc_radom.html')"
        >
          <h2 class="mb-3 text-xl font-semibold text-cyan-50">抽arc歌曲</h2>
          <p class="text-sm leading-6 text-cyan-50/85">随机抽取 Arcaea 歌曲，点击进入抽曲界面。</p>
        </button>

        <button
          type="button"
          class="hud-tile group p-6 text-left"
          @click="go('arcaea_radom/phi_radom.html')"
        >
          <h2 class="mb-3 text-xl font-semibold text-cyan-50">抽phi歌曲</h2>
          <p class="text-sm leading-6 text-cyan-50/85">随机抽取 Phigros 歌曲，点击进入抽曲界面。</p>
        </button>

        <button
          type="button"
          class="hud-tile group p-6 text-left"
          @click="go('draw2guess/draw2guess.html')"
        >
          <h2 class="mb-3 text-xl font-semibold text-cyan-50">猜歌抽曲界面</h2>
          <p class="text-sm leading-6 text-cyan-50/85">抽曲并猜歌，点击进入游戏。</p>
        </button>

        <button
            type="button"
            class="hud-tile group p-6 text-left"
            @click="openurl('https://thenobody996.github.io/gachagacha/')"
          ><h2 class="mb-3 text-xl font-semibold text-cyan-50">bingo活动抽曲</h2>
          <p class="text-sm leading-6 text-cyan-50/85">bingo活动用抽曲界面</p></button>

        <button
          type="button"
          class="hud-tile group p-6 text-left"
          @click="go('docs/SCREEN.html')"
        >
          <h2 class="mb-3 text-xl font-semibold text-cyan-50">转播方案介绍</h2>
          <p class="text-sm leading-6 text-cyan-50/85">了解简易比赛转播方案，点击查看详细介绍。</p>
        </button>
      </div>
    </div>
  </section>

</template>

<script lang="ts" setup>
function go(path: string) {
  window.open(`https://qglint.github.io/cdmga_links/${path}`, '_blank')
}
function openurl(path: string) {
  window.open(path, '_blank')
}
</script>

<style scoped>
.glitch-title {
  position: relative;
  display: inline-block;
  letter-spacing: 0.12em;
  line-height: 1;
  background-image: linear-gradient(135deg, #22d3ee 0%, #9333ea 40%, #c026d3 62%, #f472b6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 16px rgba(139, 92, 246, 0.38);
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glitch-title::before {
  color: rgba(34, 211, 238, 0.8);
  transform: translateX(1px);
  clip-path: polygon(0 4%, 100% 0, 100% 38%, 0 42%);
}

.glitch-title::after {
  color: rgba(217, 70, 239, 0.8);
  transform: translateX(-1px);
  clip-path: polygon(0 62%, 100% 58%, 100% 100%, 0 96%);
}

.hud-card {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(14, 24, 48, 0.5), rgba(23, 12, 42, 0.45));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 28px rgba(34, 211, 238, 0.16),
    0 0 46px rgba(217, 70, 239, 0.08);
  backdrop-filter: blur(8px);
}

.hud-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.9), rgba(168, 85, 247, 0.86), rgba(244, 114, 182, 0.9));
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

.hud-tile {
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 14px;
  background: rgba(9, 30, 56, 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.hud-tile::before {
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

.hud-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(165, 243, 252, 0.7);
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.2);
}
</style>
