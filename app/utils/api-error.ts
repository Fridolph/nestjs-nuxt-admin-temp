export class ApiError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly details?: unknown
	) {
		super(message)
		this.name = 'ApiError'
	}
}

export function apiError(cause: unknown, fallback = '请求失败，请稍后重试'): ApiError {
	if (cause instanceof ApiError) return cause
	const error = cause as {
		data?: { message?: unknown; errors?: unknown }
		statusCode?: number
		status?: number
		message?: string
	} | null
	const responseMessage = error?.data?.message
	const message =
		typeof responseMessage === 'string'
			? responseMessage
			: Array.isArray(responseMessage)
				? responseMessage.filter(item => typeof item === 'string').join('；')
				: (error?.message ?? fallback)
	return new ApiError(message, error?.statusCode ?? error?.status, error?.data?.errors)
}
