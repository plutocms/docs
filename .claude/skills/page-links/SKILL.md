# Page links

Two links connect the public page and the admin form of the same Markdown file.

## From the admin to the page: "View"

- `contentRoutePath(id, prefix = '')` (`shared/utils/content-route.ts`, auto-imported) gives the
  Nuxt Content route of a content id. It strips the number prefixes from each segment and a final
  `index` segment. `prefix` goes in front.
  - `1.getting-started/2.installation` gives `/getting-started/installation`.
  - `1.getting-started/1.index` gives `/getting-started`.
  - `index` gives `/`.
  - With `routePrefix: '/docs'`, `1.start/2.install` gives `/docs/start/install`.
- The docs type sets `previewUrl(item)` to `contentRoutePath(item.id, routePrefix)`. The form toolbar
  of core shows it as the **View** link (a new tab, edit mode only). A new page has no id, so it has
  no link. The layer registers no `View page` action any more.
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

## The admin bar: "New Page" and "Edit Page"

The client plugin registers one `navbarActions` component action, `PlutoNuxtContentBarActions`
(async). It renders `PlutoNavbarButton` items (each is an `<li>`), only when
`can(DOCS_CAPABILITIES.write)` is true:

- **New <label>** for each type of the layer config (`usePlutoContentTexts()(type).newLabel`),
  to `contentNewPath(type)` (`/admin/content/<type>/new`). It shows on every page where the bar
  shows, `/admin/**` too.
- **Edit <label>** (`nuxt-content.actions.edit`, "Edit {label}") on a public page, to
  `contentEditPath(type, id)`. It does not show on `/admin/**`, because the form has the View link.

The layer does not own the collections, so it cannot find the page of a route. The page tells
it: `usePlutoContentEditLink(page, type)` also sets `usePlutoContentCurrentPage()` (a `useState`,
`{ type, id, owner }`) in the browser, and clears it in `onScopeDispose`. The next page can mount
before the old one unmounts, so a page clears the value only when its own `owner` number is still
there. The server never sets the value. A site that wants "Edit Page" on a page must call
`usePlutoContentEditLink` there, the landing page too.

`contentEditPath` and `contentNewPath` are in `shared/utils/content-route.ts` and have tests.
