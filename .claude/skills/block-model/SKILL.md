# Block model

The block model cuts the Markdown (MDC) body of a page into blocks, edits the blocks, and writes
the text back. It is the base of the visual block editor. The code is pure: it has no Nuxt import.
It lives in `shared/utils/blocks/`. The UI is the [block editor](../block-editor/SKILL.md).

## The rule

The truth is the Markdown string. The model never writes the whole page again from a tree. A block
that is not edited keeps the source text it came from (`original`), and the gaps between the blocks
keep the text too. A save with no edit writes the same bytes. One edit changes only the lines of
that block. A test guards this with the 48 pages of the docs site.

## Files

- `types.ts`: `PlutoBlockDoc`, the four kinds of block, and the types of a block definition.
- `parse.ts`: `parseBlocks(source)`. It uses `remark-parse`, `remark-gfm` and `remark-mdc`.
- `serialize.ts`: `serializeBlocks(doc)`, `renderBlock(block)`.
- `mdc-props.ts`: reads and writes the props: `{a="b" .c #d flag :n='3'}` and the YAML block.
- `operations.ts`: pure, immutable edits. Each returns a new doc.
- `history.ts`: undo and redo over doc snapshots. The clock is a parameter.
- `presets.ts`: the Nuxt UI prose and page components, with i18n keys.
- `registry.ts`: `resolveBlockDefinition`, `listPaletteBlocks`, `definePlutoBlock`.
- `preview-protocol.ts`: the `postMessage` types and validators for the preview frame.
- `editor.ts`: helpers for the UI (labels, slot editors, preview blocks, palette).
- `tree.ts`: `flatChildren`, `walkBlocks`, `findBlock`, `pathOf`, `newBlockId`.

## The kinds of block

- `text`: prose. One block for each H1 or H2 section at the top level. In a component, all the
  prose between two other blocks is one block.
- `code`: a fenced code block. `lang`, `filename` (from `[file.ts]`), `meta`, `fence`, `code`.
- `component`: a container component (`::name`). It has `props`, `propsStyle` (`inline` or `yaml`),
  `propOrder`, `slots`, and `gaps`.
- `raw`: Markdown that the editor does not edit. The `reason` is `table`, `html`, `inline-mdc`,
  `footnote`, `task-list` or `unknown`. A raw block is still written back byte for byte.

## How a component is kept

- The children of all slots are in one list in source order. `slots` splits that list by slot name.
  `gaps` has the text before, between and after the children. It holds the `#name` lines.
- `openerText` is the opening line (and the YAML block). While the props are the same, it is
  written as it was. `propSource` has the source text of each prop, so a changed prop does not
  rewrite the others.
- A nested component has more colons than its parent. The model raises the colons when it moves or
  inserts a block into a parent.
- `indent` is the white space before the first line of a block inside a component.

## Operations

`insertBlocks`, `insertBlock`, `removeBlock`, `moveBlock`, `duplicateBlock`, `updateText`,
`updateCode`, `setProp`, `setSlot`, `replaceWithMarkdown`, `blocksFromMarkdown`, `blockMarkdown`,
and the makers `createTextBlock`, `createCodeBlock`, `createComponentBlock`.

- An edit removes `original` from the block and its ancestors. The other blocks keep theirs.
- A move in one list changes only the order of the blocks. The gaps stay in place.
- A no-op edit returns the same doc object.
- Pass plain objects. The functions copy the doc with JSON, so a Vue proxy also works.

## Block definitions

`resolveBlockDefinition(name, { overrides, block })` joins the preset, the site override
(`plutoBlocks` in `app.config.ts`), and the props and slots found in the document (Advanced). An
unknown component gets an automatic entry. `listPaletteBlocks(overrides)` gives the palette groups.
`definePlutoBlock(def)` is a typed identity helper for `app.config.ts`. A label or a description is
an i18n key (`docs.blocks.<name>.label`) or a plain text. `false` hides a block.

## Add a preset

1. Add a `block(...)` call to `presets.ts` with the group, the icon, the props, the slots, and the
   insert text.
2. Add `label` and `description` to `blocks.<name>` in `en.json` and `pt-BR.json`. A new prop
   or slot name needs a key in `blocks.props` or `blocks.slots`.
3. `test/blocks-registry.test.ts` checks the keys, the insert text, and unused texts.

## Tests

- `test/blocks-corpus.test.ts`: the 48 pages in `test/fixtures/mdc/` (copied from the docs site)
  write back byte for byte. The fixtures have `-text` in `.gitattributes`, so git keeps the bytes.
- `test/blocks-edit.test.ts`, `test/blocks-operations.test.ts`: one edit changes only that block,
  and every operation leaves a text that parses again and writes the same bytes.
- `test/blocks-parse.test.ts`, `test/blocks-history.test.ts`, `test/blocks-registry.test.ts`,
  `test/blocks-preview-protocol.test.ts`.

## Pinned versions

`remark-mdc`, `remark-parse`, `remark-gfm` and `unified` are pinned to the versions of `@nuxtjs/mdc`
0.23. The blocks are cut with `remark-mdc`, and the site renders with `@nuxtjs/mdc`. Change the pins
only when `@nuxtjs/mdc` changes them, and run the corpus test.

## Limits

- A component whose opening line spans lines, or has `[text]` after the name, or has no closing
  colons, is a raw block.
- A YAML comment between props is lost when that component's props change.
- An edited Text block uses `\n`. A page with `\r\n` keeps its bytes until a block is edited.
