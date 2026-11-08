<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  closable?: boolean;
}>(), { closable: true, description: undefined });
const open = defineModel<boolean>("open", { required: true });
const attrs = useAttrs();
const baseUi = {
  content: "w-screen max-w-[600px]",
  container: "!h-full !min-h-0 !overflow-hidden !gap-0 !p-0",
  header: "sticky top-0 z-10 shrink-0 border-b border-default bg-default p-4",
  body: "min-h-0 overflow-y-auto p-4",
  footer: "sticky bottom-0 z-10 shrink-0 border-t border-default bg-default p-4",
};
const drawerUi = computed(() => {
  const customUi = attrs.ui;
  if (!customUi || typeof customUi !== "object") return baseUi;

  const ui = customUi as Record<string, unknown>;
  return {
    ...ui,
    content: [baseUi.content, typeof ui.content === "string" ? ui.content : ""].filter(Boolean).join(" "),
    container: [baseUi.container, typeof ui.container === "string" ? ui.container : ""].filter(Boolean).join(" "),
    header: [baseUi.header, typeof ui.header === "string" ? ui.header : ""].filter(Boolean).join(" "),
    body: [baseUi.body, typeof ui.body === "string" ? ui.body : ""].filter(Boolean).join(" "),
    footer: [baseUi.footer, typeof ui.footer === "string" ? ui.footer : ""].filter(Boolean).join(" "),
  };
});
</script>

<template>
  <UDrawer
    v-model:open="open"
    v-bind="attrs"
    direction="right"
    :title="props.title"
    :description="props.description"
    :close="props.closable"
    :handle="false"
    :dismissible="props.closable"
    :ui="drawerUi"
  >
    <template v-if="$slots.header" #header>
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <slot name="header" />
        </div>
        <UButton
          v-if="props.closable"
          icon="i-lucide-x"
          aria-label="Close"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="open = false"
        />
      </div>
    </template>
    <template #body>
      <slot />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UDrawer>
</template>
