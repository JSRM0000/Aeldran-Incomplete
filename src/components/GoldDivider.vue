<script setup>
defineProps({
  tone: { type: String, default: 'gold' }
})
</script>

<template>
  <div class="rule" :class="`rule--${tone}`" aria-hidden="true">
    <span class="rule__line"></span>
    <svg class="rule__mark" viewBox="0 0 44 16" fill="none">
      <path d="M22 2.4 27.4 8 22 13.6 16.6 8Z" fill="currentColor" opacity="0.95" />
      <path d="M22 5.6 24.4 8 22 10.4 19.6 8Z" fill="rgba(255,252,238,0.75)" />
      <path d="M6 8h6M32 8h6" stroke="currentColor" stroke-width="1" opacity="0.55" />
      <circle cx="4" cy="8" r="1.3" fill="currentColor" opacity="0.65" />
      <circle cx="40" cy="8" r="1.3" fill="currentColor" opacity="0.65" />
    </svg>
    <span class="rule__line"></span>
  </div>
</template>

<style scoped>
.rule {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  color: var(--gold-300);
}

.rule__line {
  flex: 1 1 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(226, 192, 122, 0), rgba(226, 192, 122, 0.7));
}

.rule__line:last-child {
  background: linear-gradient(90deg, rgba(226, 192, 122, 0.7), rgba(226, 192, 122, 0));
}

.rule__mark {
  flex: 0 0 auto;
  width: 44px;
  height: 16px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
}

.rule--ink {
  color: rgba(122, 86, 38, 0.85);
}

.rule--ink .rule__line {
  background: linear-gradient(90deg, rgba(122, 86, 38, 0), rgba(122, 86, 38, 0.55));
}

.rule--ink .rule__line:last-child {
  background: linear-gradient(90deg, rgba(122, 86, 38, 0.55), rgba(122, 86, 38, 0));
}

.rule--ink .rule__mark path[fill="rgba(255,252,238,0.75)"] {
  fill: rgba(255, 250, 235, 0.55);
}
</style>
