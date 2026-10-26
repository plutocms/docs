// Pure helpers for the block editor UI: the label, icon and excerpt of a block,
// the Markdown of a slot, the blocks sent to the preview, and the palette
// entries. No Nuxt import, so plain Vitest tests them.

import type { PlutoPreviewBlock } from './preview-protocol'
import type { PlutoBlock, PlutoBlockDefinition, PlutoBlocksConfig, PlutoComponentBlock } from './types'
import { blockMarkdown } from './operations'
import { BLOCK_KIND_LABELS } from './presets'
import { listPaletteBlocks, resolveBlockDefinition } from './registry'
import { renderBlock } from './serialize'
import { flatChildren } from './tree'

export interface PlutoBlockInfo {
  /** A plain text or an i18n key. */
  label: string
  icon: string
  /** A short plain text from the content of the block. */
  excerpt: string
  /** The name of the component, for a component block. */
  name?: string
}

const HEADING = /^#{1,6} +(\S.*)$/m

/** Removes the Markdown marks of a short text, so it reads as plain text in a list. */
export function plainExcerpt(markdown: string, max = 48): string {
  const text = markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~>#]/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function textExcerpt(markdown: string): string {
  const heading = HEADING.exec(markdown)
  if (heading) {
    return plainExcerpt(heading[1]!.replace(/ +#+$/, ''))
  }
  const first = markdown.split('\n').find((line) => line.trim() !== '' && !/^\s*(?:---|:::?)/.test(line))
  return plainExcerpt(first ?? '')
}

/** The label, the icon and the excerpt of a block in the outline. */
export function describeBlock(block: PlutoBlock, overrides: PlutoBlocksConfig = {}): PlutoBlockInfo {
  switch (block.kind) {
    case 'text': {
      const heading = HEADING.test(block.markdown)
      return { label: BLOCK_KIND_LABELS.text, icon: heading ? 'i-lucide-heading' : 'i-lucide-pilcrow', excerpt: textExcerpt(block.markdown) }
    }
    case 'code':
      return { label: BLOCK_KIND_LABELS.code, icon: 'i-lucide-code-xml', excerpt: block.filename || block.lang || '' }
    case 'raw':
      return {
        label: block.reason === 'table' ? 'nuxt-content.blocks.kinds.table' : BLOCK_KIND_LABELS.raw,
        icon: block.reason === 'table' ? 'i-lucide-table' : 'i-lucide-file-text',
        excerpt: block.reason === 'table' ? '' : textExcerpt(block.markdown),
      }
    case 'component': {
      const definition = resolveBlockDefinition(block.name, { overrides })
      const title = typeof block.props.title === 'string' ? block.props.title : typeof block.props.label === 'string' ? block.props.label : ''
      return { label: definition.label, icon: definition.icon, excerpt: plainExcerpt(title), name: block.name }
    }
  }
}

/** The Markdown of the children of one slot, without the white space of the parent. */
export function slotMarkdown(component: PlutoComponentBlock, slot: string): string {
  return (component.slots[slot] ?? []).map((child) => blockMarkdown(child)).join('\n\n')
}

export type PlutoSlotMode = 'rich' | 'inline' | 'blocks' | 'markdown'

/**
 * The editor for a slot. A `rich` or `inline` slot falls back when its content
 * has a block or a syntax that the text editor would lose: it then shows the
 * blocks, or a Markdown box.
 */
export function resolveSlotMode(component: PlutoComponentBlock, slot: string, wanted: 'rich' | 'inline' | 'blocks' | undefined): PlutoSlotMode {
  const children = component.slots[slot] ?? []
  if (wanted === 'blocks') {
    return 'blocks'
  }
  if (!children.every((child) => child.kind === 'text')) {
    return 'blocks'
  }
  // The parser already turns unsafe prose into a raw block, so only text is left here.
  const markdown = slotMarkdown(component, slot)
  if (wanted === 'inline') {
    return markdown.includes('\n') ? 'markdown' : 'inline'
  }
  return 'rich'
}

/** The top-level blocks as the preview frame wants them. */
export function toPreviewBlocks(blocks: PlutoBlock[], overrides: PlutoBlocksConfig = {}): PlutoPreviewBlock[] {
  return blocks.map((block) => {
    const markdown = renderBlock(block)
    if (block.kind !== 'component') {
      return { id: block.id, markdown }
    }
    const definition = resolveBlockDefinition(block.name, { overrides })
    return { id: block.id, markdown, label: definition.label, ...(definition.preview === false ? { preview: false } : {}) }
  })
}

/** The component names that a slot accepts, or `undefined` for any. */
export function acceptedNames(definition: PlutoBlockDefinition, slot: string): string[] | undefined {
  return definition.slots?.[slot]?.accepts
}

export type PlutoPaletteEntry =
  | { id: string, kind: 'text', group: string, label: string, description: string, icon: string, markdown: string }
  | { id: string, kind: 'code', group: string, label: string, description: string, icon: string, markdown: string }
  | { id: string, kind: 'table', group: string, label: string, description: string, icon: string, markdown: string }
  | { id: string, kind: 'component', group: string, label: string, description: string, icon: string, name: string, markdown: string }

export interface PlutoPaletteGroup {
  group: string
  entries: PlutoPaletteEntry[]
}

const TABLE_MARKDOWN = '| Column | Column |\n| ------ | ------ |\n| Cell | Cell |'

/**
 * The palette: the built-in blocks (text, code, table) first, then the
 * component groups. `accepts` limits the list to some component names, for a
 * target inside a component that takes only some children.
 */
export function buildPalette(overrides: PlutoBlocksConfig = {}, accepts?: string[]): PlutoPaletteGroup[] {
  const groups: PlutoPaletteGroup[] = []
  if (!accepts) {
    groups.push({
      group: 'text',
      entries: [
        { id: 'builtin:text', kind: 'text', group: 'text', label: BLOCK_KIND_LABELS.text, description: 'nuxt-content.blocks.kinds.textDescription', icon: 'i-lucide-pilcrow', markdown: '## Title\n\nWrite your text here.' },
        { id: 'builtin:table', kind: 'table', group: 'text', label: 'nuxt-content.blocks.kinds.table', description: 'nuxt-content.blocks.kinds.tableDescription', icon: 'i-lucide-table', markdown: TABLE_MARKDOWN },
      ],
    })
    groups.push({
      group: 'code',
      entries: [
        { id: 'builtin:code', kind: 'code', group: 'code', label: BLOCK_KIND_LABELS.code, description: 'nuxt-content.blocks.kinds.codeDescription', icon: 'i-lucide-code-xml', markdown: '```ts\nconst hello = \'world\'\n```' },
      ],
    })
  }
  for (const { group, items } of listPaletteBlocks(overrides)) {
    const entries = items
      .filter((item) => !accepts || accepts.includes(item.name))
      .map((item): PlutoPaletteEntry => ({
        id: `component:${item.name}`,
        kind: 'component',
        group,
        label: item.label,
        description: item.description ?? '',
        icon: item.icon,
        name: item.name,
        markdown: item.insert ?? `::${item.name}\n::`,
      }))
    if (entries.length === 0) {
      continue
    }
    const existing = groups.find((candidate) => candidate.group === group)
    if (existing) {
      existing.entries.push(...entries)
    } else {
      groups.push({ group, entries })
    }
  }
  return groups
}

/** How many blocks a block holds, itself included. */
export function countBlocks(block: PlutoBlock): number {
  return block.kind === 'component' ? 1 + flatChildren(block).reduce((sum, child) => sum + countBlocks(child), 0) : 1
}
