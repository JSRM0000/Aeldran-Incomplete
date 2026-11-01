// 静态检查：用 @vue/compiler-sfc 编译每个 .vue（不启动 vite、不 spawn 子进程），
// 并校验 src 内所有相对 import 指向的文件真实存在。
// 用法：node tools/lint-sfc.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sfc = require('@vue/compiler-sfc')

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const srcDir = path.join(root, 'src')

const files = []
function walk (dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else files.push(full)
  }
}
walk(srcDir)

let errors = 0
const report = (file, message) => {
  errors += 1
  console.log(`  ✗ ${path.relative(root, file)}\n     ${message}`)
}

/* ---------- 1. 编译 .vue ---------- */
for (const file of files.filter((f) => f.endsWith('.vue'))) {
  const source = fs.readFileSync(file, 'utf8')
  const { descriptor, errors: parseErrors } = sfc.parse(source, { filename: file })
  if (parseErrors.length) {
    parseErrors.forEach((e) => report(file, e.message))
    continue
  }

  try {
    const id = path.basename(file, '.vue')
    if (descriptor.script || descriptor.scriptSetup) {
      const compiled = sfc.compileScript(descriptor, { id, inlineTemplate: false })
      if (!compiled.content) report(file, 'script 编译结果为空')
    }
    if (descriptor.template) {
      const res = sfc.compileTemplate({
        id,
        filename: file,
        source: descriptor.template.content,
        compilerOptions: { bindingMetadata: {} }
      })
      res.errors.forEach((e) => report(file, `template: ${e.message || e}`))
    }
  } catch (error) {
    report(file, error.message)
  }
}

/* ---------- 2. 相对 import 是否指向真实文件 ---------- */
const IMPORT_RE = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g
for (const file of files.filter((f) => /\.(vue|js)$/.test(f))) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(IMPORT_RE)) {
    const target = path.resolve(path.dirname(file), match[1])
    const candidates = [target, `${target}.js`, `${target}.vue`, path.join(target, 'index.js')]
    if (!candidates.some((c) => fs.existsSync(c))) {
      report(file, `import 无法解析：${match[1]}`)
    }
  }
}

/* ---------- 4. 模板里用到的 class 是否有对应样式 ---------- */
const cssFiles = files.filter((f) => f.endsWith('.css'))
const globalClasses = new Set()
const collectClasses = (text, into) => {
  for (const m of text.matchAll(/\.([a-zA-Z][\w-]*)/g)) into.add(m[1])
}
cssFiles.forEach((f) => collectClasses(fs.readFileSync(f, 'utf8'), globalClasses))

for (const file of files.filter((f) => f.endsWith('.vue'))) {
  const source = fs.readFileSync(file, 'utf8')
  const { descriptor } = sfc.parse(source, { filename: file })
  const localClasses = new Set()
  descriptor.styles.forEach((style) => collectClasses(style.content, localClasses))

  const used = new Set()
  const template = descriptor.template?.content ?? ''
  for (const m of template.matchAll(/\sclass="([^"]*)"/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach((c) => used.add(c))
  }
  for (const m of template.matchAll(/:class="([^"]*)"/g)) {
    // 只取对象字面量里的 key（'is-active': ...），避免把比较值 'novelai' 当成类名
    for (const s of m[1].matchAll(/'([a-zA-Z][\w-]*)'\s*:/g)) used.add(s[1])
  }
  for (const name of used) {
    if (!localClasses.has(name) && !globalClasses.has(name)) {
      report(file, `class 无对应样式：.${name}`)
    }
  }
}

/* ---------- 5. 用到的图标名是否都在 Icon.vue 里 ---------- */
const iconFile = path.join(srcDir, 'components/settings/Icon.vue')
if (fs.existsSync(iconFile)) {
  const iconSource = fs.readFileSync(iconFile, 'utf8')
  const known = new Set([...iconSource.matchAll(/name === '([a-zA-Z]+)'/g)].map((m) => m[1]))
  const used = new Set()
  for (const file of files.filter((f) => f.endsWith('.vue'))) {
    const source = fs.readFileSync(file, 'utf8')
    for (const m of source.matchAll(/<Icon[^>]*\bname="([^"]+)"/g)) used.add(m[1])
  }
  for (const name of used) {
    if (!known.has(name)) report(iconFile, `缺少图标定义：${name}`)
  }
  console.log(`  图标：已定义 ${known.size} 个，模板中使用 ${used.size} 个`)
}

const total = files.filter((f) => f.endsWith('.vue')).length
console.log(errors ? `\n✗ 发现 ${errors} 处问题` : `\n✓ ${total} 个 .vue 全部编译通过，import 与图标引用均正常`)
process.exit(errors ? 1 : 0)
