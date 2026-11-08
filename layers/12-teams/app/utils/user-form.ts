import { z } from "zod";
import type { CreateUserInput, ProfileChanges, UserRow } from "../types/user";

export function passwordStrength(password: string) {
  const categories = [/[A-Za-z]/, /\d/, /[^A-Za-z0-9\s]/].filter(pattern => pattern.test(password)).length;
  if (password.length < 6 || categories < 2) return "低";
  return password.length >= 10 && categories === 3 ? "高" : "中";
}

export const createUserSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名").max(20, "用户名最多 20 个字符"),
  password: z.string().min(6, "密码至少 6 位").max(32, "密码最多 32 个字符")
    .refine(value => passwordStrength(value) !== "低", "密码不能只用数字或字母，请组合至少两类字符"),
  confirmPassword: z.string().min(1, "请再次输入密码"),
  roleIds: z.array(z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]))
    .min(1, "请至少选择一个角色")
    .refine(ids => new Set(ids).size === ids.length, "角色不能重复"),
  nickname: z.union([z.literal(""), z.string().trim().min(1).max(20)
    .regex(/^[A-Za-z0-9_\p{Script=Han}]+$/u, "昵称只能包含中文、英文字母、数字和下划线")]),
  gender: z.enum(["", "0", "1"]),
  photo: z.string().max(512, "照片地址最多 512 个字符"),
  address: z.string().max(120, "地址最多 120 个字符"),
}).refine(value => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "两次输入的密码不一致",
});

const nicknameSchema = z.string().trim().min(1, "请输入昵称").max(20, "昵称最多 20 个字符")
  .regex(/^[A-Za-z0-9_\p{Script=Han}]+$/u, "昵称只能包含中文、英文字母、数字和下划线");

export const profileFormSchema = (user: Pick<UserRow, "nickname">) => z.object({
  nickname: z.string().refine(
    value => value === (user.nickname ?? "") || nicknameSchema.safeParse(value).success,
    "昵称不能为空，最多 20 个字符，且只能包含中文、英文字母、数字和下划线",
  ),
  gender: z.enum(["", "0", "1"]),
  photo: z.string().max(512, "照片地址最多 512 个字符"),
  address: z.string().max(120, "地址最多 120 个字符"),
});

export type CreateUserForm = z.output<typeof createUserSchema>;
export type ProfileFormInput = z.output<ReturnType<typeof profileFormSchema>>;

export function createUserPayload(input: CreateUserForm): CreateUserInput {
  return {
    username: input.username,
    password: input.password,
    roleIds: input.roleIds,
    ...(input.nickname ? { nickname: input.nickname } : {}),
    ...(input.gender ? { gender: Number(input.gender) as 0 | 1 } : {}),
    ...(input.photo ? { photo: input.photo } : {}),
    ...(input.address ? { address: input.address } : {}),
  };
}

export function profileChanges(user: UserRow, input: ProfileFormInput): ProfileChanges {
  const changes: ProfileChanges = {};
  const nickname = input.nickname.trim();
  if (nickname !== user.nickname && input.nickname !== (user.nickname ?? "")) changes.nickname = nickname;

  const gender = input.gender === "" ? null : Number(input.gender) as 0 | 1;
  if (gender !== user.gender) changes.gender = gender;

  const photo = input.photo || null;
  if (photo !== user.photo) changes.photo = photo;

  const address = input.address || null;
  if (address !== user.address) changes.address = address;

  return changes;
}
