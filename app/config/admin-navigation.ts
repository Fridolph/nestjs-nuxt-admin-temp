import type { AdminBrandConfig, AdminNavigationItem } from "../types/admin";

export const adminBrand: AdminBrandConfig = {
  name: "Admin Studio",
  mark: "A",
  href: "/",
};

export const adminNavigation: AdminNavigationItem[] = [
  {
    label: "仪表盘",
    icon: "i-lucide-layout-dashboard",
    to: "/",
    exact: true,
  },
  {
    label: "项目管理",
    icon: "i-lucide-folder-kanban",
    defaultOpen: true,
    children: [
      { label: "全部项目", to: "/projects" },
      { label: "最近查看", to: "/projects/recent" },
    ],
  },
  {
    label: "用户管理",
    icon: "i-lucide-users",
    to: "/users",
  },
  {
    label: "角色管理",
    icon: "i-lucide-shield-user",
    to: "/roles",
  },
  {
    label: "权限管理",
    icon: "i-lucide-key-round",
    to: "/permissions",
  },
  {
    label: "系统设置",
    icon: "i-lucide-settings-2",
    to: "/settings",
  },
];

export const adminExternalNavigation: AdminNavigationItem[] = [
  { label: "Help center", icon: "i-lucide-circle-help", to: "/help" },
  { label: "Release notes", icon: "i-lucide-megaphone", to: "/release-notes" },
];
