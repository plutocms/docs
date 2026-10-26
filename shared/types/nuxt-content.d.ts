import type { PlutoNuxtContentOptions, PlutoNuxtContentTypeOptions } from '../../modules/pluto-nuxt-content/options'
import type { PlutoBlocksConfig } from '../utils/blocks/types'

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
  // A site declares its blocks in app.config.ts. See shared/utils/blocks/registry.ts.
  interface AppConfigInput {
    plutoBlocks?: PlutoBlocksConfig
  }
  interface AppConfig {
    plutoBlocks?: PlutoBlocksConfig
  }
}

export {}
