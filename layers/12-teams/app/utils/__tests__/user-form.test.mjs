import assert from "node:assert/strict";
import test from "node:test";
import { createUserPayload, createUserSchema, passwordStrength, profileChanges, profileFormSchema } from "../user-form.ts";

const user = {
  id: 1,
  username: "alice",
  nickname: "Alice",
  profileId: 1,
  gender: 0,
  photo: "https://example.com/a.png",
  address: "北京",
};

const validCreateUser = {
  username: "alice",
  password: "secret123",
  confirmPassword: "secret123",
  roleIds: [3],
  nickname: "",
  gender: "",
  photo: "",
  address: "",
};

test("创建用户表单限制必填字段和长度", () => {
  assert.equal(createUserSchema.safeParse(validCreateUser).success, true);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, username: " " }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, username: "a".repeat(21) }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, password: "a".repeat(33) }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, password: "abc12" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, password: "123456" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, password: "abcdef" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, confirmPassword: "different" }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, roleIds: [] }).success, false);
  assert.equal(createUserSchema.safeParse({ ...validCreateUser, roleIds: [3, 3] }).success, false);
});

test("密码强度提示与提交门槛一致，确认密码不发送给后端", () => {
  assert.equal(passwordStrength("123456"), "低");
  assert.equal(passwordStrength("abc123"), "中");
  assert.equal(passwordStrength("abc123!@#$"), "高");
  assert.deepEqual(createUserPayload(createUserSchema.parse(validCreateUser)), {
    username: "alice",
    password: "secret123",
    roleIds: [3],
  });
});

test("编辑资料只提交变化字段，清空可空字段传 null", () => {
  const unchanged = profileFormSchema(user).parse({ nickname: "Alice", gender: "0", photo: user.photo, address: user.address });
  assert.deepEqual(profileChanges(user, unchanged), {});

  const edited = profileFormSchema(user).parse({ nickname: " Alice_2 ", gender: "", photo: "", address: "", bio: "尚未支持" });
  assert.deepEqual(profileChanges(user, edited), {
    nickname: "Alice_2",
    gender: null,
    photo: null,
    address: null,
  });
});

test("昵称规则与后端资料接口一致", () => {
  const form = { nickname: "中文_123", gender: "1", photo: "", address: "" };
  assert.equal(profileFormSchema(user).safeParse(form).success, true);
  assert.equal(profileFormSchema(user).safeParse({ ...form, nickname: "bad name" }).success, false);
  assert.equal(profileFormSchema(user).safeParse({ ...form, nickname: "" }).success, false);
});

test("历史无效昵称不变时仍可编辑其他资料", () => {
  const legacyUser = { ...user, nickname: "old name!" };
  const form = { nickname: legacyUser.nickname, gender: "0", photo: user.photo, address: "新地址" };
  assert.equal(profileFormSchema(legacyUser).safeParse(form).success, true);
  assert.deepEqual(profileChanges(legacyUser, form), { address: "新地址" });
});
