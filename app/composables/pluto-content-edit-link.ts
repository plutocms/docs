/** The Nuxt Content page on screen, for the "Edit page" button of the admin bar. */
export interface PlutoContentCurrentPage {
  /** The content type name, for example `doc`. */
  type: string
  /** The content id: the page stem, for example `2.core/03.content-model`. */
  id: string
  /** The page that set the value. Only that page clears it. */
  owner: number
}

let nextOwner = 0

/**
 * The Nuxt Content page on screen, or `null`. `usePlutoContentEditLink` sets it
 * in the browser while the page is mounted. The admin bar reads it to show
 * "Edit page". The server never sets it.
 */
export function usePlutoContentCurrentPage() {
  return useState<PlutoContentCurrentPage | null>('pluto-nuxt-content:current-page', () => null)
}

/**
 * The admin edit link of a Nuxt Content page, for the signed-in staff only.
 * Returns `null` for a visitor, so a public page shows no link. The link is
 * `/admin/content/<type>/<id>`. The id is the page stem (`2.core/03.content-model`).
 * The staff check follows the admin bar, which is client only: the link
 * appears after hydration, never in the server HTML.
 *
 * It also records the page as the current page, so the admin bar shows
 * "Edit page" for it.
 *
 * @param page A Nuxt Content page. Only `stem` is read.
 * @param type The content type name. Default `doc`.
 */
export function usePlutoContentEditLink(
  page: MaybeRefOrGetter<{ stem?: string } | null | undefined>,
  type = 'doc'
) {
  const bar = usePlutoAdminBar()
  const current = usePlutoContentCurrentPage()

  if (import.meta.client) {
    // The next page can mount before this one unmounts. The owner check keeps
    // this page from clearing the value of the next page.
    const owner = ++nextOwner
    watch(
      () => toValue(page)?.stem,
      (stem) => {
        current.value = stem ? { type, id: stem, owner } : null
      },
      { immediate: true }
    )
    onScopeDispose(() => {
      if (current.value?.owner === owner) {
        current.value = null
      }
    })
  }

  return computed(() => {
    const stem = toValue(page)?.stem
    if (!bar.visible.value || !stem) {
      return null
    }
    return contentEditPath(type, stem)
  })
}
