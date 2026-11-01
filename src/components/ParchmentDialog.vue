<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import GoldDivider from './GoldDivider.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  kicker: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  wide: { type: Boolean, default: false },
  tall: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

function onKeydown (event) {
  if (event.key === 'Escape') emit('close')
}

// 面板多以 open 静态挂载，因此挂载时也要绑定一次
onMounted(() => {
  if (props.open) window.addEventListener('keydown', onKeydown)
})

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition appear name="dlg">
    <div v-if="open" class="dlg" role="dialog" aria-modal="true" :aria-label="title">
      <div class="dlg__veil" @click="emit('close')"></div>

      <div class="dlg__frame parchment" :class="{ 'dlg__frame--wide': wide, 'dlg__frame--tall': tall }">
        <span class="dlg__corner dlg__corner--tl" aria-hidden="true"></span>
        <span class="dlg__corner dlg__corner--tr" aria-hidden="true"></span>
        <span class="dlg__corner dlg__corner--bl" aria-hidden="true"></span>
        <span class="dlg__corner dlg__corner--br" aria-hidden="true"></span>

        <button class="dlg__close" type="button" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <header class="dlg__head">
          <p v-if="kicker" class="dlg__kicker">{{ kicker }}</p>
          <h2 class="dlg__title">{{ title }}</h2>
          <GoldDivider tone="ink" />
          <p v-if="subtitle" class="dlg__sub">{{ subtitle }}</p>
        </header>

        <div class="dlg__body scroll-thin">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="dlg__foot">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dlg {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 4vh 4vw;
}

.dlg__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(12, 8, 4, 0.42), rgba(6, 4, 2, 0.82) 78%),
    rgba(6, 4, 2, 0.35);
  backdrop-filter: blur(5px) saturate(0.85);
}

.dlg__frame {
  position: relative;
  width: min(100%, 580px);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  padding: 30px 36px 26px;
  border: 1px solid rgba(70, 45, 16, 0.62);
  border-radius: 3px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 252, 240, 0.5),
    inset 0 0 44px rgba(133, 92, 40, 0.3),
    0 30px 70px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(0, 0, 0, 0.35);
}

.dlg__frame--wide {
  width: min(100%, 780px);
}

.dlg__frame--tall {
  max-height: 93vh;
  padding-top: 24px;
  padding-bottom: 20px;
}

/* 四角金色折线 */
.dlg__corner {
  position: absolute;
  z-index: 4;
  width: 20px;
  height: 20px;
  border: 0 solid rgba(143, 108, 44, 0.85);
  pointer-events: none;
}

.dlg__corner--tl {
  top: 9px;
  left: 9px;
  border-top-width: 1px;
  border-left-width: 1px;
}

.dlg__corner--tr {
  top: 9px;
  right: 9px;
  border-top-width: 1px;
  border-right-width: 1px;
}

.dlg__corner--bl {
  bottom: 9px;
  left: 9px;
  border-bottom-width: 1px;
  border-left-width: 1px;
}

.dlg__corner--br {
  bottom: 9px;
  right: 9px;
  border-bottom-width: 1px;
  border-right-width: 1px;
}

.dlg__close {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: rgba(90, 62, 26, 0.75);
  border: 1px solid rgba(126, 92, 44, 0.35);
  border-radius: 50%;
  background: rgba(255, 250, 235, 0.4);
  transition: color 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), transform 0.3s var(--ease-out);
}

.dlg__close svg {
  width: 13px;
  height: 13px;
}

.dlg__close:hover {
  color: #3b2510;
  transform: rotate(90deg);
  box-shadow: 0 0 14px rgba(255, 196, 118, 0.45);
}

.dlg__head {
  text-align: center;
  padding-bottom: 4px;
}

.dlg__kicker {
  color: rgba(107, 76, 33, 0.72);
  font-family: var(--font-flavor);
  font-size: 12.5px;
  letter-spacing: 0.34em;
  text-indent: 0.34em;
}

.dlg__title {
  margin: 4px 0 10px;
  color: #33210f;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  text-shadow: 0 1px 0 rgba(255, 252, 238, 0.7);
}

.dlg__sub {
  margin-top: 10px;
  color: rgba(74, 49, 20, 0.78);
  font-family: var(--font-flavor);
  font-size: 13.5px;
  letter-spacing: 0.06em;
  line-height: 1.7;
}

.dlg__body {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dlg__foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(122, 86, 38, 0.24);
}

/* ---- 出场动画 ---- */
.dlg-enter-active .dlg__veil,
.dlg-leave-active .dlg__veil {
  transition: opacity 0.35s var(--ease-out);
}

.dlg-enter-active .dlg__frame,
.dlg-leave-active .dlg__frame {
  transition: opacity 0.45s var(--ease-out), transform 0.45s var(--ease-out);
}

.dlg-enter-from .dlg__veil,
.dlg-leave-to .dlg__veil {
  opacity: 0;
}

.dlg-enter-from .dlg__frame,
.dlg-leave-to .dlg__frame {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
}

@media (max-width: 640px) {
  .dlg__frame {
    padding: 26px 20px 20px;
  }

  .dlg__title {
    font-size: 21px;
  }
}
</style>
