import { useQueryCache, useMutationCache } from '@pinia/colada'
import { apiError } from '../utils/api-error'
import { createSessionClient, safeReturnTo } from '../utils/auth-session'
import type { AuthResponseData, AuthUser } from '../utils/auth-schema'

/** 统一传输、401 续期和会话清理；403 原样交给页面，不清除登录状态。 */
export default defineNuxtPlugin({
  name: 'api-session',
  dependsOn: ['Pinia Colada'],
  setup(nuxtApp) {
    const router = useRouter()
    const currentUser = useState<AuthUser | null>('auth-user', () => null)
    const permissionContext = useState('permission-context', () => null)
    const accessToken = shallowRef<string | null>(null)
    const queryCache = useQueryCache(nuxtApp.$pinia)
    const mutationCache = useMutationCache(nuxtApp.$pinia)
    const signingOut = shallowRef(false)
    let channel: BroadcastChannel | undefined
    const transport = $fetch.create({
      baseURL: useRuntimeConfig().public.apiBase,
      credentials: 'include',
      retry: 0,
      onRequest({ options }) {
        options.headers.set('Accept', 'application/json')
        options.headers.set('X-Auth-Request', '1')
      },
      onResponse({ response }) {
        const body = response._data as { code?: unknown } | undefined
        if (response.ok && typeof body?.code === 'number' && body.code >= 400) throw apiError({ data: body, statusCode: body.code })
      },
      onResponseError({ response }) { throw apiError({ data: response._data, statusCode: response.status }) },
      onRequestError({ error }) { throw apiError(error, '无法连接接口服务，请稍后重试') },
    })

    const session = createSessionClient({
      transport,
      save(data: AuthResponseData) {
        accessToken.value = data.accessToken
        currentUser.value = { userId: data.userId, username: data.username, roleId: data.roleId }
      },
      clear() {
        accessToken.value = null
        currentUser.value = null
        permissionContext.value = null
        // 取消在途查询并擦除数据；请求层也会拒绝旧会话的迟到响应。
        queryCache.cancelQueries()
        for (const entry of queryCache.getEntries()) {
          entry.placeholderData = null
          queryCache.setEntryState(entry, { status: 'pending', data: undefined, error: null })
          // 活跃订阅保留空壳，避免破坏页面引用；卸载后由 Colada 正常回收。
          if (!entry.active) queryCache.remove(entry)
        }
        for (const entry of mutationCache.getEntries()) mutationCache.remove(entry)
      },
      expired: async () => {
        await nuxtApp.runWithContext(() => navigateTo({ path: '/login', query: { redirect: safeReturnTo(router.currentRoute.value.fullPath) } }, { replace: true }))
      },
      // Web Locks 在同源标签页之间串行续期，每次都读取浏览器最新 HttpOnly Cookie。
      withRefreshLock: callback => import.meta.client && navigator.locks
        ? navigator.locks.request('admin-session-refresh', callback)
        : callback(),
    })

    if (import.meta.client) {
      // 清理旧版可读 Cookie；新 access token 仅保存在内存中。
      useCookie('access_token').value = null
      channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('admin-session') : undefined
      if (channel) channel.onmessage = () => {
        // 同源标签页共享 Cookie；清空旧状态并重载，让中间件用最新 Cookie 恢复身份。
        session.clear()
        window.location.reload()
      }
      if (import.meta.hot) import.meta.hot.dispose(() => channel?.close())
    }

    const authSession = {
      ensureSession: session.ensureSession,
      async authenticate(path: '/auth/signin' | '/auth/register', body: unknown) {
        const response = await session.authenticate(path, body)
        channel?.postMessage('changed')
        return response
      },
      async logout() {
        if (signingOut.value) return
        signingOut.value = true
        try {
          await session.logout()
          channel?.postMessage('changed')
          await nuxtApp.runWithContext(() => navigateTo('/login', { replace: true }))
        } finally { signingOut.value = false }
      },
      signingOut: readonly(signingOut),
    }
    return { provide: { api: session.request, authToken: accessToken, authSession } }
  },
})
