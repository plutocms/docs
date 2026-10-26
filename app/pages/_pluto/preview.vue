<script setup lang="ts">
import type { MDCElement, MDCNode, MDCRoot } from '@nuxtjs/mdc'
// The preview page of the visual block editor. The editor shows it in an
// iframe. It fetches nothing. The editor sends the blocks (Markdown) with
// `postMessage`. This page parses each changed block with the site parser
// (`parseMarkdown` of @nuxtjs/mdc) and renders it with `ContentRenderer`, so
// the page looks as it does on the site. A click on a block tells the editor
// which block it is. See the block-editor skill.
//
// Security: same origin only. This page ignores a message from another
// origin or from a window that is not its parent. No remote data loads here.
import type { CSSProperties } from 'vue'
import type { PlutoPreviewBlock as PreviewBlockData } from '../../../shared/utils/blocks/preview-protocol'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import { isTrustedPreviewOrigin, parsePreviewMessage, previewMessage } from '../../../shared/utils/blocks/preview-protocol'
import PlutoPreviewBlock from '../../components/Pluto/NuxtContent/Blocks/PlutoPreviewBlock.vue'

definePageMeta({ layout: false, plutoAdminBar: false })

const { t } = usePlutoI18n()

useHead({
  title: () => t('nuxt-content.preview.title'),
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// Each block renders with `tag` false, so no wrapper element sits between the blocks (the prose
// styles read the first and last child). Vue warns in dev about the type of that prop, and about
// the debug attribute that ContentRenderer adds. The preview app is its own app, so this
// handler hides only those two messages here.
if (import.meta.dev) {
  const config = useNuxtApp().vueApp.config
  const previous = config.warnHandler
  config.warnHandler = (message, instance, trace) => {
    if (message.includes('prop "tag"') || message.includes('data-content-id')) {
      return
    }
    if (previous) {
      previous(message, instance, trace)
    } else {
      console.warn(`[Vue warn]: ${message}`, trace)
    }
  }
}

interface RenderedBlock {
  id: string
  label: string
  body?: MDCRoot
  error?: string
}

const frontmatter = ref<Record<string, unknown>>({})
const blocks = shallowRef<RenderedBlock[]>([])
const selectedId = ref<string | null>(null)

// The parsed body of a block, by id and text. The same text gives the same
// object, so Vue does not render a block that did not change.
const cache = new Map<string, MDCRoot>()
const CACHE_LIMIT = 300
let run = 0
// A scroll that came before the block was on screen (a new block): do it after the next render.
let wantedScroll: string | null = null

/** Puts the id on each element at the top of a body. A component passes it to its root element. */
function mark(root: MDCRoot, id: string): MDCRoot {
  const children = root.children.map((child): MDCNode => {
    if (child.type !== 'element') {
      return child
    }
    const element = child as MDCElement
    return { ...element, props: { ...element.props, 'data-pluto-block': id } }
  })
  return { ...root, children }
}

async function bodyOf(block: PreviewBlockData): Promise<{ body?: MDCRoot, error?: string }> {
  const key = `${block.id}\u0000${block.markdown}`
  const cached = cache.get(key)
  if (cached) {
    return { body: cached }
  }
  try {
    const parsed = await parseMarkdown(block.markdown)
    const body = mark(parsed.body, block.id)
    if (cache.size >= CACHE_LIMIT) {
      cache.delete(cache.keys().next().value!)
    }
    cache.set(key, body)
    return { body }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

async function render(message: { frontmatter: Record<string, unknown>, blocks: PreviewBlockData[], selectedId?: string | null }) {
  const current = ++run
  const next = await Promise.all(message.blocks.map(async (block): Promise<RenderedBlock> => {
    const label = block.label ?? ''
    if (block.preview === false) {
      return { id: block.id, label }
    }
    return { id: block.id, label, ...(await bodyOf(block)) }
  }))
  // A newer message came while the parser worked.
  if (current !== run) {
    return
  }
  frontmatter.value = message.frontmatter
  blocks.value = next
  if (message.selectedId !== undefined) {
    selectedId.value = message.selectedId
  }
  await nextTick()
  refreshOverlay()
  if (wantedScroll) {
    // The components of a block can mount a moment after the render.
    setTimeout(() => wantedScroll && scrollToBlock(wantedScroll), 80)
  }
}

// --- Talk to the editor ---------------------------------------------------------

function post(message: ReturnType<typeof previewMessage>) {
  window.parent?.postMessage(message, window.location.origin)
}

function onMessage(event: MessageEvent) {
  if (event.source !== window.parent || !isTrustedPreviewOrigin(event.origin, window.location.origin)) {
    return
  }
  const message = parsePreviewMessage(event.data, 'to-frame')
  if (!message) {
    return
  }
  switch (message.type) {
    case 'render':
      void render(message)
      break
    case 'select':
      selectedId.value = message.id
      nextTick(refreshOverlay)
      break
    case 'scroll-to':
      scrollToBlock(message.id)
      break
  }
}

// --- Outlines -------------------------------------------------------------------

const hoverId = ref<string | null>(null)
const overlay = ref<{ selected: DOMRect | null, hover: DOMRect | null }>({ selected: null, hover: null })

/** The elements of a block. A style or a script has no box. */
function elementsOf(id: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`[data-pluto-block="${CSS.escape(id)}"]`)]
    .filter((element) => element.tagName !== 'STYLE' && element.tagName !== 'SCRIPT')
}

/** The box around all elements of a block, in page coordinates. */
function boxOf(id: string | null): DOMRect | null {
  if (!id) {
    return null
  }
  let box: DOMRect | null = null
  for (const element of elementsOf(id)) {
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      continue
    }
    box = box
      ? new DOMRect(Math.min(box.left, rect.left), Math.min(box.top, rect.top), Math.max(box.right, rect.right) - Math.min(box.left, rect.left), Math.max(box.bottom, rect.bottom) - Math.min(box.top, rect.top))
      : rect
  }
  return box ? new DOMRect(box.left + window.scrollX, box.top + window.scrollY, box.width, box.height) : null
}

let frame = 0
function refreshOverlay() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    overlay.value = { selected: boxOf(selectedId.value), hover: hoverId.value === selectedId.value ? null : boxOf(hoverId.value) }
  })
}

function scrollToBlock(id: string) {
  const box = boxOf(id)
  if (!box) {
    wantedScroll = id
    return
  }
  wantedScroll = null
  const top = box.top - window.scrollY
  const margin = 24
  if (top < margin || top + box.height > window.innerHeight - margin) {
    window.scrollTo({ top: Math.max(0, box.top - margin), behavior: 'smooth' })
  }
}

const labels = computed(() => new Map(blocks.value.map((block) => [block.id, block.label])))

function blockIdAt(target: EventTarget | null): string | null {
  return target instanceof Element ? (target.closest<HTMLElement>('[data-pluto-block]')?.dataset.plutoBlock ?? null) : null
}

// A click selects the block. The page does not follow links or press buttons.
function onClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  const id = blockIdAt(event.target)
  selectedId.value = id
  post(previewMessage('select', { id }))
  refreshOverlay()
}

function onPointerMove(event: PointerEvent) {
  const id = blockIdAt(event.target)
  if (id !== hoverId.value) {
    hoverId.value = id
    post(previewMessage('hover', { id }))
    refreshOverlay()
  }
}

function onPointerLeave() {
  if (hoverId.value !== null) {
    hoverId.value = null
    post(previewMessage('hover', { id: null }))
    refreshOverlay()
  }
}

// Keyboard: Enter on a focused block selects it, so the preview works without a mouse too.
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    const id = blockIdAt(event.target)
    if (id) {
      event.preventDefault()
      selectedId.value = id
      post(previewMessage('select', { id }))
      refreshOverlay()
    }
  }
}

function onBlockError(id: string, message: string) {
  post(previewMessage('error', { id, message }))
}

let observer: ResizeObserver | undefined
let mutations: MutationObserver | undefined

onMounted(() => {
  window.addEventListener('message', onMessage)
  window.addEventListener('scroll', refreshOverlay, { passive: true })
  window.addEventListener('resize', refreshOverlay)
  document.addEventListener('click', onClick, true)
  document.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('keydown', onKeydown, true)
  observer = new ResizeObserver(refreshOverlay)
  observer.observe(document.body)
  // Images, fonts and lazy components change the layout after the render.
  mutations = new MutationObserver(refreshOverlay)
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open'] })
  post(previewMessage('ready', {}))
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  window.removeEventListener('scroll', refreshOverlay)
  window.removeEventListener('resize', refreshOverlay)
  document.removeEventListener('click', onClick, true)
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerleave', onPointerLeave)
  document.removeEventListener('keydown', onKeydown, true)
  observer?.disconnect()
  mutations?.disconnect()
  cancelAnimationFrame(frame)
})

const hoverLabel = computed(() => (hoverId.value ? labels.value.get(hoverId.value) : '') ?? '')

function boxStyle(rect: DOMRect | null, kind: 'selected' | 'hover'): CSSProperties {
  if (!rect) {
    return { display: 'none' }
  }
  // The box has the size of the block, and the ring is an inset box shadow. So a full-width block
  // (a hero, a page section) gives no horizontal scroll (a border on a larger box did), and the
  // four sides of the ring stay on screen.
  const color = 'var(--ui-primary, #6366f1)'
  return {
    position: 'absolute',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex: '2147483000',
    borderRadius: '4px',
    boxShadow: kind === 'selected'
      ? `inset 0 0 0 2px ${color}`
      : `inset 0 0 0 1px color-mix(in oklab, ${color} 70%, transparent)`,
    background: kind === 'selected' ? `color-mix(in oklab, ${color} 8%, transparent)` : 'transparent',
  }
}

const chipStyle: CSSProperties = {
  position: 'absolute',
  top: '-22px',
  left: '0',
  padding: '1px 8px',
  borderRadius: '6px 6px 0 0',
  fontSize: '11px',
  lineHeight: '20px',
  fontFamily: 'system-ui, sans-serif',
  background: 'var(--ui-primary, #6366f1)',
  color: 'var(--ui-bg, #fff)',
  whiteSpace: 'nowrap',
}
</script>

<template>
  <div>
    <PlutoContentPreview :frontmatter="frontmatter">
      <PlutoPreviewBlock
        v-for="block in blocks"
        :id="block.id"
        :key="block.id"
        :body="block.body"
        :label="block.label"
        :error="block.error"
        @error="onBlockError"
      />
    </PlutoContentPreview>

    <!-- The outlines use inline styles only, so they do not depend on the site CSS. -->
    <div aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none; overflow: visible; height: 0">
      <div :style="boxStyle(overlay.hover, 'hover')">
        <span v-if="overlay.hover && hoverLabel" :style="{ ...chipStyle, opacity: '0.85' }">{{ hoverLabel }}</span>
      </div>
      <div :style="boxStyle(overlay.selected, 'selected')">
        <span v-if="overlay.selected && selectedId && labels.get(selectedId)" :style="chipStyle">{{ labels.get(selectedId) }}</span>
      </div>
    </div>
  </div>
</template>
