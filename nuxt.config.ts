// Point PLUTO_PLUTO_PATH at a local checkout (e.g. `../pluto`) to test
// unpublished changes; unset, it resolves to the published npm package.
const plutoLayer = process.env.PLUTO_PLUTO_PATH || '@plutocms/pluto'

export default defineNuxtConfig({
  extends: [plutoLayer],

  modules: ['@nuxt/content'],

  $meta: {
    name: 'nuxt-content',
  },

  // Nuxt Content stores its data in SQLite. The native connector needs Node 22.5
  // or newer and no extra package. An app can set another connector.
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },

  // No `css` entry: the app owns the one Tailwind build, and Nuxt UI scans
  // this layer's app/ dir. The tokens of this layer are in
  // app/assets/css/pluto-layer.css. See the single-tailwind-build skill in pluto.

  // The pages are Markdown files, so the fixed blog post type is off. A docs
  // edit must redeploy the site, so the commit message has no `[skip ci]`
  // marker by default. An app can change both. The other `plutoCms` options
  // have defaults in core (see the github-cms skill in pluto).
  plutoCms: {
    postType: false,
    commit: {
      skipDeploy: false,
    },
  },
})
