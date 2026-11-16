<script setup lang="ts">
import { z } from 'zod'
import type { RoleRow } from '../types/role'

const props = defineProps<{ role: RoleRow | null; pending?: boolean; error?: string | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ submit: [data: { roleName: string; description: string; roleCode: string }] }>()
const isEditing = computed(() => !!props.role)
const form = reactive({ roleName: '', description: '', roleCode: '' })
const schema = z.object({
  roleName: z.string().trim().min(1, '请输入角色名称').max(32, '角色名称最多 32 个字符'),
  description: z.string().trim().max(255, '角色描述最多 255 个字符'),
  roleCode: z.string().trim().min(1, '请输入角色编码').max(32, '角色编码最多 32 个字符').regex(/^[a-z][a-z0-9_]*$/, '只能使用小写字母、数字和下划线'),
})
watch(() => [open.value, props.role] as const, ([visible, role]) => {
  if (visible) Object.assign(form, role ? { roleName: role.roleName, description: role.description, roleCode: role.roleCode } : { roleName: '', description: '', roleCode: '' })
}, { immediate: true })
function submit() {
  const result = schema.safeParse(form)
  if (result.success) emit('submit', result.data)
}
</script>
<template>
  <AppDrawer v-model:open="open" :title="isEditing ? '编辑角色' : '创建新角色'">
    <template #header><div><h2 class="text-base font-semibold">{{ isEditing ? '编辑角色' : '创建新角色' }}</h2><p class="mt-1 text-sm text-muted">角色编码用于权限判断，创建后不可修改。</p></div></template>
    <UAlert v-if="error" class="mb-4" color="error" variant="soft" title="保存失败" :description="error" />
    <UForm :state="form" :schema="schema" class="space-y-4" @submit="submit">
      <UFormField name="roleCode" label="角色编码" required><UInput v-model="form.roleCode" class="w-full" :disabled="isEditing" placeholder="例如 content_editor" /></UFormField>
      <UFormField name="roleName" label="角色名称" required><UInput v-model="form.roleName" class="w-full" placeholder="请输入角色名称" /></UFormField>
      <UFormField name="description" label="角色描述"><UTextarea v-model="form.description" class="w-full" :rows="4" placeholder="描述该角色拥有的能力" /></UFormField>
    </UForm>
    <template #footer><div class="flex gap-2"><UButton :label="isEditing ? '保存修改' : '创建角色'" :loading="pending" @click="submit" /><UButton label="取消" color="neutral" variant="outline" :disabled="pending" @click="open = false" /></div></template>
  </AppDrawer>
</template>
