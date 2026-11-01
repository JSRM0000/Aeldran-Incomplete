<script setup>
import { ref } from 'vue'
import {
  FREE_POINTS,
  addFree,
  attrRows,
  freeLeft,
  hiddenRows
} from '../../../composables/useCharacter.js'

const showHidden = ref(false)

function step (row, delta) {
  addFree(row.key, delta)
}

function signed (value) {
  return `${value > 0 ? '+' : ''}${value}`
}
</script>

<template>
  <section class="cv-step">
    <header class="cv-step__head">
      <h2 class="cv-step__title">第八步 · 属性值</h2>
      <p class="cv-step__kicker">
        {{ freeLeft > 0 ? `还余 ${freeLeft} / ${FREE_POINTS} 点自由属性，用右侧加减分配` : '自由属性已分配完毕' }}
      </p>
    </header>

    <div class="cv-step__body">
      <div class="cv-attrs">
        <div v-for="row in attrRows" :key="row.key" class="cv-attr">
          <span class="cv-attr__name">{{ row.name }}</span>
          <span class="cv-attr__value">{{ row.total }}</span>
          <span class="cv-attr__calc">
            <span>{{ row.base }}</span>
            <template v-if="row.raceBonus">
              <span>· 种族</span><b>{{ signed(row.raceBonus) }}</b>
            </template>
            <template v-if="row.classBonus">
              <span>· 职业</span><b>{{ signed(row.classBonus) }}</b>
            </template>
            <template v-if="row.free">
              <span>· 自由</span><b>{{ signed(row.free) }}</b>
            </template>
            <span v-if="!row.raceBonus && !row.classBonus && !row.free" class="cv-attr__plain">无调整</span>
          </span>
          <span class="cv-attr__free">
            <span class="cv-stepper">
              <button type="button" aria-label="减一点" :disabled="row.free <= 0" @click="step(row, -1)">−</button>
              <span>{{ row.free }}</span>
              <button type="button" aria-label="加一点" :disabled="freeLeft <= 0" @click="step(row, 1)">＋</button>
            </span>
          </span>
          <span class="cv-attr__mod">{{ signed(row.mod) }}</span>
        </div>
      </div>


      <div class="cv-debug-zone">
        <button class="btn btn--ghost btn--sm" type="button" @click="showHidden = !showHidden">
          {{ showHidden ? '隐藏调试信息' : '显示调试信息' }}
        </button>
        <p v-if="!showHidden" class="cv-debug__hint">性技与羞耻由引擎内部计算，默认不在界面上展示。</p>

        <div v-else class="cv-debug">
          <span v-for="row in hiddenRows" :key="row.key">
            {{ row.name }} <b>{{ row.value }}</b>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cv-attr__plain {
  opacity: 0.5;
}

.cv-debug-zone {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.cv-debug__hint {
  font-family: var(--font-flavor);
  font-size: 11.5px;
  color: rgba(80, 52, 20, 0.58);
}
</style>
