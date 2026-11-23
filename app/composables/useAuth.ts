import type { AuthResponse, LoginCredentials, RegisterCredentials } from '~/utils/auth-schema'

/** 认证流程的唯一入口，负责请求、令牌保存和当前用户身份。 */
export function useAuth() {
	const { $api, $authToken } = useNuxtApp()
	const tokenCookie = useCookie<string | null>('access_token', {
		sameSite: 'lax',
		maxAge: 60 * 60 * 2,
	})
	const currentUser = useState<{
		userId: number
		username: string
		roleIds: number[]
	} | null>('auth-user', () => null)

	function readTokenIdentity(token: string | null) {
		if (!token || import.meta.server) return null
		try {
			const encoded = token.split('.')[1]
			if (!encoded) return null
			const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))) as {
				userId?: unknown
				username?: unknown
				roleId?: unknown
				roleIds?: unknown
			}
			const roleValue = payload.roleId ?? payload.roleIds
			if (
				typeof payload.userId !== 'number' ||
				typeof payload.username !== 'string' ||
				!Array.isArray(roleValue)
			) return null
			return {
				userId: payload.userId,
				username: payload.username,
				roleIds: roleValue.filter((id): id is number => typeof id === 'number'),
			}
		} catch {
			return null
		}
	}

	if (!currentUser.value) currentUser.value = readTokenIdentity(tokenCookie.value)

	function saveIdentity(response: AuthResponse) {
		tokenCookie.value = response.data.accessToken
		$authToken.value = response.data.accessToken
		currentUser.value = {
			userId: response.data.userId,
			username: response.data.username,
			roleIds: response.data.roleId ?? response.data.roleIds ?? [],
		}
	}

	async function signIn(credentials: LoginCredentials) {
		const response = await $api<AuthResponse>('/auth/signin', { method: 'POST', body: credentials })
		saveIdentity(response)
		return response
	}

	async function register(credentials: RegisterCredentials) {
		const { confirmPassword: _confirmPassword, nickname, ...payload } = credentials
		const response = await $api<AuthResponse>('/auth/register', {
			method: 'POST',
			body: { ...payload, ...(nickname ? { nickname } : {}) },
		})
		saveIdentity(response)
		return response
	}

	function signOut() {
		tokenCookie.value = null
		$authToken.value = null
		currentUser.value = null
		usePermission().clearPermissionContext()
	}

	return { currentUser, signIn, register, signOut }
}
