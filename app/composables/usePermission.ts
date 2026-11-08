import { canAccess, type PermissionContext, type PermissionRequirement } from "../utils/permission";

export function usePermission() {
  const context = useState<PermissionContext | null>("permission-context", () => null);

  return {
    context: readonly(context),
    hasPermission: (requirement: PermissionRequirement) => canAccess(context.value, requirement),
    setPermissionContext: (value: PermissionContext) => { context.value = value; },
    clearPermissionContext: () => { context.value = null; },
  };
}
