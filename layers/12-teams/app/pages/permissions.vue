<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui/components/Table.vue'
import { usePermissions } from '../composables/usePermissions'
import type { CreatePermissionInput, PermissionGroup, PermissionRow } from '../types/permission'

definePageMeta({
  layout: 'has-sidebar',
  title: '权限管理',
  middleware: () => {
    const token = useCookie<string | null>('access_token')
    if (!token.value) return navigateTo('/login')
    // 服务端不解析 JWT 作授权判断；客户端只用角色 ID 控制页面可见性。
    if (import.meta.server) return
    const { currentUser } = useAuth()
    if (!currentUser.value?.roleIds.includes(1)) {
      return abortNavigation(createError({ statusCode: 403, statusMessage: '仅超管可访问权限管理' }))
    }
  },
})

const {
  permissions, canManageDirectory, accessDenied, error, loading, isInitialLoading, refetch,
  createPermission, updatePermission, deletePermission, saving, saveError, deleting,
} = usePermissions()
// 权限目录写接口仅允许超管；服务端仍以 CASL manage/all 作最终判断。
const drawerOpen = shallowRef(false)
const editingPermission = shallowRef<PermissionRow | null>(null)
const expanded = shallowRef<Record<string, boolean>>({})
const { confirm } = useConfirmModal()
const columns: TableColumn<PermissionGroup>[] = [
  { accessorKey: 'name', header: '资源名称' },
  { accessorKey: 'resource', header: '资源标识' },
  { id: 'actionSummary', header: '已配置动作' },
  { id: 'permissionCount', header: '权限数量' },
  {
    id: 'operations',
    header: '操作',
    meta: { class: { th: 'w-32 text-center', td: 'w-32 text-center' } },
  },
]

function openDrawer(permission: PermissionRow | null) {
  if (!canManageDirectory.value) return
  editingPermission.value = permission
  createPermission.reset()
  updatePermission.reset()
  drawerOpen.value = true
}

async function savePermission(payload: CreatePermissionInput) {
  if (!canManageDirectory.value) return
  try {
    if (editingPermission.value) {
      const { code: _code, ...data } = payload
      await updatePermission.mutateAsync({ id: editingPermission.value.id, data })
    } else {
      await createPermission.mutateAsync(payload)
    }
    drawerOpen.value = false
  } catch { /* mutation.error 显示在抽屉内 */ }
}

async function startDelete(permission: PermissionRow) {
  if (!canManageDirectory.value || deleting.value) return
  const confirmed = await confirm({
    type: 'delete',
    title: `删除权限 · ${permission.name}`,
    description: '如果该权限已分配给角色，后端会拒绝删除。确认继续吗？',
  })
  if (!confirmed) return
  try { await deletePermission.mutateAsync(permission.id) } catch { /* mutation 已提示错误 */ }
}
</script>

<template>
  <div class="content-pad">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-highlighted">权限管理</h1>
        <p class="mt-2 text-sm text-muted">按资源查看权限目录，展开后可维护各动作的字段范围和状态。</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton v-if="canManageDirectory" label="创建权限" icon="i-lucide-plus" @click="openDrawer(null)" />
        <UButton label="刷新" icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="loading" @click="refetch()" />
      </div>
    </div>

    <div v-if="error" class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <UAlert class="flex-1" color="error" variant="soft" title="权限目录加载失败" :description="error.message" />
      <UButton label="重试" color="error" variant="subtle" :loading="loading" @click="refetch()" />
    </div>
    <UAlert v-else-if="accessDenied" class="mt-4" color="warning" variant="soft" title="无权访问权限管理" description="当前账号没有超管权限。若角色刚发生变化，请刷新后重试。" />

    <div v-if="isInitialLoading && loading" class="mt-6 space-y-2" aria-busy="true">
      <span class="sr-only">正在加载权限目录</span>
      <USkeleton v-for="row in 5" :key="row" class="h-12 w-full" />
    </div>
    <div v-else-if="canManageDirectory && (!error || permissions.length)" class="mt-6 w-full overflow-x-auto" :aria-busy="loading">
      <UTable v-model:expanded="expanded" :loading="loading" :columns="columns" :data="permissions" :get-row-id="row => row.resource" :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }" class="min-w-190 w-full">
        <template #operations-cell="{ row }">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :icon="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            :label="row.getIsExpanded() ? '收起' : '展开'"
            :aria-label="`${row.getIsExpanded() ? '收起' : '展开'}${row.original.name}的权限明细`"
            :aria-expanded="row.getIsExpanded()"
            @click="row.toggleExpanded()"
          />
        </template>
        <template #name-cell="{ row }"><span class="font-medium">{{ row.original.name }}</span></template>
        <template #actionSummary-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="action in row.original.actions" :key="action" variant="soft">{{ action }}</UBadge>
          </div>
        </template>
        <template #permissionCount-cell="{ row }">{{ row.original.permissions.length }}</template>
        <template #expanded="{ row }">
          <PermissionDetails :group="row.original" :can-manage="canManageDirectory" :deleting="deleting" @edit="openDrawer" @delete="startDelete" />
        </template>
        <template #empty>暂无权限数据。</template>
      </UTable>
    </div>
    <PermissionDrawer v-if="canManageDirectory" v-model:open="drawerOpen" :permission="editingPermission" :pending="saving" :error="saveError" @submit="savePermission" />
  </div>
</template>
