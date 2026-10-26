<script setup lang="ts">
// The Markdown mode of the `mdc` widget in a canvas form: the Markdown at the
// left and the live preview at the right, side by side (stacked on a narrow
// screen). The handle between them resizes them, and a cookie keeps the size.
// The preview is the frame of the visual editor, so it renders with the site
// parser. A click on a block in the preview selects the first line of that
// block in the Markdown and scrolls to it. The Markdown is the only editor
// here: the block model only feeds the preview and never writes.
import type { SplitterItem } from '@nuxt/ui'
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

// --- The split ---------------------------------------------------------------------

const isDesktop = useMediaQuery('(min-width: 64rem)')
// The size of the Markdown pane, in percent of the row (desktop) or of the column (narrow).
const splitSize = useCookie<number>('pluto-mdc-split', { default: () => 50, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
const MIN = 25
const MAX = 75
// Read once: a reactive `defaultSize` would rebuild the panels on each save of the size.
const initialSize = Math.min(MAX, Math.max(MIN, Number(splitSize.value) || 50))
const items: SplitterItem[] = [
  { id: 'pluto-mdc-source', slot: 'source', defaultSize: initialSize, minSize: MIN, maxSize: MAX },
  { id: 'pluto-mdc-preview', slot: 'preview' },
]

// The pointer over the iframe goes to the frame, and the drag stops. So the preview takes no
// pointer events while the handle moves. The size is saved when the drag ends.
const dragging = ref(false)
let lastLayout: number[] = []
function onLayout(sizes: number[]) {
  lastLayout = sizes
}
function onDragging(_index: number, value: boolean) {
  dragging.value = value
  if (!value && lastLayout[0]) {
    splitSize.value = Math.round(lastLayout[0])
  }
}

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
  <USplitter
    id="pluto-mdc-split"
    :items="items"
    :orientation="isDesktop ? 'horizontal' : 'vertical'"
    :ui="{
      root: 'h-full min-h-0',
      handle: 'bg-(--ui-border) transition-colors hover:bg-primary data-[resize-handle-state=drag]:bg-primary',
    }"
    data-block-canvas
    @layout="onLayout"
    @dragging="onDragging"
  >
    <template #source>
      <div ref="pane" class="size-full overflow-y-auto p-4">
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
    </template>

    <template #preview>
      <PlutoBlockPreviewFrame
        :frontmatter="frontmatter"
        :class="{ 'pointer-events-none': dragging }"
        class="size-full"
      />
    </template>
  </USplitter>
</template>
