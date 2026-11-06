<script setup lang="ts">
definePageMeta({ layout: "docs", title: "迁移记录" });
</script>

<template>
  <article class="mx-auto max-w-3xl space-y-6">
    <h1 class="text-3xl font-semibold text-highlighted">迁移记录</h1>
    <p class="text-muted">2026-10-30 · 从 dao-monorepo-temp 的 apps/admin 迁移基础界面。</p>
    <ul class="list-disc space-y-3 pl-5 text-muted">
      <li>复用侧栏布局、顶部栏、用户菜单、认证分栏布局与登录表单。</li>
      <li>保留 Dashboard、Projects、Team、Settings、Help 基础路由和 Layers 组织。</li>
      <li>补充注册界面、表单校验、移动端导航入口。</li>
      <li>使用 Nuxt 4.6.3、Nuxt UI、Tailwind CSS 4，接入 Pinia 和 Colada。</li>
    </ul>
    <UAlert color="info" title="当前为界面骨架" description="登录注册不调用接口、不保存账号或登录状态；业务页面保留示例内容。" />
  </article>
</template>
