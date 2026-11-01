import { computed, reactive, watch } from 'vue'
import { applyCharacter, snapshot } from './useCharacter.js'

const STORAGE_KEY = 'aeldran.characters.v1'
export const CHARACTER_SLOTS = 3

function readStorage () {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    if (data && typeof data === 'object') return data
  } catch (error) {
    /* ignore */
  }
  return {}
}

export const characters = reactive(readStorage())

let timer = 0
watch(
  characters,
  () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
      } catch (error) {
        /* ignore */
      }
    }, 200)
  },
  { deep: true }
)

export const characterSlots = computed(() =>
  Array.from({ length: CHARACTER_SLOTS }, (_, index) => {
    const slot = index + 1
    return { slot, data: characters[slot] || null }
  })
)

export function saveCharacter (slot, label) {
  const character = snapshot()
  characters[slot] = {
    label: label || character.name || `角色 ${slot}`,
    savedAt: Date.now(),
    character
  }
  return characters[slot]
}

export function loadCharacter (slot) {
  const entry = characters[slot]
  if (!entry) return false
  applyCharacter(entry.character)
  return true
}

export function renameCharacter (slot, label) {
  if (!characters[slot]) return false
  characters[slot].label = label
  return true
}

export function deleteCharacter (slot) {
  delete characters[slot]
}

export function characterSummary (entry) {
  if (!entry) return ''
  const character = entry.character || {}
  const bits = [character.name || '无名旅人']
  if (character.raceId) bits.push(String(character.raceId).replace('RACE-', '种族 '))
  return bits.join(' · ')
}
