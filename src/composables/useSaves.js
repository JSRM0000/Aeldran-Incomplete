import { computed, reactive, watch } from 'vue'

const STORAGE_KEY = 'aeldran.saves.v1'
export const MANUAL_SLOTS = 15
export const PAGE_SIZE = 5
export const PAGES = Math.ceil(MANUAL_SLOTS / PAGE_SIZE)
export const AUTO_SLOT = 0

function readStorage () {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return data
  } catch (error) {
    return null
  }
}

/** 演示存档：地址栏加 ?preview=save 时铺满一个自动档与三个手动档 */
function demoData () {
  const base = {
    version: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    playtime: 7 * 3600 + 12 * 60
  }
  const make = (slot, name, character, world, updatedAt, playtime) => ({
    ...base,
    version: 1,
    slot,
    name,
    playtime,
    updatedAt,
    character,
    world
  })

  return {
    auto: make(
      AUTO_SLOT,
      '长休之后 · 长夜旅店',
      { name: '灰烬旅人', level: 6, race: '半精灵', subrace: '森林精灵血统', className: '游侠', background: '城市猎人', difficulty: '平衡' },
      { chapter: '第三章 · 灰烬王庭', place: '灰烬王庭 · 长夜旅店', day: 47, hour: 7, minute: 20 },
      Date.now() - 1000 * 60 * 6,
      7 * 3600 + 40 * 60
    ),
    manual: {
      1: make(
        1,
        '灰烬王庭 · 长夜',
        { name: '灰烬旅人', level: 6, race: '半精灵', subrace: '森林精灵血统', className: '游侠', background: '城市猎人', difficulty: '平衡' },
        { chapter: '第三章 · 灰烬王庭', place: '灰烬王庭 · 长夜旅店', day: 47, hour: 6, minute: 55 },
        Date.now() - 1000 * 60 * 47,
        7 * 3600 + 12 * 60
      ),
      2: make(
        2,
        '银桥渡口 · 哨塔',
        { name: '灰烬旅人', level: 4, race: '半精灵', subrace: '森林精灵血统', className: '游侠', background: '城市猎人', difficulty: '平衡' },
        { chapter: '第二章 · 银桥渡口', place: '银桥渡口 · 渡口哨塔', day: 31, hour: 22, minute: 10 },
        new Date(2026, 9, 21, 0, 8).getTime(),
        3 * 3600 + 51 * 60
      ),
      3: make(
        3,
        '白石高地 · 旧祭坛',
        { name: '灰烬旅人', level: 2, race: '半精灵', subrace: '森林精灵血统', className: '游侠', background: '城市猎人', difficulty: '探索者' },
        { chapter: '第一章 · 白石高地', place: '白石高地 · 旧祭坛', day: 12, hour: 18, minute: 40 },
        new Date(2026, 9, 14, 21, 30).getTime(),
        1 * 3600 + 24 * 60
      )
    }
  }
}

function initial () {
  const stored = readStorage()
  if (stored && typeof stored === 'object') {
    return {
      auto: stored.auto || null,
      manual: stored.manual && typeof stored.manual === 'object' ? stored.manual : {}
    }
  }
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') === 'save') return demoData()
  } catch (error) {
    /* ignore */
  }
  return { auto: null, manual: {} }
}

export const saves = reactive(initial())

let timer = 0
watch(
  saves,
  () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
      } catch (error) {
        /* 隐私模式或配额不足时忽略 */
      }
    }, 200)
  },
  { deep: true }
)

export function formatGameTime (world) {
  if (!world) return '—'
  const pad = (value) => String(value ?? 0).padStart(2, '0')
  return `第 ${world.day ?? 1} 天 · ${pad(world.hour)}:${pad(world.minute)}`
}

export function formatPlaytime (seconds = 0) {
  const total = Math.max(0, Math.floor(seconds / 60))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分钟`
}

export function formatSavedAt (timestamp) {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function listManual () {
  const out = []
  for (let slot = 1; slot <= MANUAL_SLOTS; slot += 1) {
    out.push({ slot, save: saves.manual[slot] || null })
  }
  return out
}

export function pageOf (page) {
  const start = (page - 1) * PAGE_SIZE + 1
  return listManual().slice(start - 1, start - 1 + PAGE_SIZE)
}

export function firstEmptySlot () {
  for (let slot = 1; slot <= MANUAL_SLOTS; slot += 1) {
    if (!saves.manual[slot]) return slot
  }
  return 0
}

/** 写入一个手动档；没有指定槽位时挑第一个空位 */
export function writeManual (slot, payload) {
  const target = slot || firstEmptySlot()
  if (!target) return { ok: false, error: '手动存档位已满，请先删除一个存档' }
  saves.manual[target] = {
    version: 1,
    kind: 'manual',
    slot: target,
    ...payload,
    updatedAt: Date.now()
  }
  return { ok: true, slot: target }
}

/** 自动存档：只有一个槽位，新的覆盖旧的 */
export function writeAuto (payload) {
  saves.auto = {
    version: 1,
    kind: 'auto',
    slot: AUTO_SLOT,
    ...payload,
    updatedAt: Date.now()
  }
  return saves.auto
}

export function renameSave (kind, slot, name) {
  const target = kind === 'auto' ? saves.auto : saves.manual[slot]
  if (!target) return false
  target.name = name
  target.updatedAt = Date.now()
  return true
}

export function removeSave (kind, slot) {
  if (kind === 'auto') {
    saves.auto = null
    return
  }
  delete saves.manual[slot]
}

export const latestSave = computed(() => {
  const all = [saves.auto, ...Object.values(saves.manual)].filter(Boolean)
  if (!all.length) return null
  return all.reduce((best, item) => ((item.updatedAt || 0) > (best.updatedAt || 0) ? item : best), all[0])
})

export const saveCount = computed(() => Object.keys(saves.manual).length + (saves.auto ? 1 : 0))

/** 导出的 JSON 必须能再导入回来：只写稳定字段 */
export function exportPayload (save) {
  return {
    format: 'aeldran.save',
    version: 1,
    name: save.name,
    updatedAt: save.updatedAt,
    createdAt: save.createdAt ?? save.updatedAt,
    playtime: save.playtime ?? 0,
    character: save.character ?? {},
    world: save.world ?? {},
    extra: save.extra ?? {}
  }
}

export function downloadSave (save) {
  const payload = exportPayload(save)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = formatSavedAt(payload.updatedAt).replace(/[.:\s]/g, '-')
  link.href = url
  link.download = `${(payload.name || 'aeldran').replace(/[\\/:*?"<>|\s]/g, '_')}-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** 读取导入的存档文件，落到第一个空的手动存档位 */
export function importSave (raw) {
  let data
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (error) {
    return { ok: false, error: '文件不是合法的 JSON' }
  }
  if (!data || typeof data !== 'object' || !data.character) {
    return { ok: false, error: '这不是艾尔德兰的存档文件' }
  }
  const slot = firstEmptySlot()
  if (!slot) return { ok: false, error: '手动存档位已满，请先删除一个存档' }

  saves.manual[slot] = {
    version: 1,
    kind: 'manual',
    slot,
    name: data.name || '导入的存档',
    createdAt: data.createdAt || Date.now(),
    updatedAt: Date.now(),
    playtime: data.playtime || 0,
    character: data.character,
    world: data.world || {}
  }
  return { ok: true, slot, name: saves.manual[slot].name }
}
