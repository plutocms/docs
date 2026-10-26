# Nuxt Content layer for Pluto

This layer lets editors change the Markdown pages of a [Nuxt Content](https://content.nuxt.com)
site in the Pluto admin. The pages are Markdown files in a GitHub repo (the standalone CMS of
`@plutocms/pluto`, no database). Nuxt Content reads the same files to build the public site.

## What the layer gives

- A `docs` page type. It maps the frontmatter of a Nuxt Content page to form fields.
- Nested, numbered folders: `content/1.getting-started/2.installation.md` is one item. The item
  list shows the pages in tree order.
- A **visual block editor** for the body of a page (see below), and a Markdown mode with an
  **Insert** menu of snippets (note, tip, code group, tabs, steps, cards, and more).
- A **View** link in the admin form.
- `usePlutoContentEditLink(page)`: an "Edit in admin" link for the public page, for signed-in
  staff only.
- Admin bar actions: **New Page** on every page, and **Edit Page** on a public page that calls
  `usePlutoContentEditLink`. They show for a user who can write pages (`docs:write`).
- A CSS offset, so the Nuxt UI header and the sticky sidebar stay under the Pluto admin bar.
- English and Brazilian Portuguese text.

For the full detail of each feature, see [FEATURES.md](./FEATURES.md).

## Requirements

- `@plutocms/pluto` 0.21 or newer. The layer depends on it, so it installs with the layer.
- Node 22.5 or newer (the layer sets the native SQLite connector of Nuxt Content).

## Installation

1. Install the layer (`npm i @plutocms/nuxt-content`, or pnpm or Bun). Your app extends only this layer. It brings `@plutocms/pluto`.

2. Add the layer to `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [['@plutocms/nuxt-content', { install: true }]],

  plutoNuxtContent: {
    types: [{ preset: 'docs', name: 'doc', source: '' }],
  },
})
```

   The CMS is on by default. In dev it reads and writes the local `content/` folder. In
   production it uses GitHub. Pluto finds the repo from `PLUTO_CMS_REPO`, from Vercel, or (in dev)
   from the `origin` remote. Set `plutoCms.github.repo` only when none of these works. The layer
   sets `plutoCms.postType: false` and `plutoCms.commit.skipDeploy: false`.

3. Define the collections in `content.config.ts`, as for any Nuxt Content site. The layer
   defines no collection.

4. Start the CSS entry of the app with the single Tailwind build:

```css
@import 'tailwindcss';
@import '@nuxt/ui';
@import '#build/pluto.css';
```

5. Use `PlutoRoot` in `app.vue` instead of `UApp`. Render the admin routes (`/admin/**`) with
   only `<NuxtPage />`, and the public routes with your own header, main and footer.

6. Set the secrets of the GitHub App. See the GitHub CMS docs of `@plutocms/pluto`.

## Options

`plutoNuxtContent.types` is a list. Each entry:

| Option        | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| `preset`      | The preset. Only `docs` exists.                                             |
| `name`        | The content type name. The admin URL is `/admin/content/<name>`.            |
| `source`      | The folder under the CMS content dir. Use `''` for the content dir itself.  |
| `label`       | The singular label. Default `Page`.                                         |
| `labelPlural` | The plural label. Default `Pages`.                                          |
| `exclude`     | Ids to hide: an id (`index`), or a folder with a trailing slash (`drafts/`). |
| `routePrefix` | The route prefix of the pages on the public site. Default: none.            |

The layer is off, with an error log, when the app sets `plutoCms.enabled: false`.

## The visual editor

The `docs` type edits the body of a page with a visual editor, for people who do not write
Markdown. The block list is at the left. The live preview of the page is in the middle. The
controls of the selected block are at the right. Click a block in the preview or in the list, change
it, and add a block from the palette. The author can switch to the Markdown editor at any time.

A page that you open and save with no change stays the same, byte for byte. A change in one block
changes only the lines of that block.

### What your site needs

1. **Skip your header and footer on the preview route.** The editor shows `/_pluto/preview` in an
   iframe. The page needs to show only the content. In `app.vue`, use the helper of core:

   ```vue
   <PlutoRoot>
     <NuxtPage v-if="isAdmin || isPlutoPreviewPath(route.path)" />
     <AppShell v-else><NuxtPage /></AppShell>
   </PlutoRoot>
   ```

2. **Optional: show the real layout.** The default preview is a generic page (a header with the
   title and the description, and the body). To use your own layout, add
   `app/components/PlutoContentPreview.vue`. It gets the `frontmatter` prop and renders the default
   slot where the blocks go.
3. **Optional: name your own components.** The editor knows the Nuxt UI prose and page components.
   A component of your site shows with a generated name. Give it a name, an icon, settings and slots
   in `app.config.ts`:

   ```ts
   export default defineAppConfig({
     plutoBlocks: {
       'pluto-hero': {
         label: 'Hero',
         icon: 'i-lucide-sparkles',
         group: 'landing',
         description: 'The big title at the top of the home page.',
         props: { center: { type: 'boolean', label: 'Center the text' } },
         slots: {
           title: { label: 'Title', content: 'inline' },
           default: { label: 'Text', content: 'rich' },
         },
         insert: '::pluto-hero\n#title\nYour title\n::',
       },
       'pluto-palette': { preview: false }, // a card in place of the component
       'u-page-c-t-a': false, // not in the palette
     },
   })
   ```

   A label or a description can be a plain text or an i18n key.

The module adds the route rules of the preview page (`ssr: false`, no prerender, `noindex`). The
page fetches nothing and runs in the iframe of the admin only.

## Local development

To test unpublished changes, point the layers at local checkouts:

```bash
PLUTO_PLUTO_PATH=../pluto bun run test
```

An app can use the `plutoLayer` helper of `@plutocms/pluto` for this layer. Set
`PLUTO_LOCAL_ROOT` (for example `PLUTO_LOCAL_ROOT=..` in `.env`) to the folder with your Pluto
checkouts. The helper then uses the local `nuxt-content` and `pluto` folders.

```ts
// nuxt.config.ts
import { plutoLayer } from '@plutocms/pluto/layers'

export default defineNuxtConfig({
  extends: [plutoLayer('@plutocms/nuxt-content')],
})
```

With pnpm, add `@plutocms/pluto` to the dependencies of the app, so the import works. Without
`PLUTO_LOCAL_ROOT`, the helper returns `['@plutocms/nuxt-content', { install: true }]`.
