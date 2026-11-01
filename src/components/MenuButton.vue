<script setup>
defineProps({
  numeral: { type: String, default: '' },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'default' }
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="mbtn"
    :class="{ 'mbtn--ember': tone === 'ember' }"
    @click="$emit('click')"
  >
    <span class="mbtn__grain" aria-hidden="true"></span>
    <span class="mbtn__sweep" aria-hidden="true"></span>

    <span class="mbtn__num" aria-hidden="true">{{ numeral }}</span>

    <span class="mbtn__text">
      <span class="mbtn__label">{{ label }}</span>
      <span v-if="hint" class="mbtn__hint">{{ hint }}</span>
    </span>

    <svg class="mbtn__chev" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.6 4.8 16 12l-7.4 7.2"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.mbtn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  isolation: isolate;
  overflow: hidden;
  width: var(--mbtn-w, 300px);
  min-height: 56px;
  padding: 9px 15px 9px 13px;
  text-align: left;
  color: var(--ink-700);
  border: 1px solid rgba(120, 86, 40, 0.82);
  border-radius: 3px;
  background-color: #dfc496;
  background-image:
    radial-gradient(150% 130% at 8% -30%, rgba(255, 250, 232, 0.92), rgba(255, 250, 232, 0) 60%),
    radial-gradient(80% 110% at 100% 112%, rgba(96, 60, 20, 0.42), rgba(96, 60, 20, 0) 62%),
    linear-gradient(180deg, #f0dcb2 0%, #e2c894 46%, #c9a468 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 253, 242, 0.9),
    inset 0 -14px 22px rgba(146, 101, 44, 0.16),
    0 6px 16px rgba(0, 0, 0, 0.44),
    0 0 0 1px rgba(0, 0, 0, 0.18);
  transition:
    transform 0.42s var(--ease-out),
    box-shadow 0.42s var(--ease-out),
    border-color 0.42s var(--ease-out);
}

/* 内层细线 */
.mbtn::before {
  content: "";
  position: absolute;
  inset: 4px;
  z-index: 0;
  border: 1px solid rgba(122, 86, 38, 0.22);
  border-radius: 1px;
  pointer-events: none;
}

.mbtn__grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: var(--noise);
  background-size: var(--grain-size);
  opacity: 0.36;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.mbtn__sweep {
  position: absolute;
  inset: -10% -40%;
  z-index: 2;
  background: linear-gradient(
    104deg,
    rgba(255, 255, 255, 0) 38%,
    rgba(255, 253, 240, 0.55) 50%,
    rgba(255, 255, 255, 0) 62%
  );
  mix-blend-mode: soft-light;
  transform: translateX(-115%);
  transition: transform 0.95s var(--ease-out);
  pointer-events: none;
}

.mbtn:hover .mbtn__sweep,
.mbtn:focus-visible .mbtn__sweep {
  transform: translateX(115%);
}

.mbtn__num {
  position: relative;
  z-index: 3;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #6a4a1d;
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.02em;
  border: 1px solid rgba(120, 86, 40, 0.52);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 26%, #fffdf3, #e6cfa0 62%, #cfae76 100%);
  box-shadow:
    inset 0 0 10px rgba(146, 101, 44, 0.24),
    0 1px 2px rgba(0, 0, 0, 0.22);
  transition: box-shadow 0.42s var(--ease-out), border-color 0.42s var(--ease-out);
}

.mbtn__text {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.mbtn__label {
  font-size: 16.5px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-indent: 0.16em;
  line-height: 1.25;
  text-shadow: 0 1px 0 rgba(255, 251, 238, 0.55);
  white-space: nowrap;
}

.mbtn__hint {
  margin-top: 2px;
  color: rgba(90, 62, 26, 0.72);
  font-family: var(--font-flavor);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 15em;
}

.mbtn__chev {
  position: relative;
  z-index: 3;
  flex: 0 0 auto;
  width: 15px;
  height: 15px;
  margin-left: auto;
  color: rgba(110, 78, 32, 0.45);
  transform: translateX(-3px);
  transition: transform 0.42s var(--ease-out), color 0.42s var(--ease-out);
}

/* ---- hover ---- */
.mbtn:hover,
.mbtn:focus-visible {
  transform: translateX(9px);
  border-color: rgba(243, 210, 146, 0.95);
  background-image:
    radial-gradient(150% 130% at 8% -30%, #fffdf4, rgba(255, 252, 238, 0) 62%),
    linear-gradient(180deg, #fbf0d2 0%, #eedcb4 46%, #ddc08a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 254, 245, 0.98),
    inset 0 -14px 22px rgba(146, 101, 44, 0.1),
    0 10px 26px rgba(0, 0, 0, 0.5),
    0 0 26px rgba(255, 182, 92, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.16);
}

.mbtn:hover .mbtn__num,
.mbtn:focus-visible .mbtn__num {
  border-color: rgba(150, 110, 44, 0.9);
  box-shadow:
    inset 0 0 10px rgba(146, 101, 44, 0.2),
    0 0 12px rgba(255, 200, 120, 0.5);
}

.mbtn:hover .mbtn__chev,
.mbtn:focus-visible .mbtn__chev {
  color: #6a4a1d;
  transform: translateX(1px);
}

.mbtn:active {
  transform: translateX(9px) scale(0.988);
}

/* ---- 主行动（继续上一个游戏） ---- */
.mbtn--ember {
  border-color: rgba(255, 210, 146, 0.92);
  background-image:
    radial-gradient(150% 130% at 8% -30%, rgba(255, 251, 236, 0.96), rgba(255, 250, 232, 0) 62%),
    radial-gradient(80% 110% at 100% 112%, rgba(96, 60, 20, 0.36), rgba(96, 60, 20, 0) 62%),
    linear-gradient(180deg, #fdf1cd 0%, #f2d9a4 46%, #ddbb80 100%);
  animation: ember-breathe 5.6s ease-in-out infinite;
}

/* 左侧火光描边 */
.mbtn--ember::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
  width: 3px;
  background: linear-gradient(180deg, rgba(255, 230, 176, 0.95), rgba(212, 146, 58, 0.95));
  box-shadow: 0 0 14px rgba(255, 190, 100, 0.8);
  pointer-events: none;
}

.mbtn--ember .mbtn__num {
  color: #4a2f0f;
  border-color: rgba(158, 114, 40, 0.75);
  background: radial-gradient(circle at 34% 26%, #fff8dd, #ecc87c 58%, #cfa253 100%);
}

@keyframes ember-breathe {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(255, 253, 242, 0.92),
      inset 0 -14px 22px rgba(146, 101, 44, 0.14),
      0 6px 16px rgba(0, 0, 0, 0.45),
      0 0 18px rgba(255, 160, 70, 0.16);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(255, 253, 242, 0.92),
      inset 0 -14px 22px rgba(146, 101, 44, 0.08),
      0 6px 18px rgba(0, 0, 0, 0.45),
      0 0 34px rgba(255, 180, 88, 0.44);
  }
}
</style>
