<script setup lang="ts">
import type { AdminBreadcrumb } from "../../types/admin";

withDefaults(
  defineProps<{
    title: string;
    breadcrumbs?: AdminBreadcrumb[];
    showSearch?: boolean;
  }>(),
  {
    breadcrumbs: () => [],
    showSearch: false,
  },
);
</script>

<template>
  <UDashboardNavbar
    :ui="{
      root: 'sticky top-0 z-20 min-h-16 border-b border-default bg-default/90 py-3 backdrop-blur px-2 md:px-4',
      left: 'min-w-0 gap-3',
      title: 'min-w-0',
      right: 'gap-2',
    }"
  >
    <template #toggle>
      <UDashboardSidebarToggle aria-label="打开导航菜单" />
    </template>

    <template #left>
      <div class="min-w-0">
        <UBreadcrumb
          v-if="breadcrumbs.length"
          :items="breadcrumbs"
          class="mb-0.5 hidden sm:flex"
          :ui="{ list: 'gap-1.5', link: 'text-xs text-muted' }"
        />
        <h1 class="truncate text-lg font-semibold tracking-tight text-highlighted sm:text-xl">
          {{ title }}
        </h1>
      </div>
    </template>

    <template #default>
      <slot name="center">
        <UInput
          v-if="showSearch"
          icon="i-lucide-search"
          placeholder="Search"
          class="hidden w-48 md:block lg:w-64"
        />
      </slot>
    </template>

    <template #right>
      <slot name="actions" />
      <UColorModeButton />
      <slot name="profile">
        <UAvatar text="AD" size="sm" alt="Admin user" />
      </slot>
    </template>
  </UDashboardNavbar>
</template>
