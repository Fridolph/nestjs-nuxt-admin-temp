<template>
  <UApp>
    <!-- 身份在客户端通过 HttpOnly Cookie 恢复，避免 SSR 先输出后台页面后再跳转登录。 -->
    <ClientOnly>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <template #fallback>
        <div class="grid min-h-screen place-items-center" role="status">正在加载…</div>
      </template>
    </ClientOnly>
  </UApp>
</template>
