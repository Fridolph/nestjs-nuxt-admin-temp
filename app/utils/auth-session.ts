import type { FetchOptions } from 'ofetch'
import type { AuthResponse, AuthResponseData } from './auth-schema'
import { ApiError, apiError } from './api-error.ts'

export type ApiOptions = Pick<FetchOptions, 'body' | 'headers' | 'query' | 'signal'> & { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'get' | 'post' | 'patch' | 'put' | 'delete' | 'head' | 'options' }
export type ApiRequest = <T>(request: string, options?: ApiOptions) => Promise<T>

/** 回跳只接受站内路径；保留 query/hash，拒绝登录页循环和开放重定向。 */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(character => character.charCodeAt(0) <= 32)) return '/'
  try {
    const url = new URL(value, 'https://admin.invalid')
    if (url.origin !== 'https://admin.invalid' || /^\/(login|register)(?:\/|$)/.test(url.pathname)) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return '/' }
}

/** 管理单个应用实例的续期和会话边界；不把令牌放入持久化存储或 Nuxt SSR payload。 */
export function createSessionClient(dependencies: {
  transport: ApiRequest
  save: (data: AuthResponseData) => void
  clear: () => void
  expired: () => void | Promise<void>
  withRefreshLock: <T>(callback: () => Promise<T>) => Promise<T>
}) {
  let token: string | null = null
  let generation = 0
  let initialized = false
  let refreshPromise: Promise<void> | null = null
  let logoutPromise: Promise<void> | null = null
  const { transport } = dependencies

  function clear() {
    generation++
    token = null
    initialized = true
    dependencies.clear()
  }
  function accept(data: AuthResponseData) { token = data.accessToken; initialized = true; dependencies.save(data) }

  function refresh() {
    if (refreshPromise) return refreshPromise
    const expected = generation
    refreshPromise = dependencies.withRefreshLock(async () => {
      const response = await transport<AuthResponse>('/auth/refresh', { method: 'POST' })
      if (generation !== expected) throw new ApiError('会话已变更', 401)
      accept(response.data)
    }).finally(() => { refreshPromise = null })
    return refreshPromise
  }

  async function ensureSession() {
    if (initialized) return !!token
    try { await refresh(); return true }
    catch (cause) {
      const error = apiError(cause)
      if (error.statusCode !== 401) throw error
      clear()
      return false
    }
  }

  const request: ApiRequest = async <T>(path: string, options?: ApiOptions) => {
    if (logoutPromise) throw new ApiError('正在退出登录，请稍后重试')
    const expected = generation
    const sentToken = token
    const send = () => {
      const headers = new Headers(options?.headers as HeadersInit | undefined)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return transport<T>(path, { ...options, headers })
    }
    try {
      const data = await send()
      if (expected !== generation) throw new ApiError('会话已变更，请重新操作')
      return data
    } catch (cause) {
      const error = apiError(cause)
      if (error.statusCode !== 401 || path.startsWith('/auth/') || expected !== generation) throw error
      try {
        // 迟到的旧请求已由其他请求续期时，直接使用新 token，避免重复轮换。
        if (token === sentToken) await refresh()
        if (expected !== generation) throw new ApiError('会话已变更')
        const data = await send()
        if (expected !== generation) throw new ApiError('会话已变更')
        return data
      } catch (refreshError) {
        const normalized = apiError(refreshError)
        if (normalized.statusCode === 401 && expected === generation) {
          clear()
          await dependencies.expired()
        }
        throw normalized
      }
    }
  }

  async function authenticate(path: '/auth/signin' | '/auth/register', body: unknown) {
    if (logoutPromise) throw new ApiError('正在退出登录')
    const expected = generation
    const response = await dependencies.withRefreshLock(() => transport<AuthResponse>(path, { method: 'POST', body: body as Record<string, unknown> }))
    if (expected !== generation) throw new ApiError('会话已变更，请重新登录')
    clear()
    accept(response.data)
    return response
  }

  function logout() {
    if (logoutPromise) return logoutPromise
    logoutPromise = (async () => {
      // 等已发出的续期设置完 Cookie 后再撤销，防止登出后迟到响应恢复 Cookie。
      await refreshPromise?.catch(() => {})
      const headers = new Headers()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      await dependencies.withRefreshLock(() => transport('/auth/logout', { method: 'POST', headers }))
      clear()
    })().finally(() => { logoutPromise = null })
    return logoutPromise
  }

  return { request, authenticate, ensureSession, logout, clear }
}
