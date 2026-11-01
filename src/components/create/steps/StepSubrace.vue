<script setup>
import { computed } from 'vue'
import { draft, race, subrace } from '../../../composables/useCharacter.js'
import { bonusText } from '../../../utils/format.js'

const options = computed(() => race.value?.subraces || [])
const current = computed(() => subrace.value || options.value[0] || null)

function traitsOf (row) {
  return (row?.traits || []).map((trait) => trait.text).filter(Boolean)
}
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第四步 · 选择亚种</h2>
      <p class="cv-step__kicker">同一种血统，也可能走向截然不同的方向。</p>
    </header>

    <div class="cv-step__body">
      <template v-if="!race">
        <div class="cv-empty">请先在第三步选择一个种族</div>
      </template>

      <template v-else-if="!race.hasSubrace">
        <p class="cv-note">
          <strong>{{ race.name }}</strong>没有亚种分支。这一步可以直接跳过，属性与天赋已在上一步确定。
        </p>
      </template>

      <template v-else>
        <div class="cv-cards cv-cards--two">
          <button
            v-for="item in options"
            :key="item.subId"
            class="cv-card"
            :class="{ 'is-on': draft.subraceId === (item.subId || item.id) }"
            type="button"
            @click="draft.subraceId = item.subId || item.id"
          >
            <span class="cv-card__top">
              <span class="cv-card__name">{{ item.subName || item.name }}</span>
              <span class="cv-card__ring" aria-hidden="true"></span>
            </span>
            <span class="cv-card__stats">
              <span><em>{{ bonusText(item.bonus) }}</em></span>
              <span>{{ item.size }}</span>
              <span>{{ item.speed }}</span>
            </span>
          </button>
        </div>

        <div v-if="current" class="cv-detail">
          <div class="cv-detail__meta">
            <span>属性调整 · <em>{{ bonusText(current.bonus) }}</em></span>
            <span>体型 · {{ current.size }}</span>
            <span>速度 · {{ current.speed }}</span>
            <span>寿命 · {{ current.lifespan }}</span>
            <span>语言 · {{ current.languages }}</span>
          </div>

          <div class="cv-detail__block">
            <h4>属性调整 / 特性</h4>
            <p v-for="(text, index) in traitsOf(current)" :key="index">{{ text }}</p>
            <p v-if="!traitsOf(current).length" class="cv-detail__muted">无额外调整。</p>
          </div>

          <div class="cv-detail__block">
            <h4>天赋</h4>
            <p v-for="(talent, index) in current.talents || []" :key="index">
              <strong>{{ talent.name }}</strong>　{{ talent.text }}
            </p>
            <p v-if="!(current.talents || []).length" class="cv-detail__muted">该亚种没有单独的天赋。</p>
          </div>

          <p v-if="current.note" class="cv-detail__note">{{ current.note }}</p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
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

.cv-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-family: var(--font-ui);
  font-size: 11.5px;
  color: rgba(70, 45, 17, 0.72);
}

.cv-detail__meta em {
  font-style: normal;
  color: var(--step-accent, #6f9d8f);
}

.cv-detail__block h4 {
  margin-bottom: 5px;
  font-family: var(--font-display);
  font-size: 12.5px;
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

.cv-detail__muted {
  font-family: var(--font-flavor);
  font-size: 12px;
  color: rgba(80, 52, 20, 0.58);
}

.cv-detail__note {
  padding-top: 8px;
  border-top: 1px dashed rgba(120, 84, 40, 0.24);
  font-family: var(--font-flavor);
  font-size: 12px;
  line-height: 1.8;
  white-space: pre-line;
  color: rgba(90, 52, 24, 0.78);
}
</style>
