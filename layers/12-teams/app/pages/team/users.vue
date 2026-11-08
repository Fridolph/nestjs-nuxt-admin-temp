<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui/components/Table.vue";
import { useUsers } from "../../composables/useUsers";
import type { UserDrawerPayload, UserRow } from "../../types/user";

definePageMeta({
  layout: "has-sidebar",
  title: "Users",
});

const route = useRoute();
const pageSizes = [5, 10, 20, 50];
const pageSizeOptions = pageSizes.map((value) => ({ label: `${value} 条`, value }));

function positiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const page = computed(() => positiveInteger(route.query.page, 1));
const size = computed(() => {
  const requested = positiveInteger(route.query.size, 10);
  return pageSizes.includes(requested) ? requested : 10;
});

// 页面只做编排：URL ⇄ 查询参数、抽屉/弹窗开关。
// 数据状态、写操作、缓存失效全部由 useUsers 负责。
const {
  users,
  total,
  displayPage,
  displaySize,
  error,
  isInitialLoading,
  loading,
  isEmpty,
  refetch,
  createUser,
  updateUserProfile,
  deleteUser,
  saving,
  saveError,
  deleting,
  deleteError,
} = useUsers({ page, size });

// 纯展示计算：把分页信息格式化成「显示 1–5 条」。
const firstItem = computed(() => (total.value ? (displayPage.value - 1) * displaySize.value + 1 : 0));
const lastItem = computed(() => Math.min(displayPage.value * displaySize.value, total.value));

const columns: TableColumn<UserRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "username", header: "用户名" },
  { accessorKey: "nickname", header: "昵称" },
  { accessorKey: "gender", header: "性别" },
  { accessorKey: "address", header: "地址" },
  { id: "actions", header: "操作" },
];

const drawerOpen = shallowRef(false);
const editingUser = shallowRef<UserRow | null>(null);
const confirmOpen = shallowRef(false);
const deletingUser = shallowRef<UserRow | null>(null);

function openDrawer(user: UserRow | null) {
  editingUser.value = user;
  // reset 清掉上一次的错误与状态，避免旧错误串到新一次提交
  createUser.reset();
  updateUserProfile.reset();
  drawerOpen.value = true;
}

async function saveUser(payload: UserDrawerPayload) {
  if (saving.value) return;
  try {
    if (payload.mode === "create") await createUser.mutateAsync(payload.data);
    else await updateUserProfile.mutateAsync({ id: payload.id, data: payload.data });
  } catch {
    // 错误已写入 mutation.error，由 saveError 渲染；这里只需保持抽屉打开
    return;
  }
  drawerOpen.value = false;
}

function startDelete(user: UserRow) {
  deletingUser.value = user;
  deleteUser.reset();
  confirmOpen.value = true;
}

async function confirmDelete() {
  if (!deletingUser.value || deleting.value) return;
  try {
    await deleteUser.mutateAsync(deletingUser.value.id);
  } catch {
    // 删除失败时保留弹窗，让 deleteError 就地展示；只有成功才关闭
    return;
  }
  confirmOpen.value = false;
  deletingUser.value = null;
}

function goToPage(nextPage: number, nextSize = size.value) {
  return navigateTo({
    path: route.path,
    query: {
      ...route.query,
      page: nextPage === 1 ? undefined : String(nextPage),
      size: nextSize === 10 ? undefined : String(nextSize),
    },
  });
}

function changeSize(nextSize: number) {
  return goToPage(1, nextSize);
}

watch([displayPage, total], ([dataPage, totalCount]) => {
  // 只在“数据确实属于当前 URL 页”时兜底：placeholderData 期间 displayPage 还是旧页，不能据此跳页
  if (import.meta.server || dataPage !== page.value || totalCount === 0) return;
  const lastPage = Math.max(1, Math.ceil(totalCount / displaySize.value));
  if (dataPage > lastPage) void goToPage(lastPage);
}, { immediate: true });
</script>

<template>
  <div class="content-pad">
    <h1 class="text-xl font-semibold tracking-tight text-highlighted">用户列表</h1>
    <p class="mt-2 text-sm text-muted">
      查看后端返回的用户及资料，按页加载。
    </p>

    <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-muted">共 {{ total }} 条用户</p>
      <div class="flex flex-wrap gap-2">
        <UButton label="创建新用户" icon="i-lucide-plus" @click="openDrawer(null)" />
        <UButton
          label="刷新"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="loading"
          @click="refetch()"
        />
      </div>
    </div>

    <div v-if="error" class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <UAlert
        class="flex-1"
        color="error"
        variant="soft"
        title="用户列表加载失败"
        :description="error.message"
      />
      <UButton label="重试" icon="i-lucide-rotate-cw" color="error" variant="subtle" :loading="loading" @click="refetch()" />
    </div>

    <!-- 首次加载：骨架屏。此时还没有任何数据，渲染空表格会造成“闪一下表头” -->
    <div v-if="isInitialLoading" class="mt-4 space-y-2" aria-busy="true" aria-live="polite">
      <span class="sr-only">正在加载用户列表</span>
      <USkeleton v-for="row in 5" :key="row" class="h-12 w-full" />
    </div>

    <!-- 翻页/刷新：保留旧数据，用表格自带的 loading 提示，不闪空 -->
    <UTable
      v-else-if="!error || users.length > 0"
      :loading="loading"
      :aria-busy="loading"
      loading-color="primary"
      loading-animation="carousel"
      :columns="columns"
      :data="users"
      class="mt-4 w-full overflow-x-auto"
    >
      <template #nickname-cell="{ row }">{{ row.original.nickname || "—" }}</template>
      <template #gender-cell="{ row }">{{ row.original.gender === 0 ? "女" : row.original.gender === 1 ? "男" : "—" }}</template>
      <template #address-cell="{ row }">{{ row.original.address || "—" }}</template>
      <template #actions-cell="{ row }">
        <div class="flex items-center gap-1 whitespace-nowrap">
          <UButton icon="i-lucide-pencil" aria-label="编辑用户" color="neutral" variant="ghost" size="sm" @click="openDrawer(row.original)" />
          <UButton icon="i-lucide-trash-2" aria-label="删除用户" color="error" variant="ghost" size="sm" @click="startDelete(row.original)" />
        </div>
      </template>
    </UTable>

    <p v-else-if="isEmpty" class="mt-4 text-sm text-muted">
      暂无用户数据。
    </p>

    <div v-if="!isInitialLoading && (!error || users.length > 0)" class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-muted">显示 {{ firstItem }}–{{ lastItem }} 条，共 {{ total }} 条</p>
      <div class="flex flex-wrap items-center gap-3">
        <label for="users-page-size" class="text-sm text-muted">每页</label>
        <USelect
          id="users-page-size"
          :items="pageSizeOptions"
          :model-value="size"
          size="sm"
          class="w-24"
          @update:model-value="changeSize"
        />
        <div v-if="total > 0" class="max-w-full overflow-x-auto">
          <UPagination
            :page="page"
            :items-per-page="size"
            :total="total"
            :sibling-count="1"
            size="sm"
            @update:page="goToPage"
          />
        </div>
      </div>
    </div>
    <UserDrawer v-model:open="drawerOpen" :user="editingUser" :pending="saving" :error="saveError" @submit="saveUser" />
    <ConfirmModal
      v-model:open="confirmOpen"
      type="delete"
      :title="`删除用户 · ${deletingUser?.username ?? ''}`"
      description="删除后无法恢复，确定继续吗？"
      :pending="deleting"
      :error="deleteError"
      @confirm="confirmDelete"
    />
  </div>
</template>
