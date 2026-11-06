import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, "请输入姓名").max(50, "姓名最多 50 个字符"),
  password: z.string().min(8, "密码至少 8 位").max(128, "密码最多 128 位"),
  confirmPassword: z.string().min(1, "请再次输入密码"),
}).refine(data => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export type LoginCredentials = z.output<typeof loginSchema>;
export type RegisterCredentials = z.output<typeof registerSchema>;
