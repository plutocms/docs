/** One content type that the layer builds from a preset. */
export interface PlutoNuxtContentTypeOptions {
  /** The preset that makes the type. Only `docs` exists. */
  preset: 'docs'
  /** The content type name. It is a URL segment: `/admin/content/<name>`. */
  name: string
  /**
   * The folder of the pages, under the CMS content dir. Use `''` for the content
   * dir itself (the usual case for a Nuxt Content site).
   */
  source: string
  label?: string
  labelPlural?: string
  /** Ids that the type must not list or edit. An id (`index`), or a folder with a trailing slash (`drafts/`). */
  exclude?: string[]
  /** The route prefix of the pages on the public site, for the "View page" action. Default: none. */
  routePrefix?: string
}

export interface PlutoNuxtContentOptions {
  /** The content types to register. Default: none. */
  types?: PlutoNuxtContentTypeOptions[]
}

export interface PlutoNuxtContentResolveContext {
  /** False when the app sets `plutoCms.enabled` to false. */
  cmsEnabled: boolean
}

export interface PlutoNuxtContentResolveResult {
  enabled: boolean
  types: PlutoNuxtContentTypeOptions[]
  errors: string[]
}

export const PLUTO_NUXT_CONTENT_PRESETS = ['docs'] as const

export const CMS_OFF_ERROR
  = 'The Nuxt Content layer needs the standalone CMS. Remove plutoCms.enabled: false, or remove the layer.'

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/
const SOURCE_SEGMENT = /^(?:\d+\.)?[a-z0-9]+(?:-[a-z0-9]+)*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether `source` is `''` or a safe nested path (the same segment rule as the CMS). */
export function isValidSource(source: unknown): source is string {
  if (typeof source !== 'string') {
    return false
  }
  if (source === '') {
    return true
  }
  const segments = source.split('/')
  return segments.length <= 6 && segments.every((segment) => SOURCE_SEGMENT.test(segment))
}

/** Normalizes a route prefix to `/a/b`, or `''` for none. */
export function normalizeRoutePrefix(prefix: unknown): string {
  if (typeof prefix !== 'string') {
    return ''
  }
  const segments = prefix.split('/').filter(Boolean)
  return segments.length > 0 ? `/${segments.join('/')}` : ''
}

/**
 * Checks the module options. A type with a problem is dropped and gives one
 * error. When the CMS is off, the layer is off and gives one error. This file
 * has no Nuxt import, so plain Vitest tests it.
 */
export function resolvePlutoNuxtContentOptions(
  options: PlutoNuxtContentOptions,
  ctx: PlutoNuxtContentResolveContext
): PlutoNuxtContentResolveResult {
  const errors: string[] = []

  if (!ctx.cmsEnabled) {
    return { enabled: false, types: [], errors: [CMS_OFF_ERROR] }
  }

  const types: PlutoNuxtContentTypeOptions[] = []
  const names = new Set<string>()
  const entries: unknown[] = Array.isArray(options.types) ? options.types : []

  for (const [index, entry] of entries.entries()) {
    const where = `plutoNuxtContent.types[${index}]`
    if (!isRecord(entry)) {
      errors.push(`${where} must be an object.`)
      continue
    }
    if (!(PLUTO_NUXT_CONTENT_PRESETS as readonly unknown[]).includes(entry.preset)) {
      errors.push(`${where}.preset must be one of: ${PLUTO_NUXT_CONTENT_PRESETS.join(', ')}.`)
      continue
    }
    if (typeof entry.name !== 'string' || !NAME_PATTERN.test(entry.name)) {
      errors.push(`${where}.name must use lowercase letters, numbers and dashes, and start with a letter.`)
      continue
    }
    if (names.has(entry.name)) {
      errors.push(`${where}.name "${entry.name}" is used twice.`)
      continue
    }
    if (!isValidSource(entry.source)) {
      errors.push(`${where}.source must be '' or a folder path such as "docs" or "1.docs/api".`)
      continue
    }
    if (entry.exclude !== undefined && !(Array.isArray(entry.exclude) && entry.exclude.every((item) => typeof item === 'string'))) {
      errors.push(`${where}.exclude must be a list of strings.`)
      continue
    }
    names.add(entry.name)
    types.push({
      preset: 'docs',
      name: entry.name,
      source: entry.source,
      ...(typeof entry.label === 'string' && { label: entry.label }),
      ...(typeof entry.labelPlural === 'string' && { labelPlural: entry.labelPlural }),
      ...(Array.isArray(entry.exclude) && { exclude: entry.exclude as string[] }),
      routePrefix: normalizeRoutePrefix(entry.routePrefix),
    })
  }

  return { enabled: true, types, errors }
}
