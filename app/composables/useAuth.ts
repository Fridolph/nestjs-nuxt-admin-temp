import type { AuthUser, LoginCredentials, RegisterCredentials } from '~/utils/auth-schema'

/** 页面共享认证入口；会话、并发续期和缓存清理由 api plugin 统一持有。 */
export function useAuth() {
  const { $authSession } = useNuxtApp()
  const currentUser = useState<AuthUser | null>('auth-user', () => null)
  return {
    currentUser,
    signIn: (credentials: LoginCredentials) => $authSession.authenticate('/auth/signin', credentials),
    register(credentials: RegisterCredentials) {
      const { confirmPassword: _confirmPassword, nickname, ...payload } = credentials
      return $authSession.authenticate('/auth/register', { ...payload, ...(nickname ? { nickname } : {}) })
    },
    signOut: $authSession.logout,
    signingOut: $authSession.signingOut,
  }
}
