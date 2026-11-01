<script setup>
import SSelect from '../../settings/SSelect.vue'
import {
  background,
  draft,
  setToolPick,
  skillChoices,
  skillList,
  toolChoices,
  toolInfo,
  toggleSkill,
  toggleToolKind
} from '../../../composables/useCharacter.js'

function pickOption (kind) {
  return (toolChoices.value.find((item) => item.kind === kind)?.options || [])
}
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第七步 · 选择熟练项</h2>
      <p class="cv-step__kicker">熟练项来自出身，多数只能查看，少数可以选择。</p>
    </header>

    <div class="cv-step__body">
      <div v-if="!background" class="cv-empty">请先在第六步选择出身</div>

      <div v-else class="cv-prof">
        <div class="cv-prof__col">
          <h3 class="cv-prof__title">技能熟练</h3>
          <p class="cv-prof__hint">
            {{ background.skills?.text || '由出身固定赋予的技能熟练。' }}
          </p>

          <div class="cv-chips">
            <span
              v-for="item in skillList"
              :key="item.name"
              class="cv-chip"
              :class="{
                'is-fixed': item.fixed,
                'is-on': !item.fixed && item.on,
                'is-off': !item.fixed && !item.on
              }"
              :role="item.fixed ? undefined : 'button'"
              :tabindex="item.fixed ? undefined : 0"
              @click="item.fixed ? null : toggleSkill(item.name)"
              @keydown.enter.prevent="item.fixed ? null : toggleSkill(item.name)"
            >
              {{ item.name }}
              <small v-if="item.fixed">已固定</small>
              <small v-else-if="item.on">已选</small>
            </span>
          </div>

          <p v-if="skillChoices.length" class="cv-prof__count">
            已选 {{ draft.skills.length }} / {{ background.skills?.count || 2 }}
          </p>
        </div>

        <div class="cv-prof__col">
          <h3 class="cv-prof__title">工具熟练</h3>
          <p class="cv-prof__hint">{{ toolInfo?.text || '由出身固定赋予的工具熟练。' }}</p>

          <template v-if="toolInfo?.mode === 'fixed'">
            <div class="cv-chips">
              <span v-for="name in toolInfo.items" :key="name" class="cv-chip is-fixed">
                {{ name }}
                <small>已固定</small>
              </span>
            </div>
            <p v-if="!(toolInfo.items || []).length" class="cv-prof__count">该出身没有工具熟练。</p>
          </template>

          <template v-else-if="toolInfo">
            <div class="cv-chips">
              <span
                v-for="item in toolInfo.mode === 'choose' ? toolInfo.from : [toolInfo.pick]"
                :key="item"
                class="cv-chip"
                :class="{
                  'is-fixed': toolInfo.mode === 'pick',
                  'is-on': toolInfo.mode === 'pick' || draft.toolKinds.includes(item),
                  'is-off': toolInfo.mode !== 'pick' && !draft.toolKinds.includes(item)
                }"
                role="button"
                tabindex="0"
                @click="toolInfo.mode === 'pick' ? null : toggleToolKind(item)"
                @keydown.enter.prevent="toolInfo.mode === 'pick' ? null : toggleToolKind(item)"
              >
                {{ item }}
                <small v-if="toolInfo.mode === 'pick'">已固定</small>
              </span>
            </div>

            <p v-if="toolInfo.mode === 'choose'" class="cv-prof__count">
              已选 {{ draft.toolKinds.length }} / {{ toolInfo.count || 2 }}
            </p>

            <div
              v-for="item in toolChoices"
              :key="item.kind"
              class="cv-prof__pick"
            >
              <span class="cv-field__label">{{ item.kind }}的具体种类</span>
              <SSelect
                :model-value="draft.toolPicks[item.kind] || ''"
                :options="pickOption(item.kind)"
                placeholder="请选择"
                @update:model-value="setToolPick(item.kind, $event)"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cv-prof {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.cv-prof__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(120, 84, 40, 0.26);
  border-radius: 2px;
  background: rgba(255, 250, 234, 0.4);
}

.cv-prof__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.14em;
  color: #55330f;
}

.cv-prof__title::before {
  content: "";
  width: 6px;
  height: 6px;
  rotate: 45deg;
  background: var(--step-accent, var(--gold-400));
}

.cv-prof__hint {
  font-family: var(--font-flavor);
  font-size: 12px;
  line-height: 1.7;
  color: rgba(70, 45, 17, 0.7);
}

.cv-prof__count {
  font-family: var(--font-ui);
  font-size: 11.5px;
  color: rgba(70, 45, 17, 0.62);
}

.cv-prof__pick {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

@media (max-width: 860px) {
  .cv-prof {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
