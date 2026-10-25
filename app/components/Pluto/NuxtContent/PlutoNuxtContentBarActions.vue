<script setup lang="ts">
// The admin bar actions of the layer, for a user with `docs:write`:
// - "New <type>" for each content type, on every page where the bar shows.
// - "Edit <type>" on a public page that called `usePlutoContentEditLink`. The
//   admin form has its own "View page", so it does not show on /admin.
// Each button is an <li>, because the bar actions sit in a <ul>.
const route = useRoute()
const { can } = usePlutoPermissions()
const { t } = usePlutoI18n()
const texts = usePlutoContentTexts()
const current = usePlutoContentCurrentPage()

// The types of this layer. The plugin registers this component only when the
// config is set.
const config = useRuntimeConfig().public.plutoNuxtContent as { types: { name: string }[] } | undefined
const types = computed(() => config?.types.map((entry) => entry.name) ?? [])

const canWrite = computed(() => can(DOCS_CAPABILITIES.write))
const onAdmin = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))

const editPath = computed(() => {
  const page = current.value
  if (onAdmin.value || !page || !types.value.includes(page.type)) {
    return null
  }
  return contentEditPath(page.type, page.id)
})

// "Edit Page", with the core phrase, like "New Page".
const editLabel = computed(() => current.value ? t('pluto.content.edit', { label: texts(current.value.type).label }) : '')
</script>

<template>
  <template v-if="canWrite">
    <PlutoNavbarButton
      v-for="type in types"
      :key="type"
      :label="texts(type).newLabel"
      icon="i-lucide-plus"
      :to="contentNewPath(type)"
    />
    <PlutoNavbarButton
      v-if="editPath"
      :label="editLabel"
      icon="i-lucide-pencil"
      :to="editPath"
    />
  </template>
</template>
