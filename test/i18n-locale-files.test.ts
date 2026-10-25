import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Checks every locale file of this layer against en: same keys, same
// placeholders. A new language is checked by adding its file. Every literal key
// in the code must exist in en.
const root = join(__dirname, '..')
const dir = join(root, 'i18n', 'locales')
const codes = readdirSync(dir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.slice(0, -'.json'.length))

type FlatMessages = Record<string, string>

function flatten(value: unknown, prefix = '', out: FlatMessages = {}): FlatMessages {
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'string') {
      out[path] = child
    } else {
      flatten(child, path, out)
    }
  }
  return out
}

const locales: Record<string, FlatMessages> = {}
for (const code of codes) {
  locales[code] = flatten(JSON.parse(readFileSync(join(dir, `${code}.json`), 'utf8')))
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).toSorted()
}

describe('nuxt-content locale files', () => {
  it('include en and pt-BR', () => {
    expect(codes).toContain('en')
    expect(codes).toContain('pt-BR')
  })

  for (const code of codes.filter((name) => name !== 'en')) {
    it(`${code} has the keys and the placeholders of en`, () => {
      expect(Object.keys(locales[code]!).toSorted()).toEqual(Object.keys(locales.en!).toSorted())
      for (const [key, message] of Object.entries(locales.en!)) {
        expect(placeholders(locales[code]![key] ?? ''), key).toEqual(placeholders(message))
      }
    })
  }

  for (const code of codes) {
    it(`${code} has only the nuxtContent namespace and no empty value`, () => {
      const namespaces = new Set(Object.keys(locales[code]!).map((key) => key.split('.')[0]))
      expect([...namespaces]).toEqual(['nuxtContent'])
      for (const [key, message] of Object.entries(locales[code]!)) {
        expect(message.trim(), key).not.toBe('')
      }
    })
  }
})

function sourceFiles(folder: string): string[] {
  const files: string[] = []
  for (const name of readdirSync(folder)) {
    const path = join(folder, name)
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path))
    } else if (/\.(?:ts|vue)$/.test(name) && !name.endsWith('.d.ts')) {
      files.push(path)
    }
  }
  return files
}

describe('nuxt-content i18n keys in the code', () => {
  it('exist in en', () => {
    const keys = new Set<string>()
    for (const folder of ['app', 'shared', 'modules', 'server']) {
      for (const file of sourceFiles(join(root, folder))) {
        for (const match of readFileSync(file, 'utf8').matchAll(/(['"`])(nuxtContent\.[\w-]+(?:\.[\w-]+)+)\1/g)) {
          keys.add(match[2]!)
        }
      }
    }
    expect(keys.size).toBeGreaterThan(0)
    for (const key of keys) {
      expect(locales.en![key], key).toBeDefined()
    }
  })
})
