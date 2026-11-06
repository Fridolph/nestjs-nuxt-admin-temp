<script setup lang="ts">
import type { LoginCredentials } from "../utils/auth-schema";

definePageMeta({ layout: false, title: "登录" });
const toast = useToast();
function handleSubmit(_credentials: LoginCredentials) {
  toast.add({ title: "表单校验通过", description: "当前仅演示界面，未发起登录请求。", color: "info" });
}
</script>

<template>
  <AuthSplitLayout image-side="right">
    <template #brand>
      <NuxtLink to="/" class="inline-flex items-center gap-3 text-highlighted">
        <span
          class="grid size-10 place-items-center rounded-2xl bg-primary text-base font-bold text-inverted shadow-sm"
          >A</span
        >
        <span class="text-lg font-semibold tracking-tight">Admin Studio</span>
      </NuxtLink>
    </template>

    <AuthLoginForm @submit="handleSubmit" />
    <UButton to="/" label="浏览后台演示" variant="link" color="neutral" class="mt-4" />

    <template #image-caption>
      <div class="max-w-sm space-y-3">
        <p class="text-sm font-medium uppercase tracking-[0.18em] text-white/70">Admin workspace</p>
        <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
          A calm place to run the work.
        </h2>
        <p class="text-sm leading-6 text-white/75">
          Nuxt · Nuxt UI · Pinia · Colada · Tailwind CSS 4
        </p>
      </div>
    </template>
  </AuthSplitLayout>
</template>
