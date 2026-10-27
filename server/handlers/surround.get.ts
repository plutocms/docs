import { defineEventHandler } from 'h3'

// Added by the module only when `plutoNuxtContent.render` is `'hybrid'` or `'runtime'`.
export default defineEventHandler((event) => plutoRuntimeSurround(event))
