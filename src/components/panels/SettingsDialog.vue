<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../settings/Icon.vue'
import ApiTab from './settings/ApiTab.vue'
import ImageTab from './settings/ImageTab.vue'
import PresetTab from './settings/PresetTab.vue'
import { ensureDemoPreset } from '../../composables/useSettings'

const emit = defineEmits(['close', 'notify'])

const TABS = [
  { id: 'api', label: 'API 设置' },
  { id: 'image', label: '文生图设置' },
  { id: 'preset', label: '预设设置' }
]

const tab = ref('api')

function onKeydown (event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  ensureDemoPreset()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="sd" role="dialog" aria-modal="true" aria-label="设置">
    <div class="sd__veil" @click="emit('close')"></div>

    <div class="sd__frame parchment">
      <span class="sd__corner sd__corner--tl" aria-hidden="true"></span>
      <span class="sd__corner sd__corner--tr" aria-hidden="true"></span>
      <span class="sd__corner sd__corner--bl" aria-hidden="true"></span>
      <span class="sd__corner sd__corner--br" aria-hidden="true"></span>

      <header class="sd__head">
        <div class="sd__title">
          <Icon class="sd__gear" name="gear" :size="21" :width="1.4" />
          <span class="sd__title-text">设置</span>
        </div>

        <button class="sd__close" type="button" aria-label="关闭设置" @click="emit('close')">
          <Icon name="close" :size="14" />
        </button>
      </header>

      <nav class="st-tabbar" aria-label="设置分类">
        <button
          v-for="item in TABS"
          :key="item.id"
          class="st-tab"
          :class="{ 'is-active': tab === item.id }"
          type="button"
          :aria-selected="tab === item.id"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </nav>

      <div class="sd__body scroll-thin">
        <ApiTab v-show="tab === 'api'" @notify="emit('notify', $event)" />
        <ImageTab v-show="tab === 'image'" @notify="emit('notify', $event)" />
        <PresetTab v-show="tab === 'preset'" @notify="emit('notify', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sd {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 3vh 3vw;
}

.sd__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(12, 8, 4, 0.4), rgba(6, 4, 2, 0.84) 78%),
    rgba(6, 4, 2, 0.35);
  backdrop-filter: blur(5px) saturate(0.85);
}

.sd__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 1140px);
  height: min(92vh, 812px);
  padding: 20px 28px 22px;
  border: 1px solid rgba(70, 45, 16, 0.62);
  border-radius: 3px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 252, 240, 0.5),
    inset 0 0 44px rgba(133, 92, 40, 0.3),
    0 30px 80px rgba(0, 0, 0, 0.72),
    0 0 0 1px rgba(0, 0, 0, 0.35);
  animation: sd-in 0.5s var(--ease-out) both;
}

@keyframes sd-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.988);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 四角金线 */
.sd__corner {
  position: absolute;
  z-index: 4;
  width: 20px;
  height: 20px;
  border: 0 solid rgba(143, 108, 44, 0.85);
  pointer-events: none;
}

.sd__corner--tl {
  top: 9px;
  left: 9px;
  border-top-width: 1px;
  border-left-width: 1px;
}

.sd__corner--tr {
  top: 9px;
  right: 9px;
  border-top-width: 1px;
  border-right-width: 1px;
}

.sd__corner--bl {
  bottom: 9px;
  left: 9px;
  border-bottom-width: 1px;
  border-left-width: 1px;
}

.sd__corner--br {
  bottom: 9px;
  right: 9px;
  border-bottom-width: 1px;
  border-right-width: 1px;
}

/* 标题区 */
.sd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(122, 86, 38, 0.24);
}

.sd__title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.sd__gear {
  color: rgba(150, 108, 44, 0.95);
  filter: drop-shadow(0 1px 0 rgba(255, 252, 238, 0.65));
}

.sd__title-text {
  color: #2f1d0b;
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  text-shadow: 0 1px 0 rgba(255, 252, 238, 0.7);
}

.sd__close {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: rgba(90, 62, 26, 0.72);
  border: 1px solid rgba(126, 92, 44, 0.35);
  border-radius: 50%;
  background: rgba(255, 250, 235, 0.42);
  transition: color 0.3s var(--ease-out), transform 0.3s var(--ease-out),
    box-shadow 0.3s var(--ease-out);
}

.sd__close:hover {
  color: #3b2510;
  transform: rotate(90deg);
  box-shadow: 0 0 14px rgba(255, 196, 118, 0.45);
}

/* 内容区 */
.sd__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

@media (max-width: 980px) {
  .sd {
    padding: 2vh 2vw;
  }

  .sd__frame {
    padding: 16px 18px 18px;
  }

  .sd__title-text {
    font-size: 17px;
  }
}
</style>
