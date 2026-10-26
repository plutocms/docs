import type { PlutoBlocksConfig, PlutoComponentBlock } from '../shared/utils/blocks/types'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildPalette } from '../shared/utils/blocks/editor'
import { parseBlocks } from '../shared/utils/blocks/parse'
import { BLOCK_GROUPS, BLOCK_KIND_LABELS, BLOCK_PRESETS, groupLabelKey } from '../shared/utils/blocks/presets'
import { definePlutoBlock, humanizeName, insertTextFor, listPaletteBlocks, resolveBlockDefinition } from '../shared/utils/blocks/registry'
import { serializeBlocks } from '../shared/utils/blocks/serialize'
import { corpusBodies } from './helpers/corpus'

const localeDir = join(__dirname, '..', 'i18n', 'locales')
const locales: Record<string, Record<string, unknown>> = {
  'en': JSON.parse(readFileSync(join(localeDir, 'en.json'), 'utf8')),
  'pt-BR': JSON.parse(readFileSync(join(localeDir, 'pt-BR.json'), 'utf8')),
}

function translated(code: string, key: string): string | undefined {
  let value: unknown = locales[code]
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown> | undefined)?.[part]
  }
  return typeof value === 'string' ? value : undefined
}

function keysOf(definition: ReturnType<typeof resolveBlockDefinition>): string[] {
  const keys = [definition.label, definition.description]
  for (const prop of Object.values(definition.props ?? {})) {
    keys.push(prop.label, prop.description)
    for (const option of prop.options ?? []) {
      keys.push(typeof option === 'string' ? undefined : option.label)
    }
  }
  for (const slot of Object.values(definition.slots ?? {})) {
    keys.push(slot.label)
  }
  return keys.filter((key): key is string => key !== undefined)
}

describe('block presets', () => {
  it('have the Nuxt UI prose and page components', () => {
    expect(Object.keys(BLOCK_PRESETS)).toEqual(expect.arrayContaining([
      'note',
      'tip',
      'warning',
      'caution',
      'callout',
      'card',
      'card-group',
      'code-group',
      'code-collapse',
      'tabs',
      'tabs-item',
      'steps',
      'accordion',
      'accordion-item',
      'field',
      'field-group',
      'collapsible',
      'badge',
      'kbd',
      'icon',
      'u-page-hero',
      'u-page-section',
      'u-page-feature',
      'u-page-card',
      'u-page-grid',
      'u-page-c-t-a',
      'u-button',
    ]))
  })

  it('use i18n keys of the nuxt-content namespace for every label and description', () => {
    for (const definition of Object.values(BLOCK_PRESETS)) {
      for (const key of keysOf(definition)) {
        expect(key, definition.name).toMatch(/^nuxt-content\.blocks\.[\w-]+(?:\.[\w-]+)+$/)
      }
    }
    for (const key of [...Object.values(BLOCK_KIND_LABELS), ...BLOCK_GROUPS.map((group) => groupLabelKey(group))]) {
      expect(key).toMatch(/^nuxt-content\.blocks\./)
    }
  })

  it('have an English and a Brazilian Portuguese text for every key', () => {
    const keys = new Set<string>([...Object.values(BLOCK_KIND_LABELS), ...BLOCK_GROUPS.map((group) => groupLabelKey(group))])
    for (const definition of Object.values(BLOCK_PRESETS)) {
      for (const key of keysOf(definition)) {
        keys.add(key)
      }
    }
    for (const code of Object.keys(locales)) {
      for (const key of keys) {
        expect(translated(code, key), `${code} ${key}`).toBeTruthy()
      }
    }
  })

  it('have no unused text in the locale files', () => {
    const used = new Set<string>([...Object.values(BLOCK_KIND_LABELS), ...BLOCK_GROUPS.map((group) => groupLabelKey(group)), 'nuxt-content.blocks.kinds.table'])
    // The palette entries of the built-in blocks (text, table, code) have their own texts.
    for (const { entries } of buildPalette()) {
      for (const entry of entries.filter((item) => item.kind !== 'component')) {
        used.add(entry.label)
        used.add(entry.description)
      }
    }
    for (const definition of Object.values(BLOCK_PRESETS)) {
      for (const key of keysOf(definition)) {
        used.add(key)
      }
    }
    const flat: string[] = []
    const walk = (value: unknown, prefix: string) => {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (typeof child === 'string') {
          flat.push(`${prefix}.${key}`)
        } else {
          walk(child, `${prefix}.${key}`)
        }
      }
    }
    walk((locales.en!['nuxt-content'] as Record<string, unknown>).blocks, 'nuxt-content.blocks')
    expect(flat.filter((key) => !used.has(key))).toEqual([])
  })

  it('give an insert text that is one valid component', () => {
    for (const definition of Object.values(BLOCK_PRESETS)) {
      if (definition.hidden) {
        continue
      }
      const text = insertTextFor(definition)
      const doc = parseBlocks(text)
      expect(doc.blocks, definition.name).toHaveLength(1)
      expect(doc.blocks[0], definition.name).toMatchObject({ kind: 'component', name: definition.name })
      expect(serializeBlocks(doc)).toBe(text)
    }
  })

  it('use only the slot names and props that the component has', () => {
    for (const definition of Object.values(BLOCK_PRESETS)) {
      if (definition.hidden) {
        continue
      }
      const block = parseBlocks(insertTextFor(definition)).blocks[0] as PlutoComponentBlock
      for (const slot of Object.keys(block.slots)) {
        expect(Object.keys(definition.slots ?? {}), `${definition.name} slot ${slot}`).toContain(slot)
      }
      for (const prop of Object.keys(block.props)) {
        if (prop !== 'class') {
          expect(Object.keys(definition.props ?? {}), `${definition.name} prop ${prop}`).toContain(prop)
        }
      }
    }
  })

  it('describe the components of the docs pages', () => {
    const names = new Set<string>()
    for (const { body } of corpusBodies()) {
      const walk = (blocks: ReturnType<typeof parseBlocks>['blocks']) => {
        for (const block of blocks) {
          if (block.kind === 'component') {
            names.add(block.name)
            walk(Object.values(block.slots).flat())
          }
        }
      }
      walk(parseBlocks(body).blocks)
    }
    const siteOnly = ['pluto-hero', 'pluto-palette', 'pluto-logo-preview', 'pluto-chip', 'prose-pre']
    for (const name of names) {
      if (!siteOnly.includes(name)) {
        expect(BLOCK_PRESETS[name], name).toBeDefined()
      }
    }
  })
})

describe('resolveBlockDefinition', () => {
  it('returns the preset', () => {
    expect(resolveBlockDefinition('note')).toMatchObject({ name: 'note', group: 'callouts', icon: 'i-lucide-info' })
  })

  it('makes an automatic entry for an unknown component', () => {
    expect(resolveBlockDefinition('pluto-hero')).toMatchObject({ name: 'pluto-hero', label: 'Pluto hero', icon: 'i-lucide-puzzle', group: 'site' })
    expect(humanizeName('u-page-card')).toBe('Page card')
  })

  it('merges the site override over the preset', () => {
    const overrides: PlutoBlocksConfig = {
      'note': { label: 'Remark', props: { extra: { type: 'string' } } },
      'pluto-hero': definePlutoBlock({
        label: 'Hero',
        icon: 'i-lucide-sparkles',
        group: 'Landing',
        props: { center: { type: 'boolean', label: 'Center the text' } },
        slots: { title: { label: 'Title', content: 'inline' } },
        insert: '::pluto-hero\n#title\nYour title\n::',
      }),
    }
    const note = resolveBlockDefinition('note', { overrides })
    expect(note).toMatchObject({ label: 'Remark', icon: 'i-lucide-info', name: 'note' })
    expect(Object.keys(note.props!)).toEqual(['icon', 'to', 'target', 'extra'])
    const hero = resolveBlockDefinition('pluto-hero', { overrides })
    expect(hero).toMatchObject({ label: 'Hero', icon: 'i-lucide-sparkles', group: 'Landing' })
    expect(Object.keys(hero.slots!)).toEqual(['default', 'title'])
  })

  it('hides a block set to false, and keeps its label', () => {
    const definition = resolveBlockDefinition('u-page-c-t-a', { overrides: { 'u-page-c-t-a': false } })
    expect(definition.hidden).toBe(true)
    expect(definition.label).toBe('nuxt-content.blocks.u-page-c-t-a.label')
  })

  it('keeps `preview: false` from the override', () => {
    expect(resolveBlockDefinition('pluto-palette', { overrides: { 'pluto-palette': { preview: false } } }).preview).toBe(false)
  })

  it('adds the props and the slots found in the document to the Advanced section', () => {
    const doc = parseBlocks('::pluto-chip{icon="i-lucide-star" center size=3 :count=\'4\'}\n#title\nHi\n::\n')
    const block = doc.blocks[0] as PlutoComponentBlock
    const definition = resolveBlockDefinition('pluto-chip', { block })
    expect(definition.props).toMatchObject({
      icon: { type: 'string', advanced: true },
      center: { type: 'boolean', advanced: true },
      size: { type: 'string', advanced: true },
      count: { type: 'number', advanced: true },
    })
    expect(Object.keys(definition.slots!)).toEqual(['default', 'title'])
    expect(definition.slots!.title).toEqual({ content: 'rich' })
  })

  it('keeps a preset prop out of the Advanced section, and ignores ui and as', () => {
    const doc = parseBlocks('::note{icon="i-lucide-star" ui=\'{}\' as="div"}\nText.\n::\n')
    const definition = resolveBlockDefinition('note', { block: doc.blocks[0] as PlutoComponentBlock })
    expect(definition.props!.icon!.advanced).toBeUndefined()
    expect(definition.props).not.toHaveProperty('ui')
    expect(definition.props).not.toHaveProperty('as')
  })
})

describe('listPaletteBlocks', () => {
  it('groups the presets and leaves out the inline components', () => {
    const groups = listPaletteBlocks()
    expect(groups.map((entry) => entry.group)).toEqual(['callouts', 'layout', 'code', 'landing'])
    const names = groups.flatMap((entry) => entry.items.map((item) => item.name))
    expect(names).toContain('note')
    expect(names).not.toContain('kbd')
  })

  it('adds a site block, in its own group, and hides a block set to false', () => {
    const groups = listPaletteBlocks({
      'pluto-hero': { label: 'Hero', group: 'Landing', icon: 'i-lucide-sparkles', insert: '::pluto-hero\n::' },
      'pluto-chip': {},
      'note': false,
    })
    expect(groups.at(-2)?.group).toBe('site')
    expect(groups.at(-1)?.group).toBe('Landing')
    const names = groups.flatMap((entry) => entry.items.map((item) => item.name))
    expect(names).toContain('pluto-hero')
    expect(names).toContain('pluto-chip')
    expect(names).not.toContain('note')
  })

  it('gives an insert text for a block with none', () => {
    expect(insertTextFor(resolveBlockDefinition('pluto-chip'))).toBe('::pluto-chip\n::')
  })
})
