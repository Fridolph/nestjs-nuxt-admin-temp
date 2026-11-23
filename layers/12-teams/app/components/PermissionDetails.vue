<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui/components/Table.vue'
import type { PermissionGroup, PermissionRow } from '../types/permission'

defineProps<{ group: PermissionGroup; canManage: boolean; deleting: boolean }>()
const emit = defineEmits<{ edit: [permission: PermissionRow]; delete: [permission: PermissionRow] }>()

const columns: TableColumn<PermissionRow>[] = [
  { accessorKey: 'name', header: '权限名称' },
  { accessorKey: 'code', header: '权限编码' },
  { accessorKey: 'action', header: 'action' },
  { id: 'fields', header: '字段范围' },
  { id: 'enabled', header: '状态' },
  {
    id: 'operations',
    header: '操作',
    meta: { class: { th: 'w-32 text-center', td: 'w-32 text-center' } },
  },
]
</script>

<template>
  <div class="overflow-x-auto border-default">
    <UTable :data="group.permissions" :columns="columns" :get-row-id="row => String(row.id)" class="min-w-760px w-full">
      <template #name-cell="{ row }"><span class="font-medium">{{ row.original.name }}</span></template>
      <template #code-cell="{ row }"><code class="text-xs">{{ row.original.code }}</code></template>
      <template #action-cell="{ row }"><UBadge variant="soft">{{ row.original.action }}</UBadge></template>
      <template #fields-cell="{ row }">{{ row.original.fields === null ? '全部字段' : row.original.fields.join('、') }}</template>
      <template #enabled-cell="{ row }">
        <UBadge :color="row.original.enabled ? 'success' : 'neutral'" variant="soft">{{ row.original.enabled ? '启用' : '停用' }}</UBadge>
      </template>
      <template #operations-cell="{ row }">
        <div v-if="canManage" class="flex gap-1">
          <UButton icon="i-lucide-pencil" :aria-label="`编辑${row.original.name}`" color="neutral" variant="ghost" size="sm" @click="emit('edit', row.original)" />
          <UButton icon="i-lucide-trash-2" :aria-label="`删除${row.original.name}`" color="error" variant="ghost" size="sm" :disabled="deleting" @click="emit('delete', row.original)" />
        </div>
      </template>
      <template #empty>该资源暂无权限。</template>
    </UTable>
  </div>
</template>
