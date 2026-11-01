<script setup>
defineProps({
  steps: { type: Array, default: () => [] },
  active: { type: Number, default: 0 }
})

const emit = defineEmits(['select'])
</script>

<template>
  <nav class="cv__rail scroll-thin" aria-label="角色创建步骤">
    <button
      v-for="(step, index) in steps"
      :key="step.key"
      class="cv-rail__item"
      :class="{ 'is-active': index === active, 'is-done': index < active }"
      :style="{ '--step-accent': step.accent }"
      type="button"
      :aria-current="index === active ? 'step' : undefined"
      @click="emit('select', index)"
    >
      <span class="cv-rail__num">{{ step.numeral }}</span>
      <span class="cv-rail__text">
        <span class="cv-rail__label">{{ step.label }}</span>
        <span class="cv-rail__sub">{{ step.sub || '　' }}</span>
      </span>
    </button>
  </nav>
</template>
