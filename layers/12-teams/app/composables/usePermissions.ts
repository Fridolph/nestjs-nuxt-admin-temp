import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import type { ApiError } from '~/utils/api-error'
import { canAccess, type PermissionRequirement } from '~/utils/permission'
import type {
  CreatePermissionInput,
  EffectivePermissionsResponse,
  PermissionMutationResult,
  PermissionsResponse,
  UpdatePermissionInput,
} from '../types/permission'

/**
 * 权限页面的两类数据：当前用户授权快照 + 权限目录。
 *
 * @remarks
 * `/permissions/me` 是授权判断的入口，身份由当前 JWT 确定；当前用户 ID 进入
 * Colada key，避免切换登录用户后复用上一个用户的权限缓存。
 * `/permissions` 返回按资源分组的目录，只负责目录展示，不能把目录记录当成当前用户已经拥有的权限。
 */
export function usePermissions() {
  const api = useNuxtApp().$api
  const queryCache = useQueryCache()
  const toast = useToast()
  const auth = useAuth()
  const permission = usePermission()
  const userId = computed(() => auth.currentUser.value?.userId ?? null)
  const token = useNuxtApp().$authToken

  const effective = useQuery<EffectivePermissionsResponse, ApiError>({
    key: () => ['permissions', 'me', userId.value ?? 'anonymous'],
    query: ({ signal }) => api<EffectivePermissionsResponse>('/permissions/me', { signal }),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    enabled: () => import.meta.client && !!token.value,
  })

  const effectivePermissions = computed(() => effective.error.value || userId.value === null
    ? []
    : effective.data.value?.data ?? [])
  const permissionCodes = computed(() => effectivePermissions.value.map(item => item.code))

  // 只信任 /me 返回的授权码；JWT 中的角色用于标识身份，不替代服务端有效权限。
  // 切换用户或请求失败时同步清空上下文，避免沿用前一位用户的页面权限。
  watch(
    [userId, effective.data, effective.error],
    ([id, response, error]) => {
      permission.setPermissionContext({
        roleId: null,
        permissions: id !== null && !error ? (response?.data.map(item => item.code) ?? []) : [],
      })
    },
    { immediate: true }
  )

  const hasPermission = (requirement: PermissionRequirement) => canAccess(
    {
      roleId: null,
      permissions: effective.error.value ? [] : permissionCodes.value,
    },
    requirement
  )

  const directory = useQuery<PermissionsResponse, ApiError>({
    // 目录接口同样受当前用户权限保护，按用户隔离缓存，避免切换账号后复用旧目录。
    key: () => ['permissions', 'directory', 'grouped', userId.value ?? 'anonymous'],
    query: ({ signal }) => api<PermissionsResponse>('/permissions', { signal }),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    // 等 /me 确认超管后再请求目录；普通用户不会发起受保护的 GET /permissions。
    enabled: () => import.meta.client && !!token.value && effectivePermissions.value.some(item => item.code === 'all:manage'),
  })

  const canManageDirectory = computed(() => effectivePermissions.value.some(item => item.code === 'all:manage'))

  async function invalidateDirectory() {
    try {
      await queryCache.invalidateQueries({ key: ['permissions', 'directory'] })
    } catch {
      toast.add({ title: '操作已成功，但权限目录刷新失败，请手动刷新', color: 'warning' })
    }
  }

  const createPermission = useMutation<PermissionMutationResult, CreatePermissionInput, ApiError>({
    mutation: input => api<PermissionMutationResult>('/permissions', { method: 'POST', body: input }),
    async onSuccess() {
      toast.add({ title: '权限创建成功', color: 'success' })
      await invalidateDirectory()
    },
    onError(error) {
      toast.add({ title: '创建权限失败', description: error.message, color: 'error' })
    },
  })

  const updatePermission = useMutation<PermissionMutationResult, { id: number; data: UpdatePermissionInput }, ApiError>({
    mutation: ({ id, data }) => api<PermissionMutationResult>(`/permissions/${id}`, { method: 'PATCH', body: data }),
    async onSuccess() {
      toast.add({ title: '权限已更新', color: 'success' })
      await invalidateDirectory()
    },
    onError(error) {
      toast.add({ title: '更新权限失败', description: error.message, color: 'error' })
    },
  })

  const deletePermission = useMutation<PermissionMutationResult, number, ApiError>({
    mutation: id => api<PermissionMutationResult>(`/permissions/${id}`, { method: 'DELETE' }),
    async onSuccess() {
      toast.add({ title: '权限已删除', color: 'success' })
      await invalidateDirectory()
    },
    onError(error) {
      toast.add({ title: '删除权限失败', description: error.message, color: 'error' })
    },
  })

  return {
    permissions: computed(() => directory.data.value?.data ?? []),
    effectivePermissions,
    canManageDirectory,
    accessDenied: computed(() => effective.status.value === 'success' && !canManageDirectory.value),
    effectiveError: effective.error,
    directoryError: directory.error,
    error: computed(() => effective.error.value ?? directory.error.value ?? null),
    loading: computed(() => effective.asyncStatus.value === 'loading' || (canManageDirectory.value && directory.asyncStatus.value === 'loading')),
    isInitialLoading: computed(() => effective.status.value === 'pending' || (canManageDirectory.value && directory.status.value === 'pending')),
    refetch: async () => {
      // 手动刷新先核对当前有效授权；角色被撤销后不再强制访问受保护的目录。
      await effective.refetch()
      if (canManageDirectory.value) await directory.refetch()
    },
    hasPermission,
    createPermission,
    updatePermission,
    deletePermission,
    saving: computed(() => createPermission.isLoading.value || updatePermission.isLoading.value),
    saveError: computed(() => createPermission.error.value?.message ?? updatePermission.error.value?.message ?? null),
    deleting: deletePermission.isLoading,
  }
}
