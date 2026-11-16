import type { AuthResponse, LoginCredentials, RegisterCredentials } from '~/utils/auth-schema'

/** 认证流程的唯一入口，负责请求、令牌保存和当前用户身份。 */
export function useAuth() {
	const { $api, $authToken } = useNuxtApp()
	const tokenCookie = useCookie<string | null>('access_token', {
		sameSite: 'lax',
		maxAge: 60 * 60 * 2,
	})
	const currentUser = useState<Pick<
		AuthResponse['data'],
		'userId' | 'username' | 'roleIds'
	> | null>('auth-user', () => null)

	function saveIdentity(response: AuthResponse) {
		tokenCookie.value = response.data.accessToken
		$authToken.value = response.data.accessToken
		currentUser.value = {
			userId: response.data.userId,
			username: response.data.username,
			roleIds: response.data.roleIds,
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
	}

	return { currentUser, signIn, register, signOut }
}
