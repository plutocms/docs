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
  line of that block in the editor (`block.original.start`, `reveal()`) and scrolls it to the upper
  third. A handle resizes the two panes (cookie `pluto-mdc-split`, 25 to 75 percent).

## The Markdown editor (`PlutoMdcCodeEditor`)

CodeMirror 6, loaded on demand (about 111 KB gzip). Every character stays visible, and the text
shows its format as the author types (a "hybrid" editor, like a chat composer): bold, italic,
strikethrough, headings (yellow, `--ui-warning`), links (primary color) and code (monospace). Every
line has the same font size. The marks (`**`, `#`, `[`) stay, dimmed (`tags.processingInstruction`).
A heading has a space after `#` (`## Title`); a slot has none (`#title`) and gets the slot look.
Inside a component, slot, props or code line, no Markdown format shows: a YAML line before a `---`
line would read as a setext heading. `mdcLineKinds` (`shared/utils/mdc-lines.ts`)
gives the MDC lines their look: components (`::name`, primary), slots (`#title`), YAML props, and
the lines of a code fence.

- Toolbar: bold (Ctrl/Cmd+B), italic (Ctrl/Cmd+I), strikethrough (Ctrl/Cmd+Shift+X), code
  (Ctrl/Cmd+E), link (Ctrl/Cmd+K), heading (none, `##`, `###`), bulleted and numbered list, quote,
  code block. A second use removes the format. The commands are pure: `formatMarkdown`
  (`shared/utils/markdown-format.ts`), tested in `test/markdown-format.test.ts`.
- The `toolbar` slot (the Insert menu) gets `insert` and `focus`; `toolbar-end` holds the mode
  switch. Exposed: `insert`, `focus`, `reveal(start, end)`.
- Enter continues a list or a quote (`markdownKeymap`), Ctrl/Cmd+F searches, history and Tab work.
- It uses `new LanguageSupport(markdownLanguage)`, not `markdown()`: `markdown()` adds the HTML, CSS
  and JavaScript languages for raw HTML (70 KB gzip more). The list commands need `markdownLanguage`
  itself, so do not build another Markdown language.
- The model value is the text as it is: a change that comes from the model (`fromModel`
  annotation) does not emit. `fill` fills the parent and scrolls inside; without it the editor
  grows with the text (`minLines`).

## Files

- `app/components/Pluto/NuxtContent/PlutoFieldMdc.vue` — the widget.
- `app/components/Pluto/NuxtContent/PlutoMdcInsertMenu.vue` — the Insert menu.
- `app/components/Pluto/NuxtContent/PlutoMdcCodeEditor.vue` — the Markdown editor (CodeMirror).
- `shared/utils/markdown-format.ts`, `shared/utils/mdc-lines.ts` — its pure parts.
- `app/components/Pluto/NuxtContent/Blocks/PlutoBlockMarkdownSplit.vue` — Markdown and preview side
  by side.
- `shared/utils/mdc-snippets.ts` — `MDC_SNIPPETS`, the snippets as pure data.
- `app/plugins/pluto-nuxt-content.ts` — registers the widget as `{ id: 'mdc', widget: 'mdc' }`
  with `defineAsyncComponent`.
- `test/mdc-snippets.test.ts` — checks that every block snippet closes.

## How it works

- It follows the field widget contract: props `field`, `modelValue`, `disabled`, and the
  `update:modelValue` event. It uses `UFormField`, like the core widgets.
- The Markdown mode uses `PlutoMdcCodeEditor` (above). It never parses or rewrites the text, so
  MDC stays as the author wrote it. (Core `PlutoMarkdownSource`, a textarea, is still the editor of
  `PlutoBlockRawEditor` in the Block panel.)
- It fills the `#toolbar="{ insert, focus }"` slot with `PlutoMdcInsertMenu`. A menu item calls
  `insert(snippet.text, { block })` (core `insertMarkdownText`). A block snippet gets a blank line
  before and after it. An inline snippet (`:kbd`, `:icon`) does not.
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
