<script setup>
import { CLASSES, draft, klass } from '../../../composables/useCharacter.js'
import { bonusText } from '../../../utils/format.js'
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第五步 · 选择职业</h2>
      <p class="cv-step__kicker">职业是你在世界上行走的方式。</p>
    </header>

    <div class="cv-step__body">
      <div class="cv-classes">
        <button
          v-for="item in CLASSES"
          :key="item.id"
          class="cv-card cv-class"
          :class="{ 'is-on': draft.classId === item.id }"
          type="button"
          @click="draft.classId = item.id"
        >
          <span class="cv-card__top">
            <span class="cv-card__name">{{ item.name }}</span>
            <span class="cv-card__ring" aria-hidden="true"></span>
          </span>
          <span class="cv-card__stats">
            <span><em>{{ item.coreText || bonusText(item.core) }}</em></span>
            <span>生命骰 {{ item.hitDie }}</span>
          </span>
        </button>
      </div>

      <div v-if="klass" class="cv-detail">
        <div class="cv-detail__block">
          <h4>核心属性</h4>
          <p>{{ klass.coreText || bonusText(klass.core) }}</p>
        </div>

        <div class="cv-detail__grid">
          <div class="cv-detail__block">
            <h4>护甲熟练</h4>
            <p>{{ klass.armor || '—' }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>武器熟练</h4>
            <p>{{ klass.weapons || '—' }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>豁免熟练</h4>
            <p>{{ klass.saves || '—' }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>生命骰</h4>
            <p>{{ klass.hitDie || '—' }}</p>
          </div>
        </div>

        <div class="cv-detail__block">
          <h4>职业特性</h4>
          <p><strong>{{ klass.feature?.name }}</strong>　{{ klass.feature?.text }}</p>
        </div>

        <div class="cv-detail__grid">
          <div class="cv-detail__block">
            <h4>战斗定位</h4>
            <p>{{ klass.combat || '—' }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>非战斗定位</h4>
            <p>{{ klass.nonCombat || '—' }}</p>
          </div>
        </div>

        <p v-if="klass.note" class="cv-detail__note">{{ klass.note }}</p>
      </div>

      <div v-else class="cv-empty">尚未选择职业 · 每个职业的核心属性都会加进第八步的属性结算</div>
    </div>
  </section>
</template>

<style scoped>
.cv-classes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(188px, 1fr));
  gap: 9px;
}

.cv-class {
  gap: 6px;
  padding: 10px 12px;
}

.cv-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(120, 84, 40, 0.26);
  border-left: 2px solid var(--step-accent, var(--gold-400));
  border-radius: 2px;
  background: rgba(255, 250, 234, 0.42);
}

.cv-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.cv-detail__block h4 {
  margin-bottom: 4px;
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #55330f;
}

.cv-detail__block p {
  font-family: var(--font-flavor);
  font-size: 12.5px;
  line-height: 1.8;
  color: rgba(60, 38, 12, 0.84);
}

.cv-detail__block strong {
  font-family: var(--font-ui);
  font-weight: 500;
  color: #5c3a15;
}

.cv-detail__note {
  padding-top: 8px;
  border-top: 1px dashed rgba(120, 84, 40, 0.24);
  font-family: var(--font-flavor);
  font-size: 12px;
  color: rgba(90, 52, 24, 0.78);
}

@media (max-width: 760px) {
  .cv-detail__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
