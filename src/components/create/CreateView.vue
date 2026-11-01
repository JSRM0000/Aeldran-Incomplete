<script setup>
import { computed, ref } from 'vue'
import Icon from '../settings/Icon.vue'
import SettingsDialog from '../panels/SettingsDialog.vue'
import InputModal from '../settings/InputModal.vue'
import ConfirmModal from '../settings/ConfirmModal.vue'
import StepRail from './StepRail.vue'
import StepDifficulty from './steps/StepDifficulty.vue'
import StepProfile from './steps/StepProfile.vue'
import StepRace from './steps/StepRace.vue'
import StepSubrace from './steps/StepSubrace.vue'
import StepClass from './steps/StepClass.vue'
import StepOrigin from './steps/StepOrigin.vue'
import StepProficiency from './steps/StepProficiency.vue'
import StepAttributes from './steps/StepAttributes.vue'
import {
  background,
  draft,
  freeLeft,
  klass,
  race,
  resetDraft,
  subrace,
  summary
} from '../../composables/useCharacter.js'
import {
  characterSlots,
  deleteCharacter,
  loadCharacter,
  saveCharacter
} from '../../composables/useCharacters.js'

const emit = defineEmits(['close', 'enter', 'notify'])

const asset = (path) => `${import.meta.env.BASE_URL}${path}`

const STEP_VIEWS = {
  1: StepDifficulty,
  2: StepProfile,
  3: StepRace,
  4: StepSubrace,
  5: StepClass,
  6: StepOrigin,
  7: StepProficiency,
  8: StepAttributes
}

const META = [
  { key: 'difficulty', label: '选定难度', accent: '#c39a4a' },
  { key: 'profile', label: '基本资料', accent: '#c98a4b' },
  { key: 'race', label: '选择种族', accent: '#8fa46a' },
  { key: 'subrace', label: '选择亚种', accent: '#6f9d8f' },
  { key: 'class', label: '选择职业', accent: '#b06a44' },
  { key: 'origin', label: '确定出身', accent: '#a385a8' },
  { key: 'proficiency', label: '选择熟练项', accent: '#74899f' },
  { key: 'attributes', label: '属性值', accent: '#cf9f3f' }
]

const initialStep = Number(new URLSearchParams(window.location.search).get('step')) || 1
const step = ref(Math.min(8, Math.max(1, initialStep)))

const current = computed(() => META[step.value - 1])
const view = computed(() => STEP_VIEWS[step.value])

const railSteps = computed(() =>
  META.slice(1).map((meta, index) => ({
    key: meta.key,
    numeral: String(index + 1).padStart(2, '0'),
    label: meta.label,
    accent: meta.accent,
    sub: subLabel(meta.key)
  }))
)

function subLabel (key) {
  if (key === 'profile') return draft.name || '尚未命名'
  if (key === 'race') return race.value?.name || '未选择'
  if (key === 'subrace') {
    if (!race.value) return '未选择'
    return race.value.hasSubrace ? (subrace.value?.subName || '未选择') : '无需选择'
  }
  if (key === 'class') return klass.value?.name || '未选择'
  if (key === 'origin') return background.value?.name || '未选择'
  if (key === 'proficiency') {
    const skills = background.value?.skills
    if (!skills) return '待定'
    if (skills.mode === 'fixed') return `${(skills.items || []).length} 项技能`
    return `技能 ${draft.skills.length}/${skills.count || 2}`
  }
  if (key === 'attributes') return `自由点 ${freeLeft.value}`
  return ''
}

/* ---- 校验 ---- */
function validate (target) {
  if (target >= 3 && !draft.name.trim()) return '请先填写角色姓名'
  if (target >= 4 && !draft.raceId) return '请先在第三步选择种族'
  if (target >= 5 && race.value?.hasSubrace && !draft.subraceId) return '请先在第四步选择亚种'
  if (target >= 6 && !draft.classId) return '请先在第五步选择职业'
  if (target >= 7 && !draft.backgroundId) return '请先在第六步确定出身'
  return ''
}

function go (next) {
  const message = validate(next)
  if (message) {
    emit('notify', message)
    return
  }
  step.value = Math.min(8, Math.max(1, next))
}

/* ---- 角色存档 ---- */
const activeSlot = ref(1)
const naming = ref(false)
const namingValue = ref('')
const removing = ref(false)
const settingsOpen = ref(false)

const slot = computed(() => characterSlots.value.find((item) => item.slot === activeSlot.value))

function selectSlot (index) {
  activeSlot.value = index
}

function openNaming () {
  if (!draft.name.trim()) {
    emit('notify', '请先填写角色姓名')
    return
  }
  namingValue.value = slot.value?.data?.label || draft.name
  naming.value = true
}

function confirmNaming (value) {
  const label = String(value || '').trim()
  if (!label) return
  saveCharacter(activeSlot.value, label)
  naming.value = false
  emit('notify', `已保存到角色槽位 ${activeSlot.value}`)
}

function readSlot () {
  if (!slot.value?.data) {
    emit('notify', '该槽位还没有角色')
    return
  }
  loadCharacter(activeSlot.value)
  step.value = 2
  emit('notify', '角色设定已载入')
}

function confirmRemove () {
  deleteCharacter(activeSlot.value)
  removing.value = false
  emit('notify', '角色存档已删除')
}

function startOver () {
  resetDraft()
  step.value = 1
}

function startAdventure () {
  const message = validate(8)
  if (message) {
    emit('notify', message)
    return
  }
  const character = summary()
  emit('enter', {
    character,
    name: `${character.name} · 序章`,
    world: {
      chapter: '序章 · 灰烬中的第一缕光',
      place: '灰烬王庭 · 王座前',
      day: 1,
      hour: 18,
      minute: 40
    }
  })
}
</script>

<template>
  <div class="cv">
    <div class="cv__bg" :style="{ backgroundImage: `url(${asset('Picture/Background/front-page.png')})` }" aria-hidden="true"></div>
    <div class="cv__veil" aria-hidden="true"></div>

    <header class="cv__brand">
      <img class="cv__crest" :src="asset('Picture/LOGO/LOGO.png')" alt="艾尔德兰徽记" />
      <span class="cv__brand-text">
        <span class="cv__cn">艾尔德兰</span>
        <span class="cv__en">AELDRAN</span>
      </span>
      <button class="cv__quit" type="button" @click="emit('close')">
        <Icon name="back" :size="13" />
        返回主菜单
      </button>
    </header>

    <div class="cv__frame parchment">
      <div class="cv__saves">
        <span class="cv__saves-label"><Icon name="book" :size="13" />角色存档</span>
        <div class="cv__slots">
          <button
            v-for="item in characterSlots"
            :key="item.slot"
            class="cv-slot"
            :class="{ 'is-on': activeSlot === item.slot }"
            type="button"
            @click="selectSlot(item.slot)"
          >
            <span class="cv-slot__num">{{ item.slot }}</span>
            <span class="cv-slot__name" :class="{ 'is-empty': !item.data }">
              {{ item.data ? item.data.label : '空槽位' }}
            </span>
          </button>
        </div>
        <div class="cv__save-actions">
          <button class="btn btn--sm" type="button" @click="openNaming">保存角色</button>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="!slot?.data" @click="readSlot">读取</button>
          <button class="btn btn--danger btn--sm" type="button" :disabled="!slot?.data" @click="removing = true">删除</button>
        </div>
      </div>

      <div class="cv__body" :class="{ 'cv__body--single': step === 1 }">
        <StepRail
          v-if="step > 1"
          :steps="railSteps"
          :active="step - 2"
          @select="(index) => go(index + 2)"
        />

        <div class="cv__main" :style="{ '--step-accent': current.accent }">
          <div class="cv__panel scroll-thin" :class="{ 'cv__panel--center': step === 1 }">
            <component :is="view" :key="step" />
          </div>

          <footer class="cv-step__foot">
            <div class="cv-step__foot-left">
              <button v-if="step > 1" class="btn btn--ghost btn--sm" type="button" @click="go(step - 1)">
                上一步
              </button>
              <button v-if="step === 1" class="btn btn--ghost btn--sm" type="button" @click="startOver">
                清空设定
              </button>
            </div>

            <div class="cv-step__foot-right">
              <template v-if="step === 8">
                <button class="btn btn--ghost btn--sm" type="button" @click="settingsOpen = true">系统设置</button>
                <button class="btn btn--ember btn--sm" type="button" @click="startAdventure">开始冒险</button>
              </template>
              <button v-else class="btn btn--primary btn--sm" type="button" @click="go(step + 1)">
                下一步
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>

    <InputModal
      :open="naming"
      title="命名该角色"
      label="角色存档名称"
      :model-value="namingValue"
      placeholder="例如：艾拉 · 灰烬"
      @confirm="confirmNaming"
      @cancel="naming = false"
    />

    <ConfirmModal
      :open="removing"
      title="确定删除该角色？"
      :message="`角色槽位 ${activeSlot} 的设定将从本机移除，此操作无法撤销。`"
      confirm-text="确认删除"
      danger
      @confirm="confirmRemove"
      @cancel="removing = false"
    />

    <SettingsDialog v-if="settingsOpen" @close="settingsOpen = false" @notify="emit('notify', $event)" />
  </div>
</template>

<style scoped>
.cv__quit {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border: 1px solid rgba(196, 154, 74, 0.34);
  border-radius: 2px;
  background: rgba(28, 17, 7, 0.42);
  font-family: var(--font-ui);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(240, 224, 190, 0.86);
  transition: all 0.24s var(--ease-out);
}

.cv__quit:hover {
  border-color: rgba(226, 192, 122, 0.62);
  background: rgba(46, 29, 12, 0.6);
  color: #fdf0cd;
}
</style>
