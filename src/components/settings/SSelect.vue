<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '未指定' },
  disabled: { type: Boolean, default: false },
  empty: { type: String, default: '暂无可用选项' }
})

const emit = defineEmits(['update:modelValue'])

const ITEM_HEIGHT = 33
const MAX_HEIGHT = 268

const open = ref(false)
const trigger = ref(null)
const pop = ref(null)
const active = ref(-1)
const pos = ref({ left: 0, top: 0, width: 0, maxHeight: MAX_HEIGHT })

const list = computed(() =>
  props.options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))
)

const current = computed(() => list.value.find((opt) => opt.value === props.modelValue) || null)

/* 浮层贴着触发按钮，空间不够时向上翻，并限制最大高度 */
function place () {
  const el = trigger.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const wanted = Math.min(MAX_HEIGHT, list.value.length * ITEM_HEIGHT + 12)
  const below = window.innerHeight - rect.bottom - 12
  const above = rect.top - 12
  const upward = below < Math.min(wanted, 120) && above > below
  const maxHeight = Math.max(96, Math.min(wanted, upward ? above : below))

  pos.value = {
    left: rect.left,
    top: upward ? Math.max(8, rect.top - Math.min(wanted, maxHeight) - 5) : rect.bottom + 5,
    width: rect.width,
    maxHeight
  }
}

function onDocClick (event) {
  if (trigger.value?.contains(event.target) || pop.value?.contains(event.target)) return
  close()
}

/* 关键：浮层内部的滚动（滚轮/触摸）不能关掉浮层，否则列表滚不动 */
function onScroll (event) {
  if (pop.value?.contains(event.target)) return
  close()
}

function onKeydown (event) {
  if (!open.value) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    const next = active.value < 0 ? (step > 0 ? 0 : list.value.length - 1) : active.value + step
    active.value = Math.min(list.value.length - 1, Math.max(0, next))
    scrollActiveIntoView()
    return
  }
  if (event.key === 'Enter' && active.value >= 0) {
    event.preventDefault()
    const opt = list.value[active.value]
    if (opt) pick(opt)
  }
}

function scrollActiveIntoView () {
  nextTick(() => {
    const node = pop.value?.querySelector('.st-pop__item.is-active-index')
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' })
    }
  })
}

function bind () {
  document.addEventListener('click', onDocClick, true)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', close)
  window.addEventListener('keydown', onKeydown, true)
}

function unbind () {
  document.removeEventListener('click', onDocClick, true)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', close)
  window.removeEventListener('keydown', onKeydown, true)
}

function openList () {
  if (props.disabled) return
  active.value = Math.max(0, list.value.findIndex((opt) => opt.value === props.modelValue))
  open.value = true
  nextTick(() => {
    place()
    scrollActiveIntoView()
  })
}

function close () {
  open.value = false
}

function toggle () {
  if (open.value) close()
  else openList()
}

function pick (opt) {
  emit('update:modelValue', opt.value)
  close()
}

watch(open, (value) => {
  if (value) {
    bind()
  } else {
    unbind()
  }
})

onBeforeUnmount(unbind)
</script>

<template>
  <div ref="trigger" class="st-select" :class="{ 'is-open': open, 'is-disabled': disabled }">
    <button
      type="button"
      class="st-select__hit"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="st-select__value" :class="{ 'is-empty': !current }">
        {{ current ? current.label : placeholder }}
      </span>
      <Icon class="st-select__chevron" name="chevron" :size="14" />

      <Teleport to="body">
        <div
          v-if="open"
          ref="pop"
          class="st-pop st-pop--fixed scroll-thin"
          role="listbox"
          :style="{ left: `${pos.left}px`, top: `${pos.top}px`, width: `${pos.width}px`, maxHeight: `${pos.maxHeight}px` }"
        >
          <p v-if="!list.length" class="st-pop__empty">{{ empty }}</p>
          <button
            v-for="(opt, index) in list"
            :key="opt.value"
            type="button"
            class="st-pop__item"
            :class="{ 'is-active': opt.value === modelValue, 'is-active-index': index === active }"
            role="option"
            :aria-selected="opt.value === modelValue"
            @mouseenter="active = index"
            @click="pick(opt)"
          >
            <span>{{ opt.label }}</span>
            <Icon v-if="opt.value === modelValue" name="check" :size="13" />
          </button>
        </div>
      </Teleport>
    </button>
  </div>
</template>

<style scoped>
.st-select__hit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  padding: 8px 11px 8px 13px;
  color: inherit;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-align: left;
}

.st-select.is-disabled {
  opacity: 0.55;
}
</style>
