<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  width: { type: [Number, String], default: 1.5 }
})
</script>

<template>
  <svg
    class="ico"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="width"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'gear'">
      <path d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" />
      <path
        d="M19.1 14.6a1.6 1.6 0 0 0 .32 1.77l.06.06a1.94 1.94 0 1 1-2.74 2.74l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V20a1.94 1.94 0 1 1-3.88 0v-.1a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a1.94 1.94 0 1 1-2.74-2.74l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H4a1.94 1.94 0 1 1 0-3.88h.1a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06A1.94 1.94 0 1 1 7.93 3.7l.06.06a1.6 1.6 0 0 0 1.77.32H9.86a1.6 1.6 0 0 0 .97-1.47V2.5a1.94 1.94 0 1 1 3.88 0v.1a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.94 1.94 0 1 1 2.74 2.74l-.06.06a1.6 1.6 0 0 0-.32 1.77v.05a1.6 1.6 0 0 0 1.47.97H21a1.94 1.94 0 1 1 0 3.88h-.1a1.6 1.6 0 0 0-1.47.97Z"
      />
    </template>

    <template v-else-if="name === 'plus'">
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </template>

    <template v-else-if="name === 'trash'">
      <path d="M4 7h16" />
      <path d="M9.5 7V5.1h5V7" />
      <path d="M6.4 7l.9 12.1h9.4L17.6 7" />
      <path d="M10.1 10.6v5.6M13.9 10.6v5.6" />
    </template>

    <template v-else-if="name === 'close'">
      <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />
    </template>

    <template v-else-if="name === 'chevron'">
      <path d="M6.6 9.6 12 15l5.4-5.4" />
    </template>

    <template v-else-if="name === 'check'">
      <path d="M5 12.4 10 17.4 19 6.6" />
    </template>

    <template v-else-if="name === 'back'">
      <path d="M14.6 5 7.6 12l7 7" />
    </template>

    <template v-else-if="name === 'import'">
      <path d="M12 3.6v9.6" />
      <path d="M8.4 9.6 12 13.2l3.6-3.6" />
      <path d="M4.6 15.4v3.1a1.3 1.3 0 0 0 1.3 1.3h12.2a1.3 1.3 0 0 0 1.3-1.3v-3.1" />
    </template>

    <template v-else-if="name === 'export'">
      <path d="M12 13.4V3.8" />
      <path d="M8.4 7.4 12 3.8l3.6 3.6" />
      <path d="M4.6 15.4v3.1a1.3 1.3 0 0 0 1.3 1.3h12.2a1.3 1.3 0 0 0 1.3-1.3v-3.1" />
    </template>

    <template v-else-if="name === 'book'">
      <path d="M3.2 5.4c2.6-1.15 5.3-1.15 7.9 0v13.2c-2.6-1.15-5.3-1.15-7.9 0V5.4Z" />
      <path d="M20.8 5.4c-2.6-1.15-5.3-1.15-7.9 0v13.2c2.6-1.15 5.3-1.15 7.9 0V5.4Z" />
      <path d="M12 5.9v12.2" opacity="0.7" />
    </template>

    <template v-else-if="name === 'spark'">
      <path d="M12 3.4l1.9 5.1 5.1 1.9-5.1 1.9L12 17.4l-1.9-5.1L5 10.4l5.1-1.9L12 3.4Z" />
      <path d="M18.4 16.6l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" opacity="0.75" />
    </template>

    <template v-else-if="name === 'image'">
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="1.4" />
      <path d="M3.8 16.4l4.6-4.4 4 3.7 2.6-2.4 4.8 4.3" />
      <circle cx="8.9" cy="9.1" r="1.35" />
    </template>
  </svg>
</template>

<style scoped>
.ico {
  display: block;
  flex: 0 0 auto;
}
</style>
