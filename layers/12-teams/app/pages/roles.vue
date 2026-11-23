<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui/components/Table.vue'
import type { RoleRow } from '../types/role'
import { useRoles } from '../composables/useRoles'

definePageMeta({ layout: 'has-sidebar', title: '角色管理' })

const { currentUser } = useAuth()
const accessToken = useCookie<string | null>('access_token')
// 页面显示状态可从登录时保存的身份或 JWT 恢复；服务端守卫仍按数据库角色授权。
const tokenRoleIds = computed(() => {
  try {
    if (import.meta.server) return []
    const payload = accessToken.value?.split('.')[1]
    if (!payload) return []
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof decoded !== 'object' || decoded === null) return []
    const identity = decoded as { roleId?: unknown; roleIds?: unknown }
    const ids = identity.roleId ?? identity.roleIds
    return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === 'number') : []
  } catch { return [] }
})
const canManageRoles = computed(() => (currentUser.value?.roleIds ?? tokenRoleIds.value).some(id => id === 1 || id === 2))
const { roles, error, loading, isInitialLoading, refetch, createRole, updateRole, deleteRole, saving, saveError, deleting } = useRoles()
const drawerOpen = shallowRef(false)
const editingRole = shallowRef<RoleRow | null>(null)
const { confirm } = useConfirmModal()
const columns: TableColumn<RoleRow>[] = [
  { accessorKey: 'roleId', header: '角色 ID' },
  { accessorKey: 'roleName', header: '角色名称' },
  { accessorKey: 'roleCode', header: '角色编码' },
  { accessorKey: 'description', header: '角色描述' },
  { id: 'actions', header: '操作' },
]
function openDrawer(role: RoleRow | null) { if (!canManageRoles.value || role?.roleCode === 'super_admin') return; editingRole.value = role; createRole.reset(); updateRole.reset(); drawerOpen.value = true }
async function saveRole(payload: { roleName: string; description: string; roleCode: string }) {
  try {
    if (editingRole.value) await updateRole.mutateAsync({ id: editingRole.value.roleId, data: { roleName: payload.roleName, description: payload.description } })
    else await createRole.mutateAsync(payload)
    drawerOpen.value = false
  } catch { /* 错误显示在抽屉内 */ }
}
async function startDelete(role: RoleRow) {
  if (!canManageRoles.value || role.roleCode === 'super_admin' || deleting.value) return
  const confirmed = await confirm({ type: 'delete', title: `删除角色 · ${role.roleName}`, description: '删除后无法恢复，确定继续吗？' })
  if (!confirmed) return
  try { await deleteRole.mutateAsync(role.roleId) } catch { /* mutation 已提示错误 */ }
}
</script>
<template>
  <div class="content-pad">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div><h1 class="text-xl font-semibold tracking-tight text-highlighted">角色管理</h1><p class="mt-2 text-sm text-muted">查看和维护系统角色及其权限标识。</p></div>
      <div v-if="canManageRoles" class="flex gap-2"><UButton label="创建新角色" icon="i-lucide-plus" @click="openDrawer(null)" /><UButton label="刷新" icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="loading" @click="refetch()" /></div>
      <UButton v-else label="刷新" icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="loading" @click="refetch()" />
    </div>
    <div v-if="error" class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><UAlert class="flex-1" color="error" variant="soft" title="角色列表加载失败" :description="error.message" /><UButton label="重试" color="error" variant="subtle" :loading="loading" @click="refetch()" /></div>
    <div v-if="isInitialLoading" class="mt-6 space-y-2" aria-busy="true"><USkeleton v-for="row in 5" :key="row" class="h-12 w-full" /></div>
    <UTable v-else-if="!error || roles.length" :loading="loading" :columns="columns" :data="roles" class="mt-6 w-full overflow-x-auto">
      <template #roleCode-cell="{ row }"><code class="rounded bg-elevated px-2 py-1 text-xs">{{ row.original.roleCode }}</code></template>
      <template #description-cell="{ row }">{{ row.original.description || '—' }}</template>
      <template #actions-cell="{ row }"><div v-if="canManageRoles && row.original.roleCode !== 'super_admin'" class="flex items-center gap-1 whitespace-nowrap"><UButton icon="i-lucide-pencil" aria-label="编辑角色" color="neutral" variant="ghost" size="sm" @click="openDrawer(row.original)" /><UButton icon="i-lucide-trash-2" aria-label="删除角色" color="error" variant="ghost" size="sm" @click="startDelete(row.original)" /></div><span v-else class="text-sm text-muted">只读</span></template>
    </UTable>
    <p v-else class="mt-6 text-sm text-muted">暂无角色数据。</p>
    <RoleDrawer v-if="canManageRoles" v-model:open="drawerOpen" :role="editingRole" :pending="saving" :error="saveError" @submit="saveRole" />
  </div>
</template>
