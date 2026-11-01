/* ===========================================================
   文生图：真正调用 NovelAI / ComfyUI
   =========================================================== */

import {
  apiFetch,
  assertHttpUrl,
  httpError,
  networkError,
  normalizeBase,
  readJson,
  sleep
} from './http.js'
import { applyComfyParams, unwrapWorkflow } from './comfy.js'

const DEFAULT_TEST_PROMPT = 'a lone knight resting by a campfire at dusk, medieval fantasy, painterly'

/** 画风作为头部插入提示词 */
export function composePrompt (style, prompt) {
  return [String(style || '').trim(), String(prompt || '').trim()]
    .filter(Boolean)
    .join(', ')
}

export function defaultTestPrompt () {
  return DEFAULT_TEST_PROMPT
}

/* ---------- 通用：把响应变成 Blob ---------- */

async function responseToBlob (response) {
  const type = String(response.headers.get('content-type') || '').toLowerCase()

  if (type.includes('application/json')) {
    const data = await readJson(response)
    const base64 =
      data?.data?.[0]?.image ??
      data?.images?.[0]?.image ??
      data?.image ??
      data?.data?.[0]?.b64_json
    if (typeof base64 === 'string' && base64) {
      const bytes = base64ToBytes(base64)
      return new Blob([bytes], { type: 'image/png' })
    }
    throw new Error('服务返回了 JSON，但里面没有图片数据')
  }

  const blob = await response.blob()

  if (type.includes('zip') || type.includes('octet-stream')) {
    return await firstImageFromZip(await blob.arrayBuffer())
  }

  if (!/^image\//.test(type) && blob.size < 16) {
    throw new Error('服务返回的内容不是图片')
  }

  return blob
}

function base64ToBytes (text) {
  const clean = text.includes(',') ? text.slice(text.indexOf(',') + 1) : text
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function mimeOf (name) {
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg'
  if (/\.webp$/i.test(name)) return 'image/webp'
  return 'image/png'
}

async function inflateRaw (bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** NovelAI v4 用 ZIP 打包返回图片，这里取第一张 */
async function firstImageFromZip (buffer) {
  const view = new DataView(buffer)
  const minEocd = Math.max(0, buffer.byteLength - 22 - 65557)
  let eocd = -1
  for (let i = buffer.byteLength - 22; i >= minEocd; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('ZIP 响应无法解析')

  const total = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)

  for (let index = 0; index < total; index++) {
    if (offset + 46 > buffer.byteLength || view.getUint32(offset, true) !== 0x02014b50) break

    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = new TextDecoder().decode(new Uint8Array(buffer, offset + 46, nameLength))

    offset += 46 + nameLength + extraLength + commentLength

    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue

    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const payload = new Uint8Array(buffer, start, compressedSize)

    let bytes
    if (method === 0) bytes = payload
    else if (method === 8) bytes = await inflateRaw(payload)
    else throw new Error(`不支持的 ZIP 压缩方式（${method}）`)

    return new Blob([bytes], { type: mimeOf(name) })
  }

  throw new Error('ZIP 响应里没有找到图片')
}

/* ---------- NovelAI ---------- */

export function buildNovelAIPayload (config, prompt) {
  const width = Number(config.width) || 832
  const height = Number(config.height) || 1216
  const negative = String(config.negative || '').trim()

  return {
    input: composePrompt(config.style, prompt),
    model: String(config.model || '').trim() || 'nai-diffusion-4-full',
    action: 'generate',
    parameters: {
      width,
      height,
      scale: Number(config.cfg) || 5,
      steps: Number(config.steps) || 28,
      sampler: String(config.sampler || '').trim() || 'k_euler_ancestral',
      n_samples: 1,
      ucPreset: 0,
      qualityToggle: true,
      negative_prompt: negative,
      uc: negative,
      sm: false,
      sm_dyn: false,
      dynamic_thresholding: false,
      controlnet_strength: 1,
      legacy: false,
      add_original_image: true,
      cfg_rescale: 0,
      noise_schedule: 'native',
      skip_cfg_above_sigma: null
    }
  }
}

export async function generateNovelAIImage (config, prompt) {
  const baseUrl = assertHttpUrl(config.baseUrl, '端点（基础 URL）')
  const apiKey = String(config.apiKey || '').trim()
  if (!apiKey) throw new Error('请先填写 NovelAI 的 API KEY')

  const target = `${baseUrl}/ai/generate-image`
  let response
  try {
    response = await apiFetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, image/png, application/zip',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildNovelAIPayload(config, prompt))
    })
  } catch (error) {
    throw networkError(error, target)
  }

  if (!response.ok) throw await httpError(response, 'NovelAI 生图失败：')

  const blob = await responseToBlob(response)
  return { blob, note: `NovelAI · ${String(config.model || 'nai-diffusion-4-full').trim()}` }
}

/* ---------- ComfyUI ---------- */

function findOutputImage (history, promptId) {
  const entry = history?.[promptId]
  const outputs = entry?.outputs || {}
  for (const node of Object.values(outputs)) {
    const images = node?.images
    if (Array.isArray(images) && images.length) return images[0]
  }
  return null
}

export async function generateComfyImage (config, prompt) {
  const apiUrl = assertHttpUrl(config.apiUrl, 'ComfyUI API 地址')
  const workflow = unwrapWorkflow(config.workflowJson)
  if (!workflow) throw new Error('工作流 JSON 为空，或不是 API 格式的工作流')

  const { graph, applied } = applyComfyParams(workflow, {
    prompt,
    negative: config.negative ?? '',
    width: config.width,
    height: config.height,
    steps: config.steps,
    cfg: config.cfg,
    sampler: config.sampler,
    seed: config.seed
  })

  const body = JSON.stringify({ prompt: graph, client_id: comfyClientId() })

  let response
  try {
    response = await apiFetch(`${apiUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })
  } catch (error) {
    throw networkError(error, `${apiUrl}/prompt`)
  }

  if (!response.ok) throw await httpError(response, 'ComfyUI 拒绝了工作流：')

  const queued = await readJson(response)
  const promptId = queued?.prompt_id
  if (!promptId) throw new Error('ComfyUI 没有返回 prompt_id')

  const nodeErrors = queued?.node_errors
  if (nodeErrors && Object.keys(nodeErrors).length) {
    const first = Object.values(nodeErrors)[0]
    const detail = first?.errors?.[0]?.message || first?.errors?.[0]?.details || ''
    throw new Error(`工作流节点报错：${detail || JSON.stringify(nodeErrors).slice(0, 160)}`)
  }

  const image = await waitForImage(apiUrl, promptId)

  const query = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || '',
    type: image.type || 'output'
  })
  const viewUrl = `${apiUrl}/view?${query.toString()}`

  let imageResponse
  try {
    imageResponse = await apiFetch(viewUrl, { method: 'GET' })
  } catch (error) {
    throw networkError(error, viewUrl)
  }
  if (!imageResponse.ok) throw await httpError(imageResponse, '取回生成结果失败：')

  const blob = await imageResponse.blob()
  const appliedNote = applied.prompt ? '' : '（未找到正向提示词节点，已按原工作流执行）'
  return { blob, note: `ComfyUI · ${image.filename}${appliedNote}` }
}

async function waitForImage (apiUrl, promptId) {
  const deadline = Date.now() + 300000
  while (Date.now() < deadline) {
    await sleep(1200)

    let response
    try {
      response = await apiFetch(`${apiUrl}/history/${promptId}`, { method: 'GET' })
    } catch (error) {
      throw networkError(error, `${apiUrl}/history/${promptId}`)
    }
    if (!response.ok) throw await httpError(response, '查询生成进度失败：')

    const history = await readJson(response)
    const entry = history?.[promptId]
    if (entry?.status?.status_str === 'error') {
      const message = entry?.status?.messages?.flat?.()?.find((item) => item?.event === 'execution_error')
      throw new Error(`ComfyUI 执行出错：${message?.data?.exception_message || '未知错误'}`)
    }

    const image = findOutputImage(history, promptId)
    if (image) return image
  }

  throw new Error('等待生成超时（5 分钟），请检查 ComfyUI 是否仍在执行')
}

function comfyClientId () {
  const key = 'aeldran.comfy.client'
  try {
    const saved = window.localStorage.getItem(key)
    if (saved) return saved
    const id = `aeldran-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(key, id)
    return id
  } catch {
    return `aeldran-${Math.random().toString(36).slice(2, 10)}`
  }
}

/** 供界面统一调用 */
export async function generateImage (imageSettings, prompt) {
  if (imageSettings.provider === 'comfyui') return generateComfyImage(imageSettings.comfyui, prompt)
  return generateNovelAIImage(imageSettings.novelai, prompt)
}

export { normalizeBase }
