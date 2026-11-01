/* ===========================================================
   ComfyUI 工作流工具：解析 API 格式工作流、回填参数、注入提示词
   =========================================================== */

/** 解析文本为工作流图（兼容 {prompt:{...}} / {workflow:{...}} / 裸图） */
export function unwrapWorkflow (text) {
  let data
  try {
    data = typeof text === 'string' ? JSON.parse(text) : text
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const graph = data.prompt ?? data.workflow ?? data
  if (!graph || typeof graph !== 'object') return null
  const entries = Object.values(graph).filter((node) => node && typeof node === 'object' && node.class_type)
  return entries.length ? graph : null
}

export function extractComfyParams (text) {
  const graph = unwrapWorkflow(text)
  if (!graph) return null

  const entries = Object.entries(graph).filter(
    ([, node]) => node && typeof node === 'object' && node.class_type
  )

  const byClass = (re) => entries.find(([, node]) => re.test(node.class_type))
  const result = {}

  const sampler = byClass(/KSampler|SamplerCustom/i)
  if (sampler) {
    const inputs = sampler[1].inputs || {}
    if (inputs.steps != null) result.steps = String(inputs.steps)
    if (inputs.cfg != null) result.cfg = String(inputs.cfg)
    if (inputs.sampler_name) result.sampler = String(inputs.sampler_name)
    const negative = inputs.negative
    if (Array.isArray(negative)) {
      const node = graph[negative[0]]
      const text = node?.inputs?.text
      if (typeof text === 'string') result.negative = text
    }
  }

  const latent = byClass(/Empty.*Latent|LatentImage/i)
  if (latent) {
    const inputs = latent[1].inputs || {}
    if (inputs.width != null) result.width = String(inputs.width)
    if (inputs.height != null) result.height = String(inputs.height)
  }

  return result
}

function toNumber (value, fallback) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function linkId (link) {
  if (Array.isArray(link) && link.length) return String(link[0])
  if (typeof link === 'string') return link
  return null
}

/** 找到 CLIPTextEncode 一类的文本节点（含 SDXL 变体），把提示词写进去 */
function writeText (graph, nodeId, text) {
  for (let depth = 0; depth < 3 && nodeId; depth++) {
    const node = graph[nodeId]
    if (!node || typeof node !== 'object') return false
    node.inputs = node.inputs || {}
    const inputs = node.inputs
    if (typeof inputs.text === 'string') {
      inputs.text = text
      return true
    }
    if (typeof inputs.text_g === 'string') {
      inputs.text_g = text
      if (typeof inputs.text_l === 'string') inputs.text_l = text
      return true
    }
    // ConditioningCombine / ConditioningConcat 等：继续向上一层找文本节点
    const next =
      linkId(inputs.conditioning_1) ||
      linkId(inputs.conditioning) ||
      linkId(inputs.conditioning_to) ||
      null
    nodeId = next
  }
  return false
}

/**
 * 把界面上的参数注入到工作流图中（返回副本，不修改原对象）
 * @returns {{ graph: object, applied: { prompt: boolean, negative: boolean, sampler: boolean, size: boolean } }}
 */
export function applyComfyParams (graph, params = {}) {
  const out = JSON.parse(JSON.stringify(graph))
  const applied = { prompt: false, negative: false, sampler: false, size: false }

  for (const node of Object.values(out)) {
    if (!node || typeof node !== 'object' || !node.class_type) continue
    const type = String(node.class_type)
    node.inputs = node.inputs || {}

    if (/^KSampler|^SamplerCustom/i.test(type)) {
      if (params.steps !== '' && params.steps != null) {
        node.inputs.steps = toNumber(params.steps, node.inputs.steps)
        applied.sampler = true
      }
      if (params.cfg !== '' && params.cfg != null) {
        node.inputs.cfg = toNumber(params.cfg, node.inputs.cfg)
        applied.sampler = true
      }
      if (params.sampler) {
        node.inputs.sampler_name = String(params.sampler)
        applied.sampler = true
      }
      if (params.seed !== '' && params.seed != null) {
        node.inputs.seed = toNumber(params.seed, node.inputs.seed)
      }

      if (params.prompt) {
        const target = linkId(node.inputs.positive)
        if (target && writeText(out, target, String(params.prompt))) applied.prompt = true
      }
      if (params.negative != null) {
        const target = linkId(node.inputs.negative)
        if (target && writeText(out, target, String(params.negative))) applied.negative = true
      }
      continue
    }

    if (/Empty.*Latent|LatentImage/i.test(type)) {
      if (params.width) node.inputs.width = toNumber(params.width, node.inputs.width)
      if (params.height) node.inputs.height = toNumber(params.height, node.inputs.height)
      if (params.width || params.height) applied.size = true
    }
  }

  return { graph: out, applied }
}
