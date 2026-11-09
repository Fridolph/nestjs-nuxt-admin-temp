import { apiError } from '../utils/api-error'

/**
 * 注册全站唯一的 HTTP 客户端 `$api`。
 *
 * @remarks
 * 这一层只负责**传输层**的三件事：baseURL、公共请求头、把各种失败归一化成 `ApiError`。
 * 业务 URL 由对应资源 composable 管理。
 *
 * 后端约定：成功的业务码写在 body 里（HTTP 仍是 200），失败则可能
 * 返回 HTTP 4xx/5xx 或 200 + 业务码 >= 400。两种都必须转成异常，
 * 否则 Pinia Colada 会把它当成“查询成功”。
 */
export default defineNuxtPlugin(() => {
	const api = $fetch.create({
		baseURL: useRuntimeConfig().public.apiBase,
		onRequest({ options }) {
			options.headers.set('Accept', 'application/json')
		},
		onResponse({ response }) {
			// 处理「HTTP 200 + body.code >= 400」这种业务失败
			const body = response._data as
				| { code?: unknown; message?: unknown; msg?: unknown; errors?: unknown }
				| undefined
			if (response.ok && typeof body?.code === 'number' && body.code >= 400) {
				throw apiError({ data: body, statusCode: body.code })
			}
		},
		onResponseError({ response }) {
			throw apiError(
				{ data: response._data, statusCode: response.status },
				`请求失败 (${response.status})`
			)
		},
		onRequestError({ error }) {
			throw apiError(error, '无法连接接口服务，请检查后端是否启动')
		},
	})

	return { provide: { api } }
})
