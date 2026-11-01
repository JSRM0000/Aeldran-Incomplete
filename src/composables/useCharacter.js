import { computed, reactive } from 'vue'
import {
  APPEARANCE_GROUPS,
  ATTRIBUTES,
  BACKGROUNDS,
  CLASSES,
  FEATS,
  GENDERS,
  RACES,
  SKILLS
} from '../data/rules.generated.js'
import { DEFAULT_DIFFICULTY, findDifficulty } from '../data/difficulties.js'
import { toolKindFrom, toolOptions } from '../data/tools.js'

export const BASE_ATTR = 12
export const FREE_POINTS = 2

export { APPEARANCE_GROUPS, ATTRIBUTES, BACKGROUNDS, CLASSES, FEATS, GENDERS, RACES, SKILLS }

/* 性技 / 羞耻 只在两处有初始调整值（规则书：魅魔备注、风流客说明） */
const HIDDEN_ADJUST = {
  'RACE-009-03': { sex: 70, sha: -80 },
  'CLS-019': { sex: 20, sha: -15 }
}

export const VISIBLE_ATTRS = ATTRIBUTES.filter((item) => !item.hidden)
export const HIDDEN_ATTRS = ATTRIBUTES.filter((item) => item.hidden)

function blank () {
  return {
    difficulty: DEFAULT_DIFFICULTY,
    name: '',
    age: '',
    genderId: '',
    appearance: {},
    raceId: '',
    subraceId: '',
    classId: '',
    backgroundId: '',
    skills: [],
    toolKinds: [],
    toolPicks: {},
    free: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  }
}

export const draft = reactive(blank())

export function resetDraft () {
  Object.assign(draft, blank())
  draft.appearance = {}
  draft.free = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  draft.skills = []
  draft.toolKinds = []
  draft.toolPicks = {}
}

/* ---------- 选择结果 ---------- */

export const race = computed(() => RACES.find((item) => item.id === draft.raceId) || null)

export const subrace = computed(() => {
  if (!race.value?.hasSubrace) return null
  return race.value.subraces.find((item) => item.id === draft.subraceId) || null
})

/** 种族加值 / 天赋的实际来源：有亚种时看亚种，没有就看种族本身 */
export const raceRow = computed(() => (race.value?.hasSubrace ? subrace.value : race.value?.base) || null)

export const klass = computed(() => CLASSES.find((item) => item.id === draft.classId) || null)

export const background = computed(() => BACKGROUNDS.find((item) => item.id === draft.backgroundId) || null)

export const feat = computed(() => (background.value ? FEATS[background.value.featId] || null : null))

export const gender = computed(() => GENDERS.find((item) => item.id === draft.genderId) || null)

export const difficulty = computed(() => findDifficulty(draft.difficulty))

export const difficultyName = computed(() => difficulty.value.name)

/* ---------- 属性 ---------- */

export function bonusOf (key) {
  const raceBonus = raceRow.value?.bonus?.[key] || 0
  const classBonus = klass.value?.core?.[key] || 0
  return raceBonus + classBonus
}

export function raceBonusOf (key) {
  return raceRow.value?.bonus?.[key] || 0
}

export function classBonusOf (key) {
  return klass.value?.core?.[key] || 0
}

export const freeUsed = computed(() =>
  Object.values(draft.free).reduce((sum, value) => sum + (Number(value) || 0), 0)
)

export const freeLeft = computed(() => FREE_POINTS - freeUsed.value)

export function modifierOf (value) {
  return Math.floor((value - 10) / 2)
}

export const attrRows = computed(() =>
  VISIBLE_ATTRS.map((attr) => {
    const base = BASE_ATTR
    const raceBonus = raceBonusOf(attr.key)
    const classBonus = classBonusOf(attr.key)
    const free = Number(draft.free[attr.key]) || 0
    const total = base + raceBonus + classBonus + free
    return {
      key: attr.key,
      id: attr.id,
      name: attr.name,
      abbr: attr.abbr,
      base,
      raceBonus,
      classBonus,
      free,
      total,
      mod: modifierOf(total)
    }
  })
)

export function addFree (key, delta) {
  const current = Number(draft.free[key]) || 0
  const next = current + delta
  if (next < 0) return
  if (delta > 0 && freeLeft.value <= 0) return
  if (BASE_ATTR + bonusOf(key) + next > 20) return
  draft.free[key] = next
}

/* 调试面板：性技 / 羞耻 */
export const hiddenRows = computed(() => {
  const adjust = { ...(HIDDEN_ADJUST[draft.raceId] || {}) }
  const classAdjust = HIDDEN_ADJUST[draft.classId] || {}
  // 亚种优先：魅魔的调整挂在亚种上
  const subAdjust = HIDDEN_ADJUST[draft.subraceId] || {}
  const sex = (adjust.sex || 0) + (subAdjust.sex || 0) + (classAdjust.sex || 0)
  const sha = (adjust.sha || 0) + (subAdjust.sha || 0) + (classAdjust.sha || 0)
  return HIDDEN_ATTRS.map((attr) => ({
    key: attr.key,
    name: attr.name,
    abbr: attr.abbr,
    value: attr.key === 'sex' ? Math.max(0, sex) : Math.max(0, 100 + sha),
    note: attr.note
  }))
})

/* ---------- 熟练项 ---------- */

export const skillChoices = computed(() => {
  const skills = background.value?.skills
  if (!skills || skills.mode !== 'choose') return []
  return skills.from.map((name) => ({ name, ...(SKILLS.find((item) => item.name === name) || {}) }))
})

export function toggleSkill (name) {
  const index = draft.skills.indexOf(name)
  if (index >= 0) draft.skills.splice(index, 1)
  else if (draft.skills.length < (background.value?.skills?.count || 2)) draft.skills.push(name)
}

export const skillList = computed(() => {
  const skills = background.value?.skills
  if (!skills) return []
  if (skills.mode === 'fixed') return skills.items.map((name) => ({ name, fixed: true }))
  return skills.from.map((name) => ({
    name,
    fixed: false,
    on: draft.skills.includes(name)
  }))
})

export const toolInfo = computed(() => {
  const tools = background.value?.tools
  if (!tools) return null
  return tools
})

export const toolChoices = computed(() => {
  const tools = toolInfo.value
  if (!tools) return []
  if (tools.mode === 'choose') {
    return tools.from
      .filter((kind) => draft.toolKinds.includes(kind))
      .map((kind) => ({ kind, options: toolOptions(kind) }))
  }
  if (tools.mode === 'pick') {
    const kind = toolKindFrom(tools.pick)
    return [{ kind, options: toolOptions(kind), single: true }]
  }
  return []
})

export function toggleToolKind (kind) {
  const index = draft.toolKinds.indexOf(kind)
  if (index >= 0) {
    draft.toolKinds.splice(index, 1)
    delete draft.toolPicks[kind]
  } else if (draft.toolKinds.length < (toolInfo.value?.count || 2)) {
    draft.toolKinds.push(kind)
  }
}

export function setToolPick (kind, value) {
  draft.toolPicks[kind] = value
}

/* ---------- 从存档/角色槽恢复 ---------- */

export function applyCharacter (data) {
  if (!data || typeof data !== 'object') return
  resetDraft()
  draft.difficulty = data.difficulty || DEFAULT_DIFFICULTY
  draft.name = data.name || ''
  draft.age = data.age || ''
  draft.genderId = data.genderId || ''
  draft.raceId = data.raceId || ''
  draft.subraceId = data.subraceId || ''
  draft.classId = data.classId || ''
  draft.backgroundId = data.backgroundId || ''
  Object.assign(draft.appearance, data.appearance || {})
  Object.assign(draft.free, data.free || {})
  draft.skills = Array.isArray(data.skills) ? [...data.skills] : []
  draft.toolKinds = Array.isArray(data.toolKinds) ? [...data.toolKinds] : []
  Object.assign(draft.toolPicks, data.toolPicks || {})
}

export function snapshot () {
  return {
    version: 1,
    difficulty: draft.difficulty,
    name: draft.name,
    age: draft.age,
    genderId: draft.genderId,
    appearance: { ...draft.appearance },
    raceId: draft.raceId,
    subraceId: draft.subraceId,
    classId: draft.classId,
    backgroundId: draft.backgroundId,
    skills: [...draft.skills],
    toolKinds: [...draft.toolKinds],
    toolPicks: { ...draft.toolPicks },
    free: { ...draft.free }
  }
}

/** 给存档/日志用的摘要 */
export function summary () {
  return {
    name: draft.name || '无名旅人',
    level: 1,
    difficulty: difficultyName.value,
    race: race.value?.name || '',
    subrace: subrace.value?.name || '',
    className: klass.value?.name || '',
    background: background.value?.name || ''
  }
}

export function appearanceValue (fieldId) {
  return draft.appearance[fieldId] || ''
}

export function setAppearance (fieldId, value) {
  if (value) draft.appearance[fieldId] = value
  else delete draft.appearance[fieldId]
}
