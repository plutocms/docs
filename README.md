# Nuxt Content layer for Pluto

Edit the Markdown pages of a [Nuxt Content](https://content.nuxt.com) site in the Pluto admin,
with a visual block editor and a live preview. The pages stay Markdown files in your GitHub
repository, and each save is a commit.

**Docs:** [Nuxt Content layer](https://pluto.vulmix.dev/layers/nuxt-content) ·
[Edit pages visually](https://pluto.vulmix.dev/guides/edit-pages-visually)

## Install

```bash
npm install @plutocms/nuxt-content
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [['@plutocms/nuxt-content', { install: true }]],

  plutoNuxtContent: {
    types: [{ preset: 'docs', name: 'doc', source: '' }],
  },
})
```

The layer brings `@plutocms/pluto`. It needs Node 22.5 or newer. The docs show the rest of the
setup: the collections, the CSS entry, `PlutoRoot`, and the GitHub App.

## What you get

- A `docs` page type for nested, numbered Markdown pages.
- A visual block editor with a live preview, and a Markdown mode.
- "New Page" and "Edit Page" in the admin bar, and an "Edit in admin" link for the public page.

## License

MIT
