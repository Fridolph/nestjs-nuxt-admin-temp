<script setup lang="ts">
import { safeReturnTo } from "../utils/auth-session";
import type { RegisterCredentials } from "../utils/auth-schema";

definePageMeta({ layout: false, title: "注册" });
const toast = useToast();
const route = useRoute();
const { register } = useAuth();
const pending = shallowRef(false);
const error = shallowRef("");
async function handleSubmit(credentials: RegisterCredentials) {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  try {
    const response = await register(credentials);
    toast.add({ title: "注册成功", description: response.msg, color: "success" });
    await navigateTo(safeReturnTo(route.query.redirect), { replace: true });
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "注册失败，请稍后重试";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <AuthSplitLayout image-side="right">
    <AuthRegisterForm :pending="pending" :error="error" @submit="handleSubmit" />
    <UButton to="/" label="浏览后台演示" variant="link" color="neutral" class="mt-4" />
    <template #image-caption>
      <div class="max-w-sm space-y-3">
        <p class="text-sm font-medium uppercase tracking-[0.18em] text-white/70">Admin workspace</p>
        <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">从这里开始，继续你的学习。</h2>
        <p class="text-sm leading-6 text-white/75">Nuxt · Nuxt UI · Pinia · Colada · Tailwind CSS 4</p>
      </div>
    </template>
  </AuthSplitLayout>
</template>
