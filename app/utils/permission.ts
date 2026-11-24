export const roleIdByCode = {
  super_admin: 1,
  admin: 2,
  user: 3,
  premium: 4,
  guest: 5,
} as const;

export interface PermissionContext {
  roleId: number | null;
  permissions: readonly string[];
}

export type PermissionRequirement = string | readonly string[] | {
  all?: readonly string[];
  any?: readonly string[];
};

function isPermissionList(requirement: PermissionRequirement): requirement is readonly string[] {
  return Array.isArray(requirement);
}

export function canAccess(context: PermissionContext | null, requirement: PermissionRequirement): boolean {
  if (!context) return false;

  const required = typeof requirement === "string"
    ? [requirement]
    : isPermissionList(requirement) ? requirement : [...(requirement.all ?? []), ...(requirement.any ?? [])];
  if (required.length === 0 || required.some(permission => !permission.trim())) return false;
  if (context.roleId === roleIdByCode.super_admin) return true;

  const granted = new Set(context.permissions);
  // /permissions/me 对超管返回 all:manage，作为有效权限快照中的通配授权。
  const matches = (permission: string) => granted.has("all:manage") || granted.has(permission);
  if (typeof requirement === "string") return matches(requirement);
  if (isPermissionList(requirement)) return requirement.every(matches);
  return (requirement.all ?? []).every(matches)
    && (!requirement.any?.length || requirement.any.some(matches));
}
