<script setup>
import { computed, ref } from 'vue'
import Icon from '../../settings/Icon.vue'
import ConfirmModal from '../../settings/ConfirmModal.vue'
import {
  deletePrompt,
  deleteTavernPreset,
  demoLoading,
  exportAllTavernPresets,
  exportTavernPreset,
  importTavernPreset,
  settings
} from '../../../composables/useSettings'

const emit = defineEmits(['notify'])

const view = ref('list')
const expanded = ref('')
const pendingDelete = ref(null)
const fileInput = ref(null)

const ROLES = [
  { value: 'system', label: '系统' },
  { value: 'user', label: '用户' },
  { value: 'assistant', label: '助手' }
]

const ROLE_LABEL = { system: '系统', user: '用户', assistant: '助手' }

const roleText = (role) => ROLE_LABEL[role] || role || '系统'

const presets = computed(() => settings.tavern.presets)

const activePreset = computed(
  () => presets.value.find((preset) => preset.id === settings.tavern.activePresetId) || null
)

function notify (text) {
  emit('notify', text)
}

function openPreset (preset) {
  settings.tavern.activePresetId = preset.id
  expanded.value = ''
  view.value = 'detail'
}

function backToList () {
  view.value = 'list'
  expanded.value = ''
}

function togglePrompt (id) {
  expanded.value = expanded.value === id ? '' : id
}

/* ---------- 导入 / 导出 ---------- */

function pickFile () {
  fileInput.value?.click()
}

async function onFile (event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const raw = JSON.parse(text)
    const name = file.name.replace(/\.json$/i, '')
    const preset = importTavernPreset(raw, name)
    notify(`已导入预设《${preset.name}》，共 ${preset.prompts.length} 条提示词`)
  } catch {
    notify('导入失败：文件不是合法的预设 JSON')
  }
}

function exportAll () {
  if (!presets.value.length) {
    notify('还没有可导出的预设')
    return
  }
  exportAllTavernPresets()
  notify(`已导出 ${presets.value.length} 个预设`)
}

function exportOne (preset) {
  exportTavernPreset(preset)
  notify(`已导出《${preset.name}》`)
}

/* ---------- 删除 ---------- */

function askDeletePreset (preset) {
  pendingDelete.value = { type: 'preset', id: preset.id, name: preset.name }
}

function askDeletePrompt (prompt) {
  pendingDelete.value = { type: 'prompt', id: prompt.id, name: prompt.name }
}

function confirmDelete () {
  const target = pendingDelete.value
  pendingDelete.value = null
  if (!target) return
  if (target.type === 'preset') {
    deleteTavernPreset(target.id)
    if (settings.tavern.activePresetId === null) view.value = 'list'
    notify(`已删除预设《${target.name}》`)
  } else if (activePreset.value) {
    deletePrompt(activePreset.value.id, target.id)
    notify(`已删除提示词「${target.name}」`)
  }
}
</script>

<template>
  <div class="st-col preset">
    <input ref="fileInput" class="sr-only" type="file" accept=".json,application/json" @change="onFile" />

    <!-- 列表 -->
    <template v-if="view === 'list'">
      <div class="preset__head">
        <div class="st-section">
          <span class="st-section__title">预设设置</span>
          <span class="st-section__hint">SillyTavern 预设 · 共 {{ presets.length }} 个</span>
        </div>

        <div class="head-tools">
          <button class="st-icon-btn" type="button" aria-label="导入酒馆预设" @click="pickFile">
            <Icon name="import" :size="15" />
          </button>
          <button class="st-icon-btn" type="button" aria-label="导出全部酒馆预设" @click="exportAll">
            <Icon name="export" :size="15" />
          </button>
        </div>
      </div>

      <p v-if="demoLoading" class="st-desc loading">正在导入示例预设 Reborn2.4.2.json …</p>

      <div v-if="presets.length" class="st-list st-list--seven scroll-thin">
        <div
          v-for="preset in presets"
          :key="preset.id"
          class="st-item"
          :class="{ 'is-active': preset.id === settings.tavern.activePresetId }"
          @click="openPreset(preset)"
        >
          <div class="st-item__main">
            <span class="st-item__name">{{ preset.name }}</span>
            <span class="st-item__meta">
              {{ preset.prompts.length }} 条提示词<template v-if="preset.source"> · 导入自 {{ preset.source }}</template>
            </span>
          </div>

          <div class="st-item__tools">
            <button
              class="st-ring"
              type="button"
              :class="{ 'is-on': preset.id === settings.tavern.activePresetId }"
              :aria-pressed="preset.id === settings.tavern.activePresetId"
              aria-label="选中该预设"
              @click.stop="settings.tavern.activePresetId = preset.id"
            ></button>

            <button class="st-icon-btn" type="button" aria-label="导出该酒馆预设" @click.stop="exportOne(preset)">
              <Icon name="export" :size="15" />
            </button>

            <button
              class="st-icon-btn st-icon-btn--danger"
              type="button"
              aria-label="删除该预设"
              @click.stop="askDeletePreset(preset)"
            >
              <Icon name="trash" :size="15" />
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="!demoLoading" class="st-empty">
        <Icon name="book" :size="20" />
        <span>还没有导入任何预设，点击右上角的导入图标试试</span>
      </div>
    </template>

    <!-- 提示词 -->
    <template v-else-if="activePreset">
      <div class="preset__head">
        <div class="prompt-head">
          <button class="st-icon-btn" type="button" aria-label="返回预设列表" @click="backToList">
            <Icon name="back" :size="15" />
          </button>
          <div class="prompt-head__text">
            <span class="prompt-head__name">{{ activePreset.name }}</span>
            <span class="prompt-head__meta">
              {{ activePreset.prompts.length }} 条提示词 · 点击任一条展开编辑
            </span>
          </div>
        </div>

        <div class="head-tools">
          <button class="st-icon-btn" type="button" aria-label="导出该酒馆预设" @click="exportOne(activePreset)">
            <Icon name="export" :size="15" />
          </button>
        </div>
      </div>

      <div class="prompt-list scroll-thin">
        <div
          v-for="(prompt, index) in activePreset.prompts"
          :key="prompt.id"
          class="prompt"
          :class="{ 'is-open': expanded === prompt.id }"
        >
          <div class="prompt__bar" @click="togglePrompt(prompt.id)">
            <span class="prompt__idx">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="prompt__name">{{ prompt.name }}</span>
            <span class="chip prompt__role">{{ roleText(prompt.role) }}</span>
            <span class="prompt__flex"></span>

            <button
              class="st-ring"
              type="button"
              :class="{ 'is-on': prompt.enabled }"
              :aria-pressed="prompt.enabled"
              aria-label="启用该提示词"
              @click.stop="prompt.enabled = !prompt.enabled"
            ></button>

            <button
              class="st-icon-btn st-icon-btn--danger"
              type="button"
              aria-label="删除该提示词"
              @click.stop="askDeletePrompt(prompt)"
            >
              <Icon name="trash" :size="14" />
            </button>
          </div>

          <div v-if="expanded === prompt.id" class="prompt__body">
            <div class="st-field">
              <div class="st-field__head">
                <span class="st-label">角色</span>
              </div>
              <div class="segmented">
                <button
                  v-for="role in ROLES"
                  :key="role.value"
                  type="button"
                  class="segmented__item"
                  :class="{ 'is-active': prompt.role === role.value }"
                  @click="prompt.role = role.value"
                >
                  {{ role.label }}
                </button>
              </div>
            </div>

            <div class="st-field">
              <div class="st-field__head">
                <span class="st-label">内容</span>
                <span class="st-label__opt">{{ prompt.content.length }} 字</span>
              </div>
              <textarea v-model="prompt.content" class="st-textarea prompt__content" spellcheck="false"></textarea>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ConfirmModal
      :open="Boolean(pendingDelete)"
      :title="pendingDelete?.type === 'prompt' ? '确定删除该提示词？' : '确定删除该预设？'"
      :message="
        pendingDelete?.type === 'prompt'
          ? '删除后该条提示词将从预设中移除，且无法恢复。'
          : '删除后该预设及其全部提示词都将被移除，且无法恢复。'
      "
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.preset {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preset__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.head-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.loading {
  padding: 4px 2px 10px;
}

.prompt-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.prompt-head__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.prompt-head__name {
  color: #2f1d0b;
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.16em;
  text-indent: 0.16em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-head__meta {
  color: rgba(90, 62, 26, 0.58);
  font-family: var(--font-flavor);
  font-size: 12px;
  letter-spacing: 0.05em;
}

.prompt-list {
  max-height: 58vh;
  min-height: 0;
  padding-right: 6px;
  overflow-y: auto;
}

.prompt {
  border: 1px solid rgba(126, 92, 44, 0.3);
  border-radius: 2px;
  background: rgba(255, 250, 235, 0.3);
  margin-bottom: 7px;
  transition: border-color 0.26s var(--ease-out), background 0.26s var(--ease-out);
}

.prompt:hover {
  border-color: rgba(178, 130, 52, 0.6);
}

.prompt.is-open {
  border-color: rgba(178, 130, 52, 0.8);
  background: rgba(255, 250, 235, 0.52);
  box-shadow: inset 3px 0 0 rgba(176, 128, 48, 0.85);
}

.prompt__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px 9px 12px;
  cursor: pointer;
}

.prompt__idx {
  flex: 0 0 auto;
  width: 20px;
  color: rgba(120, 86, 40, 0.55);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.prompt__name {
  min-width: 0;
  overflow: hidden;
  color: var(--ink-700);
  font-size: 14px;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt__role {
  flex: 0 0 auto;
  padding: 2px 8px;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-indent: 0.1em;
}

.prompt__flex {
  flex: 1 1 auto;
}

.prompt__body {
  padding: 2px 14px 14px;
  border-top: 1px dashed rgba(122, 86, 38, 0.24);
  margin-top: 2px;
  padding-top: 12px;
}

.prompt__content {
  min-height: 120px;
}
</style>
