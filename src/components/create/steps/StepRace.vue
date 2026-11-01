<script setup>
import { RACES, draft, race, raceRow } from '../../../composables/useCharacter.js'
import { bonusText } from '../../../utils/format.js'

function pick (item) {
  draft.raceId = item.id
  if (!item.hasSubrace) draft.subraceId = ''
  else if (!item.subraces.some((sub) => sub.id === draft.subraceId)) draft.subraceId = ''
}

function traitsOf (raceItem) {
  return (raceItem?.traits || []).map((trait) => trait.text).filter(Boolean)
}
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第三步 · 选择种族</h2>
      <p class="cv-step__kicker">血统决定天赋的起点，而非命运的终点。</p>
    </header>

    <div class="cv-step__body">
      <div class="cv-races">
        <button
          v-for="item in RACES"
          :key="item.id"
          class="cv-card cv-race"
          :class="{ 'is-on': draft.raceId === item.id }"
          type="button"
          @click="pick(item)"
        >
          <span class="cv-card__top">
            <span class="cv-card__name">{{ item.name }}</span>
            <span class="cv-card__ring" aria-hidden="true"></span>
          </span>
          <span class="cv-card__stats">
            <span><em>{{ bonusText(item.base?.bonus) }}</em></span>
          </span>
          <span class="cv-card__badge cv-race__badge">
            {{ item.hasSubrace ? `${item.subraces.length} 个亚种` : (item.base?.size || '') }}
          </span>
        </button>
      </div>

      <div v-if="race" class="cv-detail">
        <template v-if="!race.hasSubrace">
          <div class="cv-detail__meta">
            <span>体型 · {{ raceRow?.size || '—' }}</span>
            <span>速度 · {{ raceRow?.speed || '—' }}</span>
            <span>寿命 · {{ raceRow?.lifespan || '—' }}</span>
            <span>语言 · {{ raceRow?.languages || '—' }}</span>
          </div>

          <div class="cv-detail__block">
            <h4>属性调整 / 特性</h4>
            <p v-for="(text, index) in traitsOf(raceRow)" :key="index">{{ text }}</p>
            <p v-if="!traitsOf(raceRow).length" class="cv-detail__muted">该种族没有额外的属性调整。</p>
          </div>

          <div class="cv-detail__block">
            <h4>天赋</h4>
            <p v-for="(talent, index) in race.base?.talents || []" :key="index">
              <strong>{{ talent.name }}</strong>　{{ talent.text }}
            </p>
          </div>

          <p v-if="raceRow?.note" class="cv-detail__note">{{ raceRow.note }}</p>
        </template>

        <template v-else>
          <p class="cv-detail__lede">
            「{{ race.name }}」分为 {{ race.subraces.length }} 个亚种，体型、属性调整与天赋都在第四步「选择亚种」中确定。
          </p>
          <div class="cv-detail__block">
            <h4>可选亚种</h4>
            <p>{{ race.subraces.map((sub) => sub.subName).join(' · ') }}</p>
          </div>
          <p v-if="race.base?.creed" class="cv-detail__note">{{ race.base.creed }}</p>
        </template>
      </div>

      <div v-else class="cv-empty">尚未选择种族 · 从上方卡片中挑选一个血统</div>
    </div>
  </section>
</template>

<style scoped>
.cv-races {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(198px, 1fr));
  gap: 9px;
}

.cv-race {
  gap: 6px;
  padding: 11px 13px;
}

.cv-detail__lede {
  font-family: var(--font-flavor);
  font-size: 12.5px;
  line-height: 1.8;
  color: rgba(60, 38, 12, 0.84);
}

.cv-race__badge {
  align-self: flex-start;
  margin-top: 2px;
  font-size: 10px;
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

.cv-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-family: var(--font-ui);
  font-size: 11.5px;
  color: rgba(70, 45, 17, 0.72);
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
  color: rgba(90, 52, 24, 0.78);
}
</style>
