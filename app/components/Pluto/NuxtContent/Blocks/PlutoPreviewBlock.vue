<script setup lang="ts">
// One block in the preview page, inside its own error boundary. A component
// that throws (it needs data that the preview has no, for example) shows a
// small card in place of the block, and the other blocks keep working.
// `preview: false` in the block definition shows the same card, with a note.
import type { MDCRoot } from '@nuxtjs/mdc'

const props = defineProps<{
  id: string
  /** The parsed body, or `undefined` for a block that the preview does not render. */
  body?: MDCRoot
  /** The name of the block, for the card. */
  label: string
  /** A parse error of this block. */
  error?: string
}>()

const emit = defineEmits<{
  error: [id: string, message: string]
}>()

const { t } = usePlutoI18n()

const failed = ref<string | null>(null)
const value = computed(() => (props.body ? { body: props.body } : undefined))

// A new body gets a new chance to render.
watch(() => props.body, () => {
  failed.value = null
})

onErrorCaptured((error) => {
  failed.value = error instanceof Error ? error.message : String(error)
  emit('error', props.id, failed.value)
  // Stop the error here, so the other blocks stay on screen.
  return false
})

const note = computed(() => {
  if (props.error) {
    return t('nuxt-content.preview.parseError')
  }
  if (failed.value) {
    return t('nuxt-content.preview.blockError')
  }
  return t('nuxt-content.preview.notShown')
})
</script>

<template>
  <ContentRenderer
    v-if="value && !failed && !error"
    :value="value"
    :tag="(false as unknown as string)"
  />

  <div
    v-else
    :data-pluto-block="id"
    class="my-4 flex items-center gap-3 rounded-lg border border-dashed border-default bg-elevated/50 px-4 py-3 text-sm text-muted"
  >
    <UIcon name="i-lucide-eye-off" class="size-5 shrink-0" />
    <div class="min-w-0">
      <p class="font-medium text-default">
        {{ label }}
      </p>
      <p>{{ note }}</p>
    </div>
  </div>
</template>
