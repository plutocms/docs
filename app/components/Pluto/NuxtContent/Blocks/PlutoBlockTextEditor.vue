<script setup lang="ts">
// A small rich text editor for one Text block, or for one slot of a
// component. It is the core Nuxt UI editor (Tiptap) with the toolbar of the
// Pluto Markdown editor (`usePlutoMarkdownToolbar`). The Tiptap history is off:
// the block editor has one undo stack for the whole page. The value is
// Markdown. The editor emits only after the author types, so opening a block
// never rewrites it.
defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string
  label: string
  /** A shorter box, for a slot such as the text of a note. */
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = usePlutoI18n()

// The first group of the shared toolbar is Undo and Redo. The page has its own.
const shared = usePlutoMarkdownToolbar({ link: true })
const items = computed(() => shared.value.slice(1))
</script>

<template>
  <!-- The editor root is a bordered box. A click anywhere in the box puts the cursor in the text. -->
  <UEditor
    v-slot="{ editor }"
    :model-value="modelValue"
    :editable="!disabled"
    :placeholder="placeholder ?? t('nuxt-content.editor.textPlaceholder')"
    :starter-kit="{ undoRedo: false }"
    :image="false"
    :mention="false"
    :ui="{
      root: 'w-full',
      content: compact ? 'min-h-24 cursor-text' : 'min-h-48 cursor-text',
      base: compact ? 'min-h-24 px-3 py-2 sm:px-3' : 'min-h-48 px-3 py-2 sm:px-3',
    }"
    :aria-label="label"
    content-type="markdown"
    class="w-full rounded-md border border-default bg-default"
    @update:model-value="emit('update:modelValue', $event as string)"
  >
    <UEditorToolbar
      :editor="editor"
      :items="items"
      :aria-label="t('pluto.cms.editor.toolbar')"
      class="sticky top-0 z-10 overflow-x-auto rounded-t-md border-b border-default bg-default px-1.5 py-1"
    >
      <template #link>
        <PlutoCmsEditorLink :editor="editor" />
      </template>
    </UEditorToolbar>
  </UEditor>
</template>
