<script setup lang="ts">
// One list of the outline: the blocks of the page, or the children of one
// slot of a component. It nests itself for the children. Each list is its own
// SortableJS group, so a block moves inside its list only (same level).
// Drag is for the mouse and touch. The keyboard uses Alt+Up and Alt+Down, and
// the menu of the row.
import type { PlutoBlock } from '../../../../../shared/utils/blocks/types'
import { resolveSlotMode } from '../../../../../shared/utils/blocks/editor'

const props = defineProps<{
  blocks: PlutoBlock[]
  parentId?: string
  slotName?: string
  level?: number
}>()

const editor = usePlutoBlockEditor()
const { t, tx } = usePlutoI18n()

const list = useTemplateRef<HTMLElement>('list')
const level = computed(() => props.level ?? 1)

function info(block: PlutoBlock) {
  const described = editor.describe(block)
  return { ...described, label: tx(described.label) }
}

/** The slots of a component that show their children in the outline. */
function childLists(block: PlutoBlock): Array<{ slot: string, blocks: PlutoBlock[], label?: string }> {
  if (block.kind !== 'component') {
    return []
  }
  const definition = editor.definitionOf(block)
  return Object.entries(block.slots)
    .filter(([slot]) => resolveSlotMode(block, slot, definition?.slots?.[slot]?.content) === 'blocks')
    .map(([slot, blocks]) => ({ slot, blocks, label: definition?.slots?.[slot]?.label }))
    .filter((entry) => entry.blocks.length > 0)
}

function slotTitle(label: string | undefined, slot: string): string {
  return label ? tx(label) : slot
}

function menu(block: PlutoBlock, index: number) {
  const siblings = editor.siblings(block.id)
  return [
    [
      { label: t('nuxt-content.editor.moveUp'), icon: 'i-lucide-arrow-up', disabled: index === 0, onSelect: () => editor.move(block.id, -1) },
      { label: t('nuxt-content.editor.moveDown'), icon: 'i-lucide-arrow-down', disabled: index >= siblings.length - 1, onSelect: () => editor.move(block.id, 1) },
      { label: t('nuxt-content.editor.addBelow'), icon: 'i-lucide-plus', onSelect: () => editor.openPalette({ parentId: props.parentId, slot: props.slotName, index: index + 1 }) },
      { label: t('nuxt-content.editor.duplicate'), icon: 'i-lucide-copy', onSelect: () => editor.duplicate(block.id) },
    ],
    [
      { label: t('nuxt-content.editor.delete'), icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => editor.remove(block.id) },
    ],
  ]
}

function focusRow(from: HTMLElement, delta: number) {
  const root = from.closest<HTMLElement>('[data-block-outline]')
  const rows = [...(root?.querySelectorAll<HTMLElement>('[data-block-row]') ?? [])]
  rows[rows.indexOf(from) + delta]?.focus()
}

function onKeydown(event: KeyboardEvent, block: PlutoBlock) {
  const target = event.currentTarget as HTMLElement
  if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    event.preventDefault()
    editor.move(block.id, event.key === 'ArrowUp' ? -1 : 1)
    // The row renders in its new place. Keep the focus on it.
    nextTick(() => document.querySelector<HTMLElement>(`[data-block-row="${CSS.escape(block.id)}"]`)?.focus())
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    focusRow(target, event.key === 'ArrowUp' ? -1 : 1)
  } else if (event.key === 'Delete') {
    event.preventDefault()
    editor.remove(block.id)
  }
}

let sortable: { destroy: () => void } | undefined

onMounted(async () => {
  const { default: Sortable } = await import('sortablejs')
  if (!list.value) {
    return
  }
  sortable = Sortable.create(list.value, {
    handle: '[data-block-handle]',
    draggable: 'li',
    animation: 150,
    ghostClass: 'opacity-40',
    // A list is its own group, so a block cannot leave it.
    group: `blocks:${props.parentId ?? 'root'}:${props.slotName ?? 'default'}`,
    onEnd(event) {
      const { oldIndex, newIndex, item, from } = event
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return
      }
      // SortableJS moved the DOM node. Put it back and let Vue render the new order.
      item.remove()
      from.insertBefore(item, from.children[oldIndex] ?? null)
      const block = props.blocks[oldIndex]
      if (block) {
        editor.moveTo(block.id, { parentId: props.parentId, slot: props.slotName, index: newIndex })
      }
    },
  })
})

onBeforeUnmount(() => sortable?.destroy())
</script>

<template>
  <ul ref="list" :data-level="level" class="flex flex-col gap-0.5">
    <li v-for="(block, index) in blocks" :key="block.id">
      <div
        :class="editor.selectedId.value === block.id ? 'bg-primary/10 ring-1 ring-inset ring-primary/40' : editor.hoverId.value === block.id ? 'bg-elevated' : 'hover:bg-elevated/60'"
        class="group flex items-center gap-0.5 rounded-md pe-0.5 ps-0.5 transition-colors"
      >
        <span
          class="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-dimmed opacity-60 group-hover:opacity-100 active:cursor-grabbing"
          aria-hidden="true"
          data-block-handle
        >
          <UIcon name="i-lucide-grip-vertical" class="size-4" />
        </span>

        <button
          :data-block-row="block.id"
          :aria-current="editor.selectedId.value === block.id ? 'true' : undefined"
          type="button"
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Delete"
          class="flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-start text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          @click="editor.select(block.id)"
          @keydown="onKeydown($event, block)"
        >
          <UIcon :name="info(block).icon" class="size-4 shrink-0 text-muted" />
          <span class="min-w-0 flex-1 truncate">
            <span class="font-medium text-highlighted">{{ info(block).label }}</span>
            <span v-if="info(block).excerpt" class="text-muted">: {{ info(block).excerpt }}</span>
          </span>
          <span
            v-if="editor.editedIds.value.has(block.id)"
            :aria-label="t('nuxt-content.editor.edited')"
            :title="t('nuxt-content.editor.edited')"
            class="size-1.5 shrink-0 rounded-full bg-primary"
            role="img"
          />
        </button>

        <UDropdownMenu :items="menu(block, index)" :content="{ align: 'end' }">
          <UButton
            :aria-label="t('nuxt-content.editor.blockActions', { name: info(block).label })"
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="ghost"
            size="xs"
            class="shrink-0"
          />
        </UDropdownMenu>
      </div>

      <div v-if="childLists(block).length" class="ms-5 border-s border-default ps-1.5">
        <div v-for="child in childLists(block)" :key="child.slot" class="pt-0.5">
          <p v-if="childLists(block).length > 1" class="px-1 pt-1 text-xs font-medium text-muted">
            {{ slotTitle(child.label, child.slot) }}
          </p>
          <PlutoBlockOutlineList :blocks="child.blocks" :parent-id="block.id" :slot-name="child.slot" :level="level + 1" />
          <UButton
            :label="t('nuxt-content.editor.addTo', { name: slotTitle(child.label, child.slot) })"
            icon="i-lucide-plus"
            color="neutral"
            variant="link"
            size="xs"
            class="ms-6"
            @click="editor.openPalette({ parentId: block.id, slot: child.slot, index: child.blocks.length })"
          />
        </div>
      </div>
    </li>
  </ul>
</template>
