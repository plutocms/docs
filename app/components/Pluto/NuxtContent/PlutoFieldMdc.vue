<script setup lang="ts">
// The `mdc` widget of the Nuxt Content layer. It edits the Markdown (MDC) body
// of a page in one of two modes:
//
// - Visual: the block editor. A live preview in the middle, the block list at
//   the left and the controls of the selected block at the right. It needs the
//   'canvas' form layout (the docs type uses it) and loads on demand, so
//   Tiptap and the remark parser stay out of the other admin pages.
// - Markdown: `PlutoMarkdownSource` (raw Markdown, the author sees all the MDC)
//   with an Insert menu of snippets.
//
// The first mode is the `editor` option of the field (`visual` or `source`). A
// cookie keeps the last choice of the author. The model value is the Markdown
// text, as it is. The widget contract: props `field`, `modelValue`, `disabled`,
// and the `update:modelValue` event. The layer registers it as the widget `mdc`.
import { defineAsyncComponent } from 'vue'
import PlutoBlockModeSwitch from './Blocks/PlutoBlockModeSwitch.vue'

const props = defineProps<{
  field: PlutoTextField
  modelValue: unknown
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// The block editor loads on demand. The skeleton shows while it loads.
const PlutoBlockEditor = defineAsyncComponent({
  loader: () => import('./Blocks/PlutoBlockEditor.vue'),
  loadingComponent: () => h('div', { class: 'flex h-full flex-col gap-3 p-6' }, [h(resolveComponent('USkeleton'), { class: 'h-8 w-1/3' }), h(resolveComponent('USkeleton'), { class: 'h-64 w-full' })]),
  delay: 120,
})

const { t } = usePlutoI18n()
const form = usePlutoContentForm()

const value = computed(() => (typeof props.modelValue === 'string' ? props.modelValue : ''))

// Visual needs the canvas layout: the panels live in the form.
const canVisual = computed(() => Boolean(form?.canvas.value))

type Mode = 'visual' | 'markdown'
const saved = useCookie<Mode | null>('pluto-mdc-editor-mode', { default: () => null, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
const mode = ref<Mode>(canVisual.value ? (saved.value ?? (props.field.editor === 'source' ? 'markdown' : 'visual')) : 'markdown')

function setMode(next: Mode) {
  mode.value = next
  saved.value = next
}

type Insert = (text: string, options?: { block?: boolean }) => void

// One dropdown item per snippet. The `insert` function comes from the toolbar slot.
function menu(insert: Insert) {
  return MDC_SNIPPETS.map((snippet) => ({
    label: t(snippet.label),
    icon: snippet.icon,
    onSelect: () => insert(snippet.text, { block: snippet.block }),
  }))
}
</script>

<template>
  <PlutoBlockEditor
    v-if="mode === 'visual' && canVisual"
    :model-value="value"
    :disabled="disabled"
    :mode="mode"
    @update:model-value="emit('update:modelValue', $event)"
    @update:mode="setMode"
  />

  <div v-else :class="form?.canvas.value ? 'h-full overflow-y-auto p-4 sm:p-6' : undefined">
    <UFormField :label="field.label" :description="field.description" :required="field.required" :class="form?.canvas.value ? 'mx-auto max-w-5xl' : undefined">
      <div v-if="canVisual" class="mb-2 flex justify-end">
        <PlutoBlockModeSwitch :mode="mode" :disabled="disabled" @update:mode="setMode" />
      </div>

      <PlutoMarkdownSource
        :model-value="value"
        :disabled="disabled"
        :placeholder="field.placeholder ?? t('nuxt-content.mdc.placeholder')"
        :aria-label="field.label"
        @update:model-value="emit('update:modelValue', $event)"
      >
        <template #toolbar="{ insert }">
          <UDropdownMenu :items="menu(insert)" :content="{ align: 'start' }" :disabled="disabled">
            <UButton
              :label="t('nuxt-content.mdc.insert')"
              :disabled="disabled"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-plus"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>
        </template>
      </PlutoMarkdownSource>
    </UFormField>
  </div>
</template>
