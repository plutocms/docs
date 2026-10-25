# MDC field

The `mdc` field widget edits the body of a docs page as raw Markdown, with an **Insert** menu of
MDC snippets. MDC is the Markdown syntax with components (`::note`, `:icon{name=""}`).

## Files

- `app/components/Pluto/NuxtContent/PlutoFieldMdc.vue` — the widget.
- `shared/utils/mdc-snippets.ts` — `MDC_SNIPPETS`, the snippets as pure data.
- `app/plugins/pluto-nuxt-content.ts` — registers the widget as `{ id: 'mdc', widget: 'mdc' }`
  with `defineAsyncComponent`.
- `test/mdc-snippets.test.ts` — checks that every block snippet closes.

## How it works

- It follows the field widget contract: props `field`, `modelValue`, `disabled`, and the
  `update:modelValue` event. It uses `UFormField`, like the core widgets.
- It wraps `PlutoMarkdownSource` from core (the CMS module registers that short name). The
  textarea never parses or rewrites the text, so MDC stays as the author wrote it.
- It fills the `#toolbar="{ insert, focus }"` slot of `PlutoMarkdownSource` with one
  `UDropdownMenu`. A menu item calls `insert(snippet.text, { block })`. A block snippet gets a blank
  line before and after it. An inline snippet (`:kbd`, `:icon`) does not.
- There is no Visual mode. MDC would be lost in the Tiptap editor. The `body` field also sets
  `editor: 'source'`.

## The snippets

Note, tip, warning, caution, callout, code group, tabs (with `tabs-item`), steps, card group (with
`card`), accordion, field group (with `field`), `:kbd{value=""}`, `:icon{name=""}`, and a code
block with a file name. A nested component uses more colons than its parent where needed
(`::tabs` holds `:::tabs-item`).

## Add a snippet

1. Add an entry to `MDC_SNIPPETS`: `id`, a full i18n key in `label`, an icon, `text`, `block`.
2. Add the key to `i18n/locales/en.json` and `pt-BR.json` under `nuxt-content.snippets`.
3. Update the id list in `test/mdc-snippets.test.ts`.

The `label` must be a full literal key (`nuxt-content.snippets.note`). The locale test scans
the code for literal keys.
