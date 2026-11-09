<script setup lang="ts">
import type { UserDrawerPayload, UserRow } from "../types/user";
import {
  createUserSchema,
  createUserPayload,
  passwordStrength,
  profileChanges,
  profileFormSchema,
} from "../utils/user-form";

const props = defineProps<{
  user: UserRow | null;
  pending: boolean;
  error: string | null;
}>();
const emit = defineEmits<{
  submit: [payload: UserDrawerPayload];
}>();
const open = defineModel<boolean>("open", { required: true });
const form = reactive({ username: "", password: "", confirmPassword: "", roleIds: [] as (2 | 3 | 4 | 5)[], nickname: "", gender: "" as "" | "0" | "1", photo: "", address: "", bio: "" });
const notice = shallowRef("");
const passwordVisible = shallowRef(false);
const confirmPasswordVisible = shallowRef(false);
const schema = computed(() => props.user ? profileFormSchema(props.user) : createUserSchema);
const selectedRoles = computed({
  get: () => form.roleIds.map(String),
  set: values => { form.roleIds = values.map(value => Number(value) as 2 | 3 | 4 | 5); },
});
const strength = computed(() => passwordStrength(form.password));
const strengthColor = computed(() => strength.value === "高" ? "text-success" : strength.value === "中" ? "text-warning" : "text-error");
const genderOptions = [
  { label: "女", value: "0" },
  { label: "男", value: "1" },
];
const roleOptions = [
  { label: "管理员", value: "2" },
  { label: "普通用户", value: "3" },
  { label: "高级用户", value: "4" },
  { label: "访客", value: "5" },
];

watch([open, () => props.user], ([isOpen, user]) => {
  if (!isOpen) return;
  Object.assign(form, {
    username: "",
    password: "",
    confirmPassword: "",
    roleIds: [],
    nickname: user?.nickname ?? "",
    gender: user?.gender == null ? "" : String(user.gender),
    photo: user?.photo ?? "",
    address: user?.address ?? "",
    bio: "",
  });
  notice.value = "";
  passwordVisible.value = false;
  confirmPasswordVisible.value = false;
});

function submit() {
  if (props.pending) return;
  notice.value = "";
  if (!props.user) {
    emit("submit", { mode: "create", data: createUserPayload(createUserSchema.parse(form)) });
    return;
  }

  const data = profileChanges(props.user, profileFormSchema(props.user).parse(form));
  if (!Object.keys(data).length) {
    notice.value = "资料没有变化，无需保存。";
    return;
  }
  emit("submit", { mode: "edit", id: props.user.userId, data });
}
</script>

<template>
  <AppDrawer
    v-model:open="open"
    :closable="!pending"
    :title="user ? `编辑用户 · ${user.username}` : '创建新用户'"
    :description="user ? '只更新用户资料，用户名不可修改。' : '创建用户并初始化默认资料。'"
  >
    <div>
      <UForm id="user-form" :schema="schema" :state="form" class="space-y-4" @submit="submit">
        <template v-if="!user">
          <UFormField name="username" label="用户名" required>
            <UInput v-model="form.username" autocomplete="off" class="w-full" />
          </UFormField>
          <UFormField name="password" label="密码" required>
            <UInput v-model="form.password" :type="passwordVisible ? 'text' : 'password'" autocomplete="new-password" class="w-full">
              <template #trailing>
                <UButton
                  :icon="passwordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
                  color="neutral"
                  variant="link"
                  size="sm"
                  @click="passwordVisible = !passwordVisible"
                />
              </template>
            </UInput>
            <p v-if="form.password" class="mt-1 text-xs" :class="strengthColor">密码强度：{{ strength }}。至少 6 位，并组合字母、数字或符号中的两类。</p>
          </UFormField>
          <UFormField name="confirmPassword" label="确认密码" required>
            <UInput v-model="form.confirmPassword" :type="confirmPasswordVisible ? 'text' : 'password'" autocomplete="new-password" class="w-full">
              <template #trailing>
                <UButton
                  :icon="confirmPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="confirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'"
                  color="neutral"
                  variant="link"
                  size="sm"
                  @click="confirmPasswordVisible = !confirmPasswordVisible"
                />
              </template>
            </UInput>
          </UFormField>
          <UFormField name="roleIds" label="用户角色" required>
            <UCheckboxGroup v-model="selectedRoles" :items="roleOptions" value-key="value" class="w-full" />
          </UFormField>
        </template>
        <div>
          <UFormField name="nickname" label="昵称" :required="!!user" :description="user ? undefined : '可选，留空时使用用户名。'">
            <UInput v-model="form.nickname" class="w-full" />
          </UFormField>
          <UFormField name="gender" label="性别">
            <URadioGroup v-model="form.gender" :items="genderOptions" orientation="horizontal" />
          </UFormField>
          <UFormField name="photo" label="照片地址" description="清空后保存会移除照片地址。">
            <UInput v-model="form.photo" class="w-full" />
          </UFormField>
          <UFormField name="address" label="地址" description="清空后保存会移除地址。">
            <UInput v-model="form.address" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="个人简介" description="后端暂未提供该字段，当前不可保存。">
          <UTextarea v-model="form.bio" class="w-full" :rows="3" disabled placeholder="等待后端接口支持" />
        </UFormField>
      </UForm>
      <UAlert v-if="notice" class="mt-4" color="neutral" variant="soft" :description="notice" />
      <UAlert v-if="error" class="mt-4" color="error" variant="soft" title="保存失败" :description="error" />
    </div>
    <template #footer>
      <div class="flex gap-2">
        <UButton type="submit" form="user-form" :label="user ? '保存资料' : '创建用户'" :loading="pending" :disabled="pending" />
        <UButton label="取消" color="neutral" variant="outline" :disabled="pending" @click="open = false" />
      </div>
    </template>
  </AppDrawer>
</template>
