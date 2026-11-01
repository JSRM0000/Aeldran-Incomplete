import { computed, reactive, watch } from 'vue'
import { latestSave, removeSave, writeAuto } from './useSaves.js'

export { formatPlaytime, formatSavedAt } from './useSaves.js'

/** 当前旅程＝最近一次写入的存档（自动存档优先由存档模块决定） */
export const session = reactive({ current: latestSave.value })

watch(latestSave, (value) => {
  session.current = value
})

export const hasSession = computed(() => Boolean(session.current))

/** 冒险开始：立刻落一个自动存档，主菜单的「继续上一个游戏」随之点亮 */
export function beginJourney ({ character, world, name } = {}) {
  writeAuto({
    name: name || `${world?.chapter || '序章'} · 自动`,
    character: character || {},
    world: world || {},
    playtime: 0
  })
  return latestSave.value
}

export function clearJourney () {
  if (session.current) removeSave('auto', 0)
  session.current = latestSave.value
}
