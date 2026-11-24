import { z } from "zod";

const username = z.string().trim().min(4, "至少输入 4 个字符的用户名").max(20, "用户名最多 20 个字符");
const password = z
  .string()
  .min(6, "密码至少 6 位")
  .max(32, "密码最多 32 个字符")
  .refine(value => [/[A-Za-z]/, /\d/, /[^A-Za-z0-9\s]/].filter(pattern => pattern.test(value)).length >= 2, {
    message: "密码不能只用数字或字母，请组合至少两类字符",
  });

export const loginSchema = z.object({
  username,
  password,
});

export const registerSchema = z.object({
  username,
  nickname: z.string().trim().min(2, "昵称最少 2 个字符").max(20, "昵称最多 20 个字符").regex(/^[A-Za-z0-9_\p{Script=Han}]+$/u, "昵称只能包含中文、英文字母、数字和下划线").optional().or(z.literal("")),
  password,
  confirmPassword: z.string().min(1, "请再次输入密码"),
}).refine(data => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export type LoginCredentials = z.output<typeof loginSchema>;
export type RegisterCredentials = z.output<typeof registerSchema>;

export interface AuthResponseData {
  userId: number;
  username: string;
  accessToken: string;
  tokenType: "Bearer";
  /** 一个用户对应一个角色，权限列表由服务端另行查询。 */
  roleId: number;
}
/** 登录状态只保留身份字段，与登录、注册、续期响应共用单角色类型。 */
export type AuthUser = Pick<AuthResponseData, "userId" | "username" | "roleId">;
export interface AuthResponse { code: number; data: AuthResponseData; msg: string }
