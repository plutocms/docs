# MDC field

The `mdc` field widget edits the body of a docs page in two modes: **Visual** (the block editor,
see the [block editor](../block-editor/SKILL.md) skill) and **Markdown** (raw Markdown, with an
**Insert** menu of MDC snippets). MDC is the Markdown syntax with components (`::note`,
`:icon{name=""}`).

## The two modes

- The first mode is the `editor` option of the field: `visual` (or `auto`) or `source`. The docs type
  sets `visual`. The cookie `pluto-mdc-editor-mode` keeps the last choice of the author.
- Visual needs the `canvas` form layout, because its panels live in the form. In any other layout
  (or outside a form) the widget shows only Markdown, with no switch.
- The Visual and Markdown switch is at the bottom of the block list, and at the end of the
  Markdown toolbar.
- The block editor loads on demand. A skeleton shows while it loads.
- Markdown in a canvas form (`PlutoBlockMarkdownSplit`, loaded on demand): the Markdown at the left
  and the live preview at the right (stacked below `lg`). The preview is the frame of the visual
  editor. A block model of the text (`createPlutoBlockEditor`, which never writes) feeds it, and
  the frame renders again after each change. A click on a block in the preview selects the first
  line of that block in the textarea (`block.original.start`) and scrolls the Markdown pane so that
  line is in the upper third. A hidden copy of the textarea measures the line, so wrapped lines
  count too.

## Files

- `app/components/Pluto/NuxtContent/PlutoFieldMdc.vue` — the widget.
- `app/components/Pluto/NuxtContent/PlutoMdcInsertMenu.vue` — the Insert menu.
- `app/components/Pluto/NuxtContent/Blocks/PlutoBlockMarkdownSplit.vue` — Markdown and preview side
  by side.
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
- The Visual mode never rewrites the whole page with Tiptap. It cuts the page in blocks and keeps
  the text of each block that the author did not edit.

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
