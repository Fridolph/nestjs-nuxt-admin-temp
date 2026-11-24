import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import type { ApiError } from '~/utils/api-error'
import type {
	CreateRoleInput,
	RoleMutationResult,
	RolesResponse,
	UpdateRoleInput,
} from '../types/role'

/** 角色资源的查询、写操作和缓存失效统一入口。 */
export function useRoles() {
	const $api = useNuxtApp().$api
	const queryCache = useQueryCache()
	const { currentUser } = useAuth()
	const toast = useToast()
	const roleList = useQuery<RolesResponse, ApiError>({
		key: () => ['roles', currentUser.value?.userId ?? 'anonymous'],
		query: ({ signal }) => $api<RolesResponse>('/roles', { signal }),
		staleTime: 60_000,
		gcTime: 10 * 60_000,
		// ApiError 是自定义 Error 实例，角色列表在客户端发起，避免失败对象进入 SSR payload。
		enabled: () => import.meta.client && !!currentUser.value,
	})

	async function invalidateRoles() {
		try {
			await queryCache.invalidateQueries({ key: ['roles'] })
		} catch {
			toast.add({ title: '操作已成功，但列表刷新失败，请手动刷新', color: 'warning' })
		}
	}

	const createRole = useMutation<RoleMutationResult, CreateRoleInput, ApiError>({
		mutation: input => $api<RoleMutationResult>('/roles', { method: 'POST', body: input }),
		async onSuccess() {
			toast.add({ title: '角色创建成功', color: 'success' })
			await invalidateRoles()
		},
	})
	const updateRole = useMutation<
		RoleMutationResult,
		{ id: number; data: UpdateRoleInput },
		ApiError
	>({
		mutation: ({ id, data }) =>
			$api<RoleMutationResult>(`/roles/${id}`, { method: 'PATCH', body: data }),
		async onSuccess() {
			toast.add({ title: '角色信息已更新', color: 'success' })
			await invalidateRoles()
		},
	})
	const deleteRole = useMutation<RoleMutationResult, number, ApiError>({
		mutation: id => $api<RoleMutationResult>(`/roles/${id}`, { method: 'DELETE' }),
		async onSuccess() {
			toast.add({ title: '角色已删除', color: 'success' })
			await invalidateRoles()
		},
	})

	return {
		roles: computed(() => roleList.data.value?.data ?? []),
		error: roleList.error,
		loading: computed(() => roleList.asyncStatus.value === 'loading'),
		isInitialLoading: computed(() => roleList.status.value === 'pending'),
		refetch: roleList.refetch,
		createRole,
		updateRole,
		deleteRole,
		saving: computed(() => createRole.isLoading.value || updateRole.isLoading.value),
		saveError: computed(
			() => createRole.error.value?.message ?? updateRole.error.value?.message ?? null
		),
		deleting: deleteRole.isLoading,
	}
}
