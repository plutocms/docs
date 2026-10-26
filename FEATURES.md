# Features

This file lists every implemented feature of this project. Each entry links to a skill file
with full detail, so this file stays short.

See the workspace-level `CLAUDE.md` (one directory up) for the delegation, writing, and git
policies shared by every project here.

- Nuxt Content setup: the `plutoNuxtContent` module, its options, and the plugins that register
  the types. See @.claude/skills/nuxt-content-setup/SKILL.md.
- Docs preset: the `docs` page type, the frontmatter hooks, and tree order. See
  @.claude/skills/docs-preset/SKILL.md.
- MDC field: the `mdc` field widget. Visual mode (the block editor) and Markdown mode (with the
  Insert menu of snippets). See @.claude/skills/mdc-field/SKILL.md.
- Page links: the View link of the form (`previewUrl`), the admin bar actions ("New Page", "Edit Page"),
  `contentRoutePath`, `contentEditPath`, and `usePlutoContentEditLink`. See
  @.claude/skills/page-links/SKILL.md.
- Admin bar offset: CSS that keeps a Nuxt UI header under the Pluto admin bar. See
  @.claude/skills/admin-bar-offset/SKILL.md.
- Block model: the pure model of the visual block editor (parse, serialize, edit, history,
  presets, registry, preview protocol). The text of an unedited block stays byte for byte. See
  @.claude/skills/block-model/SKILL.md.
- Block editor: the visual editor for the page body. A live preview, the block list, the palette, and
  the controls of the selected block, with no raw MDC. See @.claude/skills/block-editor/SKILL.md.
