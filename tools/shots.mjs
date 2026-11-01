/**
 * 多分辨率截图：用 CDP 精确设定视口尺寸，避免 --window-size 的缩放差异。
 * 用法：node tools/shots.mjs [url]
 */
import fs from 'node:fs/promises'

const PORT = Number(process.env.CDP_PORT || 9223)
const TARGET_URL = process.argv[2] || 'http://127.0.0.1:5173/'
const OUT = 'tmp-inspect'
const SIZES = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1600x900', width: 1600, height: 900 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x640', width: 1024, height: 640 }
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const page = list.find((target) => target.type === 'page')
if (!page) throw new Error('找不到页面目标')

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))

let nextId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = (nextId += 1)
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })

await send('Page.enable')
await fs.mkdir(OUT, { recursive: true })

for (const size of SIZES) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: size.width,
    height: size.height,
    deviceScaleFactor: 1,
    mobile: false
  })
  await send('Page.navigate', { url: TARGET_URL })
  await sleep(1500)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  await fs.writeFile(`${OUT}/size-${size.name}.png`, Buffer.from(shot.result.data, 'base64'))
  console.log(`captured ${size.name}`)
}

await send('Emulation.clearDeviceMetricsOverride')
socket.close()
