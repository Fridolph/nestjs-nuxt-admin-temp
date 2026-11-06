import type { AdminBrandConfig, AdminNavigationItem } from "../types/admin";

export const adminBrand: AdminBrandConfig = {
  name: "Admin Studio",
  mark: "A",
  href: "/",
};

export const adminNavigation: AdminNavigationItem[] = [
  {
    label: "Dashboard",
    icon: "i-lucide-layout-dashboard",
    to: "/",
    exact: true,
  },
  {
    label: "Projects",
    icon: "i-lucide-folder-kanban",
    defaultOpen: true,
    children: [
      { label: "All projects", to: "/projects" },
      { label: "Recently viewed", to: "/projects/recent" },
    ],
  },
  {
    label: "Team",
    icon: "i-lucide-users",
    children: [
      { label: "Users", to: "/team/users" },
      { label: "Members", to: "/team/members" },
      { label: "Roles & access", to: "/team/roles" },
    ],
  },
  {
    label: "Settings",
    icon: "i-lucide-settings-2",
    to: "/settings",
  },
];

export const adminExternalNavigation: AdminNavigationItem[] = [
  { label: "Help center", icon: "i-lucide-circle-help", to: "/help" },
  { label: "Release notes", icon: "i-lucide-megaphone", to: "/release-notes" },
];
