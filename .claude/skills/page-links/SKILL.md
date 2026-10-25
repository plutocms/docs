# Page links

Two links connect the public page and the admin form of the same Markdown file.

## From the admin to the page: "View page"

- `contentRoutePath(id, prefix = '')` (`shared/utils/content-route.ts`, auto-imported) gives the
  Nuxt Content route of a content id. It strips the number prefixes from each segment and a final
  `index` segment. `prefix` goes in front.
  - `1.getting-started/2.installation` gives `/getting-started/installation`.
  - `1.getting-started/1.index` gives `/getting-started`.
  - `index` gives `/`.
  - With `routePrefix: '/docs'`, `1.start/2.install` gives `/docs/start/install`.
- The client plugin registers one `contentActions` entry per type: `View page`, outline button,
  `show: ctx.editing`. A new page has no public route, so the button shows in edit mode only.
  `onSelect` opens the route in a new tab with `navigateTo(path, { external: true, open: { target: '_blank' } })`.
- The route prefix comes from the `routePrefix` option of the type.

## From the page to the admin: "Edit in admin"

`usePlutoContentEditLink(page, type = 'doc')` (`app/composables/pluto-content-edit-link.ts`)
returns a computed value:

- `/admin/content/<type>/<contentIdPath(page.stem)>` for signed-in staff.
- `null` for everyone else.

The staff check is `usePlutoAdminBar().visible`. The bar is client only, so the link appears after
hydration and is never in the server HTML. A cached public page holds no editor data.

The `stem` of a Nuxt Content page is the file path without the extension and relative to the
collection source. It equals the content id when the collection source is the content dir
(`source: ''`). A site with another collection source must pass an id that matches the type
`source`.

Use it in a page next to the "edit" link of the table of contents:

```ts
const adminLink = usePlutoContentEditLink(page)
// links.push({ icon: 'i-lucide-pencil', label: 'Edit in admin', to: adminLink.value })
```

## Tests

`test/content-route.test.ts` checks `contentRoutePath` against the paths of the docs template.
