import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

/**
 * 美术与数据资源统一放在项目根目录（保持与设计稿一致的 `./Picture/...`、`./预设/...` 路径）。
 * 开发服务器会把根目录当作站点根，所以这些路径直接可用；
 * 打包时再把目录复制进 dist，线上路径保持一致。
 */
const ASSET_DIRS = ['Picture', '预设']

function copyProjectAssets () {
  return {
    name: 'aeldran-copy-assets',
    apply: 'build',
    closeBundle () {
      for (const dir of ASSET_DIRS) {
        const from = path.resolve(rootDir, dir)
        const to = path.resolve(rootDir, 'dist', dir)
        if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true })
      }
    }
  }
}

/* ------------------------------------------------------------------
   第三方 API 代理：浏览器直连 OpenAI / NovelAI / ComfyUI 会被 CORS 拦下，
   这里提供同源的 `/__api/proxy?url=<encodeURIComponent(target)>` 中转。
   只允许 http/https，只转发一次请求，不缓存。
   ------------------------------------------------------------------ */

const PROXY_PATH = '/__api/proxy'
const DROP_HEADERS = new Set(['host', 'origin', 'referer', 'connection', 'content-length', 'accept-encoding', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])

function readBody (req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function proxyHandler (req, res) {
  const query = new URL(req.url || '', 'http://localhost').searchParams
  const target = query.get('url')

  if (!target) {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'missing url' }))
    return
  }

  let parsed
  try {
    parsed = new URL(target)
  } catch {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'invalid url' }))
    return
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'unsupported protocol' }))
    return
  }

  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (DROP_HEADERS.has(key) || value == null) continue
    headers[key] = Array.isArray(value) ? value.join(', ') : value
  }

  try {
    const hasBody = !['GET', 'HEAD'].includes((req.method || 'GET').toUpperCase())
    const body = hasBody ? await readBody(req) : undefined
    const upstream = await fetch(parsed.href, {
      method: req.method,
      headers,
      body,
      redirect: 'follow'
    })

    const buf = Buffer.from(await upstream.arrayBuffer())
    const outHeaders = {
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      'cache-control': 'no-store',
      'x-aeldran-proxy': '1'
    }
    const disposition = upstream.headers.get('content-disposition')
    if (disposition) outHeaders['content-disposition'] = disposition

    res.writeHead(upstream.status, outHeaders)
    res.end(buf)
  } catch (error) {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: `无法连接到该地址（${proxyReason(error)}）` }))
  }
}

/** 把 Node 的 fetch 失败原因翻译成一句中文 */
function proxyReason (error) {
  const code = error?.cause?.code ||
    error?.cause?.errors?.[0]?.code ||
    error?.code ||
    ''
  const table = {
    ECONNREFUSED: '目标端口没有在监听，连接被拒绝',
    ENOTFOUND: '域名无法解析，请检查地址拼写',
    EHOSTUNREACH: '主机不可达，请检查网络',
    ETIMEDOUT: '连接超时'
  }
  if (table[code]) return table[code]
  const raw = String(error?.cause?.message || error?.message || error || '未知错误')
  if (/bad port/i.test(raw)) return '该端口被保留，换一个端口试试'
  if (/fetch failed/i.test(raw)) return '连接失败'
  return raw.length > 120 ? `${raw.slice(0, 120)}…` : raw
}

function apiProxy () {
  const attach = (server) => {
    server.middlewares.use(PROXY_PATH, proxyHandler)
  }
  return {
    name: 'aeldran-api-proxy',
    configureServer: attach,
    configurePreviewServer: attach
  }
}

export default defineConfig({
  base: './',
  plugins: [vue(), copyProjectAssets(), apiProxy()],
  define: {
    // 构建产物由 `npm run preview` 托管时同样存在代理；纯静态托管下会自动退回直连
    __AELDRAN_PROXY__: 'true'
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    watch: {
      // 编辑器写入时的临时目录/临时文件会触发 EBUSY，全部忽略
      ignored: ['**/.*', '**/*.tmpdir/**', '**/*.tmp', '**/tmp-inspect/**', '**/tmp-probe/**', '**/.npm-cache/**', '**/dist/**'],
      // 原子写入（临时文件 + rename）不可靠地产生 change 事件，改用轮询，避免热更新丢改动
      usePolling: true,
      interval: 220
    }
  }
})
