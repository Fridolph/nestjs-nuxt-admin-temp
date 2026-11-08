<script setup lang="ts">
defineProps<{
  type: "delete" | "default";
  title: string;
  description: string;
  pending: boolean;
  error?: string | null;
}>();
const emit = defineEmits<{ confirm: [] }>();
const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="!pending"
    :close="!pending"
    :ui="{ footer: 'justify-end' }"
  >
    <template v-if="error" #body>
      <UAlert v-if="error" color="error" variant="soft" :title="type === 'delete' ? '删除失败' : '操作失败'" :description="error" />
    </template>
    <template #footer>
      <UButton label="取消" color="neutral" variant="outline" :disabled="pending" @click="open = false" />
      <UButton :label="type === 'delete' ? '确认删除' : '确认'" :color="type === 'delete' ? 'error' : 'primary'" :loading="pending" :disabled="pending" @click="emit('confirm')" />
    </template>
  </UModal>
</template>
