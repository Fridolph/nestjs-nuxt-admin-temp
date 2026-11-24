import { safeReturnTo } from '../utils/auth-session'

/** SSR 不读取受保护数据；客户端先恢复会话，再渲染后台页面。 */
export default defineNuxtRouteMiddleware(async to => {
  if (import.meta.server) return
  const { $authSession } = useNuxtApp()
  const publicPage = ['/login', '/register'].includes(to.path)
  try {
    const authenticated = await $authSession.ensureSession()
    if (!publicPage && !authenticated) return navigateTo({ path: '/login', query: { redirect: safeReturnTo(to.fullPath) } }, { replace: true })
  } catch (cause) {
    // 服务不可用时保留登录表单可访问性，不把断网伪装成凭证失效。
    if (!publicPage) throw createError({ statusCode: 503, statusMessage: '认证服务暂时不可用，请稍后重试', cause })
  }
})
