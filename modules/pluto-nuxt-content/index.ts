import type { PlutoNuxtContentOptions } from './options'
import { defineNuxtModule, useLogger } from '@nuxt/kit'
import { resolvePlutoNuxtContentOptions } from './options'

export type { PlutoNuxtContentOptions, PlutoNuxtContentTypeOptions } from './options'

/**
 * Registers the content types of the Nuxt Content layer. It is OFF when the
 * app turns the standalone CMS off (`plutoCms.enabled: false`). The default
 * `'auto'` and `true` both count as on. The module only checks the options
 * and copies them to the public runtime config. The client plugin
 * (`app/plugins/pluto-nuxt-content.ts`) and the Nitro plugin
 * (`server/plugins/pluto-nuxt-content.ts`) of the layer build the types from
 * that config. See the nuxt-content-setup skill.
 */
export default defineNuxtModule<PlutoNuxtContentOptions>({
  meta: { name: 'pluto-nuxt-content', configKey: 'plutoNuxtContent' },
  defaults: { types: [] },
  setup(options, nuxt) {
    const logger = useLogger('pluto-nuxt-content')
    const cms = (nuxt.options as { plutoCms?: { enabled?: boolean | 'auto' } }).plutoCms

    const { enabled, types, errors } = resolvePlutoNuxtContentOptions(options, {
      cmsEnabled: cms?.enabled !== false,
    })

    for (const error of errors) {
      logger.error(error)
    }
    if (!enabled) {
      return
    }

    // The plugins read this key. It is absent when the layer is off.
    nuxt.options.runtimeConfig.public.plutoNuxtContent = { types }

    if (!nuxt.options._prepare) {
      logger.info(`Nuxt Content layer on. Types: ${types.map((type) => type.name).join(', ') || 'none'}.`)
    }
  },
})
