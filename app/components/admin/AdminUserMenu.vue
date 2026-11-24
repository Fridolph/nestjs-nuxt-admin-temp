<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface UserMenuProps {
  collapsed?: boolean;
}

const props = withDefaults(defineProps<UserMenuProps>(), { collapsed: false });

const { currentUser, signOut, signingOut } = useAuth();
const toast = useToast();
const user = computed(() => ({
  name: currentUser.value?.username ?? "未登录",
  email: currentUser.value ? `用户 ID · ${currentUser.value.userId}` : "请登录",
  initials: currentUser.value?.username.slice(0, 2).toUpperCase() ?? "?",
  avatar: undefined as string | undefined,
}));
const items = computed<DropdownMenuItem[][]>(() => [
  [{ type: "label", slot: "user" }],
  [{ label: "系统设置", icon: "i-lucide-settings-2", to: "/settings" }],
  [{ label: signingOut.value ? "正在退出…" : "退出登录", icon: "i-lucide-log-out", disabled: signingOut.value, onSelect: async () => {
    try { await signOut(); }
    catch (cause) { toast.add({ title: "退出失败，请重试", description: cause instanceof Error ? cause.message : "无法连接服务器", color: "error" }); }
  } }],
]);
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
