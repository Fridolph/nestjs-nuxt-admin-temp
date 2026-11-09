import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError, apiError } from '../api-error.ts'

test('优先使用后端 msg，保留状态和字段校验详情', () => {
	const errors = [{ path: 'nickname', code: 'invalid_type', message: '不能为空' }]
	const error = apiError({ statusCode: 400, data: { msg: '请求参数校验失败', message: '旧提示', errors } })
	assert.equal(error.message, '请求参数校验失败')
	assert.equal(error.statusCode, 400)
	assert.deepEqual(error.details, errors)
})

test('兼容历史 message 和消息数组', () => {
	assert.equal(apiError({ data: { message: '用户不存在' } }).message, '用户不存在')
	assert.equal(apiError({ data: { message: ['字段一错误', '字段二错误'] } }).message, '字段一错误；字段二错误')
})

test('网络错误使用兜底，已归一化的异常保持原实例', () => {
	assert.equal(apiError(null, '网络不可用').message, '网络不可用')
	const error = new ApiError('已归一化', 409)
	assert.equal(apiError(error), error)
})
