import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "../auth-schema.ts";

test("登录表单拒绝无效邮箱和空密码", () => {
  assert.equal(loginSchema.safeParse({ email: "invalid", password: "password" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "learner@example.com", password: "" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "learner@example.com", password: "password" }).success, true);
});

const registration = {
  name: "Learner", email: "learner@example.com",
  password: "learning123", confirmPassword: "learning123",
};

test("注册表单验证姓名、密码长度和确认密码", () => {
  assert.equal(registerSchema.safeParse(registration).success, true);
  assert.equal(registerSchema.safeParse({ ...registration, name: "  " }).success, false);
  assert.equal(registerSchema.safeParse({ ...registration, password: "short", confirmPassword: "short" }).success, false);
  const result = registerSchema.safeParse({ ...registration, confirmPassword: "different" });
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(result.error.issues[0]?.path, ["confirmPassword"]);
});
