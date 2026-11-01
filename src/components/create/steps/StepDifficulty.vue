<script setup>
import { DIFFICULTIES } from '../../../data/difficulties.js'
import { draft } from '../../../composables/useCharacter.js'
</script>

<template>
  <section class="cv-step cv-step--single">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第一步 · 选定难度</h2>
      <p class="cv-step__kicker">难度决定战场的凶险，也决定叙事的呼吸。</p>
    </header>

    <div class="cv-step__body">
      <div class="cv-cards cv-cards--three">
        <button
          v-for="d in DIFFICULTIES"
          :key="d.id"
          class="cv-card cv-diff__card"
          :class="{ 'is-on': draft.difficulty === d.id }"
          :style="{ '--step-accent': d.accent }"
          type="button"
          @click="draft.difficulty = d.id"
        >
          <span class="cv-card__top">
            <span class="cv-card__name">{{ d.name }}</span>
            <span class="cv-card__ring" aria-hidden="true"></span>
          </span>
          <span class="cv-card__desc">{{ d.tagline }}</span>
        </button>
      </div>

      <p class="cv-note">
        难度一经选定，会写入存档并随角色一同保存。之后可在「系统设置」中查看，但不会改变已有的战斗记录。
      </p>
    </div>
  </section>
</template>

<style scoped>
.cv-step--single {
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
}

.cv-diff__card {
  gap: 12px;
  padding: 20px 24px 22px;
  min-height: 164px;
  justify-content: center;
}

.cv-diff__card .cv-card__name {
  font-size: 22px;
  letter-spacing: 0.14em;
}

.cv-diff__card .cv-card__desc {
  font-family: var(--font-flavor);
  font-size: 16.5px;
  line-height: 1.85;
  color: rgba(62, 39, 14, 0.9);
}


</style>