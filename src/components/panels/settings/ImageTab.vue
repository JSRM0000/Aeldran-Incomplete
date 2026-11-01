<script setup>
import { computed, ref } from 'vue'
import Icon from '../../settings/Icon.vue'
import SSelect from '../../settings/SSelect.vue'
import ConfirmModal from '../../settings/ConfirmModal.vue'
import InputModal from '../../settings/InputModal.vue'
import {
  activeWorkflow,
  createWorkflow,
  deleteWorkflow,
  renameWorkflow,
  settings,
  syncWorkflowJson
} from '../../../composables/useSettings'
import { extractComfyParams } from '../../../utils/comfy'
import { composePrompt, generateImage } from '../../../utils/imagegen'

const emit = defineEmits(['notify'])

const image = settings.image

const workflowOptions = computed(() =>
  image.comfyui.workflows.map((workflow) => ({ value: workflow.id, label: workflow.name }))
)

const renaming = ref(false)
const pendingDelete = ref(null)
const generating = ref(false)
const preview = ref('')
const previewNote = ref('')
const error = ref('')

function notify (text) {
  emit('notify', text)
}

function setProvider (value) {
  image.provider = value
  preview.value = ''
}

/* ---------- 工作流 ---------- */

function addWorkflow () {
  createWorkflow()
  notify('已新建工作流，请粘贴 API 格式的工作流 JSON')
}

/* 切换工作流时同步把它的 JSON 载入编辑框，并回填可提取的参数 */
function pickWorkflow (id) {
  image.comfyui.activeWorkflowId = id
  const workflow = image.comfyui.workflows.find((item) => item.id === id)
  image.comfyui.workflowJson = workflow?.json || ''
  if (image.comfyui.workflowJson) {
    applyParams(extractComfyParams(image.comfyui.workflowJson))
  }
}

function askRename () {
  if (!activeWorkflow.value) {
    notify('请先新建或选择一个工作流')
    return
  }
  renaming.value = true
}

function confirmRename (name) {
  renaming.value = false
  if (!name) {
    notify('名称不能为空')
    return
  }
  renameWorkflow(activeWorkflow.value.id, name)
  notify(`工作流已改名为「${name}」`)
}

function askDelete () {
  if (!activeWorkflow.value) {
    notify('当前没有可删除的工作流')
    return
  }
  pendingDelete.value = activeWorkflow.value.id
}

function confirmDelete () {
  deleteWorkflow(pendingDelete.value)
  pendingDelete.value = null
  notify('工作流已删除')
}

function applyParams (params) {
  if (!params) return false
  const keys = Object.keys(params)
  if (!keys.length) return false
  for (const key of keys) {
    if (key === 'negative') image.comfyui.negative = params[key]
    else if (key === 'sampler') image.comfyui.sampler = params[key]
    else if (key === 'width') image.comfyui.width = params[key]
    else if (key === 'height') image.comfyui.height = params[key]
    else if (key === 'steps') image.comfyui.steps = params[key]
    else if (key === 'cfg') image.comfyui.cfg = params[key]
  }
  return true
}

function onJsonInput (event) {
  const text = event.target.value
  syncWorkflowJson(text)
  if (!text.trim()) return
  if (applyParams(extractComfyParams(text))) {
    notify('已从工作流中提取宽度、步数、采样器等参数')
  }
}

/* ---------- 生成测试（真实调用生图服务） ---------- */

async function generate () {
  if (generating.value) return
  generating.value = true
  error.value = ''
  clearPreview()

  const config = image.provider === 'novelai' ? image.novelai : image.comfyui
  const prompt = composePrompt(config.style, image.testPrompt)
  const provider = image.provider === 'novelai' ? 'NovelAI' : 'ComfyUI'

  try {
    const result = await generateImage(image, prompt)
    preview.value = URL.createObjectURL(result.blob)
    previewNote.value = result.note
    notify(`已通过 ${provider} 生成图片`)
  } catch (err) {
    error.value = err.message
    notify(err.message)
  } finally {
    generating.value = false
  }
}

function clearPreview () {
  if (preview.value && preview.value.startsWith('blob:')) URL.revokeObjectURL(preview.value)
  preview.value = ''
  previewNote.value = ''
}

function downloadName () {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `aeldran-${stamp}.png`
}
</script>

<template>
  <div class="st-col st-col--single">
    <div class="st-section">
      <span class="st-section__title">文生图设置</span>
      <span class="st-section__hint">为插图提示词生成挑选画师</span>
    </div>

    <div class="st-field">
      <div class="st-field__head">
        <span class="st-label">链接设置</span>
      </div>
      <div class="segmented provider">
        <button
          type="button"
          class="segmented__item provider__item"
          :class="{ 'is-active': image.provider === 'novelai' }"
          @click="setProvider('novelai')"
        >
          <Icon name="image" :size="15" />
          NovelAI 生图
        </button>
        <button
          type="button"
          class="segmented__item provider__item"
          :class="{ 'is-active': image.provider === 'comfyui' }"
          @click="setProvider('comfyui')"
        >
          <Icon name="spark" :size="15" />
          ComfyUI 生图
        </button>
      </div>
    </div>

    <!-- NovelAI -->
    <div v-show="image.provider === 'novelai'" class="panel">
      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">端点（基础 URL）</span>
        </div>
        <input
          v-model="image.novelai.baseUrl"
          class="st-input"
          type="text"
          placeholder="https://api.novelai.net"
          spellcheck="false"
        />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">API KEY</span>
        </div>
        <input
          v-model="image.novelai.apiKey"
          class="st-input"
          type="password"
          placeholder="pst-..."
          autocomplete="off"
        />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">模型选择</span>
        </div>
        <input v-model="image.novelai.model" class="st-input" type="text" placeholder="nai-diffusion-4-full" />
      </div>

      <div class="st-quad">
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">图形宽度</span></div>
          <input v-model="image.novelai.width" class="st-input" type="number" placeholder="832" />
        </div>
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">图形高度</span></div>
          <input v-model="image.novelai.height" class="st-input" type="number" placeholder="1216" />
        </div>
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">步数</span></div>
          <input v-model="image.novelai.steps" class="st-input" type="number" placeholder="28" />
        </div>
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">CFG</span></div>
          <input v-model="image.novelai.cfg" class="st-input" type="number" step="0.1" placeholder="5" />
        </div>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">采样器</span>
        </div>
        <input v-model="image.novelai.sampler" class="st-input" type="text" placeholder="k_euler_ancestral" />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">负面提示词</span>
          <span class="st-label__opt">negative prompt</span>
        </div>
        <textarea
          v-model="image.novelai.negative"
          class="st-textarea"
          placeholder="lowres, bad anatomy, watermark..."
        ></textarea>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">画风</span>
          <span class="st-label__opt">作为提示词头部插入</span>
        </div>
        <input v-model="image.novelai.style" class="st-input" type="text" placeholder="artbook, oil painting" />
      </div>
    </div>

    <!-- ComfyUI -->
    <div v-show="image.provider === 'comfyui'" class="panel">
      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">ComfyUI API 地址</span>
        </div>
        <input
          v-model="image.comfyui.apiUrl"
          class="st-input"
          type="text"
          placeholder="http://localhost:8188"
          spellcheck="false"
        />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">工作流预设</span>
          <span class="st-label__opt">API 格式</span>
        </div>
        <div class="workflow-row">
          <SSelect
            :model-value="image.comfyui.activeWorkflowId"
            :options="workflowOptions"
            placeholder="未指定"
            empty="还没有保存工作流"
            @update:model-value="pickWorkflow"
          />
          <button class="btn btn--ghost btn--sm" type="button" @click="addWorkflow">新建</button>
          <button class="btn btn--ghost btn--sm" type="button" @click="askRename">改名</button>
          <button class="btn btn--ghost btn--sm" type="button" @click="askDelete">删除</button>
        </div>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">工作流 JSON</span>
          <span class="st-label__opt">粘贴后自动提取参数</span>
        </div>
        <textarea
          class="st-textarea st-textarea--mono json-box"
          :value="image.comfyui.workflowJson"
          placeholder="在此粘贴 ComfyUI 的 API 格式工作流（Save (API Format)）"
          spellcheck="false"
          @input="onJsonInput"
        ></textarea>
      </div>

      <div class="st-quad">
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">图形宽度</span></div>
          <input v-model="image.comfyui.width" class="st-input" type="number" placeholder="1024" />
        </div>
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">图形高度</span></div>
          <input v-model="image.comfyui.height" class="st-input" type="number" placeholder="1024" />
        </div>
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">步数</span></div>
          <input v-model="image.comfyui.steps" class="st-input" type="number" placeholder="20" />
        </div>
        <div class="st-field">
          <div class="st-field__head"><span class="st-label">CFG</span></div>
          <input v-model="image.comfyui.cfg" class="st-input" type="number" step="0.1" placeholder="7" />
        </div>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">采样器</span>
        </div>
        <input v-model="image.comfyui.sampler" class="st-input" type="text" placeholder="euler" />
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">负面提示词</span>
          <span class="st-label__opt">negative prompt</span>
        </div>
        <textarea
          v-model="image.comfyui.negative"
          class="st-textarea"
          placeholder="lowres, bad anatomy, watermark..."
        ></textarea>
      </div>

      <div class="st-field">
        <div class="st-field__head">
          <span class="st-label">画风</span>
          <span class="st-label__opt">作为提示词头部插入</span>
        </div>
        <input v-model="image.comfyui.style" class="st-input" type="text" placeholder="artbook, oil painting" />
      </div>
    </div>

    <div class="st-field test-prompt">
      <div class="st-field__head">
        <span class="st-label">测试提示词</span>
        <span class="st-label__opt">画风会自动接在它前面</span>
      </div>
      <input
        v-model="image.testPrompt"
        class="st-input"
        type="text"
        placeholder="a lone knight at a campfire, medieval fantasy"
        spellcheck="false"
      />
    </div>

    <p v-if="error" class="st-error">{{ error }}</p>

    <div class="generate">
      <button class="btn btn--ember generate__btn" type="button" :disabled="generating" @click="generate">
        <Icon name="spark" :size="16" />
        {{ generating ? '正在连接生图服务…' : '生成图片' }}
      </button>
      <p class="st-desc">
        会用当前填写的参数真实请求
        {{ image.provider === 'novelai' ? 'NovelAI 的 /ai/generate-image' : 'ComfyUI 的 /prompt' }}
        并等待出图。
      </p>
    </div>

    <div v-if="preview" class="preview preview--real">
      <img class="preview__image" :src="preview" alt="生成的图片" />
      <div class="preview__bar">
        <span>{{ previewNote }}</span>
        <a class="preview__link" :href="preview" :download="downloadName()">保存到本地</a>
      </div>
    </div>

    <InputModal
      :open="renaming"
      title="工作流名称"
      label="新的名称"
      :model-value="activeWorkflow?.name || ''"
      placeholder="例如：中世纪肖像 · 竖版"
      confirm-text="确认"
      @cancel="renaming = false"
      @confirm="confirmRename"
    />

    <ConfirmModal
      :open="Boolean(pendingDelete)"
      title="确定删除该工作流？"
      message="该工作流名称与其中的 JSON 都将被移除，且无法恢复。"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.st-col--single {
  max-width: 720px;
  margin: 0 auto;
}

.provider {
  padding: 4px;
}

.provider__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  font-size: 14px;
}

.panel {
  margin-top: 2px;
}

.workflow-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 8px;
  align-items: center;
}

.json-box {
  min-height: 132px;
}

.generate {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

.generate__btn {
  min-height: 44px;
  padding: 10px 30px;
  font-size: 15px;
  letter-spacing: 0.2em;
  text-indent: 0.2em;
}

.generate__btn:disabled {
  opacity: 0.7;
}

.preview {
  margin-top: 14px;
}

.test-prompt {
  margin-top: 6px;
}

</style>
