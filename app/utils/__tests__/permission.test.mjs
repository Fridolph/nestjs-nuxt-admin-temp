import assert from "node:assert/strict";
import test from "node:test";
import { canAccess, roleIds } from "../permission.ts";

test("未加载身份或无效权限要求时默认拒绝", () => {
  assert.equal(canAccess(null, "user:delete"), false);
  assert.equal(canAccess({ roleIds: [], permissions: [] }, "user:delete"), false);
  assert.equal(canAccess({ roleIds: [roleIds.superAdmin], permissions: [] }, ""), false);
  assert.equal(canAccess({ roleIds: [roleIds.superAdmin], permissions: [] }, []), false);
});

test("超管拥有全部有效权限，其余角色只使用明确授权的权限码", () => {
  assert.equal(canAccess({ roleIds: [roleIds.superAdmin], permissions: [] }, "user:delete"), true);
  assert.equal(canAccess({ roleIds: [roleIds.admin], permissions: [] }, "user:delete"), false);
  assert.equal(canAccess({ roleIds: [roleIds.user], permissions: ["user.profile:edit"] }, "user.profile:edit"), true);
});

test("支持全部满足和任一满足的权限组合", () => {
  const context = { roleIds: [roleIds.admin], permissions: ["user.profile:edit", "user:read"] };
  assert.equal(canAccess(context, ["user.profile:edit", "user:read"]), true);
  assert.equal(canAccess(context, ["user.profile:edit", "user:delete"]), false);
  assert.equal(canAccess(context, { all: ["user:read"], any: ["user:delete", "user.profile:edit"] }), true);
  assert.equal(canAccess(context, { any: ["user:delete"] }), false);
});
