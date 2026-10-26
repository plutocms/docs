// Join the presets, the site overrides (`plutoBlocks` in app.config.ts) and the
// props found in the document into one definition for each component. Pure
// functions: the caller reads the app config and passes it in.

import type { PlutoBlock, PlutoBlockDefinition, PlutoBlockOverride, PlutoBlockPropDefinition, PlutoBlocksConfig, PlutoBlockSlotDefinition, PlutoComponentBlock } from './types'
import { BLOCK_GROUPS, BLOCK_PRESETS, HIDDEN_PROP_NAMES } from './presets'

/** The definition of a block that a site declares in `app.config.ts`. It gives type help. */
export function definePlutoBlock<T extends Partial<Omit<PlutoBlockDefinition, 'name'>>>(definition: T): T {
  return definition
}

export interface ResolveOptions {
  /** The `plutoBlocks` value of the app config. */
  overrides?: PlutoBlocksConfig
  /** A block of the doc. Its props and slots fill what the definition does not list. */
  block?: PlutoComponentBlock
}

/** A readable name from a component name: `pluto-hero` gives `Pluto hero`. */
export function humanizeName(name: string): string {
  const text = name.replace(/^u-/, '').replace(/[-_]+/g, ' ').trim()
  return text ? text[0]!.toUpperCase() + text.slice(1) : name
}

function automaticDefinition(name: string): PlutoBlockDefinition {
  return { name, label: humanizeName(name), icon: 'i-lucide-puzzle', group: 'site', slots: { default: { content: 'blocks' } } }
}

function propFromValue(value: unknown): PlutoBlockPropDefinition {
  if (typeof value === 'boolean') {
    return { type: 'boolean', advanced: true }
  }
  if (typeof value === 'number') {
    return { type: 'number', advanced: true }
  }
  const text = typeof value === 'string' ? value : ''
  return { type: typeof value === 'string' && !text.includes('\n') ? 'string' : 'text', advanced: true }
}

function isOverrideObject(override: PlutoBlockOverride | undefined): override is Exclude<PlutoBlockOverride, false> {
  return typeof override === 'object' && override !== null
}

function mergeDefinition(base: PlutoBlockDefinition, override: PlutoBlockOverride | undefined): PlutoBlockDefinition {
  if (override === false) {
    return { ...base, hidden: true }
  }
  if (!isOverrideObject(override)) {
    return base
  }
  return {
    ...base,
    ...override,
    name: base.name,
    props: { ...base.props, ...override.props },
    slots: { ...base.slots, ...override.slots },
  }
}

/** The slot content kind for a slot that no definition lists. */
function slotFromChildren(children: PlutoBlock[]): PlutoBlockSlotDefinition {
  const onlyText = children.every((child) => child.kind === 'text')
  return { content: onlyText ? 'rich' : 'blocks' }
}

/**
 * The definition of a component: the preset (or an automatic one), the site
 * override over it, and the props and slots of `options.block` that neither
 * lists. Found props go to the Advanced section.
 */
export function resolveBlockDefinition(name: string, options: ResolveOptions = {}): PlutoBlockDefinition {
  const base = BLOCK_PRESETS[name] ?? automaticDefinition(name)
  const merged = mergeDefinition(base, options.overrides?.[name])
  const found = options.block?.kind === 'component' ? options.block : undefined
  if (!found) {
    return merged
  }
  const props = { ...merged.props }
  for (const [key, value] of Object.entries(found.props)) {
    if (!(key in props) && !(HIDDEN_PROP_NAMES as readonly string[]).includes(key)) {
      props[key] = propFromValue(value)
    }
  }
  const slots = { ...merged.slots }
  for (const [key, children] of Object.entries(found.slots)) {
    if (!(key in slots)) {
      slots[key] = slotFromChildren(children)
    }
  }
  return { ...merged, props, slots }
}

/** The text a palette inserts for a component. */
export function insertTextFor(definition: PlutoBlockDefinition): string {
  return definition.insert ?? `::${definition.name}\n::`
}

export interface PaletteGroup {
  group: string
  items: PlutoBlockDefinition[]
}

/**
 * The blocks of the palette, in groups. The presets come first, then the
 * components that only the site config declares. A hidden block, or a block set
 * to `false`, is not in the list.
 */
export function listPaletteBlocks(overrides: PlutoBlocksConfig = {}): PaletteGroup[] {
  const names = [...Object.keys(BLOCK_PRESETS), ...Object.keys(overrides).filter((name) => !(name in BLOCK_PRESETS))]
  const groups = new Map<string, PlutoBlockDefinition[]>()
  for (const name of names) {
    const definition = resolveBlockDefinition(name, { overrides })
    if (definition.hidden) {
      continue
    }
    groups.set(definition.group, [...(groups.get(definition.group) ?? []), definition])
  }
  const known = BLOCK_GROUPS as readonly string[]
  const order = [...known.filter((group) => groups.has(group)), ...[...groups.keys()].filter((group) => !known.includes(group))]
  return order.map((group) => ({ group, items: groups.get(group)! }))
}
