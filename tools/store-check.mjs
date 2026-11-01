// 设置存储的功能自检：API 预设、工作流、酒馆预设的增删改
// 用法：node tools/store-check.mjs
import { register } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

globalThis.__ENV__ = { BASE_URL: '/', DEV: true, PROD: false, MODE: 'test' }
const store = new Map()
globalThis.window = {
  location: { search: '' },
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key)
  },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {},
  removeEventListener() {}
}
globalThis.localStorage = globalThis.window.localStorage

register('./tools/vue-hooks.mjs', pathToFileURL(`${root}/`))

const s = await import('../src/composables/useSettings.js')

let pass = 0
let fail = 0

function check (label, condition) {
  if (condition) {
    pass += 1
    console.log(`  ✓ ${label}`)
  } else {
    fail += 1
    console.log(`  ✗ ${label}`)
  }
}

console.log('\n[API 预设]')
const blank = s.blankProfile()
check('最大回复长度默认 60000', blank.maxTokens === '60000')
check('新预设初始没有 id', !blank.id)
check('当前预设默认未指定', s.activeProfile.value === null && s.profileName(null) === '未指定')

const saved = s.saveProfile({ ...blank, name: '深夜叙事', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' })
check('保存后进入列表', s.settings.profiles.length === 1)
check('保存后返回 id', Boolean(saved.id))
check('当前预设指向新预设', s.activeProfile.value?.id === saved.id)
check('名称可回查', s.profileName(saved.id) === '深夜叙事')

const saved2 = s.saveProfile({ ...blank, name: '本地 Ollama', baseUrl: 'http://127.0.0.1:11434/v1' })
check('可保存第二个预设', s.settings.profiles.length === 2)

s.saveProfile({ ...saved, name: '深夜叙事 · 改名' })
check('按 id 覆盖而不是新增', s.settings.profiles.length === 2)
check('覆盖后名称已更新', s.profileName(saved.id) === '深夜叙事 · 改名')

s.settings.assignments.narrative = saved.id
check('功能分配可绑定预设', s.settings.assignments.narrative === saved.id)

s.deleteProfile(saved2.id)
check('删除预设后只剩一个', s.settings.profiles.length === 1)
s.deleteProfile(saved.id)
check('全部删除后当前预设回落到未指定', s.activeProfile.value === null)

console.log('\n[预设不再内置]')
check('未导入任何预设时列表为空', s.settings.tavern.presets.length === 0)
check('没有自动导入示例预设', typeof s.ensureDemoPreset === 'undefined')

console.log('\n[ComfyUI 工作流]')
check('默认没有工作流', s.settings.image.comfyui.workflows.length === 0)
const wf = s.createWorkflow()
check('新建工作流后成为当前工作流', s.activeWorkflow.value?.id === wf.id)
check('新建会清空 JSON 编辑框', s.settings.image.comfyui.workflowJson === '')
s.syncWorkflowJson('{"3":{"class_type":"KSampler","inputs":{"steps":20}}}')
check('编辑 JSON 会同步进工作流', s.activeWorkflow.value?.json.includes('KSampler'))
s.renameWorkflow(wf.id, '标准出图')
check('改名生效', s.activeWorkflow.value?.name === '标准出图')
const wf2 = s.createWorkflow()
check('第二个工作流', s.settings.image.comfyui.workflows.length === 2)
s.deleteWorkflow(wf2.id)
check('删除后回落第一个', s.activeWorkflow.value?.id === wf.id)

console.log('\n[酒馆预设]')
const raw = readFileSync(`${root}/OpenAI Settings/Reborn2.4.2.json`, 'utf8')
const preset = s.importTavernPreset(raw, 'Reborn 2.4.2')
check('字符串也能导入（自动解析 JSON）', preset.prompts.length === 67)
check('导入后自动选中', s.settings.tavern.activePresetId === preset.id)
check('角色字段被保留', preset.prompts.every((p) => ['system', 'user', 'assistant'].includes(p.role)))

const roundtrip = s.importTavernPreset(s.presetToJson(preset), 'roundtrip')
check('导出再导入条数一致', roundtrip.prompts.length === 67)
check('导出保留提示词顺序', roundtrip.prompts[0].name === preset.prompts[0].name)

s.deletePrompt(roundtrip.id, roundtrip.prompts[0].id)
check('删除单条提示词', s.settings.tavern.presets[0].prompts.length === 66)

let badThrown = false
try {
  s.importTavernPreset('{ not json', 'bad')
} catch {
  badThrown = true
}
check('非法 JSON 会抛错而不是静默导入', badThrown)

s.deleteTavernPreset(roundtrip.id)
check('删除预设', !s.settings.tavern.presets.some((p) => p.id === roundtrip.id))

console.log('\n[持久化]')
await new Promise((done) => setTimeout(done, 320))
const stored = store.get('aeldran.settings.v1')
check('已写入 localStorage', Boolean(stored))
check('写盘内容含工作流名称', stored && stored.includes('标准出图'))

console.log(`\n${fail === 0 ? '✓' : '✗'} 自检结束：${pass} 通过 / ${fail} 失败\n`)
process.exit(fail === 0 ? 0 : 1)
