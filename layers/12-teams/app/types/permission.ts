/** 分组目录中的单条权限明细；Date 经 JSON 序列化后为字符串。 */
export interface PermissionRow {
  id: number
  code: string
  name: string
  resource: string
  action: string
  enabled: boolean
  fields: string[] | null
  createdAt: string
  updatedAt: string
}

export interface PermissionsResponse {
  code: number
  data: PermissionGroup[]
}

/** 管理端按资源分组的目录行；每个动作仍保留独立权限记录。 */
export interface PermissionGroup {
  resource: string
  name: string
  actions: string[]
  permissions: PermissionRow[]
}

/** GET /permissions/me 返回的当前用户有效权限，不包含目录主键和展示名称。 */
export interface EffectivePermission {
  code: string
  resource: string
  action: string
  fields: string[] | null
}

export interface EffectivePermissionsResponse {
  code: number
  data: EffectivePermission[]
}

/** 权限目录写入载荷；超管的 all:manage 不可通过此接口创建。 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export'

export interface CreatePermissionInput {
  code: string
  name: string
  resource: string
  action: PermissionAction
  fields: string[] | null
  enabled: boolean
}

export type UpdatePermissionInput = Partial<Omit<CreatePermissionInput, 'code'>>

export interface PermissionMutationResult {
  code: number
  data: PermissionRow | boolean
  msg?: string
}
