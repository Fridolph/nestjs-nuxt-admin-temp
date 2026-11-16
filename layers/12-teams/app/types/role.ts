export interface RoleRow {
  roleId: number
  roleName: string
  description: string
  roleCode: string
}

export interface RolesResponse {
  code: number
  data: RoleRow[]
}

export interface CreateRoleInput {
  roleName: string
  description: string
  roleCode: string
}

export type UpdateRoleInput = Partial<Pick<CreateRoleInput, 'roleName' | 'description'>>

export interface RoleMutationResult {
  code: number
  data: RoleRow | boolean
  msg?: string
}
