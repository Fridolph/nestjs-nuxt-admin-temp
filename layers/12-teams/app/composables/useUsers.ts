import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import type { ComputedRef } from 'vue'
import type { ApiError } from '~/utils/api-error'
import type { CreateUserInput, MutationResult, ProfileChanges, UsersPage } from '../types/user'

/** `useUsers` 的分页参数，均来自 URL 查询参数，因此都是响应式的。 */
interface UseUsersOptions {
	page: ComputedRef<number>
	size: ComputedRef<number>
}

/**
 * users 资源的统一入口：列表查询 + 三个写操作。
 *
 * @remarks
 * 为什么查询与写操作放在同一个 composable，而不是拆成 `useUsersQuery` /
 * `useUserMutations`：它们共享同一段**私有**逻辑——写成功必须让列表缓存失效。
 * 按功能内聚、按技术角色拆分，会让这段共享逻辑被迫外露或在两个文件里各写一份。
 *
 * 同理，这里不再单独抽 `api/users.ts`：目前每个接口只有一个调用点，
 * 抽出去只是把 URL 从 A 文件搬到 B 文件，并未消除重复。
 * 当同一接口出现**第二个**消费者（详情页、hover 预取、服务端 loader）时，
 * 再抽出 `api/` 领域层，那时它才真正消除重复。
 *
 * 请求本身通过 `$api` 直接发出：传输层配置（baseURL、请求头、错误归一化）
 * 已由 `app/plugins/api.ts` 统一处理，这里只负责拼路径与声明返回类型。
 *
 * @param options.page - 当前页码（来自 URL）。
 * @param options.size - 每页条数（来自 URL）。
 * @returns 列表数据与状态、分页展示信息、三个写操作及其状态。
 */
export function useUsers({ page, size }: UseUsersOptions) {
	// 在 setup 期取到已配置 baseURL 的客户端，查询函数直接复用它，
	// 避免在异步回调里重新获取 Nuxt 上下文。
	const api = useNuxtApp().$api
	const queryCache = useQueryCache()
	const toast = useToast()

	// ── 列表查询 ───────────────────────────────────────────────
	// 一页 = 一个缓存条目：key 里带页码与每页条数，来回翻页可直接命中缓存。
	const list = useQuery<UsersPage, ApiError>({
		// key 必须写成 getter，页码变化时 Colada 才会切到新的缓存条目
		key: () => ['users', { page: page.value, size: size.value }],
		query: ({ signal }) =>
			api<UsersPage>('/users', {
				query: { page: page.value, size: size.value },
				signal,
			}),
		// 翻页时保留上一页数据，避免表格闪空、总数归零、分页器跳回第 1 页
		placeholderData: previousData => previousData,
		staleTime: 60_000,
		gcTime: 10 * 60_000,
		// SSR 阶段失败时不要抛 500，交给页面渲染错误态
		ssrCatchError: true,
	})

	const { data, error, status, asyncStatus, refetch } = list

	const users = computed(() => data.value?.data ?? [])
	const total = computed(() => data.value?.pagination.total ?? 0)
	// 分页展示信息跟“当前真正显示的那份数据”走，而不是跟 URL 走。
	// 否则在 placeholderData 保留上一页数据的瞬间，会出现「显示 6–8，屏幕上还是 1–5」的矛盾。
	const displayPage = computed(() => data.value?.pagination.page ?? page.value)
	const displaySize = computed(() => data.value?.pagination.size ?? size.value)

	/** 首次加载（无缓存、无 SSR 数据）：用骨架屏，不要渲染空表格。 */
	const isInitialLoading = computed(() => status.value === 'pending')
	/** 任意一次请求进行中（含翻页、刷新）：用于按钮与表格的 loading 态。 */
	const loading = computed(() => asyncStatus.value === 'loading')
	/** 请求成功但确实没有数据，用于「暂无数据」提示。 */
	const isEmpty = computed(() => status.value === 'success' && users.value.length === 0)

	// ── 写操作 ─────────────────────────────────────────────────
	/**
	 * 让用户列表缓存失效并重新请求当前活跃的那一页。
	 *
	 * @remarks
	 * 失效失败不应被当成写操作失败（数据已经写进库了），
	 * 因此这里自行兜住异常，只给一个“请手动刷新”的提醒。
	 */
	async function invalidateUsers() {
		try {
			await queryCache.invalidateQueries({ key: ['users'] })
		} catch {
			toast.add({ title: '操作已成功，但列表刷新失败，请手动刷新', color: 'warning' })
		}
	}

	const createUser = useMutation<MutationResult, CreateUserInput, ApiError>({
		mutation: input => api<MutationResult>('/users', { method: 'POST', body: input }),
		async onSuccess() {
			toast.add({ title: '用户创建成功', color: 'success' })
			await invalidateUsers()
		},
	})

	const updateUserProfile = useMutation<
		MutationResult,
		{ id: number; data: ProfileChanges },
		ApiError
	>({
		mutation: ({ id, data }) =>
			api<MutationResult>(`/users/${id}/profile`, { method: 'PATCH', body: data }),
		async onSuccess() {
			toast.add({ title: '用户资料已更新', color: 'success' })
			await invalidateUsers()
		},
	})

	const deleteUser = useMutation<MutationResult, number, ApiError>({
		mutation: id => api<MutationResult>(`/users/${id}`, { method: 'DELETE' }),
		async onSuccess() {
			toast.add({ title: '用户已删除', color: 'success' })
			await invalidateUsers()
		},
	})

	// 页面只需要“是否在保存 / 最近一次错误是什么”，不必自己组合多个 isLoading。
	const saving = computed(() => createUser.isLoading.value || updateUserProfile.isLoading.value)
	/** 创建与编辑共用一个抽屉，取最近一次失败的错误即可。 */
	const saveError = computed(
		() => createUser.error.value?.message ?? updateUserProfile.error.value?.message ?? null
	)
	const deleting = deleteUser.isLoading
	const deleteError = computed(() => deleteUser.error.value?.message ?? null)

	return {
		// 列表数据与状态
		users,
		total,
		displayPage,
		displaySize,
		error,
		isInitialLoading,
		loading,
		isEmpty,
		refetch,
		// 写操作
		createUser,
		updateUserProfile,
		deleteUser,
		saving,
		saveError,
		deleting,
		deleteError,
	}
}
