/**
 * 悬浮提示（全局委托版）
 *
 * 设置窗口内的图标按钮统一通过 aria-label 提供提示文本；
 * 这里用事件委托显示气泡，气泡挂在 body 上并 fixed 定位，
 * 因此不会被滚动容器（.st-list / .prompt-list）裁切。
 * 也可以给任意元素加 data-tip="文本" 覆盖 aria-label。
 */
let bubble = null
let timer = 0
let current = null

const SELECTOR = '.sd [aria-label], .sd [data-tip], [data-tip]'

function ensureBubble () {
  if (bubble) return bubble
  bubble = document.createElement('div')
  bubble.className = 'st-tip-pop'
  bubble.setAttribute('role', 'tooltip')
  document.body.appendChild(bubble)
  return bubble
}

function hide () {
  window.clearTimeout(timer)
  if (bubble) bubble.classList.remove('is-on')
}

function place (el) {
  const text = el.getAttribute('data-tip') || el.getAttribute('aria-label')
  if (!text) return
  const node = ensureBubble()
  node.textContent = text
  node.style.visibility = 'hidden'
  node.classList.add('is-on')

  const rect = el.getBoundingClientRect()
  const box = node.getBoundingClientRect()
  const gap = 9
  let top = rect.top - box.height - gap
  let below = false
  if (top < 8) {
    top = rect.bottom + gap
    below = true
  }
  let left = rect.left + rect.width / 2 - box.width / 2
  left = Math.max(8, Math.min(left, window.innerWidth - box.width - 8))

  node.style.top = Math.round(top) + 'px'
  node.style.left = Math.round(left) + 'px'
  node.dataset.arrow = below ? 'up' : 'down'
  node.style.visibility = 'visible'
}

export function installTip () {
  if (typeof document === 'undefined') return

  document.addEventListener('mouseover', (event) => {
    const el = event.target?.closest?.(SELECTOR)
    if (!el) {
      // 移到没有提示的元素上（例如切换标签页后），立刻收起旧气泡
      if (current) {
        current = null
        hide()
      }
      return
    }
    if (el === current) return
    current = el
    window.clearTimeout(timer)
    timer = window.setTimeout(() => place(el), 80)
  })

  document.addEventListener('mouseout', (event) => {
    const el = event.target?.closest?.(SELECTOR)
    if (el && el === current) {
      current = null
      hide()
    }
  })

  document.addEventListener('mousedown', hide, true)
  document.addEventListener('click', hide, true)
  document.addEventListener('keydown', hide, true)
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
}

export default installTip
