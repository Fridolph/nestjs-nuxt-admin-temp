<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface UserMenuProps {
  collapsed?: boolean;
}

const props = withDefaults(defineProps<UserMenuProps>(), { collapsed: false });

// 纯界面占位信息，不代表当前存在登录会话。
const user = {
  name: "演示用户",
  email: "admin@example.com",
  initials: "AD",
  avatar: undefined as string | undefined,
};

const items: DropdownMenuItem[][] = [
  [{ type: "label", slot: "user" }],
  [{ label: "Settings", icon: "i-lucide-settings-2", to: "/settings" }],
  [{ label: "登录页面", icon: "i-lucide-log-in", to: "/login" }],
];
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: props.collapsed ? 'right' : 'top', align: 'start' }"
    :ui="{ content: 'min-w-60' }"
  >
    <UButton
      :avatar="
        user.avatar
          ? { src: user.avatar, alt: user.name }
          : { text: user.initials, alt: user.name }
      "
      color="neutral"
      variant="ghost"
      block
      :square="props.collapsed"
      :trailing-icon="props.collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      :ui="{
        base: 'justify-start px-2 py-1.5 data-[state=open]:bg-elevated',
        leadingAvatar: 'size-8',
        trailingIcon: 'text-dimmed',
      }"
    >
      <span v-if="!props.collapsed" class="flex min-w-0 flex-col items-start text-left">
        <span class="w-full truncate text-sm font-medium text-highlighted">{{ user.name }}</span>
        <span class="w-full truncate text-xs text-muted">{{ user.email }}</span>
      </span>
    </UButton>

    <template #user-label>
      <div class="flex items-center gap-2 py-0.5">
        <UAvatar :text="user.initials" :alt="user.name" size="sm" />
        <div class="flex min-w-0 flex-col">
          <span class="truncate text-sm font-semibold text-highlighted">{{ user.name }}</span>
          <span class="truncate text-xs text-muted">{{ user.email }}</span>
        </div>
      </div>
    </template>
  </UDropdownMenu>
</template>
