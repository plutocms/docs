const NUMBER_PREFIX = /^\d+\./

/**
 * The public route of a Nuxt Content page, from its content id. Nuxt Content
 * drops the number prefixes of the folders and files, and a final `index`
 * segment. For example `1.getting-started/2.installation` gives
 * `/getting-started/installation`, and `index` gives `/`. `prefix` is added in
 * front of the path (for example `/docs`).
 */
export function contentRoutePath(id: string, prefix = ''): string {
  const segments = String(id)
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(NUMBER_PREFIX, ''))

  if (segments.at(-1) === 'index') {
    segments.pop()
  }

  const base = prefix.split('/').filter(Boolean)
  const path = [...base, ...segments].join('/')
  return `/${path}`
}
