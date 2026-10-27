import { defineEventHandler } from 'h3'

// Added by the module only when `plutoNuxtContent.render` is `'hybrid'` or `'runtime'`. A route of the
// public API (`/api/pluto/v1/nuxt-content/:type/surround`): the answer is `{ data }`, like core's routes.
export default defineEventHandler(async (event) => ({ data: await plutoRuntimeSurround(event) }))
