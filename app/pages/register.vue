<script setup lang="ts">
import type { RegisterCredentials } from "../utils/auth-schema";

definePageMeta({ layout: false, title: "注册" });
const toast = useToast();
function handleSubmit(_credentials: RegisterCredentials) {
  toast.add({ title: "表单校验通过", description: "当前仅演示界面，未创建或保存账号。", color: "info" });
}
</script>

<template>
  <AuthSplitLayout image-side="right">
    <AuthRegisterForm @submit="handleSubmit" />
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
