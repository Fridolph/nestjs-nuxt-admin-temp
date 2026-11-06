<script setup lang="ts">
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

const { data, error, isPending, isLoading, refetch } = useUsersQuery(page, size);
const users = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.pagination.total ?? 0);
const firstItem = computed(() => (total.value ? (page.value - 1) * size.value + 1 : 0));
const lastItem = computed(() => Math.min(page.value * size.value, total.value));

const columns = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "username", header: "用户名" },
  { accessorKey: "nickname", header: "昵称" },
  { accessorKey: "gender", header: "性别" },
  { accessorKey: "address", header: "地址" },
];

const tableData = computed(() => users.value.map((user) => ({
  ...user,
  nickname: user.nickname || "—",
  gender: user.gender === 0 ? "女" : user.gender === 1 ? "男" : "—",
  address: user.address || "—",
})));

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

watch(data, (response) => {
  if (import.meta.server || !response || response.pagination.page !== page.value) return;
  const lastPage = Math.max(1, Math.ceil(response.pagination.total / size.value));
  if (page.value > lastPage) void goToPage(lastPage);
}, { immediate: true });
</script>

<template>
  <div class="content-pad">
    <h1 class="text-xl font-semibold tracking-tight text-highlighted">用户列表</h1>
    <p class="mt-2 text-sm text-muted">
      查看后端返回的用户及资料，按页加载。
    </p>

    <div class="mt-6 flex items-center justify-between gap-3">
      <p class="text-sm text-muted">共 {{ total }} 条用户</p>
      <UButton
        label="刷新"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        :loading="isLoading"
        @click="refetch()"
      />
    </div>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      title="用户列表加载失败"
      :description="error.message"
    />

    <UTable
      v-if="!error || users.length > 0"
      :loading="isLoading"
      loading-color="primary"
      loading-animation="carousel"
      :columns="columns"
      :data="tableData"
      class="mt-4 w-full"
    />

    <p v-if="!isPending && !error && users.length === 0" class="mt-4 text-sm text-muted">
      暂无用户数据。
    </p>

    <div v-if="!error || users.length > 0" class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-muted">显示 {{ firstItem }}–{{ lastItem }} 条，共 {{ total }} 条</p>
      <div class="flex flex-wrap items-center gap-3">
        <label for="users-page-size" class="text-sm text-muted">每页</label>
        <USelect
          id="users-page-size"
          :items="pageSizeOptions"
          :model-value="size"
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
  </div>
</template>
