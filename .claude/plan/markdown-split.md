# Markdown mode: side by side with the preview

Status: in progress (part 1 done, part 2 waits for the user)
Started: 2026-10-26
Projects: nuxt-content (branch `feat/block-model`)
Branch / PR: `feat/block-model` (draft PR #16)

## Context

- User (2026-10-26), for the Markdown mode of the editor:
  1. Put the editor and the preview side by side.
  2. Click to go to line; if not possible, a non-clickable live preview.
  3. Question: live syntax highlighting and quick options (bold, italic) in the Markdown editor?
- Part 1 (items 1 and 2): `PlutoBlockMarkdownSplit` with the preview frame of the visual editor. A
  block model of the text (read only) feeds it. Every block of a fresh parse has `original.start`,
  so a click goes to the exact line.
- Part 2 (item 3): a proposal for the user. The textarea cannot color text. Recommended:
  CodeMirror 6 (`@codemirror/lang-markdown`, small MDC rules for `::name`, `#slot`, YAML props),
  plus a toolbar of quick options (bold, italic, link, heading, list, code) and their shortcuts.

## Checklist

- [x] `PlutoMdcInsertMenu` (shared by the split and the plain field).
- [x] `PlutoBlockMarkdownSplit`: side by side (stacked below `lg`), click to go to line.
- [x] `PlutoFieldMdc`: the split in a canvas form, the plain Markdown elsewhere.
- [x] Skill `mdc-field`; checked in Chrome.
- [x] Resizable split (`USplitter`, cookie `pluto-mdc-split`, 25 to 75 percent; vertical below `lg`).
- [ ] Part 2: after the user decides (CodeMirror or not).

## Log

- 2026-10-26: part 1 built. In Chrome: a click on the Warning selects `::warning` in the Markdown;
  a click on the card group selects `::card-group` and scrolls the pane to it. 201 tests pass.
- 2026-10-26: the split is resizable (drag 200 px: 379 to 577 px, cookie 73). Same round, in the
  visual editor: the button Label field edits the slot text (prop `slot` option), the outline has
  chevrons to collapse a component, and a block selected in the preview scrolls its row into view.
