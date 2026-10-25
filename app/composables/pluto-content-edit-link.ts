/**
 * The admin edit link of a Nuxt Content page, for the signed-in staff only.
 * Returns `null` for a visitor, so a public page shows no link. The link is
 * `/admin/content/<type>/<id>`. The id is the page stem (`2.core/03.content-model`).
 * The staff check follows the admin bar, which is client only: the link
 * appears after hydration, never in the server HTML.
 *
 * @param page A Nuxt Content page. Only `stem` is read.
 * @param type The content type name. Default `doc`.
 */
export function usePlutoContentEditLink(
  page: MaybeRefOrGetter<{ stem?: string } | null | undefined>,
  type = 'doc'
) {
  const bar = usePlutoAdminBar()

  return computed(() => {
    const stem = toValue(page)?.stem
    if (!bar.visible.value || !stem) {
      return null
    }
    return `/admin/content/${encodeURIComponent(type)}/${contentIdPath(stem)}`
  })
}
