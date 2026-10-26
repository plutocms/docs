# Block editor UI

Status: in progress
Started: 2026-10-25
Projects: nuxt-content, plutocms (docs site)
Branch / PR: feat/block-model (draft PR #16), docs site branch feat/visual-editor

## Context

- Goal: the visual block editor UI (Phase 2 of the workspace plan `.claude/plan/visual-block-editor.md`).
- Decisions: see the workspace plan. Preview is a same-origin iframe of `/_pluto/preview`. The outline is a
  custom list with SortableJS (not UTree), for keyboard and drag control.
- Key files: `app/components/Pluto/NuxtContent/Blocks/`, `app/pages/_pluto/preview.vue`,
  `app/components/PlutoContentPreview.vue`, `app/composables/pluto-block-editor.ts`.
- Not released: the user sees the editor before nuxt-content 0.4.0.

## Checklist

- [ ] Editor state composable, preview page, preview wrapper, route rules.
- [ ] Preview frame, editor, outline, palette.
- [ ] Inspector, prop control, text editor, raw editor.
- [ ] `PlutoFieldMdc` host, `docs-type.ts`, remove the "View page" action.
- [ ] i18n, narrow screens, keyboard, tests, skills, FEATURES.md, README.
- [ ] Docs site worktree changes, screenshots.

## Log

- 2026-10-25: started.
