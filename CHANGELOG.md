# Changelog

## [0.7.0](https://github.com/plutocms/nuxt-content/compare/v0.6.0...v0.7.0) (2026-10-27)


### ⚠ BREAKING CHANGES

* the default render mode is now 'hybrid'. Content pages must not be prerendered in hybrid or runtime mode. Set `render: 'build'` to keep a fully static site. Needs @plutocms/pluto with `markPublicRead` and `readFile`.

### Features

* render the pages in hybrid mode by default, with build and runtime modes ([#24](https://github.com/plutocms/nuxt-content/issues/24)) ([44efefe](https://github.com/plutocms/nuxt-content/commit/44efefec130c9a48744ec79eba0f454399f5560b))

## [0.6.0](https://github.com/plutocms/nuxt-content/compare/v0.5.0...v0.6.0) (2026-10-27)


### Features

* use the admin bar buttons of core, and shorten the README ([#22](https://github.com/plutocms/nuxt-content/issues/22)) ([568f54b](https://github.com/plutocms/nuxt-content/commit/568f54b3f0a73e0346c44f2aec44e6c34c0320fe))

## [0.5.0](https://github.com/plutocms/nuxt-content/compare/v0.4.1...v0.5.0) (2026-10-26)


### Features

* **deps:** use @plutocms/pluto 0.24 ([#20](https://github.com/plutocms/nuxt-content/issues/20)) ([acb7195](https://github.com/plutocms/nuxt-content/commit/acb71955bdf7f2fb18d545e6281aaef50cc9fc23))

## [0.4.1](https://github.com/plutocms/nuxt-content/compare/v0.4.0...v0.4.1) (2026-10-26)


### Bug Fixes

* **editor:** type the editor for the sites that type-check the layer ([#18](https://github.com/plutocms/nuxt-content/issues/18)) ([c7b08bb](https://github.com/plutocms/nuxt-content/commit/c7b08bbb92e7417487303d599ba42820c0d07059))

## [0.4.0](https://github.com/plutocms/nuxt-content/compare/v0.3.2...v0.4.0) (2026-10-26)


### Features

* add the visual block editor and a hybrid Markdown mode ([#16](https://github.com/plutocms/nuxt-content/issues/16)) ([22c8c5e](https://github.com/plutocms/nuxt-content/commit/22c8c5e7f7f745ced4ef01d85160b08aa5749d7a))

## [0.3.2](https://github.com/plutocms/nuxt-content/compare/v0.3.1...v0.3.2) (2026-10-25)


### Bug Fixes

* **i18n:** use the nuxt-content namespace, so core translates the labels ([#14](https://github.com/plutocms/nuxt-content/issues/14)) ([4c44e3c](https://github.com/plutocms/nuxt-content/commit/4c44e3ce43d8a7d47e9ce0cd20477c41a676ba39))

## [0.3.1](https://github.com/plutocms/nuxt-content/compare/v0.3.0...v0.3.1) (2026-10-25)


### Bug Fixes

* **i18n:** translate the doc type in the admin ([#12](https://github.com/plutocms/nuxt-content/issues/12)) ([2ff7034](https://github.com/plutocms/nuxt-content/commit/2ff70343257ecf912be2e39a94a73a80a9c8aeee))

## [0.3.0](https://github.com/plutocms/nuxt-content/compare/v0.2.0...v0.3.0) (2026-10-25)


### Features

* add New Page and Edit Page to the admin bar ([#9](https://github.com/plutocms/nuxt-content/issues/9)) ([c5fe6ad](https://github.com/plutocms/nuxt-content/commit/c5fe6ad5ebc4a868aacfe8013647b325fc3898a7))

## [0.2.0](https://github.com/plutocms/nuxt-content/compare/v0.1.0...v0.2.0) (2026-10-25)


### Features

* **deps:** use @plutocms/pluto 0.20 and default to no post type ([#6](https://github.com/plutocms/nuxt-content/issues/6)) ([b4fb0f0](https://github.com/plutocms/nuxt-content/commit/b4fb0f044da3411162047503e9ac8ab23df48001))

## 0.1.0 (2026-10-25)


### Features

* add the Nuxt Content layer with a docs preset ([90db635](https://github.com/plutocms/nuxt-content/commit/90db63534eead5ed108d01304eae3092072a44dc))


### Miscellaneous Chores

* start the release line at 0.1.0 ([36cfc78](https://github.com/plutocms/nuxt-content/commit/36cfc7892ae904e2bc7014da643c1fd3e5b18d1a))
