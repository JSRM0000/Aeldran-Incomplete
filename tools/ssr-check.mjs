// 冒烟测试：在 Node 里用 @vue/server-renderer 真实渲染首页与「系统设置」弹窗，
// 不启动 dev server、不打开浏览器，只验证「组件树能否无错误渲染」。
// 用法：node tools/ssr-check.mjs [?panel=settings]
import { register } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

/* ---------- 浏览器环境垫片（模块加载时就会读 window / localStorage / import.meta.env） ---------- */
const store = new Map()
const search = process.env.SSR_SEARCH ?? process.argv[2] ?? '?panel=settings'

globalThis.__ENV__ = { BASE_URL: '/', MODE: 'test', DEV: true, PROD: false }
globalThis.window = {
  location: { search, href: `http://127.0.0.1:5173/${search}` },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  },
  matchMedia: () => ({ matches: false, addEventListener () {}, removeEventListener () {} }),
  addEventListener () {},
  removeEventListener () {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  innerWidth: 1600,
  innerHeight: 900,
  requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id)
}
globalThis.document = {
  documentElement: { style: {}, classList: { add () {}, remove () {} } },
  body: { classList: { add () {}, remove () {} } },
  addEventListener () {},
  removeEventListener () {}
}
try {
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true })
} catch {
  /* 高版本 Node 的 navigator 只读，忽略即可 */
}

register(new URL('./vue-hooks.mjs', import.meta.url).href)

const warnings = []
let failed = false

try {
  const { default: App } = await import('../src/App.vue')
  const app = createSSRApp(App)
  app.config.warnHandler = (msg) => warnings.push(String(msg).trim())
  const html = await renderToString(app)

  const HOME_TEXTS = ['艾尔德兰', '以文字为墨', '创意工坊', '开始游戏', '读取存档', '世界书', '系统设置']
  const SETTINGS_TEXTS = [
    'API 设置',
    '文生图设置',
    '预设设置',
    '当前 API 预设',
    '功能分配',
    '叙事正文',
    '最大回复长度',
    '附加主体参数',
    '保存当前预设',
    'NovelAI 生图',
    'ComfyUI 生图',
    '工作流 JSON',
    '导入酒馆预设'
  ]
  const expected = [...HOME_TEXTS]
  if (search.includes('panel=settings')) expected.push(...SETTINGS_TEXTS)
  if (search.includes('preview=save')) expected.push('继续上一个游戏')
  const missing = expected.filter((text) => !html.includes(text))

  // 可选：把渲染结果连同全部样式导出一份静态快照，便于离线看版面
  if (process.env.SSR_HTML) {
    const out = path.resolve(process.env.SSR_HTML)
    const globals = ['tokens', 'base', 'controls', 'settings']
      .map((n) => fs.readFileSync(path.resolve('src/styles', `${n}.css`), 'utf8'))
      .join('\n')
    const scoped = (globalThis.__SFC_STYLES__ ?? []).join('\n')
    const body = html.replace(/\s(src|href)="\/([^"]*)"/g, ' $1="../$2"')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(
      out,
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Aeldran 快照</title><style>${globals}\n${scoped}</style></head><body><div id="app">${body}</div></body></html>`,
      'utf8'
    )
    console.log(`快照已写入：${out}`)
  }

  console.log(`渲染长度：${html.length} 字符`)
  if (warnings.length) {
    console.log(`\n运行时警告 ${warnings.length} 条：`)
    warnings.slice(0, 15).forEach((w) => console.log(`  ! ${w.split('\n')[0]}`))
  }
  if (missing.length) {
    console.log(`\n✗ 缺少预期文本：${missing.join('、')}`)
  }
  failed = missing.length > 0 || warnings.length > 0
  console.log(
    failed
      ? '\n✗ 渲染存在缺失或警告'
      : `\n✓ 渲染通过，${expected.length} 项关键文案齐全，无运行时警告`
  )
} catch (error) {
  failed = true
  console.log(`✗ 渲染失败：${error.stack?.split('\n').slice(0, 6).join('\n') ?? error.message}`)
}

process.exit(failed ? 1 : 0)
