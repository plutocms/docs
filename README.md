# Nuxt Content layer for Pluto CMS

This layer lets editors change the Markdown pages of a [Nuxt Content](https://content.nuxt.com)
site in the Pluto admin. The pages are Markdown files in a GitHub repo (the standalone CMS of
`@plutocms/pluto`, no database). Nuxt Content reads the same files to build the public site.

## What the layer gives

- A `docs` page type. It maps the frontmatter of a Nuxt Content page to form fields.
- Nested, numbered folders: `content/1.getting-started/2.installation.md` is one item. The item
  list shows the pages in tree order.
- A source editor for MDC (the Markdown syntax with components), with an **Insert** menu of
  snippets (note, tip, code group, tabs, steps, cards, and more).
- A **View page** button in the admin form.
- `usePlutoContentEditLink(page)`: an "Edit in admin" link for the public page, for signed-in
  staff only.
- A CSS offset, so the Nuxt UI header and the sticky sidebar stay under the Pluto admin bar.
- English and Brazilian Portuguese text.

For the full detail of each feature, see [FEATURES.md](./FEATURES.md).

## Requirements

- `@plutocms/pluto` 0.19 or newer. The layer depends on it, so it installs with the layer.
- Node 22.5 or newer (the layer sets the native SQLite connector of Nuxt Content).

## Installation

> [!NOTE]
> Version 0.1.0 is tagged. The npm publish is pending, so the package is not on npm yet.

1. Install the layer (`npm i @plutocms/nuxt-content`, or pnpm or Bun). Your app extends only this layer. It brings `@plutocms/pluto`.

2. Add the layer to `nuxt.config.ts`, and turn the CMS on:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [['@plutocms/nuxt-content', { install: true }]],

  plutoCms: {
    enabled: true,
    storage: process.env.NODE_ENV === 'production' ? 'github' : 'fs',
    github: { repo: 'my-org/my-docs', branch: 'main', appSlug: process.env.PLUTO_CMS_APP_SLUG },
    dir: 'content',
    postType: false,
  },

  plutoNuxtContent: {
    types: [{ preset: 'docs', name: 'doc', source: '' }],
  },
})
```

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

The layer is off, with an error log, when `plutoCms.enabled` is not `true`.

## Local development

To test unpublished changes, point the layers at local checkouts:

```bash
PLUTO_PLUTO_PATH=../pluto bun run test
```

An app uses `PLUTO_NUXT_CONTENT_PATH` for this layer.
