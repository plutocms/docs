import { describe, expect, it } from 'vitest'
import { CMS_OFF_ERROR, isValidSource, normalizeRoutePrefix, resolvePlutoNuxtContentOptions } from '../modules/pluto-nuxt-content/options'

describe('resolvePlutoNuxtContentOptions', () => {
  it('has no type by default', () => {
    expect(resolvePlutoNuxtContentOptions({}, { cmsEnabled: true })).toEqual({ enabled: true, types: [], errors: [] })
  })

  it('is off with an error when the CMS is off', () => {
    const result = resolvePlutoNuxtContentOptions(
      { types: [{ preset: 'docs', name: 'doc', source: '' }] },
      { cmsEnabled: false }
    )
    expect(result).toEqual({ enabled: false, types: [], errors: [CMS_OFF_ERROR] })
  })

  it('keeps a valid docs type', () => {
    const result = resolvePlutoNuxtContentOptions(
      { types: [{ preset: 'docs', name: 'doc', source: '', label: 'Page', exclude: ['drafts/'] }] },
      { cmsEnabled: true }
    )
    expect(result.errors).toEqual([])
    expect(result.types).toEqual([
      { preset: 'docs', name: 'doc', source: '', label: 'Page', exclude: ['drafts/'], routePrefix: '' },
    ])
  })

  it('accepts a nested source and normalizes the route prefix', () => {
    const result = resolvePlutoNuxtContentOptions(
      { types: [{ preset: 'docs', name: 'guide', source: '1.docs/api', routePrefix: 'docs/' }] },
      { cmsEnabled: true }
    )
    expect(result.types[0]).toMatchObject({ source: '1.docs/api', routePrefix: '/docs' })
  })

  it('drops a type with an unknown preset', () => {
    const result = resolvePlutoNuxtContentOptions(
      { types: [{ preset: 'blog', name: 'doc', source: '' } as never] },
      { cmsEnabled: true }
    )
    expect(result.types).toEqual([])
    expect(result.errors).toHaveLength(1)
  })

  it('drops a type with a bad name or source', () => {
    const result = resolvePlutoNuxtContentOptions(
      {
        types: [
          { preset: 'docs', name: 'Bad Name', source: '' },
          { preset: 'docs', name: 'doc', source: '../x' },
          { preset: 'docs', name: 'doc', source: '/abs' },
        ],
      },
      { cmsEnabled: true }
    )
    expect(result.types).toEqual([])
    expect(result.errors).toHaveLength(3)
  })

  it('drops a duplicate name', () => {
    const result = resolvePlutoNuxtContentOptions(
      {
        types: [
          { preset: 'docs', name: 'doc', source: '' },
          { preset: 'docs', name: 'doc', source: 'other' },
        ],
      },
      { cmsEnabled: true }
    )
    expect(result.types).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
  })

  it('drops a type whose exclude is not a list of strings', () => {
    const result = resolvePlutoNuxtContentOptions(
      { types: [{ preset: 'docs', name: 'doc', source: '', exclude: 'index' as never }] },
      { cmsEnabled: true }
    )
    expect(result.types).toEqual([])
    expect(result.errors).toHaveLength(1)
  })
})

describe('isValidSource', () => {
  it('accepts an empty source and nested folders', () => {
    expect(isValidSource('')).toBe(true)
    expect(isValidSource('docs')).toBe(true)
    expect(isValidSource('1.docs/2.api')).toBe(true)
  })

  it('refuses unsafe paths', () => {
    expect(isValidSource('..')).toBe(false)
    expect(isValidSource('a//b')).toBe(false)
    expect(isValidSource('A')).toBe(false)
    expect(isValidSource(undefined)).toBe(false)
  })
})

describe('normalizeRoutePrefix', () => {
  it('gives a leading slash and no trailing slash', () => {
    expect(normalizeRoutePrefix('docs')).toBe('/docs')
    expect(normalizeRoutePrefix('/a/b/')).toBe('/a/b')
    expect(normalizeRoutePrefix('/')).toBe('')
    expect(normalizeRoutePrefix(undefined)).toBe('')
  })
})
