/**
 * 团队用户域的领域类型。
 *
 * @remarks
 * 这些类型同时被请求层（`composables/useUsers.ts`）、表单层（`utils/user-form.ts`）、
 * 组件与页面使用。集中在一处，可以避免“表单层反过来依赖 composable”的循环引用，
 * 也让后端字段变更时只有一处需要跟进。
 */

/** 用户列表的一行：后端 `user LEFT JOIN profile` 的扁平结果。 */
export interface UserRow {
  id: number;
  username: string;
  nickname: string | null;
  profileId: number | null;
  gender: number | null;
  photo: string | null;
  address: string | null;
}

/** 后端用户列表响应：业务码 + 分页信息 + 当前页数据。 */
export interface UsersPage {
  code: number;
  pagination: {
    total: number;
    page: number;
    size: number;
  };
  data: UserRow[];
}

/** 用户列表查询参数。它既是请求参数，也是缓存 key 的一部分。 */
export interface UsersQuery {
  page: number;
  size: number;
}

/** 写操作（创建 / 更新 / 删除）的统一响应体。 */
export interface MutationResult {
  code: number;
  data: boolean;
  /** 创建接口的历史字段名。 */
  msg?: string;
  /** 更新、删除接口的历史字段名。 */
  message?: string;
}

/** 创建用户时提交给后端的载荷（已去掉仅用于前端校验的 confirmPassword）。 */
export interface CreateUserInput {
  username: string;
  password: string;
  roleIds: number[];
  nickname?: string;
  gender?: 0 | 1;
  photo?: string;
  address?: string;
}

/** 资料 PATCH 只提交变化字段；可空字段用 `null` 表示清空。 */
export type ProfileChanges = Partial<{
  nickname: string;
  gender: 0 | 1 | null;
  photo: string | null;
  address: string | null;
}>;

/** 用户抽屉的提交事件：创建与编辑的判别联合。 */
export type UserDrawerPayload =
  | { mode: "create"; data: CreateUserInput }
  | { mode: "edit"; id: number; data: ProfileChanges };
