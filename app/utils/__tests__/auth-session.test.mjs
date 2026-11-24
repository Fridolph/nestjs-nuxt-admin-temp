import assert from 'node:assert/strict'
import test from 'node:test'
import { createSessionClient, safeReturnTo } from '../auth-session.ts'
import { ApiError } from '../api-error.ts'

const data = token => ({ userId: 9, username: 'learner', roleId: 3, accessToken: token, tokenType: 'Bearer' })
function setup(transport) {
  const events = { saved: [], clears: 0, expired: 0 }
  const client = createSessionClient({
    transport,
    save: value => events.saved.push(value),
    clear: () => { events.clears++ },
    expired: () => { events.expired++ },
    withRefreshLock: callback => callback(),
  })
  return { client, events }
}

test('站内回跳保留查询与 hash，拒绝外链、双斜杠、反斜杠和认证页循环', () => {
  assert.equal(safeReturnTo('/users?page=2#profile'), '/users?page=2#profile')
  for (const path of ['//evil.com', 'https://evil.com', '/\\evil.com', '/login?redirect=/users', '/register', ['//evil'], '/\n/evil']) assert.equal(safeReturnTo(path), '/')
})

test('并发401只续期一次，重试使用新 access token；403不清会话也不跳登录', async () => {
  let refreshes = 0
  const { client, events } = setup(async (path, options) => {
    if (path === '/auth/signin') return { data: data('old') }
    if (path === '/auth/refresh') { refreshes++; await new Promise(resolve => setTimeout(resolve, 5)); return { data: data('new') } }
    if (path === '/forbidden') throw new ApiError('没有权限', 403)
    if (options.headers.get('Authorization') === 'Bearer old') throw new ApiError('过期', 401)
    return { ok: true }
  })
  await client.authenticate('/auth/signin', {})
  const result = await Promise.all([client.request('/users'), client.request('/roles')])
  assert.deepEqual(result, [{ ok: true }, { ok: true }])
  assert.equal(refreshes, 1)
  await assert.rejects(client.request('/forbidden'), { statusCode: 403 })
  assert.equal(events.expired, 0)
  assert.equal(events.clears, 1) // 登录前清除上一位用户
})

test('续期401清空一次并回登录；网络故障不伪装成退出；登录401留在表单', async () => {
  const { client, events } = setup(async () => { throw new ApiError('失效', 401) })
  await Promise.allSettled([client.request('/users'), client.request('/roles')])
  assert.equal(events.expired, 1)
  assert.equal(events.clears, 1)
  const network = setup(async () => { throw new ApiError('断网') })
  await assert.rejects(network.client.ensureSession())
  assert.equal(network.events.expired, 0)
  assert.equal(network.events.clears, 0)
  await assert.rejects(client.authenticate('/auth/signin', {}))
  assert.equal(events.expired, 1)
})

test('退出成功清会话；重复点击只发一次；退出失败保留状态以便重试', async () => {
  let calls = 0
  let fail = true
  const { client, events } = setup(async path => {
    if (path === '/auth/signin') return { data: data('current') }
    calls++
    await new Promise(resolve => setTimeout(resolve, 5))
    if (fail) throw new ApiError('服务不可用', 503)
    return { code: 200 }
  })
  await client.authenticate('/auth/signin', {})
  await assert.rejects(client.logout())
  assert.equal(events.clears, 1)
  fail = false
  await Promise.all([client.logout(), client.logout()])
  assert.equal(calls, 2)
  assert.equal(events.clears, 2)
})

test('换账号后拒绝旧会话迟到响应，避免重新填充缓存', async () => {
  let resolveOld
  const { client } = setup(async path => path === '/auth/signin'
    ? { data: data('new') }
    : new Promise(resolve => { resolveOld = resolve }))
  const oldRequest = client.request('/users')
  await client.authenticate('/auth/signin', {})
  resolveOld({ oldUser: 'secret' })
  await assert.rejects(oldRequest, /会话已变更/)
})
