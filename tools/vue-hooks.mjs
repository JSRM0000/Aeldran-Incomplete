// 供 tools/ssr-check.mjs 使用的 Node 模块加载钩子：
// 1) 现场把 .vue 单文件组件编译成 ESM（不启动 vite、不 spawn 任何子进程）
// 2) 把 .css 变成空模块
// 3) 把 import.meta.env 替换成 globalThis.__ENV__，模拟 vite 注入的环境变量
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sfc = require('@vue/compiler-sfc')

const EMPTY_MODULE = 'data:text/javascript,export default {}'

export async function resolve (specifier, context, next) {
  if (specifier.endsWith('.css')) {
    return { url: EMPTY_MODULE, shortCircuit: true }
  }
  if (specifier.endsWith('.vue')) {
    return { url: new URL(specifier, context.parentURL).href, shortCircuit: true }
  }
  // vite 风格的无扩展名相对导入
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    for (const candidate of ['.js', '.vue', '/index.js']) {
      const url = new URL(specifier + candidate, context.parentURL)
      if (fs.existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true }
    }
  }
  return next(specifier, context)
}

export async function load (url, context, next) {
  if (!url.startsWith('file:')) return next(url, context)

  const file = fileURLToPath(url).replace(/\\/g, '/')

  if (file.endsWith('.vue')) {
    const source = fs.readFileSync(file, 'utf8')
    const id = file.split('/').pop().replace('.vue', '')
    const { descriptor, errors } = sfc.parse(source, { filename: file })
    if (errors.length) throw errors[0]

    let code = 'let __sfc__ = {}\n'
    let bindings = {}
    if (descriptor.script || descriptor.scriptSetup) {
      const compiled = sfc.compileScript(descriptor, { id })
      bindings = compiled.bindings ?? {}
      code = compiled.content.replace('export default', 'const __sfc__ =')
    }
    if (descriptor.template) {
      const tpl = sfc.compileTemplate({
        id,
        filename: file,
        source: descriptor.template.content,
        scoped: descriptor.styles.some((s) => s.scoped),
        compilerOptions: { bindingMetadata: bindings }
      })
      if (tpl.errors.length) throw tpl.errors[0]
      code += '\n' + tpl.code.replace('export function render', 'function render')
      code += '\n__sfc__.render = render\n'
    }
    code += `\n__sfc__.__file = ${JSON.stringify(id)}\nexport default __sfc__\n`
    code = code.replace(/import\.meta\.env/g, 'globalThis.__ENV__')

    // 收集 scoped 样式，供 SSR 快照使用
    if (descriptor.styles.length) {
      globalThis.__SFC_STYLES__ = globalThis.__SFC_STYLES__ ?? []
      for (const style of descriptor.styles) {
        const compiled = sfc.compileStyle({
          id: `data-v-${id}`,
          filename: file,
          source: style.content,
          scoped: Boolean(style.scoped)
        })
        globalThis.__SFC_STYLES__.push(compiled.code)
      }
    }

    return { format: 'module', source: code, shortCircuit: true }
  }

  if (file.endsWith('.js') && file.includes('/src/')) {
    let source = fs.readFileSync(file, 'utf8')
    if (source.includes('import.meta.env')) {
      source = source.replace(/import\.meta\.env/g, 'globalThis.__ENV__')
      return { format: 'module', source, shortCircuit: true }
    }
    return next(url, context)
  }

  // vite 允许直接 import JSON（自带默认导出），Node 的 ESM 需要 import attribute，
  // 这里统一包成 JS 模块，让 ssr-check 也能跑到「导入示例预设」这段代码
  if (file.endsWith('.json')) {
    const source = fs.readFileSync(file, 'utf8')
    return {
      format: 'module',
      source: `export default ${source}`,
      shortCircuit: true
    }
  }

  return next(url, context)
}
