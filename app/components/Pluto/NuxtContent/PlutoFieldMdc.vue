<script setup lang="ts">
// The `mdc` widget of the Nuxt Content layer. It wraps `PlutoMarkdownSource`
// (raw Markdown, the author sees all the MDC) and adds an Insert menu of MDC
// snippets in the toolbar. The model value is the Markdown text, as it is.
// The widget contract: props `field`, `modelValue`, `disabled`, and the
// `update:modelValue` event. The layer registers it as the widget `mdc`.
const props = defineProps<{
  field: PlutoTextField
  modelValue: unknown
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = usePlutoI18n()

const value = computed(() => (typeof props.modelValue === 'string' ? props.modelValue : ''))

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
  <UFormField :label="field.label" :description="field.description" :required="field.required">
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
</template>
