<script setup lang="ts">
// The left panel of the editor: the blocks of the page as a list. A header
// with Undo, Redo and Add. The list has the drag handle, the block menu, and
// the blocks inside a container. The mode switch (Visual or Markdown) sits at
// the bottom.
import PlutoBlockModeSwitch from './PlutoBlockModeSwitch.vue'
import PlutoBlockOutlineList from './PlutoBlockOutlineList.vue'

defineProps<{
  mode: 'visual' | 'markdown'
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:mode': [mode: 'visual' | 'markdown']
}>()

const editor = usePlutoBlockEditor()
const { t } = usePlutoI18n()
</script>

<template>
  <div :aria-label="t('nuxt-content.editor.blocks')" class="flex min-h-0 flex-1 flex-col" role="region" data-block-outline data-pluto-block-ui>
    <div class="flex h-12 shrink-0 items-center gap-1 border-b border-default px-3">
      <h2 class="min-w-0 truncate text-sm font-semibold text-highlighted max-lg:hidden">
        {{ t('nuxt-content.editor.blocks') }}
      </h2>
      <div class="ms-auto flex items-center gap-1">
        <UTooltip :text="t('nuxt-content.editor.undo')" :kbds="['meta', 'Z']">
          <UButton
            :disabled="disabled || !editor.canUndo.value"
            :aria-label="t('nuxt-content.editor.undo')"
            icon="i-lucide-undo-2"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="editor.undo()"
          />
        </UTooltip>
        <UTooltip :text="t('nuxt-content.editor.redo')" :kbds="['meta', 'shift', 'Z']">
          <UButton
            :disabled="disabled || !editor.canRedo.value"
            :aria-label="t('nuxt-content.editor.redo')"
            icon="i-lucide-redo-2"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="editor.redo()"
          />
        </UTooltip>
        <UButton
          :label="t('nuxt-content.editor.add')"
          :disabled="disabled"
          :aria-label="t('nuxt-content.editor.addBlock')"
          icon="i-lucide-plus"
          color="primary"
          variant="soft"
          size="xs"
          @click="editor.openPalette()"
        />
        <!-- Hides this panel (desktop). The core toolbar shows the toggle to open it again. -->
        <PlutoViewLeftCollapse />
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-2">
      <PlutoBlockOutlineList v-if="editor.doc.value.blocks.length" :blocks="editor.doc.value.blocks" />
      <UEmpty
        v-else
        :title="t('nuxt-content.editor.emptyTitle')"
        :description="t('nuxt-content.editor.emptyDescription')"
        :actions="[{ label: t('nuxt-content.editor.addBlock'), icon: 'i-lucide-plus', onClick: () => editor.openPalette() }]"
        icon="i-lucide-blocks"
      />
    </div>

    <div class="flex shrink-0 items-center justify-between gap-2 border-t border-default px-3 py-2">
      <PlutoBlockModeSwitch :mode="mode" :disabled="disabled" @update:mode="emit('update:mode', $event)" />
    </div>
  </div>
</template>
