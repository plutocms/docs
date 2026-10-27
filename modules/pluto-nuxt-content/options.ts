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
  /** The route prefix of the pages on the public site, for the View link of the form. Default: none. */
  routePrefix?: string
}

/** How the public pages get their content. See the nuxt-content-setup skill. */
export type PlutoNuxtContentRender = 'hybrid' | 'build' | 'runtime'

export interface PlutoNuxtContentOptions {
  /** The content types to register. Default: none. */
  types?: PlutoNuxtContentTypeOptions[]
  /**
   * `'hybrid'` (default): the pages are built with the site, and the server reads from the content
   * repository the pages that changed after the build. `'build'`: Nuxt Content builds the pages
   * and nothing else. `'runtime'`: the server reads every page from the repository at request time.
   */
  render?: PlutoNuxtContentRender
  /**
   * Seconds that a CDN may cache the answers of the layer routes (`hybrid` and `runtime`). Default 10.
   * It is short, so a save shows soon. `0` turns the cache header into `no-store`.
   */
  runtimeMaxAge?: number
}

export interface PlutoNuxtContentResolveContext {
  /** False when the app sets `plutoCms.enabled` to false. */
  cmsEnabled: boolean
}

export interface PlutoNuxtContentResolveResult {
  enabled: boolean
  render: PlutoNuxtContentRender
  runtimeMaxAge: number
  types: PlutoNuxtContentTypeOptions[]
  errors: string[]
}

export const PLUTO_NUXT_CONTENT_PRESETS = ['docs'] as const
export const PLUTO_NUXT_CONTENT_RENDER_MODES = ['hybrid', 'build', 'runtime'] as const
export const DEFAULT_RUNTIME_MAX_AGE = 10

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
    return { enabled: false, render: 'build', runtimeMaxAge: DEFAULT_RUNTIME_MAX_AGE, types: [], errors: [CMS_OFF_ERROR] }
  }

  let render: PlutoNuxtContentRender = 'hybrid'
  if (options.render !== undefined) {
    if ((PLUTO_NUXT_CONTENT_RENDER_MODES as readonly unknown[]).includes(options.render)) {
      render = options.render
    } else {
      errors.push(`plutoNuxtContent.render must be one of: ${PLUTO_NUXT_CONTENT_RENDER_MODES.join(', ')}. Using "hybrid".`)
    }
  }

  let runtimeMaxAge = DEFAULT_RUNTIME_MAX_AGE
  if (options.runtimeMaxAge !== undefined) {
    if (typeof options.runtimeMaxAge === 'number' && Number.isInteger(options.runtimeMaxAge) && options.runtimeMaxAge >= 0) {
      runtimeMaxAge = options.runtimeMaxAge
    } else {
      errors.push(`plutoNuxtContent.runtimeMaxAge must be a whole number of seconds, 0 or more. Using ${DEFAULT_RUNTIME_MAX_AGE}.`)
    }
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

  return { enabled: true, render, runtimeMaxAge, types, errors }
}
