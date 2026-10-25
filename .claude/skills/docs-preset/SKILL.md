# Docs preset

The `docs` preset makes the content type of a Nuxt Content page. `createDocsType(options)`
(`shared/utils/docs-type.ts`) is pure: it has no Nuxt import, and it is auto-imported in the app
and in Nitro.

## The type

- Items are nested Markdown files. The id is the path under `source`, without `.md`
  (`2.core/03.content-model`). `files: { nested: true, exclude, frontmatter: { read, write } }`.
- `source: ''` uses the CMS content dir itself, so the landing `index.md` is an item too.
- `status: false`, `timestamps: false`. A page has no draft state and no stored dates.
- `defaultSort: { field: 'id', direction: 'asc' }`. The list shows the tree order: `index` first,
  then the numeric prefixes as numbers.
- `form: { layout: 'focus', width: 'full' }`.
- `capabilities: { write: 'docs:write', delete: 'docs:delete' }`. There is no read capability.
- `titleField: 'title'`, `slug: { field: 'slug' }`, icon `lucide:book-open`.

## Fields

| Field | Type | Frontmatter key | Region |
| --- | --- | --- | --- |
| `title` | text, required | `title` | main |
| `slug` | slug, required | none (the file path) | main |
| `description` | textarea | `description` | main |
| `body` | richtext, `widget: 'mdc'`, `editor: 'source'` | none (the file body) | main |
| `navigationTitle` | text | `navigation.title` | side |
| `navigationIcon` | text | `navigation.icon` | side |
| `navigationHidden` | boolean | `navigation: false` | side |
| `seoTitle` | text | `seo.title` | side |
| `seoDescription` | textarea | `seo.description` | side |

- The slug field holds the whole id, a path. A new path moves the file in one commit. It is never
  a frontmatter key, because Nuxt Content reserves `path`.
- The five navigation and SEO fields are normal, non-virtual fields. Their `column` is the flat
  key (the field name). The core adapter reads a virtual field back from no column, so a virtual
  field would always show empty.

## The frontmatter hooks

The core adapter runs `read` after it parses a file, and `write` before it writes. Both are pure
and get a copy.

- `readDocsFrontmatter` adds the flat keys: `navigationTitle` and `navigationIcon` from
  `navigation`, `navigationHidden: true` from `navigation: false`, and `seoTitle` and
  `seoDescription` from `seo`.
- `writeDocsFrontmatter` folds the flat keys back and drops them.
  - The flat keys win. A missing flat key means the author cleared the field, so the nested key is
    removed. The exception: a nested value that is not a string (a number, a list) stays as the
    author wrote it.
  - Unknown keys of `navigation` and `seo` stay (`navigation.badge`, `seo.ogImage`).
  - An empty `navigation` or `seo` object is dropped.
  - `navigationHidden: true` writes `navigation: false`. This replaces the title and the icon:
    a hidden page keeps no navigation title and icon.
  - Every other frontmatter key stays (`links`, custom keys), in the same order.
- Read then write gives the same frontmatter. The core adapter then sees the same file text and
  makes no commit. `test/docs-type.test.ts` checks this round trip.

## Tests

`test/docs-type.test.ts` checks the fields, the type options, the round trip, hidden navigation,
empty objects and unknown keys.
