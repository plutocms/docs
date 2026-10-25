import type { PlutoNuxtContentTypeOptions } from '../../modules/pluto-nuxt-content/options'
import { defineAsyncComponent } from 'vue'

// The field widget and the bar actions load on demand and stay out of the entry
// chunk. Core shows a skeleton while the field chunk loads.
const PlutoFieldMdc = defineAsyncComponent(
  () => import('../components/Pluto/NuxtContent/PlutoFieldMdc.vue')
)
const PlutoNuxtContentBarActions = defineAsyncComponent(
  () => import('../components/Pluto/NuxtContent/PlutoNuxtContentBarActions.vue')
)

// Registers the types, the capabilities, the `mdc` field widget, the "View
// page" action, and the admin bar actions ("New page", "Edit page"). The module sets the config only when the CMS is on. Without it,
// the layer adds nothing to the admin.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.plutoNuxtContent as {
    types: PlutoNuxtContentTypeOptions[]
  } | undefined
  if (!config) {
    return
  }

  const types = config.types.map((entry) => createDocsType(entry))
  const prefixes = new Map(config.types.map((entry) => [entry.name, entry.routePrefix ?? '']))

  definePlutoExtension({
    id: 'nuxt-content',
    contentTypes: types.map((type) => ({ id: type.name, type })),
    capabilities: [
      { id: 'docs-write', key: DOCS_CAPABILITIES.write, label: 'nuxtContent.capabilities.write' },
      { id: 'docs-delete', key: DOCS_CAPABILITIES.delete, label: 'nuxtContent.capabilities.delete' },
    ],
    navbarActions: [
      { id: 'bar-actions', component: PlutoNuxtContentBarActions },
    ],
    contentFieldWidgets: [
      { id: 'mdc', widget: 'mdc', component: PlutoFieldMdc },
    ],
    contentActions: types.map((type) => ({
      id: `view-page-${type.name}`,
      contentType: type.name,
      label: 'nuxtContent.actions.viewPage',
      icon: 'i-lucide-external-link',
      color: 'neutral',
      variant: 'outline',
      // A new page has no public route yet.
      show: (ctx) => ctx.editing,
      onSelect: async (ctx) => {
        const path = contentRoutePath(String(ctx.item.id), prefixes.get(type.name) ?? '')
        await navigateTo(path, { external: true, open: { target: '_blank' } })
      },
    })),
  })
})
