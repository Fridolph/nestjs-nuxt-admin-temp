<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";
import { registerSchema, type RegisterCredentials } from "../../utils/auth-schema";

const props = withDefaults(defineProps<{ pending?: boolean; error?: string }>(), { pending: false, error: "" });
const emit = defineEmits<{ submit: [credentials: RegisterCredentials] }>();
const fields: AuthFormField[] = [
  { name: "username", type: "text", label: "用户名", placeholder: "至少 4 个字符", required: true, size: "lg" },
  { name: "nickname", type: "text", label: "昵称（可选）", placeholder: "用于展示的昵称", size: "lg" },
  { name: "password", type: "password", label: "密码", placeholder: "至少 6 位，需组合字符类型", required: true, size: "lg" },
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
    description="注册后会自动登录并进入后台。"
    :submit="{ label: '注册', size: 'lg', block: true }"
    :loading="props.pending"
    :ui="{ header: 'text-left', title: 'text-3xl font-semibold tracking-tight text-highlighted' }"
    @submit="handleSubmit"
  >
    <template #validation>
      <UAlert v-if="props.error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="props.error" />
    </template>
    <template #footer>
      <p class="text-center text-sm text-muted">
        已有账号？
        <ULink to="/login" class="font-medium text-primary hover:underline">前往登录</ULink>
      </p>
    </template>
  </UAuthForm>
</template>
