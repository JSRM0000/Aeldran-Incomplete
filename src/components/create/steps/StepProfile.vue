<script setup>
import { computed } from 'vue'
import SSelect from '../../settings/SSelect.vue'
import {
  APPEARANCE_GROUPS,
  GENDERS,
  appearanceValue,
  draft,
  gender,
  setAppearance
} from '../../../composables/useCharacter.js'

const genderOptions = GENDERS.map((item) => ({ value: item.id, label: item.name }))

function visible (field) {
  if (!field.need) return true
  return Boolean(gender.value?.parts?.includes(field.need))
}

const groups = computed(() =>
  APPEARANCE_GROUPS.map((group) => ({
    name: group.name,
    fields: group.fields.filter(visible)
  })).filter((group) => group.fields.length)
)

function optionsOf (field) {
  return (field.options || []).map((option) => ({ value: option.label, label: option.label }))
}
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第二步 · 角色基本资料</h2>
      <p class="cv-step__kicker">外貌与身体皆可留白，留给故事去慢慢填充。</p>
    </header>

    <div class="cv-step__body">
      <div class="cv-form cv-form--three">
        <label class="cv-field">
          <span class="cv-field__label">姓名 <i>必填以便存档命名</i></span>
          <input v-model="draft.name" class="cv-input" type="text" placeholder="例如：艾拉 · 灰烬" />
        </label>

        <label class="cv-field">
          <span class="cv-field__label">年龄 <i>可选</i></span>
          <input v-model="draft.age" class="cv-input" type="text" placeholder="例如：二十四" />
        </label>

        <div class="cv-field">
          <span class="cv-field__label">性别 <i>来自规则书「身体与生理」</i></span>
          <SSelect v-model="draft.genderId" :options="genderOptions" placeholder="请选择性别" />
        </div>
      </div>

      <p v-if="gender" class="cv-note">
        <strong>{{ gender.name }}</strong>　身体构成：{{ gender.body || '—' }}
        <template v-if="gender.physiology">　生理：{{ gender.physiology }}</template>
      </p>

      <div class="cv-appearance">
        <div v-for="group in groups" :key="group.name" class="cv-appearance__group">
          <h3 class="cv-appearance__title">{{ group.name }}</h3>
          <div class="cv-form cv-form--three">
            <div
              v-for="field in group.fields"
              :key="field.id"
              class="cv-field"
              :class="{ 'cv-field--num': field.type === 'number' }"
            >
              <span class="cv-field__label">
                {{ field.label }}
                <i v-if="field.type === 'number'">自行填写数值</i>
                <i v-else-if="field.hint">{{ field.hint }}</i>
              </span>
              <SSelect
                v-if="field.type === 'select'"
                :model-value="appearanceValue(field.id)"
                :options="optionsOf(field)"
                placeholder="不指定"
                @update:model-value="setAppearance(field.id, $event)"
              />
              <input
                v-else-if="field.type === 'number'"
                class="cv-input cv-input--num"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.1"
                placeholder="填写数值"
                :value="appearanceValue(field.id)"
                @input="setAppearance(field.id, $event.target.value)"
              />
              <input
                v-else
                class="cv-input"
                type="text"
                placeholder="自行填写"
                :value="appearanceValue(field.id)"
                @input="setAppearance(field.id, $event.target.value)"
              />
              <i v-if="field.type === 'number' && field.unit" class="cv-field__unit">{{ field.unit }}</i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cv-field--num {
  position: relative;
}

.cv-field--num .cv-field__unit {
  position: absolute;
  right: 14px;
  bottom: 11px;
  font-style: normal;
  font-family: var(--font-ui);
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: rgba(90, 60, 24, 0.55);
  pointer-events: none;
}

.cv-input--num {
  padding-right: 46px;
  font-variant-numeric: tabular-nums;
}

.cv-appearance {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cv-appearance__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(120, 84, 40, 0.24);
  border-radius: 2px;
  background: rgba(255, 250, 234, 0.34);
}

.cv-appearance__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.16em;
  color: #55330f;
}

.cv-appearance__title::before {
  content: "";
  width: 5px;
  height: 5px;
  rotate: 45deg;
  background: var(--step-accent, var(--gold-400));
}
</style>
