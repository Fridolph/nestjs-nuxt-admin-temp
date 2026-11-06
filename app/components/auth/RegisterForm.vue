<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";
import { registerSchema, type RegisterCredentials } from "../../utils/auth-schema";

const emit = defineEmits<{ submit: [credentials: RegisterCredentials] }>();
const fields: AuthFormField[] = [
  { name: "name", type: "text", label: "姓名", placeholder: "如何称呼你", required: true, size: "lg" },
  { name: "email", type: "email", label: "邮箱", placeholder: "you@example.com", required: true, size: "lg" },
  { name: "password", type: "password", label: "密码", placeholder: "至少 8 位", required: true, size: "lg" },
  { name: "confirmPassword", type: "password", label: "确认密码", placeholder: "再次输入密码", required: true, size: "lg" },
];

function handleSubmit(event: FormSubmitEvent<RegisterCredentials>) {
  emit("submit", event.data);
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="registerSchema"
    title="创建账号"
    description="仅作界面演示，不创建或保存账号。"
    :submit="{ label: '注册', size: 'lg', block: true }"
    :ui="{ header: 'text-left', title: 'text-3xl font-semibold tracking-tight text-highlighted' }"
    @submit="handleSubmit"
  >
    <template #footer>
      <p class="text-center text-sm text-muted">
        已有账号？
        <ULink to="/login" class="font-medium text-primary hover:underline">前往登录</ULink>
      </p>
    </template>
  </UAuthForm>
</template>
