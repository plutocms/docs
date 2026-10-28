// The MDC snippets of the Insert menu. Pure data, so plain Vitest tests it.
// Each `label` is a full i18n key (a literal, so the locale test finds it).

export interface MdcSnippet {
  id: string
  /** An i18n key of the layer. */
  label: string
  icon: string
  /** The Markdown text to insert. */
  text: string
  /** Put a blank line before and after the text. Inline snippets set `false`. */
  block: boolean
}

export const MDC_SNIPPETS: MdcSnippet[] = [
  {
    id: 'note',
    label: 'nuxt-content.snippets.note',
    icon: 'i-lucide-info',
    block: true,
    text: '::note\nText of the note.\n::',
  },
  {
    id: 'tip',
    label: 'nuxt-content.snippets.tip',
    icon: 'i-lucide-lightbulb',
    block: true,
    text: '::tip\nText of the tip.\n::',
  },
  {
    id: 'warning',
    label: 'nuxt-content.snippets.warning',
    icon: 'i-lucide-triangle-alert',
    block: true,
    text: '::warning\nText of the warning.\n::',
  },
  {
    id: 'caution',
    label: 'nuxt-content.snippets.caution',
    icon: 'i-lucide-octagon-alert',
    block: true,
    text: '::caution\nText of the caution.\n::',
  },
  {
    id: 'callout',
    label: 'nuxt-content.snippets.callout',
    icon: 'i-lucide-message-square-quote',
    block: true,
    text: '::callout{icon="i-lucide-info" color="primary"}\nText of the callout.\n::',
  },
  {
    id: 'code-group',
    label: 'nuxt-content.snippets.codeGroup',
    icon: 'i-lucide-square-code',
    block: true,
    text: '::code-group\n```bash [bun]\nbun add package\n```\n\n```bash [pnpm]\npnpm add package\n```\n::',
  },
  {
    id: 'tabs',
    label: 'nuxt-content.snippets.tabs',
    icon: 'i-lucide-panel-top',
    block: true,
    text: '::tabs\n  :::tabs-item{label="First" icon="i-lucide-code"}\n  Text of the first tab.\n  :::\n\n  :::tabs-item{label="Second" icon="i-lucide-file"}\n  Text of the second tab.\n  :::\n::',
  },
  {
    id: 'steps',
    label: 'nuxt-content.snippets.steps',
    icon: 'i-lucide-list-ordered',
    block: true,
    text: '::steps{level="3"}\n### First step\n\nText of the first step.\n\n### Second step\n\nText of the second step.\n::',
  },
  {
    id: 'card-group',
    label: 'nuxt-content.snippets.cardGroup',
    icon: 'i-lucide-layout-grid',
    block: true,
    text: '::card-group\n  :::card\n  ---\n  title: Title\n  icon: i-lucide-box\n  to: /path\n  ---\n  Text of the card.\n  :::\n::',
  },
  {
    id: 'accordion',
    label: 'nuxt-content.snippets.accordion',
    icon: 'i-lucide-chevrons-up-down',
    block: true,
    text: '::accordion\n  :::accordion-item{label="Question" icon="i-lucide-circle-help"}\n  Answer.\n  :::\n::',
  },
  {
    id: 'field-group',
    label: 'nuxt-content.snippets.fieldGroup',
    icon: 'i-lucide-list-tree',
    block: true,
    text: '::field-group\n  :::field{name="name" type="string" required}\n  Text of the field.\n  :::\n::',
  },
  {
    id: 'kbd',
    label: 'nuxt-content.snippets.kbd',
    icon: 'i-lucide-keyboard',
    block: false,
    text: ':kbd{value="Ctrl"}',
  },
  {
    id: 'icon',
    label: 'nuxt-content.snippets.icon',
    icon: 'i-lucide-smile',
    block: false,
    text: ':icon{name="i-lucide-rocket"}',
  },
  {
    id: 'code-file',
    label: 'nuxt-content.snippets.codeFile',
    icon: 'i-lucide-file-code',
    block: true,
    text: '```ts [file.ts]\nconst value = 1\n```',
  },
]
