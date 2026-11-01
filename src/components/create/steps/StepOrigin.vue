<script setup>
import { BACKGROUNDS, background, draft, feat } from '../../../composables/useCharacter.js'

function skillsText (item) {
  const skills = item?.skills
  if (!skills) return '—'
  if (skills.mode === 'fixed') return (skills.items || []).join('、')
  return skills.text || (skills.from || []).join('、')
}

function toolsText (item) {
  const tools = item?.tools
  if (!tools) return '—'
  if (tools.mode === 'fixed') return (tools.items || []).join('、')
  return tools.text || [tools.pick, ...(tools.from || [])].filter(Boolean).join('、')
}
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第六步 · 确定出身</h2>
      <p class="cv-step__kicker">出身决定了你在踏入冒险之前，已经学会了什么。</p>
    </header>

    <div class="cv-step__body">
      <div class="cv-bgs">
        <button
          v-for="item in BACKGROUNDS"
          :key="item.id"
          class="cv-card cv-bg"
          :class="{ 'is-on': draft.backgroundId === item.id }"
          type="button"
          @click="draft.backgroundId = item.id"
        >
          <span class="cv-card__top">
            <span class="cv-card__name">{{ item.name }}</span>
            <span class="cv-card__ring" aria-hidden="true"></span>
          </span>
          <span class="cv-card__stats">
            <span><em>{{ item.featName || '专长' }}</em></span>
          </span>
        </button>
      </div>

      <div v-if="background" class="cv-detail">
        <div class="cv-detail__block">
          <h4>专长 · {{ background.featName }}</h4>
          <p v-for="(line, index) in feat?.lines || []" :key="index">{{ line }}</p>
          <p v-if="feat?.note" class="cv-detail__note">{{ feat.note }}</p>
          <p v-if="!(feat?.lines || []).length" class="cv-detail__muted">该专长暂无详细条目。</p>
        </div>

        <div class="cv-detail__grid">
          <div class="cv-detail__block">
            <h4>技能熟练</h4>
            <p>{{ skillsText(background) }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>工具熟练</h4>
            <p>{{ toolsText(background) }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>语言</h4>
            <p>{{ background.languages || '—' }}</p>
          </div>
          <div class="cv-detail__block">
            <h4>初始金币</h4>
            <p>{{ background.gold || '—' }}</p>
          </div>
        </div>

        <div v-if="background.description" class="cv-detail__block">
          <h4>经历</h4>
          <p>{{ background.description }}</p>
        </div>
      </div>

      <div v-else class="cv-empty">尚未选择出身 · 出身决定专长与第七步的熟练项</div>
    </div>
  </section>
</template>

<style scoped>
.cv-bgs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(182px, 1fr));
  gap: 9px;
}

.cv-bg {
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

.cv-detail__muted {
  font-family: var(--font-flavor);
  font-size: 12px;
  color: rgba(80, 52, 20, 0.58);
}

.cv-detail__note {
  margin-top: 6px;
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
