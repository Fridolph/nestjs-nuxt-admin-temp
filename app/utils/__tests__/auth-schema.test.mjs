import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "../auth-schema.ts";

test("登录表单使用用户名并拒绝空密码", () => {
  assert.equal(loginSchema.safeParse({ username: "abc", password: "password" }).success, false);
  assert.equal(loginSchema.safeParse({ username: "learner", password: "" }).success, false);
  assert.equal(loginSchema.safeParse({ username: "learner", password: "password!" }).success, true);
});

const registration = {
  username: "Learner", nickname: "学习者",
  password: "learning!123", confirmPassword: "learning!123",
};

test("注册表单验证用户名、可选昵称、密码长度和确认密码", () => {
  assert.equal(registerSchema.safeParse(registration).success, true);
  assert.equal(registerSchema.safeParse({ ...registration, username: "  " }).success, false);
  assert.equal(registerSchema.safeParse({ ...registration, nickname: "" }).success, true);
  assert.equal(registerSchema.safeParse({ ...registration, password: "123456", confirmPassword: "123456" }).success, false);
  const result = registerSchema.safeParse({ ...registration, confirmPassword: "different" });
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(result.error.issues[0]?.path, ["confirmPassword"]);
});
