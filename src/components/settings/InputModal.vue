<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '工作流名称' },
  label: { type: String, default: '新的名称' },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' }
})

const emit = defineEmits(['confirm', 'cancel'])

const value = ref(props.modelValue)
const field = ref(null)

function onKeydown (event) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('cancel')
  }
  if (event.key === 'Enter') {
    event.stopPropagation()
    submit()
  }
}

function submit () {
  emit('confirm', value.value.trim())
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      value.value = props.modelValue
      window.addEventListener('keydown', onKeydown, true)
      window.setTimeout(() => {
        field.value?.focus()
        field.value?.select()
      }, 60)
    } else {
      window.removeEventListener('keydown', onKeydown, true)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="st-modal">
      <div v-if="open" class="st-modal" role="dialog" aria-modal="true" :aria-label="title">
        <div class="st-modal__veil" @click="emit('cancel')"></div>

        <div class="st-modal__card parchment">
          <button class="st-modal__close" type="button" aria-label="关闭" @click="emit('cancel')">
            <Icon name="close" :size="14" />
          </button>

          <h3 class="st-modal__title">{{ title }}</h3>

          <div class="st-modal__body">
            <label class="st-label" for="st-input-modal">{{ label }}</label>
            <input
              id="st-input-modal"
              ref="field"
              v-model="value"
              class="st-input"
              type="text"
              :placeholder="placeholder"
            />
          </div>

          <div class="st-modal__foot">
            <button class="btn btn--ghost btn--sm" type="button" @click="emit('cancel')">
              {{ cancelText }}
            </button>
            <button class="btn btn--primary btn--sm" type="button" @click="submit">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
