<script setup>
import { onBeforeUnmount, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '确定删除该预设？' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确认删除' },
  cancelText: { type: String, default: '取消' },
  danger: { type: Boolean, default: true }
})

const emit = defineEmits(['confirm', 'cancel'])

function onKeydown (event) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('cancel')
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown, true)
    else window.removeEventListener('keydown', onKeydown, true)
  },
  { immediate: true }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="st-modal">
      <div v-if="open" class="st-modal" role="alertdialog" aria-modal="true" :aria-label="title">
        <div class="st-modal__veil" @click="emit('cancel')"></div>

        <div class="st-modal__card parchment">
          <button class="st-modal__close" type="button" aria-label="关闭" @click="emit('cancel')">
            <Icon name="close" :size="14" />
          </button>

          <h3 class="st-modal__title">{{ title }}</h3>
          <div class="st-modal__body">
            <p v-if="message" class="st-modal__text">{{ message }}</p>
          </div>

          <div class="st-modal__foot">
            <button class="btn btn--ghost btn--sm" type="button" @click="emit('cancel')">
              {{ cancelText }}
            </button>
            <button
              class="btn btn--sm"
              :class="danger ? 'btn--danger' : 'btn--primary'"
              type="button"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.st-modal-enter-active .st-modal__veil,
.st-modal-leave-active .st-modal__veil {
  transition: opacity 0.28s var(--ease-out);
}

.st-modal-enter-active .st-modal__card,
.st-modal-leave-active .st-modal__card {
  transition: opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out);
}

.st-modal-enter-from .st-modal__veil,
.st-modal-leave-to .st-modal__veil {
  opacity: 0;
}

.st-modal-enter-from .st-modal__card,
.st-modal-leave-to .st-modal__card {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
