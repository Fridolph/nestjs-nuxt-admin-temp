export class ApiError extends Error {
	readonly statusCode?: number
	readonly details?: unknown

	constructor(message: string, statusCode?: number, details?: unknown) {
		super(message)
		this.name = 'ApiError'
		this.statusCode = statusCode
		this.details = details
	}
}

export function apiError(cause: unknown, fallback = '请求失败，请稍后重试'): ApiError {
	if (cause instanceof ApiError) return cause
	const error = cause as {
		data?: { msg?: unknown; message?: unknown; errors?: unknown }
		statusCode?: number
		status?: number
		message?: string
	} | null
	const responseMessage = error?.data?.msg ?? error?.data?.message
	const message =
		typeof responseMessage === 'string'
			? responseMessage
			: Array.isArray(responseMessage)
				? responseMessage.filter(item => typeof item === 'string').join('；')
				: (error?.message ?? fallback)
	return new ApiError(message, error?.statusCode ?? error?.status, error?.data?.errors)
}
