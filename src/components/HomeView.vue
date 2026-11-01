<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import MenuButton from './MenuButton.vue'
import GoldDivider from './GoldDivider.vue'
import LoadPanel from './panels/LoadPanel.vue'
import CodexPanel from './panels/CodexPanel.vue'
import SettingsDialog from './panels/SettingsDialog.vue'
import CreateView from './create/CreateView.vue'
import { beginJourney, hasSession, session } from '../composables/useSession'
import { latestSave, writeAuto } from '../composables/useSaves.js'

const asset = (path) => `${import.meta.env.BASE_URL}${path}`

const panel = ref(null)
const PANELS = ['load', 'codex', 'settings', 'create']
// 便于设计评审：?panel=start|load|codex|settings 可直接打开对应面板
const presetPanel = new URLSearchParams(window.location.search).get('panel')
if (PANELS.includes(presetPanel)) panel.value = presetPanel

const toast = ref('')
let toastTimer = 0

function notify (text) {
  toast.value = text
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = ''
  }, 2800)
}

onBeforeUnmount(() => window.clearTimeout(toastTimer))

const continueHint = computed(() => {
  const current = session.current
  if (!current) return ''
  const chapter = current.world?.chapter || '序章'
  return `${chapter} · ${current.character?.level ?? 1} 级`
})

function onBegin (payload) {
  beginJourney(payload)
  panel.value = null
  notify(`旅程已开启 · ${payload?.name || payload?.character?.name || '序章'}`)
}

function onResume () {
  const current = latestSave.value
  if (!current) return
  notify(`继续 · ${current.name}`)
}

function onLoad (save) {
  writeAuto({
    name: save.name,
    character: save.character,
    world: save.world,
    playtime: save.playtime
  })
  panel.value = null
  notify(`已载入《${save.name}》`)
}
</script>

<template>
  <main class="home">
    <div class="home__art" aria-hidden="true">
      <img class="home__img" :src="asset('Picture/Background/front-page.png')" alt="" />
    </div>
    <div class="home__tone" aria-hidden="true"></div>
    <div class="home__sun" aria-hidden="true"></div>
    <div class="home__grain" aria-hidden="true"></div>
    <div class="home__vignette" aria-hidden="true"></div>

    <header class="home__top">
      <div class="brand">
        <img class="brand__crest" :src="asset('Picture/LOGO/LOGO.png')" alt="艾尔德兰徽记" />
        <span class="brand__seam" aria-hidden="true"></span>
        <span class="brand__meta">
          <span class="brand__name">艾尔德兰</span>
          <span class="brand__latin">AELDRAN</span>
        </span>
      </div>

      <button class="workshop" type="button" @click="notify('创意工坊 · 尚未开启')">
        <svg class="workshop__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3.2 5.4c2.6-1.15 5.3-1.15 7.9 0v13.2c-2.6-1.15-5.3-1.15-7.9 0V5.4Z"
            stroke="currentColor"
            stroke-width="1.25"
            stroke-linejoin="round"
          />
          <path
            d="M20.8 5.4c-2.6-1.15-5.3-1.15-7.9 0v13.2c2.6-1.15 5.3-1.15 7.9 0V5.4Z"
            stroke="currentColor"
            stroke-width="1.25"
            stroke-linejoin="round"
          />
          <path d="M12 5.9v12.2" stroke="currentColor" stroke-width="1.1" opacity="0.75" />
        </svg>
        <span class="workshop__label">创意工坊</span>
      </button>
    </header>

    <section class="stage" aria-label="艾尔德兰">
      <img
        class="stage__title"
        :src="asset('Picture/LOGO/Title-Marker.alpha.png')"
        alt="艾尔德兰"
        draggable="false"
      />
      <p class="stage__tagline">以文字为墨　以抉择为刃</p>
      <GoldDivider class="stage__rule" />
      <p class="stage__latin">A TEXT-DRIVEN CHRONICLE</p>
    </section>

    <nav class="menu" aria-label="主菜单">
      <div v-if="hasSession" class="menu__slot" style="--i: 0">
        <MenuButton
          numeral="I"
          label="继续上一个游戏"
          :hint="continueHint"
          tone="ember"
          @click="onResume"
        />
      </div>
      <div class="menu__slot" :style="{ '--i': hasSession ? 1 : 0 }">
        <MenuButton
          :numeral="hasSession ? 'II' : 'I'"
          label="开始游戏"
          hint="立下名讳，踏入八步建角"
          @click="panel = 'create'"
        />
      </div>
      <div class="menu__slot" :style="{ '--i': hasSession ? 2 : 1 }">
        <MenuButton
          :numeral="hasSession ? 'III' : 'II'"
          label="读取存档"
          hint="翻阅既有的纪事"
          @click="panel = 'load'"
        />
      </div>
      <div class="menu__slot" :style="{ '--i': hasSession ? 3 : 2 }">
        <MenuButton
          :numeral="hasSession ? 'IV' : 'III'"
          label="世界书"
          hint="大陆志 · 人物录 · 年表"
          @click="panel = 'codex'"
        />
      </div>
      <div class="menu__slot" :style="{ '--i': hasSession ? 4 : 3 }">
        <MenuButton
          :numeral="hasSession ? 'V' : 'IV'"
          label="系统设置"
          hint="API · 文生图 · 预设"
          @click="panel = 'settings'"
        />
      </div>
    </nav>

    <footer class="foot">
      <p class="foot__line"><span class="foot__diamond" aria-hidden="true"></span>本作完全离线运行，存档保存在此设备</p>
      <p class="foot__build">v0.1.0 · 序章界面原型</p>
    </footer>

    <Transition name="toast">
      <div v-if="toast" class="toast parchment" role="status" aria-live="polite">
        {{ toast }}
      </div>
    </Transition>

    <CreateView
      v-if="panel === 'create'"
      @close="panel = null"
      @enter="onBegin"
      @notify="notify"
    />
    <LoadPanel v-if="panel === 'load'" @close="panel = null" @load="onLoad" @notify="notify" />
    <CodexPanel v-if="panel === 'codex'" @close="panel = null" />
    <SettingsDialog v-if="panel === 'settings'" @close="panel = null" @notify="notify" />
  </main>
</template>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100dvh;
  min-height: 520px;
  overflow: hidden;
  color: var(--paper-100);
  --mbtn-w: clamp(252px, 21vw, 322px);
}

/* ---------- 背景 ---------- */
.home__art {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.home__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 46%;
  transform: scale(1.04);
  animation: art-drift 72s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes art-drift {
  from {
    transform: scale(1.04) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.1) translate3d(-1.2%, -1%, 0);
  }
}

.home__tone {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 66% 52% at 50% 40%, rgba(255, 202, 122, 0.14), rgba(255, 202, 122, 0) 72%),
    linear-gradient(180deg, rgba(30, 18, 7, 0.3) 0%, rgba(30, 18, 7, 0) 20%, rgba(30, 18, 7, 0) 64%, rgba(24, 14, 6, 0.46) 100%),
    linear-gradient(90deg, rgba(26, 16, 7, 0.4) 0%, rgba(26, 16, 7, 0.04) 30%, rgba(26, 16, 7, 0) 52%);
  mix-blend-mode: multiply;
  opacity: 0.82;
}

/* 右上方的夕照金光 */
.home__sun {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 42% 38% at 79% 27%, rgba(255, 208, 132, 0.24), rgba(255, 208, 132, 0) 68%),
    radial-gradient(ellipse 70% 46% at 50% 96%, rgba(255, 176, 84, 0.14), rgba(255, 176, 84, 0) 70%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.home__grain {
  position: absolute;
  inset: 0;
  background-image: var(--noise);
  background-size: var(--grain-size);
  opacity: 0.14;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.home__vignette {
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 0 13vmin 2vmin rgba(10, 6, 2, 0.5),
    inset 0 0 3.5vmin rgba(10, 6, 2, 0.3);
  pointer-events: none;
}

/* ---------- 顶部 ---------- */
.home__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: clamp(18px, 3.4vh, 36px) clamp(20px, 3.4vw, 56px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  animation: rise-in 1s var(--ease-out) both 0.12s;
}

.brand__crest {
  width: auto;
  height: clamp(56px, 7.2vh, 88px);
  filter: brightness(1.1) saturate(1.06) drop-shadow(0 0 16px rgba(255, 186, 98, 0.3))
    drop-shadow(0 7px 14px rgba(0, 0, 0, 0.68));
}

.brand__seam {
  width: 1px;
  height: clamp(30px, 4vh, 46px);
  background: linear-gradient(180deg, rgba(226, 192, 122, 0), rgba(226, 192, 122, 0.75), rgba(226, 192, 122, 0));
}

.brand__meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand__name {
  color: var(--gold-100);
  font-family: var(--font-display);
  font-size: clamp(15px, 1.5vw, 19px);
  letter-spacing: 0.34em;
  text-indent: 0.34em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
}

.brand__latin {
  color: rgba(226, 192, 122, 0.72);
  font-size: clamp(9px, 0.78vw, 10.5px);
  letter-spacing: 0.42em;
  text-indent: 0.42em;
}

.workshop {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 10px 15px;
  color: var(--gold-100);
  font-size: 14px;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  border: 1px solid rgba(226, 192, 122, 0.42);
  border-radius: 3px;
  background: linear-gradient(180deg, rgba(38, 24, 11, 0.58), rgba(24, 15, 7, 0.7));
  box-shadow:
    inset 0 1px 0 rgba(255, 240, 208, 0.14),
    0 4px 16px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(3px);
  animation: rise-in 1s var(--ease-out) both 0.26s;
  transition: border-color 0.4s var(--ease-out), box-shadow 0.4s var(--ease-out), color 0.4s var(--ease-out);
}

.workshop__icon {
  width: 19px;
  height: 19px;
  color: rgba(240, 213, 158, 0.92);
  transition: color 0.4s var(--ease-out);
}

.workshop:hover {
  color: #fff4da;
  border-color: rgba(246, 214, 148, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 244, 224, 0.24),
    0 6px 22px rgba(0, 0, 0, 0.5),
    0 0 26px rgba(255, 184, 96, 0.3);
}

.workshop:hover .workshop__icon {
  color: #ffe6b4;
}

.workshop__label {
  white-space: nowrap;
}

/* ---------- 中央标题 ---------- */
.stage {
  position: absolute;
  left: 50%;
  top: 47%;
  z-index: 8;
  width: min(92vw, 900px);
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.stage::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: -1;
  width: 108%;
  height: 118%;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at 50% 52%, rgba(255, 190, 100, 0.2), rgba(255, 190, 100, 0) 66%);
  filter: blur(24px);
}

.stage__title {
  width: min(76vw, 760px);
  max-height: 44vh;
  object-fit: contain;
  filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.72)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
  animation: title-in 1.8s var(--ease-out) both 0.1s;
}

.stage__tagline {
  margin-top: clamp(12px, 2vh, 24px);
  color: rgba(255, 243, 219, 0.92);
  font-family: var(--font-flavor);
  font-size: clamp(12.5px, 1.15vw, 16px);
  letter-spacing: 0.28em;
  text-indent: 0.28em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
  animation: rise-in 1.2s var(--ease-out) both 0.7s;
}

.stage__rule {
  width: min(360px, 46vw);
  margin-top: 10px;
  animation: rise-in 1.2s var(--ease-out) both 0.85s;
}

.stage__latin {
  margin-top: 8px;
  color: rgba(226, 192, 122, 0.62);
  font-size: clamp(8.5px, 0.72vw, 10px);
  letter-spacing: 0.52em;
  text-indent: 0.52em;
  animation: rise-in 1.2s var(--ease-out) both 0.95s;
}

/* ---------- 左下菜单 ---------- */
.menu {
  position: absolute;
  left: clamp(20px, 3.4vw, 56px);
  bottom: clamp(20px, 4.2vh, 48px);
  z-index: 12;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu__slot {
  animation: rise-in 0.85s var(--ease-out) both;
  animation-delay: calc(0.68s + var(--i, 0) * 0.085s);
  display: flex;
}

/* ---------- 右下角 ---------- */
.foot {
  position: absolute;
  right: clamp(20px, 3.4vw, 56px);
  bottom: clamp(20px, 4.2vh, 40px);
  z-index: 11;
  text-align: right;
  animation: rise-in 1s var(--ease-out) both 1s;
}

.foot__line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(244, 228, 198, 0.62);
  font-family: var(--font-flavor);
  font-size: 12.5px;
  letter-spacing: 0.08em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
}

.foot__diamond {
  width: 5px;
  height: 5px;
  background: rgba(226, 192, 122, 0.8);
  transform: rotate(45deg);
}

.foot__build {
  margin-top: 5px;
  color: rgba(226, 192, 122, 0.42);
  font-size: 10.5px;
  letter-spacing: 0.26em;
  text-indent: 0.26em;
}

/* ---------- 提示条 ---------- */
.toast {
  position: fixed;
  left: 50%;
  bottom: clamp(28px, 6vh, 64px);
  z-index: 80;
  padding: 11px 26px;
  color: var(--ink-700);
  font-family: var(--font-flavor);
  font-size: 13.5px;
  letter-spacing: 0.12em;
  text-indent: 0.12em;
  border: 1px solid rgba(122, 86, 38, 0.5);
  border-radius: 2px;
  transform: translateX(-50%);
  pointer-events: none;
  white-space: nowrap;
  max-width: 92vw;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.45s var(--ease-out), transform 0.45s var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* ---------- 通用入场 ---------- */
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes title-in {
  from {
    opacity: 0;
    transform: scale(0.965);
    filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.72)) blur(6px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.72)) blur(0);
  }
}

/* ---------- 自适应 ---------- */
@media (max-width: 1080px) {
  .stage__title {
    width: min(84vw, 640px);
  }
}

@media (max-width: 720px) {
  .home {
    --mbtn-w: min(84vw, 320px);
  }

  .stage {
    top: 42%;
  }

  .stage__title {
    width: 94vw;
    max-height: 34vh;
  }

  .brand__meta {
    display: none;
  }

  .foot__line {
    display: none;
  }

  .menu {
    right: clamp(20px, 3.4vw, 56px);
  }

  .menu__slot :deep(.mbtn) {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home__img,
  .brand,
  .workshop,
  .stage__title,
  .stage__tagline,
  .stage__rule,
  .stage__latin,
  .menu__slot,
  .foot {
    animation: none !important;
  }
}
</style>
