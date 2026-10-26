# Nuxt Content setup

The layer edits the pages of a Nuxt Content site in the Pluto admin. The app turns it on with
`extends` and one config key (`plutoNuxtContent.types`). This skill describes the module, the options, and the plugins.

## Files

- `nuxt.config.ts` — extends `process.env.PLUTO_PLUTO_PATH || '@plutocms/pluto'`, adds the
  `@nuxt/content` module, sets `$meta.name: 'nuxt-content'`, the native SQLite connector, and the
  layer defaults `plutoCms.postType: false` and `plutoCms.commit.skipDeploy: false`. It has no `css`
  entry. The other `plutoCms` options use the core defaults (`enabled: 'auto'`, `storage` by mode,
  the repo from the env or the git remote). See the `github-cms` skill in pluto.
- `modules/pluto-nuxt-content/index.ts` — the Nuxt module. Config key `plutoNuxtContent`.
- `modules/pluto-nuxt-content/options.ts` — pure helpers: `resolvePlutoNuxtContentOptions`,
  `isValidSource`, `normalizeRoutePrefix`. No Nuxt import, so plain Vitest tests them.
- `shared/types/nuxt-content.d.ts` — the `@nuxt/schema` types for the config key.
- `app/plugins/pluto-nuxt-content.ts` — the client plugin.
- `server/plugins/pluto-nuxt-content.ts` — the Nitro plugin.
- `test/module-options.test.ts` — the unit tests.

## Options

```ts
plutoNuxtContent: {
  types: [{ preset: 'docs', name: 'doc', source: '', label?, labelPlural?, exclude?, routePrefix? }],
}
```

- Default `types` is `[]`.
- `name` uses lowercase letters, numbers and dashes, and starts with a letter. It is unique.
- `source` is `''` (the content dir itself) or a nested folder path (`1.docs/api`).
- `exclude` is a list of ids or folders (`index`, `drafts/`).
- `routePrefix` is the route prefix of the pages on the public site, for the View link of the form.
- A type with a problem is dropped, and the module logs one error for it.

## The CMS must be on

The module reads `nuxt.options.plutoCms.enabled`. Core defaults it to `'auto'`, so an app
sets nothing. When the app sets `plutoCms.enabled: false`, the module logs this error and stays
off:

> The Nuxt Content layer needs the standalone CMS. Remove plutoCms.enabled: false, or remove the
> layer.

When the module is on, it copies the valid types to `runtimeConfig.public.plutoNuxtContent`.
When it is off, that key does not exist. Both plugins return at once when the key is missing.

## The plugins

Both plugins live in the layer dirs (`app/plugins`, `server/plugins`), so the layer needs no
`addPlugin` call and no auto-import trick. They build each type with `createDocsType` from the
shared config.

- The Nitro plugin calls `registerContentType` (core) for each type. The CMS Nitro plugin
  registers the adapter. The order of the two plugins does not matter, because the adapter looks
  up the type for each request.
- The client plugin calls `definePlutoExtension` (extension id `nuxt-content`) with the
  `contentTypes`, the `capabilities` (`docs:write`, `docs:delete`), the `mdc` field widget
  (`defineAsyncComponent`), and the admin bar actions. The module also adds the route rules of the
  preview page `/_pluto/preview` (see the block editor skill).

## The app side

- `content.config.ts` of the app defines the collections. The layer defines none.
- The CSS entry of the app has the single Tailwind build. See the
  [admin bar offset](../admin-bar-offset/SKILL.md) skill.
- The app uses `PlutoRoot` in `app.vue`. `PlutoRoot` renders a `NuxtLayout`, so a site that wraps
  its header and footer in `app.vue` must not use a page layout for the docs sidebar. Put the
  sidebar in a component instead.
- Pluto sets `eslint.config.standalone: false` and button, input and form field sizes `xl`. A
  site with its own ESLint config and the Nuxt UI default sizes sets them back in its own config.

## Local development

The layer needs Pluto 0.20 or newer. To test unpublished Pluto changes, run the commands with
`PLUTO_PLUTO_PATH=<path to pluto>`. An app that extends this layer from a local folder uses the
`plutoLayer` helper (`@plutocms/pluto/layers`) with `PLUTO_LOCAL_ROOT`. See the `local-layers`
skill in pluto.
