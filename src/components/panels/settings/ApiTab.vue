<script setup>
import { computed, reactive, ref, watch } from 'vue'
import Icon from '../../settings/Icon.vue'
import SSelect from '../../settings/SSelect.vue'
import ConfirmModal from '../../settings/ConfirmModal.vue'
import {
  ASSIGNMENTS,
  activeProfile,
  blankProfile,
  deleteProfile,
  loadModelList,
  saveProfile,
  settings
} from '../../../composables/useSettings'

const emit = defineEmits(['notify'])

const draft = reactive({ ...blankProfile() })
if (activeProfile.value) Object.assign(draft, activeProfile.value)

const models = ref([])
const loadingModels = ref(false)
const modelError = ref('')
const pendingDelete = ref(null)

const profileOptions = computed(() =>
  settings.profiles.map((profile) => ({ value: profile.id, label: profile.name || '未命名预设' }))
)

const modelOptions = computed(() => models.value.map((name) => ({ value: name, label: name })))

/* 端点或密钥一改，之前拉到的模型列表就作废 */
watch(
  () => [draft.baseUrl, draft.apiKey],
  () => {
    models.value = []
    modelError.value = ''
  }
)

function notify (text) {
  emit('notify', text)
}

function pickProfile (id) {
  const profile = settings.profiles.find((item) => item.id === id)
  if (!profile) return
  Object.assign(draft, profile)
  models.value = []
}

function createBlank () {
  Object.assign(draft, blankProfile())
  models.value = []
  notify('已新建空白 API 预设')
}

function askDelete () {
  if (!draft.id) {
    notify('当前预设尚未保存')
    return
  }
  pendingDelete.value = draft.id
}

function confirmDelete () {
  deleteProfile(pendingDelete.value)
  pendingDelete.value = null
  Object.assign(draft, blankProfile())
  models.value = []
  notify('API 预设已删除')
}

async function loadModels () {
  if (loadingModels.value) return
  loadingModels.value = true
  modelError.value = ''
  try {
    const list = await loadModelList(draft)
    models.value = list
    if (!draft.model) draft.model = list[0]
    notify(`已连接成功，载入 ${list.length} 个可用模型`)
  } catch (error) {
    models.value = []
    modelError.value = error.message
    notify(error.message)
  } finally {
    loadingModels.value = false
  }
}

function save () {
  if (!draft.name.trim()) {
    notify('请先填写预设名称')
    return
  }
  if (draft.extraParams.trim()) {
    try {
      JSON.parse(draft.extraParams)
    } catch {
      notify('附加主体参数不是合法的 JSON')
      return
    }
  }
  const saved = saveProfile({ ...draft })
  Object.assign(draft, saved)
  notify(`已保存预设《${saved.name}》`)
}

function discard () {
  Object.assign(draft, blankProfile())
  models.value = []
  notify('已清空当前填写')
}
</script>

<template>
  <div class="st-grid">
    <section class="st-col">
      <div class="st-section">
        <span class="st-section__title">API 预设</span>
        <span class="st-section__hint">仅兼容 OpenAI 协议</span>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">当前 API 预设</span>
          <span class="st-label__opt">已保存 {{ settings.profiles.length }} 个</span>
        </div>

        <div class="profile-row">
          <SSelect
            :model-value="draft.id"
            :options="profileOptions"
            placeholder="未指定"
            empty="还没有保存任何预设"
            @update:model-value="pickProfile"
          />

          <button class="st-icon-btn" type="button" aria-label="新建 API 预设" @click="createBlank">
            <Icon name="plus" :size="15" />
          </button>

          <button
            class="st-icon-btn st-icon-btn--danger"
            type="button"
            aria-label="删除当前预设"
            :disabled="!draft.id"
            @click="askDelete"
          >
            <Icon name="trash" :size="15" />
          </button>
        </div>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">预设名称</span>
        </div>
        <input v-model="draft.name" class="st-input" type="text" placeholder="例如：深夜叙事 · GPT-4o" />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">端点（基础 URL）</span>
          <span class="st-label__opt">OpenAI 兼容</span>
        </div>
        <input
          v-model="draft.baseUrl"
          class="st-input"
          type="text"
          placeholder="https://api.openai.com/v1"
          spellcheck="false"
        />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">API KEY</span>
        </div>
        <input
          v-model="draft.apiKey"
          class="st-input"
          type="password"
          placeholder="sk-..."
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">模型名</span>
        </div>
        <div class="inline-row">
          <input v-model="draft.model" class="st-input" type="text" placeholder="gpt-4o" spellcheck="false" />
          <button class="btn btn--ghost btn--sm" type="button" :disabled="loadingModels" @click="loadModels">
            {{ loadingModels ? '连接中…' : '加载模型' }}
          </button>
        </div>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">模型选择</span>
          <span class="st-label__opt">{{ models.length ? `共 ${models.length} 个` : '点击「加载模型」后可选' }}</span>
        </div>
        <SSelect
          v-model="draft.model"
          :options="modelOptions"
          placeholder="请选择"
          empty="先点击「加载模型」获取列表"
        />
        <p v-if="modelError" class="st-error">{{ modelError }}</p>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">最大回复长度</span>
          <span class="st-label__opt">tokens</span>
        </div>
        <input v-model="draft.maxTokens" class="st-input" type="number" min="256" step="256" placeholder="60000" />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">附加主体参数</span>
          <span class="st-label__opt">JSON</span>
        </div>
        <textarea
          v-model="draft.extraParams"
          class="st-textarea st-textarea--mono"
          placeholder='{ "temperature": 0.9, "top_p": 0.95 }'
          spellcheck="false"
        ></textarea>
        <p class="st-desc field-note">留空则使用默认值；保存时自动合并进最终模型请求体。</p>
      </div>

      <div class="st-actions">
        <button class="btn btn--ghost btn--sm" type="button" @click="discard">放弃修改</button>
        <button class="btn btn--primary btn--sm" type="button" @click="save">保存当前预设</button>
      </div>
    </section>

    <section class="st-col st-col--right">
      <div class="st-section">
        <span class="st-section__title">功能分配</span>
        <span class="st-section__hint">为不同场合挑选模型</span>
      </div>

      <div class="assign">
        <div v-for="row in ASSIGNMENTS" :key="row.key" class="assign__row">
          <span class="assign__name">{{ row.label }}</span>

          <SSelect
            v-model="settings.assignments[row.key]"
            :options="profileOptions"
            placeholder="未指定"
            empty="请先在左侧保存预设"
          />

          <span class="assign__desc">{{ row.desc }}</span>
        </div>
      </div>

      <div class="st-note">
        <span class="st-note__dot"></span>
        <span>「加载模型」会真实请求 <code>{{ '{端点}' }}/models</code>；请求经由本地代理转发，可绕过浏览器跨域限制。</span>
      </div>
    </section>

    <ConfirmModal
      :open="Boolean(pendingDelete)"
      title="确定删除该预设？"
      message="删除后该预设的端点、密钥与模型信息将一并移除，且无法恢复。"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.profile-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px 32px;
  gap: 8px;
  align-items: center;
}

.inline-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.field-note {
  margin-top: 5px;
}

.assign {
  display: flex;
  flex-direction: column;
}

.assign__row {
  display: grid;
  grid-template-columns: 76px 158px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px dashed rgba(122, 86, 38, 0.2);
}

.assign__row:last-child {
  border-bottom: 0;
}

.assign__name {
  color: var(--ink-700);
  font-size: 13.5px;
  letter-spacing: 0.08em;
}

.assign__desc {
  color: rgba(90, 62, 26, 0.62);
  font-family: var(--font-flavor);
  font-size: 11.8px;
  line-height: 1.55;
  letter-spacing: 0.02em;
}

@media (max-width: 900px) {
  .assign__row {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px 10px;
  }

  .assign__desc {
    grid-column: 1 / -1;
    padding-left: 82px;
  }
}
</style>
