import { defineStore } from "pinia";

/** 仅保存当前页面的布局状态，不涉及账号或鉴权。 */
export const useAdminStore = defineStore("admin", () => {
  const sidebarOpen = shallowRef(false);
  const sidebarCollapsed = shallowRef(false);

  return { sidebarOpen, sidebarCollapsed };
});
