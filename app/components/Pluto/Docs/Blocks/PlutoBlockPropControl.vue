<script setup lang="ts">
// One setting of a component: a field with the right control for the type of
// the prop (text, long text, switch, number, choice, icon, color, link). A
// prop with an object or a list shows as YAML. An empty value removes the prop,
// so the Markdown stays short.
import type { PlutoBlockPropDefinition } from '../../../../../shared/utils/blocks/types'
import { parse, stringify } from 'yaml'
import { humanizeName } from '../../../../../shared/utils/blocks/registry'

const props = defineProps<{
  /** The name of the prop in the Markdown. */
  name: string
  definition: PlutoBlockPropDefinition
  modelValue: unknown
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** `undefined` removes the prop. */
  'update:modelValue': [value: unknown]
}>()

const { t, tx } = usePlutoI18n()

const DEFAULT = '__default__'
type ChipColor =
  'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
const COLOR_CHIPS: Record<string, ChipColor> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
  neutral: 'neutral',
}

const label = computed(() =>
  props.definition.label ? tx(props.definition.label) : humanizeName(props.name)
)
const description = computed(() =>
  props.definition.description ? tx(props.definition.description) : undefined
)

const isStructured = computed(
  () => typeof props.modelValue === 'object' && props.modelValue !== null
)
const type = computed(() =>
  isStructured.value ? 'yaml' : props.definition.type
)

const text = computed(() =>
  props.modelValue === undefined || props.modelValue === null
    ? ''
    : String(props.modelValue)
)

function setText(value: string | undefined) {
  emit(
    'update:modelValue',
    value === undefined || value === '' ? undefined : value
  )
}

function setBoolean(value: boolean) {
  // Off removes the prop. An explicit `false` in the source stays false.
  emit(
    'update:modelValue',
    value ? true : props.modelValue === false ? false : undefined
  )
}

const numberValue = computed(() => {
  const value =
    typeof props.modelValue === 'number'
      ? props.modelValue
      : Number(props.modelValue)
  return props.modelValue === undefined || Number.isNaN(value)
    ? undefined
    : value
})

const selectItems = computed(() => {
  const items = (props.definition.options ?? []).map((option) => {
    const value = typeof option === 'string' ? option : option.value
    const text = typeof option === 'string' ? option : option.label
    return { value, label: text ? tx(text) : value }
  })
  const current = text.value
  if (current && !items.some((item) => item.value === current)) {
    items.push({ value: current, label: current })
  }
  return [{ value: DEFAULT, label: t('docs.editor.default') }, ...items]
})

const colorItems = computed(() =>
  selectItems.value.map((item) =>
    COLOR_CHIPS[item.value]
      ? { ...item, chip: { color: COLOR_CHIPS[item.value] } }
      : item
  )
)

function setSelect(value: string) {
  emit('update:modelValue', value === DEFAULT ? undefined : value)
}

// YAML for an object or a list. The text applies when the box loses the focus and the YAML is valid.
const yamlDraft = ref(
  isStructured.value ? stringify(props.modelValue).trimEnd() : ''
)
const yamlError = ref<string | null>(null)

watch(
  () => props.modelValue,
  (value) => {
    if (typeof value === 'object' && value !== null) {
      try {
        if (JSON.stringify(parse(yamlDraft.value)) === JSON.stringify(value)) {
          return
        }
      } catch {
        return
      }
      yamlDraft.value = stringify(value).trimEnd()
    }
  }
)

function applyYaml() {
  try {
    const value =
      yamlDraft.value.trim() === '' ? undefined : parse(yamlDraft.value)
    yamlError.value = null
    emit('update:modelValue', value)
  } catch (error) {
    yamlError.value =
      error instanceof Error ? error.message.split('\n')[0]! : String(error)
  }
}

const iconPreview = computed(() =>
  text.value.startsWith('i-') || text.value.includes(':')
    ? text.value
    : undefined
)
</script>

<template>
  <UFormField
    :label="label"
    :description="description"
    :error="yamlError ?? undefined"
    :help="type === 'icon' ? t('docs.editor.iconHelp') : undefined"
    class="w-full"
  >
    <USwitch
      v-if="type === 'boolean'"
      :model-value="modelValue === true || modelValue === 'true'"
      :disabled="disabled"
      :aria-label="label"
      @update:model-value="setBoolean($event)"
    />

    <UInputNumber
      v-else-if="type === 'number'"
      :model-value="numberValue"
      :disabled="disabled"
      class="w-full"
      @update:model-value="emit('update:modelValue', $event ?? undefined)"
    />

    <USelect
      v-else-if="type === 'select'"
      :model-value="text || DEFAULT"
      :items="selectItems"
      :disabled="disabled"
      value-key="value"
      class="w-full"
      @update:model-value="setSelect($event as string)"
    />

    <USelect
      v-else-if="type === 'color'"
      :model-value="text || DEFAULT"
      :items="colorItems"
      :disabled="disabled"
      value-key="value"
      class="w-full"
      @update:model-value="setSelect($event as string)"
    />

    <UTextarea
      v-else-if="type === 'text'"
      :model-value="text"
      :disabled="disabled"
      :rows="2"
      class="w-full"
      autoresize
      @update:model-value="setText($event as string)"
    />

    <UTextarea
      v-else-if="type === 'yaml'"
      v-model="yamlDraft"
      :disabled="disabled"
      :rows="4"
      :ui="{ base: 'font-mono text-xs' }"
      class="w-full"
      spellcheck="false"
      autoresize
      @blur="applyYaml"
    />

    <UInput
      v-else-if="type === 'icon'"
      :model-value="text"
      :disabled="disabled"
      :icon="iconPreview"
      placeholder="i-lucide-rocket"
      spellcheck="false"
      autocomplete="off"
      class="w-full"
      @update:model-value="setText($event as string)"
    />

    <UInput
      v-else-if="type === 'link'"
      :model-value="text"
      :disabled="disabled"
      :placeholder="t('docs.editor.linkPlaceholder')"
      icon="i-lucide-link"
      autocomplete="off"
      class="w-full"
      @update:model-value="setText($event as string)"
    />

    <UInput
      v-else
      :model-value="text"
      :disabled="disabled"
      class="w-full"
      @update:model-value="setText($event as string)"
    />
  </UFormField>
</template>
