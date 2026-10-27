import type { PlutoNuxtContentTypeOptions } from '../../modules/pluto-nuxt-content/options'

// Registers the content types of the layer with the core content registry. The
// CMS Nitro plugin registers the adapter. The types are looked up per request,
// so the order of the two plugins does not matter. When the layer is off (the
// CMS is off), the module sets no config and this plugin does nothing.
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig().public.plutoNuxtContent as {
    types: PlutoNuxtContentTypeOptions[]
    render?: string
  } | undefined
  if (!config) {
    return
  }
  for (const entry of config.types) {
    registerContentType(createDocsType({ ...entry, liveOnSave: config.render === 'hybrid' || config.render === 'runtime' }))
  }
})
