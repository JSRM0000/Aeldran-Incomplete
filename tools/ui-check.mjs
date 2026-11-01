/**
 * 首页交互自检：用 Chrome DevTools Protocol 驱动无头浏览器，
 * 依次点开每个面板、按 Esc 关闭、开始游戏并确认「继续上一个游戏」出现。
 *
 * 用法：
 *   1) 启动 vite dev server（127.0.0.1:5173）
 *   2) 以 --remote-debugging-port=9223 启动 Chrome
 *   3) node tools/ui-check.mjs
 */
import fs from 'node:fs/promises'

const PORT = Number(process.env.CDP_PORT || 9223)
const BASE = process.env.BASE || 'http://127.0.0.1:5173/'
const OUT = process.env.OUT_DIR || 'tmp-inspect'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function findTarget () {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const page = list.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page) return page
    } catch (error) {
      /* Chrome 还没起来 */
    }
    await sleep(250)
  }
  throw new Error(`CDP 端口 ${PORT} 连不上`)
}

function createClient (socket) {
  let nextId = 0
  const pending = new Map()

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  })

  function send (method, params = {}) {
    const id = (nextId += 1)
    return new Promise((resolve) => {
      pending.set(id, resolve)
      socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async function evaluate (expression) {
    const response = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    })
    const details = response.result?.exceptionDetails
    if (details) throw new Error(details.exception?.description || details.text)
    return response.result?.result?.value
  }

  async function shot (name) {
    const response = await send('Page.captureScreenshot', { format: 'png' })
    const data = response.result?.data
    if (!data) throw new Error('截图失败')
    await fs.mkdir(OUT, { recursive: true })
    await fs.writeFile(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  }

  return { send, evaluate, shot }
}

const results = []
function check (label, ok, detail = '') {
  results.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
}

const target = await findTarget()
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

const { send, evaluate, shot } = createClient(socket)
await send('Page.enable')
await send('Runtime.enable')

async function goto (url) {
  await send('Page.navigate', { url })
  await sleep(1400)
}

// ---- 1. 初始状态：没有存档时只有 4 个按钮 ----
await goto(BASE)
check('菜单初始为 4 项（无存档）', (await evaluate('document.querySelectorAll(".mbtn").length')) === 4)
check('标题图已加载', (await evaluate('(() => { const i = document.querySelector(".stage__title"); return i.complete && i.naturalWidth > 0 })()')))
await shot('check-01-home-empty')

// ---- 2. 逐个打开面板 ----
const panels = [
  ['开始游戏', '开始游戏', 0],
  ['读取存档', '读取存档', 1],
  ['世界书', '世界书', 2],
  ['系统设置', '系统设置', 3]
]

for (const [label, title, index] of panels) {
  await evaluate(`document.querySelectorAll('.mbtn')[${index}].click()`)
  await sleep(520)
  const openTitle = await evaluate('document.querySelector(".dlg__title")?.textContent?.trim() ?? ""')
  check(`点击「${label}」打开面板`, openTitle === title, openTitle)
  await shot(`check-02-${index}-panel`)

  // Esc 关闭
  await evaluate('window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))')
  await sleep(950)
  check(`Esc 关闭「${label}」`, (await evaluate('document.querySelectorAll(".dlg").length')) === 0)
}

// ---- 3. 开始游戏 → 启程 ----
await evaluate('document.querySelectorAll(".mbtn")[0].click()')
await sleep(500)
await evaluate('document.querySelector(".dice").click()')
const rolled = await evaluate('document.querySelector(".input").value')
check('随机名讳可用', Boolean(rolled), rolled)
await evaluate('document.querySelectorAll(".opt")[2].click()')
await evaluate('document.querySelector(".dlg__foot .btn--primary").click()')
await sleep(700)

check('启程后出现「继续上一个游戏」（5 项）', (await evaluate('document.querySelectorAll(".mbtn").length')) === 5)
const firstLabel = await evaluate('document.querySelector(".mbtn .mbtn__label")?.textContent?.trim() ?? ""')
check('首个按钮为「继续上一个游戏」', firstLabel === '继续上一个游戏', firstLabel)
const hint = await evaluate('document.querySelector(".mbtn .mbtn__hint")?.textContent?.trim() ?? ""')
check('继续按钮显示章节与等级', hint.includes('序章'), hint)
const toastText = await evaluate('document.querySelector(".toast")?.textContent?.trim() ?? ""')
check('出现提示条', toastText.length > 0, toastText)
check('存档已写入 localStorage', Boolean(await evaluate('localStorage.getItem("aeldran.session.v1")')))
await shot('check-03-after-start')

// ---- 4. 设置面板开关 ----
await evaluate('document.querySelectorAll(".mbtn")[4].click()')
await sleep(500)
const before = await evaluate('document.querySelectorAll(".switch")[0].getAttribute("aria-checked")')
await evaluate('document.querySelectorAll(".switch")[0].click()')
const after = await evaluate('document.querySelectorAll(".switch")[0].getAttribute("aria-checked")')
check('开关可切换', before !== after, `${before} → ${after}`)
await shot('check-04-settings')
await evaluate('window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))')
await sleep(400)

// ---- 5. 刷新后存档仍在 ----
await goto(BASE)
check('刷新后仍保留存档（5 项）', (await evaluate('document.querySelectorAll(".mbtn").length')) === 5)
await shot('check-05-home-with-save')

// 清理演示存档，保持初始状态
await evaluate('localStorage.removeItem("aeldran.session.v1")')

const failed = results.filter((item) => !item.ok)
console.log(`\n共 ${results.length} 项，失败 ${failed.length} 项`)
socket.close()
if (failed.length) process.exitCode = 1
