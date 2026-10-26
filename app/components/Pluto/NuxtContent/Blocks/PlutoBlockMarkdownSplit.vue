<script setup lang="ts">
// The Markdown mode of the `mdc` widget in a canvas form: the Markdown at the
// left and the live preview at the right, side by side (stacked on a narrow
// screen). The preview is the frame of the visual editor, so it renders with
// the site parser. A click on a block in the preview selects the first line of
// that block in the Markdown and scrolls to it. The Markdown is the only
// editor here: the block model only feeds the preview and never writes.
import { findBlock } from '../../../../../shared/utils/blocks/tree'
import PlutoMdcInsertMenu from '../PlutoMdcInsertMenu.vue'
import PlutoBlockModeSwitch from './PlutoBlockModeSwitch.vue'
import PlutoBlockPreviewFrame from './PlutoBlockPreviewFrame.vue'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  mode: 'visual' | 'markdown'
  placeholder?: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:mode': [mode: 'visual' | 'markdown']
}>()

const form = usePlutoContentForm()
const appConfig = useAppConfig()

const editor = createPlutoBlockEditor({
  source: () => props.modelValue,
  emit: () => {},
  overrides: () => appConfig.plutoBlocks,
})
provide(plutoBlockEditorKey, editor)

// The front matter for the preview header: the item without the body.
const frontmatter = computed<Record<string, unknown>>(() => {
  const item = form?.item.value ?? {}
  return Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'body'))
})

const pane = useTemplateRef<HTMLElement>('pane')

const MIRRORED = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'tabSize',
  'textIndent',
  'wordSpacing',
  'wordBreak',
] as const

/**
 * The top of the caret at `offset`, in px from the top of the textarea. A
 * hidden copy of the textarea with the text before the offset gives it, so
 * long lines that wrap count too.
 */
function caretTop(textarea: HTMLTextAreaElement, offset: number): number {
  const style = getComputedStyle(textarea)
  const mirror = document.createElement('div')
  for (const property of MIRRORED) {
    mirror.style[property] = style[property]
  }
  Object.assign(mirror.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' })
  mirror.textContent = textarea.value.slice(0, offset)
  const marker = document.createElement('span')
  marker.textContent = '​'
  mirror.append(marker)
  document.body.append(mirror)
  const top = marker.offsetTop
  mirror.remove()
  return top
}

/** Selects the first line of the range in the Markdown, and scrolls it to the upper third of the pane. */
function reveal(start: number, end: number) {
  const container = pane.value
  const textarea = container?.querySelector('textarea')
  if (!container || !textarea) {
    return
  }
  const lineEnd = textarea.value.indexOf('\n', start)
  textarea.focus({ preventScroll: true })
  textarea.setSelectionRange(start, lineEnd === -1 ? end : Math.min(lineEnd, end))
  const offset = textarea.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
  container.scrollTo({ top: Math.max(0, offset + caretTop(textarea, start) - container.clientHeight / 3), behavior: 'smooth' })
}

// A click on a block in the preview: go to that block in the Markdown.
watch(() => editor.selection.value, (selection) => {
  if (selection?.source !== 'preview') {
    return
  }
  const original = findBlock(editor.doc.value, selection.id)?.block.original
  if (original) {
    reveal(original.start, original.end)
  }
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col lg:flex-row" data-block-canvas>
    <div ref="pane" class="min-h-0 flex-1 overflow-y-auto p-4 lg:basis-1/2">
      <PlutoMarkdownSource
        :model-value="modelValue"
        :disabled="disabled"
        :placeholder="placeholder"
        :aria-label="label"
        @update:model-value="emit('update:modelValue', $event)"
      >
        <template #toolbar="{ insert }">
          <PlutoMdcInsertMenu :insert="insert" :disabled="disabled" />
          <div class="ms-auto">
            <PlutoBlockModeSwitch :mode="mode" :disabled="disabled" @update:mode="emit('update:mode', $event)" />
          </div>
        </template>
      </PlutoMarkdownSource>
    </div>

    <div class="min-h-0 flex-1 border-t border-default lg:basis-1/2 lg:border-s lg:border-t-0">
      <PlutoBlockPreviewFrame :frontmatter="frontmatter" class="size-full" />
    </div>
  </div>
</template>
