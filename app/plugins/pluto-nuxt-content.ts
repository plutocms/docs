import type { PlutoNuxtContentTypeOptions } from '../../modules/pluto-nuxt-content/options'
import { defineAsyncComponent } from 'vue'

// The field widget loads on demand and stays out of the entry chunk. Core shows a
// skeleton while the field chunk loads.
const PlutoFieldMdc = defineAsyncComponent(
  () => import('../components/Pluto/NuxtContent/PlutoFieldMdc.vue')
)

// Registers the types, the capabilities and the `mdc` field widget. The types set
// `adminBar`, so core shows "New page" and "Edit page" in the admin bar. The module
// sets the config only when the CMS is on. Without it, the layer adds nothing to the admin.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.plutoNuxtContent as unknown as {
    types: PlutoNuxtContentTypeOptions[]
    render?: string
  } | undefined
  if (!config) {
    return
  }

  const types = config.types.map((entry) => createDocsType({ ...entry, liveOnSave: config.render === 'hybrid' || config.render === 'runtime' }))

  definePlutoExtension({
    id: 'nuxt-content',
    contentTypes: types.map((type) => ({ id: type.name, type })),
    capabilities: [
      { id: 'docs-write', key: DOCS_CAPABILITIES.write, label: 'nuxt-content.capabilities.write' },
      { id: 'docs-delete', key: DOCS_CAPABILITIES.delete, label: 'nuxt-content.capabilities.delete' },
    ],
    contentFieldWidgets: [
      { id: 'mdc', widget: 'mdc', component: PlutoFieldMdc },
    ],
  })
})
