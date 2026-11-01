/* ===========================================================
   外部 API 请求：统一走这里，自动绕开浏览器 CORS
   -----------------------------------------------------------
   - 开发服务器 / 预览服务器内置了 `/__api/proxy` 同源中转；
   - 打包后若被普通静态服务器托管（没有中转），自动退回直连，
     这时目标服务必须自行开启 CORS。
   =========================================================== */

const PROXY_PATH = '/__api/proxy'

/** 中转端点（vite 插件 aeldran-api-proxy 提供）是否可用；一旦发现不可用就记住，不再尝试 */
let proxyEnabled = typeof __AELDRAN_PROXY__ === 'undefined' ? true : Boolean(__AELDRAN_PROXY__)

export function proxyUrl (target) {
  return `${PROXY_PATH}?url=${encodeURIComponent(target)}`
}

function sameOrigin (target) {
  try {
    return new URL(target, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * 发送请求。同源直连；跨域优先走本地中转，中转不可用时退回直连。
 * @param {string} target 目标地址
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
export async function apiFetch (target, init = {}) {
  if (!proxyEnabled || sameOrigin(target)) return fetch(target, init)

  let response
  try {
    response = await fetch(proxyUrl(target), init)
  } catch {
    // 中转自己都连不上：退回直连，让浏览器给出真实的网络/CORS 报错
    proxyEnabled = false
    return fetch(target, init)
  }

  // 404/501 说明站点没有中转中间件（例如纯静态托管），退回直连
  if (response.status === 404 || response.status === 501) {
    const check = response.headers.get('x-aeldran-proxy')
    if (!check) {
      proxyEnabled = false
      return fetch(target, init)
    }
  }

  return response
}

/** 去掉末尾斜杠，避免拼出 `//models` */
export function normalizeBase (value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

export function trimSlashes (value) {
  return normalizeBase(value)
}

/** 校验 http(s) 地址，失败时抛出可直接展示给玩家的中文错误 */
export function assertHttpUrl (value, label = '地址') {
  const raw = normalizeBase(value)
  if (!raw) throw new Error(`请先填写${label}`)
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`${label}格式不正确（需要以 http:// 或 https:// 开头）`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${label}必须以 http:// 或 https:// 开头`)
  }
  return raw
}

/** 读 JSON，失败时给出截断的原文，方便定位端点问题 */
export async function readJson (response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`端点返回的不是 JSON：${text.slice(0, 160)}`)
  }
}

const STATUS_HINT = {
  400: '请求参数被拒绝（400）',
  401: 'API KEY 无效或已过期（401）',
  403: '没有访问权限（403）',
  404: '地址不存在（404），请检查端点是否以 /v1 结尾',
  405: '该地址不允许此请求方法（405）',
  429: '请求过于频繁（429），请稍后再试',
  500: '服务端内部错误（500）',
  502: '本地代理无法连上该地址（502）',
  503: '服务暂不可用（503）'
}

/** 把 HTTP 失败转成中文提示，附带服务端返回的片段 */
export async function httpError (response, prefix = '') {
  let detail = ''
  try {
    const text = await response.text()
    if (text) {
      try {
        const data = JSON.parse(text)
        detail = data?.error?.message || data?.error || data?.message || data?.detail || text.slice(0, 160)
        if (typeof detail !== 'string') detail = JSON.stringify(detail).slice(0, 160)
      } catch {
        detail = text.slice(0, 160)
      }
    }
  } catch {
    detail = ''
  }
  // 502 来自本地代理，detail 里已经是「无法连接到该地址（原因）」，不必再加前缀
  if (response.status === 502 && detail) return new Error(`${prefix}${detail}`)
  const base = STATUS_HINT[response.status] || `请求失败（${response.status}）`
  return new Error(`${prefix}${base}${detail ? `：${detail}` : ''}`)
}

/** 网络层异常（DNS / 拒绝连接 / CORS）转中文 */
export function networkError (error, target = '') {
  const message = String(error?.message || error || '')
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return new Error(`连接超时${target ? `：${target}` : ''}`)
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return new Error(`无法连接${target ? `：${target}` : '目标服务'}（地址、端口、或跨域设置有问题）`)
  }
  return new Error(message || '请求失败')
}

export function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
