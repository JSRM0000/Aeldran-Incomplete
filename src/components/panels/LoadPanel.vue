<script setup>
import { computed, ref } from 'vue'
import ParchmentDialog from '../ParchmentDialog.vue'
import ConfirmModal from '../settings/ConfirmModal.vue'
import InputModal from '../settings/InputModal.vue'
import {
  PAGES,
  downloadSave,
  formatGameTime,
  importSave,
  pageOf,
  renameSave,
  removeSave,
  saves
} from '../../composables/useSaves.js'

const emit = defineEmits(['close', 'load', 'notify'])

const page = ref(1)
const cards = computed(() => pageOf(page.value))
const autoSave = computed(() => saves.auto)

/* ---- 删除确认 ---- */
const removing = ref(null)
const confirmTitle = computed(() => '确定删除该存档？')
const confirmMessage = computed(() =>
  removing.value?.save ? `《${removing.value.save.name}》将从簿册中抹去，无法找回。` : ''
)

function askRemove (save) {
  removing.value = { kind: 'manual', slot: save.slot, save }
}

function askRemoveAuto () {
  removing.value = { kind: 'auto', slot: 0, save: { name: '自动存档' } }
}

function confirmRemove () {
  if (removing.value) {
    removeSave(removing.value.kind, removing.value.slot)
    emit('notify', '存档已删除')
  }
  removing.value = null
}

/* ---- 改名 ---- */
const renaming = ref(null)
const renameValue = ref('')

function askRename (save) {
  renaming.value = { kind: 'manual', slot: save.slot }
  renameValue.value = save.name
}

function confirmRename (value) {
  if (renaming.value && value) {
    renameSave(renaming.value.kind, renaming.value.slot, value.trim())
    emit('notify', '存档已改名')
  }
  renaming.value = null
}

/* ---- 其余动作 ---- */
function loadSave (save) {
  emit('load', save)
}

function exportSave (save) {
  downloadSave(save)
  emit('notify', `已导出《${save.name}》`)
}

function onImport (event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const save = importSave(String(reader.result || ''))
      emit('notify', `已导入《${save.name}》`)
    } catch (error) {
      emit('notify', error.message)
    }
  }
  reader.readAsText(file, 'utf-8')
  event.target.value = ''
}

const fileInput = ref(null)
function pickFile () {
  fileInput.value?.click()
}
</script>

<template>
  <ParchmentDialog
    open
    wide
    tall
    kicker="ARCHIVE"
    title="读取存档"
    subtitle="簿册记录着每一次抉择，也记录着每一次代价。"
    @close="emit('close')"
  >
    <div class="ld">
      <div class="ld__import">
        <span class="ld__import-text">
          <span class="ld__import-title">导入存档文件</span>
          <span class="ld__import-hint">读取由本界面「导出」生成的 JSON 存档，导入后落在第一个空存档位。</span>
        </span>
        <button class="btn btn--ghost" type="button" @click="pickFile">选择文件…</button>
        <input ref="fileInput" class="sr-only" type="file" accept="application/json,.json" @change="onImport" />
      </div>

      <div class="ld__section">
        <span class="ld__section-title">自动存档</span>
        <span class="ld__section-note">创建世界、一次长休之后自动记录，只保留最新一份。</span>
      </div>

      <div v-if="autoSave" class="ld-card ld-auto">
        <span class="ld-card__main">
          <span class="ld-card__name">{{ autoSave.name }}</span>
          <span class="ld-card__meta">
            <span><b>{{ autoSave.character?.name || '无名旅人' }}</b></span>
            <span class="ld-card__dot" aria-hidden="true"></span>
            <span>等级 {{ autoSave.character?.level ?? 1 }}</span>
            <span class="ld-card__dot" aria-hidden="true"></span>
            <span>{{ autoSave.world?.place || '未知之地' }}</span>
            <span class="ld-card__dot" aria-hidden="true"></span>
            <span>{{ formatGameTime(autoSave.world) }}</span>
          </span>
        </span>
        <span class="ld-card__actions">
          <button class="btn btn--primary" type="button" @click="loadSave(autoSave)">读取</button>
          <button class="btn btn--ghost" type="button" @click="askRename(autoSave)">改名</button>
          <button class="btn btn--ghost" type="button" @click="exportSave(autoSave)">导出</button>
          <button class="btn btn--ghost" type="button" @click="askRemoveAuto">删除</button>
        </span>
      </div>
      <div v-else class="ld-card ld-card--empty ld-auto">
        <span class="ld-card__main">
          <span class="ld-card__empty-label">尚无自动存档</span>
        </span>
        <span class="ld-card__actions">
          <span class="ld-auto__empty">进入世界并完成一次长休后生成</span>
        </span>
      </div>

      <div class="ld__section">
        <span class="ld__section-title">手动存档</span>
        <span class="ld__section-note">共 15 个存档位 · 3 页 · 每页 5 位</span>
      </div>

      <div class="ld-list">
        <div
          v-for="card in cards"
          :key="card.slot"
          class="ld-card"
          :class="{ 'ld-card--empty': !card.save }"
        >
          <template v-if="card.save">
            <span class="ld-card__main">
              <span class="ld-card__name">{{ card.save.name }}</span>
              <span class="ld-card__meta">
                <span><b>{{ card.save.character?.name || '无名旅人' }}</b></span>
                <span class="ld-card__dot" aria-hidden="true"></span>
                <span>等级 {{ card.save.character?.level ?? 1 }}</span>
                <span class="ld-card__dot" aria-hidden="true"></span>
                <span>{{ card.save.world?.place || '未知之地' }}</span>
                <span class="ld-card__dot" aria-hidden="true"></span>
                <span>{{ formatGameTime(card.save.world) }}</span>
              </span>
            </span>
            <span class="ld-card__actions">
              <button class="btn btn--primary" type="button" @click="loadSave(card.save)">读取</button>
              <button class="btn btn--ghost" type="button" @click="askRename(card.save)">改名</button>
              <button class="btn btn--ghost" type="button" @click="exportSave(card.save)">导出</button>
              <button class="btn btn--ghost" type="button" @click="askRemove(card.save)">删除</button>
            </span>
          </template>
          <template v-else>
            <span class="ld-card__main">
              <span class="ld-card__empty-label">空存档位 {{ card.slot }}</span>
            </span>
            <span class="ld-card__actions ld-card__actions--off">
              <button class="btn btn--ghost" type="button" disabled>读取</button>
              <button class="btn btn--ghost" type="button" disabled>改名</button>
              <button class="btn btn--ghost" type="button" disabled>导出</button>
              <button class="btn btn--ghost" type="button" disabled>删除</button>
            </span>
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="ld-pager">
        <button
          class="ld-pager__btn"
          type="button"
          aria-label="上一页"
          :disabled="page <= 1"
          @click="page -= 1"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <span class="ld-pager__pages">
          <button
            v-for="n in PAGES"
            :key="n"
            class="ld-pager__page"
            :class="{ 'is-on': page === n }"
            type="button"
            @click="page = n"
          >
            第 {{ n }} 页
          </button>
        </span>
        <button
          class="ld-pager__btn"
          type="button"
          aria-label="下一页"
          :disabled="page >= PAGES"
          @click="page += 1"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
      <button class="btn btn--ghost" type="button" @click="emit('close')">关闭</button>
    </template>
  </ParchmentDialog>

  <ConfirmModal
    :open="Boolean(removing)"
    :title="confirmTitle"
    :message="confirmMessage"
    confirm-text="确认删除"
    danger
    @confirm="confirmRemove"
    @cancel="removing = null"
  />

  <InputModal
    :open="Boolean(renaming)"
    title="重命名存档"
    label="新的名称"
    :model-value="renameValue"
    placeholder="例如：灰烬王庭 · 长夜之前"
    @confirm="confirmRename"
    @cancel="renaming = null"
  />
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
