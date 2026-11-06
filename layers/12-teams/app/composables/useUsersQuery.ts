import { useQuery } from "@pinia/colada";
import type { ComputedRef } from "vue";

interface UserRow {
  id: number;
  username: string;
  nickname: string | null;
  profileId: number | null;
  gender: number | null;
  photo: string | null;
  address: string | null;
}

interface UsersResponse {
  code: number;
  pagination: {
    total: number;
    page: number;
    size: number;
  };
  data: UserRow[];
}

interface UsersQueryError {
  message: string;
}

export function useUsersQuery(page: ComputedRef<number>, size: ComputedRef<number>) {
  return useQuery<UsersResponse, UsersQueryError>({
    key: () => ["users", page.value, size.value],
    async query({ signal }) {
      try {
        return await $fetch<UsersResponse>("http://localhost:3000/api/v1/users", {
          query: { page: page.value, size: size.value },
          signal,
        });
      } catch (cause) {
        const responseMessage = (cause as { data?: { message?: unknown } })?.data?.message;
        throw {
          message: typeof responseMessage === "string"
            ? responseMessage
            : cause instanceof Error ? cause.message : "请求失败，请稍后重试",
        } satisfies UsersQueryError;
      }
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ssrCatchError: true,
  });
}
