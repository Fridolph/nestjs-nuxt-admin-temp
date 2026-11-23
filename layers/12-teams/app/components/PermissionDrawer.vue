<script setup lang="ts">
import { z } from 'zod'
import type { CreatePermissionInput, PermissionAction, PermissionRow } from '../types/permission'

const props = defineProps<{ permission: PermissionRow | null; pending: boolean; error: string | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ submit: [data: CreatePermissionInput] }>()
const editing = computed(() => props.permission !== null)
const form = reactive({
  code: '', name: '', resource: '', action: 'read' as PermissionAction,
  fieldsText: '', enabled: true,
})
const schema = z.object({
  code: z.string().trim().min(3, '请输入权限编码').max(64, '权限编码最多 64 个字符').regex(/^[a-z][a-z0-9._-]*:[a-z][a-z0-9._-]*$/, '格式应为 resource:action'),
  name: z.string().trim().min(1, '请输入权限名称').max(64, '权限名称最多 64 个字符'),
  resource: z.string().trim().min(1, '请输入资源标识').max(64, '资源标识最多 64 个字符').regex(/^[a-z][a-z0-9._-]*$/, '资源标识只能使用小写字母、数字、点、下划线和短横线'),
  action: z.enum(['create', 'read', 'update', 'delete', 'export']),
  fieldsText: z.string().refine(value => {
    const fields = value.split(',').map(field => field.trim()).filter(Boolean)
    return fields.length === 0 || (new Set(fields).size === fields.length && fields.every(field => /^[A-Za-z][A-Za-z0-9_]*$/.test(field)))
  }, '字段需以英文逗号分隔，不能重复，只能使用字母、数字和下划线'),
  enabled: z.boolean(),
})
const actionOptions = [
  { label: '创建', value: 'create' },
  { label: '读取', value: 'read' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '导出', value: 'export' },
]

watch([open, () => props.permission], ([visible, permission]) => {
  if (!visible) return
  Object.assign(form, permission
    ? { code: permission.code, name: permission.name, resource: permission.resource, action: permission.action, fieldsText: permission.fields?.join(', ') ?? '', enabled: permission.enabled }
    : { code: '', name: '', resource: '', action: 'read', fieldsText: '', enabled: true })
}, { immediate: true })

function submit() {
  const result = schema.safeParse(form)
  if (!result.success) return
  const fields = result.data.fieldsText.split(',').map(field => field.trim()).filter(Boolean)
  emit('submit', {
    code: result.data.code,
    name: result.data.name,
    resource: result.data.resource,
    action: result.data.action,
    fields: fields.length ? fields : null,
    enabled: result.data.enabled,
  })
}
</script>

<template>
  <AppDrawer v-model:open="open" :title="editing ? '编辑权限' : '创建权限'" description="资源、动作和字段范围必须与后端 CASL 资源声明一致。">
    <UAlert v-if="error" class="mb-4" color="error" variant="soft" title="保存失败" :description="error" />
    <UForm :state="form" :schema="schema" class="space-y-4" @submit="submit">
      <UFormField name="code" label="权限编码" required>
        <UInput v-model="form.code" class="w-full" :disabled="editing" placeholder="例如 users:read" />
      </UFormField>
      <UFormField name="name" label="权限名称" required>
        <UInput v-model="form.name" class="w-full" placeholder="例如 查看用户" />
      </UFormField>
      <UFormField name="resource" label="资源标识" required>
        <UInput v-model="form.resource" class="w-full" placeholder="例如 users" />
      </UFormField>
      <UFormField name="action" label="动作" required>
        <USelect v-model="form.action" class="w-full" :items="actionOptions" />
      </UFormField>
      <UFormField name="fieldsText" label="字段范围" description="留空表示全部字段；限定字段请用英文逗号分隔。">
        <UInput v-model="form.fieldsText" class="w-full" placeholder="例如 nickname, photo" />
      </UFormField>
      <UFormField name="enabled" label="状态">
        <USwitch v-model="form.enabled" :label="form.enabled ? '启用' : '停用'" />
      </UFormField>
    </UForm>
    <template #footer>
      <div class="flex gap-2">
        <UButton :label="editing ? '保存修改' : '创建权限'" :loading="pending" @click="submit" />
        <UButton label="取消" color="neutral" variant="outline" :disabled="pending" @click="open = false" />
      </div>
    </template>
  </AppDrawer>
</template>
