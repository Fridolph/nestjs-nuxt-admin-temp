export default defineNuxtConfig({
  compatibilityDate: "2026-10-30",
  modules: ["@nuxt/ui", "@pinia/nuxt", "@pinia/colada-nuxt", "@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  devServer: { host: "127.0.0.1", port: 3050 },
  runtimeConfig: {
    public: { apiBase: "http://localhost:3000/api/v1" },
  },
  // 使用系统字体，开发和构建不依赖远程字体服务。
  ui: { fonts: false },
  icon: { clientBundle: { scan: true } },
  typescript: { strict: true },
  app: { head: { title: "Admin Studio", htmlAttrs: { lang: "zh-CN" } } },
});
