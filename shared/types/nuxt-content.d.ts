import type { PlutoNuxtContentOptions, PlutoNuxtContentTypeOptions } from '../../modules/pluto-nuxt-content/options'

// The `pluto-nuxt-content` module fills the public key. See modules/pluto-nuxt-content/index.ts.
declare module '@nuxt/schema' {
  interface NuxtConfig {
    plutoNuxtContent?: PlutoNuxtContentOptions
  }
  interface NuxtOptions {
    plutoNuxtContent?: PlutoNuxtContentOptions
  }
  interface PublicRuntimeConfig {
    plutoNuxtContent?: {
      types: PlutoNuxtContentTypeOptions[]
    }
  }
}

export {}
