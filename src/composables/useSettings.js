import { computed, reactive, ref, watch } from 'vue'
import { apiFetch, assertHttpUrl, httpError, networkError, readJson } from '../utils/http.js'

/* ===========================================================
   设置状态：API 预设 / 功能分配 / 文生图 / 酒馆预设
   全部落在 localStorage 的一个键里，刷新不丢
   =========================================================== */

export const SETTINGS_KEY = 'aeldran.settings.v1'

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

export const ASSIGNMENTS = [
  {
    key: 'narrative',
    label: '叙事正文',
    desc: '掌管旁白、对话与场景描写，是一局故事的主笔。'
  },
  {
    key: 'r18',
    label: 'R18 场景',
    desc: '情节转入私密场景时，接管尺度、节奏与描写密度。'
  },
  {
    key: 'negotiation',
    label: '谈判对话',
    desc: '处理交涉、审讯与讨价还价，需要逻辑与分寸的来回。'
  },
  {
    key: 'imagePrompt',
    label: '插图提示词生成',
    desc: '把眼前的场景转译成绘图提示词，交给文生图模块。'
  }
]

export function blankProfile () {
  return {
    id: '',
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    maxTokens: '60000',
    extraParams: ''
  }
}

function blankImage () {
  return {
    provider: 'novelai',
    testPrompt: 'a lone knight resting by a campfire at dusk, medieval fantasy, painterly',
    novelai: {
      baseUrl: '',
      apiKey: '',
      model: 'nai-diffusion-4-full',
      width: '832',
      height: '1216',
      steps: '28',
      cfg: '5',
      sampler: 'k_euler_ancestral',
      negative: 'lowres, bad anatomy, watermark, signature, text',
      style: 'artbook, painterly, warm torchlight, medieval fantasy'
    },
    comfyui: {
      apiUrl: 'http://localhost:8188',
      workflows: [],
      activeWorkflowId: null,
      workflowJson: '',
      width: '',
      height: '',
      steps: '',
      cfg: '',
      sampler: '',
      negative: '',
      style: ''
    }
  }
}

function defaults () {
  return {
    profiles: [],
    activeProfileId: null,
    assignments: { narrative: null, r18: null, negotiation: null, imagePrompt: null },
    image: blankImage(),
    tavern: { presets: [], activePresetId: null }
  }
}

function mergeDefaults (target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {}
      mergeDefaults(target[key], value)
    } else if (target[key] === undefined) {
      target[key] = value
    }
  }
  return target
}

function load () {
  const base = defaults()
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return base
    const stored = JSON.parse(raw)
    return mergeDefaults(stored, base)
  } catch {
    return base
  }
}

export const settings = reactive(load())

let saveTimer = 0
watch(
  settings,
  () => {
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        /* 配额不足时静默失败，界面仍可继续使用 */
      }
    }, 220)
  },
  { deep: true }
)

/* ---------- API 预设 ---------- */

export const activeProfile = computed(
  () => settings.profiles.find((p) => p.id === settings.activeProfileId) || null
)

export function saveProfile (draft) {
  const data = { ...draft }
  if (!data.id) {
    data.id = uid('api')
    settings.profiles.push(data)
  } else {
    const index = settings.profiles.findIndex((p) => p.id === data.id)
    if (index >= 0) settings.profiles[index] = data
    else settings.profiles.push(data)
  }
  settings.activeProfileId = data.id
  return data
}

export function deleteProfile (id) {
  const index = settings.profiles.findIndex((p) => p.id === id)
  if (index >= 0) settings.profiles.splice(index, 1)
  if (settings.activeProfileId === id) {
    settings.activeProfileId = settings.profiles[0]?.id ?? null
  }
  for (const key of Object.keys(settings.assignments)) {
    if (settings.assignments[key] === id) settings.assignments[key] = null
  }
}

export function profileName (id) {
  return settings.profiles.find((p) => p.id === id)?.name || '未指定'
}

/* 真实「加载模型」：GET {baseUrl}/models（OpenAI 兼容协议） */
export async function loadModelList (draft) {
  const baseUrl = assertHttpUrl(draft?.baseUrl, '端点（基础 URL）')
  const apiKey = String(draft?.apiKey || '').trim()
  const target = `${baseUrl}/models`

  const headers = { Accept: 'application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  let response
  try {
    response = await apiFetch(target, { method: 'GET', headers })
  } catch (error) {
    throw networkError(error, target)
  }

  if (!response.ok) throw await httpError(response, '加载模型失败：')

  const payload = await readJson(response)
  const models = collectModelIds(payload)

  if (!models.length) {
    throw new Error('端点没有返回任何模型：请确认该地址兼容 OpenAI 的 /models 接口')
  }
  return models
}

/** 兼容 {data:[{id}]}、{models:[{name}]}、['a','b'] 等常见形状 */
function collectModelIds (payload) {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.models)
        ? payload.models
        : Array.isArray(payload?.result?.data)
          ? payload.result.data
          : []

  const ids = []
  for (const row of rows) {
    const id = typeof row === 'string' ? row : row?.id ?? row?.name ?? row?.model ?? row?.model_name
    if (typeof id === 'string' && id.trim() && !ids.includes(id.trim())) ids.push(id.trim())
  }
  if (!ids.length) {
    const single = payload?.model ?? payload?.default_model
    if (typeof single === 'string' && single.trim()) ids.push(single.trim())
  }
  return ids.sort((a, b) => a.localeCompare(b))
}

/* ---------- 文生图：工作流 ---------- */

export const activeWorkflow = computed(() => {
  const list = settings.image.comfyui.workflows
  return list.find((w) => w.id === settings.image.comfyui.activeWorkflowId) || null
})

export function createWorkflow () {
  const workflow = { id: uid('wf'), name: '未命名工作流', json: '' }
  settings.image.comfyui.workflows.push(workflow)
  settings.image.comfyui.activeWorkflowId = workflow.id
  settings.image.comfyui.workflowJson = ''
  return workflow
}

export function renameWorkflow (id, name) {
  const workflow = settings.image.comfyui.workflows.find((w) => w.id === id)
  if (workflow) workflow.name = name
}

export function deleteWorkflow (id) {
  const list = settings.image.comfyui.workflows
  const index = list.findIndex((w) => w.id === id)
  if (index >= 0) list.splice(index, 1)
  if (settings.image.comfyui.activeWorkflowId === id) {
    settings.image.comfyui.activeWorkflowId = list[0]?.id ?? null
    settings.image.comfyui.workflowJson = list[0]?.json ?? ''
  }
}

export function syncWorkflowJson (text) {
  settings.image.comfyui.workflowJson = text
  const workflow = activeWorkflow.value
  if (workflow) workflow.json = text
}

/* ---------- 酒馆预设（SillyTavern） ---------- */

export function importTavernPreset (raw, fallbackName) {
  let data = raw
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      throw new Error('预设文件不是合法的 JSON')
    }
  }
  const prompts = Array.isArray(data?.prompts) ? data.prompts : []
  const preset = {
    id: uid('tp'),
    name: data?.name || fallbackName || '未命名预设',
    source: fallbackName || '',
    prompts: prompts.map((p, index) => ({
      id: p.identifier || uid('pr'),
      name: p.name || `提示词 ${index + 1}`,
      role: p.role || 'system',
      content: p.content || '',
      enabled: p.enabled !== false,
      marker: Boolean(p.marker),
      order: p.injection_order ?? index
    })),
    meta: {
      temperature: data?.temperature ?? null,
      topP: data?.top_p ?? null,
      maxTokens: data?.openai_max_tokens ?? null
    }
  }
  settings.tavern.presets.unshift(preset)
  settings.tavern.activePresetId = preset.id
  return preset
}

export function deleteTavernPreset (id) {
  const list = settings.tavern.presets
  const index = list.findIndex((p) => p.id === id)
  if (index >= 0) list.splice(index, 1)
  if (settings.tavern.activePresetId === id) {
    settings.tavern.activePresetId = list[0]?.id ?? null
  }
}

export function deletePrompt (presetId, promptId) {
  const preset = settings.tavern.presets.find((p) => p.id === presetId)
  if (!preset) return
  const index = preset.prompts.findIndex((p) => p.id === promptId)
  if (index >= 0) preset.prompts.splice(index, 1)
}

export function presetToJson (preset) {
  if (typeof preset === 'string') {
    preset = settings.tavern.presets.find((p) => p.id === preset) || { prompts: [] }
  }
  const prompts = Array.isArray(preset.prompts) ? preset.prompts : []
  return {
    name: preset.name,
    temperature: preset.meta?.temperature ?? 1,
    top_p: preset.meta?.topP ?? 1,
    openai_max_tokens: preset.meta?.maxTokens ?? 4096,
    prompts: prompts.map((p) => ({
      identifier: p.id,
      name: p.name,
      role: p.role,
      content: p.content,
      enabled: p.enabled,
      marker: p.marker,
      injection_order: p.order
    })),
    prompt_order: [{ character_id: 100000, order: prompts.map((p) => ({ identifier: p.id, enabled: p.enabled })) }]
  }
}

function download (name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportTavernPreset (preset) {
  download(`${preset.name || 'preset'}.json`, presetToJson(preset))
}

export function exportAllTavernPresets () {
  download('aeldran-tavern-presets.json', {
    presets: settings.tavern.presets.map(presetToJson)
  })
}

/* 预设不再随项目内置：玩家在「预设设置」里自行导入 SillyTavern 预设 JSON。 */
export const presetHint = '选择 SillyTavern 导出的 JSON 文件。预设只保存在本机浏览器里，不随游戏一起发布。'