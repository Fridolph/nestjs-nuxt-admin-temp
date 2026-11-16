<script setup lang="ts">
import type { Component } from "vue";

type ConfirmModalType = "default" | "delete" | "error" | "warn" | "info";

const props = withDefaults(defineProps<{
  type?: ConfirmModalType;
  title: string;
  description: string;
  pending: boolean;
  error?: string | null;
  bodyComponent?: Component | null;
  bodyProps?: Record<string, unknown> | null;
}>(), { type: "default", error: null, bodyComponent: null, bodyProps: null });

const appearance = computed(() => ({
  default: { icon: null, color: "neutral", iconClass: "text-default" },
  delete: { icon: "i-ri-delete-bin-2-line", color: "error", iconClass: "text-error" },
  error: { icon: "i-ri-close-circle-line", color: "error", iconClass: "text-error" },
  warn: { icon: "i-ri-error-warning-line", color: "warning", iconClass: "text-warning" },
  info: { icon: "i-ri-information-line", color: "info", iconClass: "text-info" },
} as const)[props.type]);

const emit = defineEmits<{ confirm: []; close: [confirmed: boolean] }>();
const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :dismissible="!pending"
    :close="!pending"
    :ui="{ footer: 'justify-end' }"
    @update:open="(value) => { if (!value) emit('close', false) }"
  >
    <template #title>
      <span class="inline-flex items-center gap-2">
        <span v-if="$slots.icon || appearance.icon" class="inline-flex shrink-0" :class="appearance.iconClass">
          <slot name="icon">
            <UIcon v-if="appearance.icon" :name="appearance.icon" class="size-5" aria-hidden="true" />
          </slot>
        </span>
        <span>{{ title }}</span>
      </span>
    </template>
    <template #body>
      <p v-if="description" class="text-base leading-6 text-muted">
        {{ description }}
      </p>
      <UAlert v-if="error" color="error" variant="soft" :title="type === 'delete' ? '删除失败' : '操作失败'" :description="error" />
      <component :is="bodyComponent" v-else-if="bodyComponent" v-bind="bodyProps ?? undefined" />
      <slot v-else name="body" />
    </template>
    <template #footer>
      <UButton label="取消" color="neutral" variant="outline" :disabled="pending" @click="open = false" />
      <UButton :label="type === 'delete' ? '确认删除' : '确认'" :color="appearance.color" :loading="pending" :disabled="pending" @click="emit('confirm')" />
    </template>
  </UModal>
</template>
