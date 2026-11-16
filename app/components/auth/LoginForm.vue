<script setup lang="ts">
import type { AuthFormField } from "@nuxt/ui";

import { loginSchema, type LoginCredentials } from "../../utils/auth-schema";

interface LoginFormProps {
  pending?: boolean;
  error?: string;
  title?: string;
  submitLabel?: string;
  createAccountTo?: string;
}

withDefaults(defineProps<LoginFormProps>(), {
  pending: false,
  error: "",
  title: "登录账号",
  submitLabel: "登录",
  createAccountTo: "/register",
});

const emit = defineEmits<{
  submit: [credentials: LoginCredentials];
}>();

const fields: AuthFormField[] = [
  {
    name: "username",
    type: "text",
    label: "用户名",
    placeholder: "请输入用户名",
    leadingIcon: "i-lucide-user",
    size: "lg",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "密码",
    placeholder: "请输入密码",
    leadingIcon: "i-lucide-lock-keyhole",
    size: "lg",
    required: true,
  },
];

function handleSubmit(event: { data: LoginCredentials }) {
  emit("submit", event.data);
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="loginSchema"
    :title="title"
    :submit="{ label: submitLabel, size: 'lg', block: true }"
    :loading="pending"
    :ui="{
      root: 'w-full',
      header: 'text-left',
      title: 'text-3xl font-semibold tracking-tight text-highlighted',
      description: 'text-sm text-muted',
      body: 'gap-y-5',
    }"
    @submit="handleSubmit"
  >
    <template #leading>
      <div class="mb-2 space-y-3">
        <div class="inline-flex rounded-lg bg-elevated p-1" role="tablist" aria-label="登录方式">
          <UButton size="sm" color="primary" variant="soft" role="tab" aria-selected="true">用户名</UButton>
          <UTooltip text="邮箱登录后续支持">
            <span tabindex="0"><UButton size="sm" color="neutral" variant="ghost" role="tab" disabled>邮箱</UButton></span>
          </UTooltip>
          <UTooltip text="手机登录后续支持">
            <span tabindex="0"><UButton size="sm" color="neutral" variant="ghost" role="tab" disabled>手机</UButton></span>
          </UTooltip>
        </div>
        <div class="inline-flex items-center gap-2 text-sm font-medium text-muted">
          <span class="text-lg" aria-hidden="true">👋</span><span>欢迎回来</span>
        </div>
      </div>
    </template>

    <template #validation>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="error"
      />
    </template>

    <template #description>使用用户名和密码登录管理后台。</template>

    <template #footer>
      <p class="text-center text-sm text-muted">
        还没有账号？
        <ULink :to="createAccountTo" class="font-medium text-primary hover:underline">
          创建账号
        </ULink>
      </p>
    </template>
  </UAuthForm>
</template>
