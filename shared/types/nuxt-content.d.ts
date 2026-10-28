import type {
  PlutoNuxtContentOptions,
  PlutoNuxtContentRender,
  PlutoNuxtContentTypeOptions,
} from '../../modules/pluto-nuxt-content/options'
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
      /** `'hybrid'`, `'build'` or `'runtime'`. The composables read it. */
      render: PlutoNuxtContentRender
      /** Seconds of the public cache of the layer routes. */
      runtimeMaxAge: number
    }
  }
  interface RuntimeConfig {
    plutoNuxtContent?: {
      /** The `toc` option of `content.build.markdown`, for the run-time parser. */
      toc?: { depth?: number; searchDepth?: number }
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
