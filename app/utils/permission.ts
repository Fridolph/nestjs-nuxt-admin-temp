export const roleIds = {
  superAdmin: 1,
  admin: 2,
  user: 3,
  advancedUser: 4,
  guest: 5,
} as const;

export interface PermissionContext {
  roleIds: readonly number[];
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
  if (context.roleIds.includes(roleIds.superAdmin)) return true;

  const granted = new Set(context.permissions);
  if (typeof requirement === "string") return granted.has(requirement);
  if (isPermissionList(requirement)) return requirement.every(permission => granted.has(permission));
  return (requirement.all ?? []).every(permission => granted.has(permission))
    && (!requirement.any?.length || requirement.any.some(permission => granted.has(permission)));
}
