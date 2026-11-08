# nestjs-nuxt-admin-temp

`nestjs-server-temp` 的配套管理后台学习项目。复用 [dao-monorepo-temp/apps/admin](https://github.com/Fridolph/dao-monorepo-temp/tree/main/apps/admin) 的布局、路由和认证页面风格，独立安装和运行。

登录、注册目前只迁移界面：表单仅校验并显示提示，不发送接口请求、不创建账号、不保存登录状态。Dashboard 统计仍为示例，`/team/users` 已连接本地后端并支持创建、编辑资料和删除；Projects / Team / Settings 其余页面保留原有占位内容。

## 开始使用

推荐 Node.js 24.22+（Nuxt 4.6.3 要求 `^22.22.3 || ^24.15.0 || >=26`）和 pnpm 12.16.1。

```bash
cd ~/Desktop/github/AI-Journey-Fighting/nestjs-nuxt-admin-temp
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

打开 <http://localhost:3050>；首页和登录注册页面不需要后端，访问 `/team/users` 前请先启动 `nestjs-server-temp` 并确认其监听 3000 端口。
`.env` 中的 `NUXT_PUBLIC_API_BASE` 是公开的后端 API 根地址，默认值为 `http://localhost:3000/api/v1`。修改后重启 Nuxt；浏览器直接调用后端时，后端仍需允许来自 `http://localhost:3050` 的跨域请求。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

`preview` 使用同一个 3050 端口，运行前先停止开发服务。本目录有自己的 `pnpm-workspace.yaml` 和锁文件，可以从父学习仓库中移出，作为独立 Git 仓库运行。

## 技术栈与职责

- Nuxt **4.6.3** / Vue 3：文件路由、SSR、Layouts、Layers。
- Nuxt UI 4 / Tailwind CSS 4：沿用原后台视觉、可折叠侧栏、深浅主题、移动端菜单。
- Pinia：`app/stores/admin.ts` 管理侧栏开关和折叠状态，不涉及登录。
- Pinia Colada：`/team/users` 使用 `useQuery` 按页缓存用户列表，写入后使列表缓存失效；登录注册仍只迁移界面。
- Zod：登录邮箱必填校验；注册姓名、邮箱、密码长度与确认密码校验。
- Nuxt ESLint / vue-tsc / Node Test Runner：静态检查和表单验证测试。

## 路由

| 路径 | 用途 |
| --- | --- |
| `/` | Dashboard 示例 |
| `/login` | 登录界面；提交只提示校验通过 |
| `/register` | 注册界面；提交只提示校验通过 |
| `/projects`、`/projects/recent` | 项目路由骨架 |
| `/team/users` | 用户列表，连接本地后端的分页查询、创建、资料编辑和删除 |
| `/team/members`、`/team/roles` | 团队路由骨架 |
| `/settings` | 跳转 `/settings/company` |
| `/settings/company`、`/settings/team` | 含二级导航的设置页面 |
| `/help`、`/release-notes` | 帮助与本次迁移说明 |

登录注册页面通过“浏览后台演示”访问首页，二者互相提供跳转链接。原登录页的忘记密码链接没有对应实现，此次未保留该入口。

## 目录与扩展位置

```text
app/
  app.vue                    # UApp → NuxtLayout → NuxtPage
  app.config.ts              # Nuxt UI 主题（violet / slate）
  components/admin/          # 侧栏、顶部栏、用户菜单
  components/auth/           # 分栏布局、登录及注册表单
  components/dashboard/      # 首页示例内容
  config/admin-navigation.ts # 品牌及主导航
  layouts/                   # has-sidebar / docs / empty
  pages/                     # 首页、认证界面、帮助
  plugins/api.ts             # 传输层：baseURL、请求头、错误归一化 → $api
  stores/admin.ts            # Pinia 布局状态
  utils/auth-schema.ts       # 表单校验与输入类型
  utils/__tests__/           # 校验边界测试
layers/
  11-projects/               # 项目页面
  12-teams/
    app/components/          # UserDrawer 等用户功能组件
    app/composables/useUsers.ts  # users 资源统一入口：列表查询 + 三个写操作
    app/pages/team/          # 团队与用户列表页面
    app/types/user.ts        # 领域类型（UserRow / CreateUserInput / …）
    app/utils/user-form.ts   # 表单 Schema 与载荷构造
  13-settings/               # 设置父子路由与二级导航
```

Nuxt 自动发现本地 `layers/`。新增页面时可复用：

```vue
<script setup lang="ts">
definePageMeta({ layout: 'has-sidebar', title: '新页面' })
</script>

<template>
  <div class="content-pad">页面内容</div>
</template>
```

然后在 `app/config/admin-navigation.ts` 补充菜单项。路由页面负责组装，较复杂的界面拆到对应功能组件中。

`/team/users` 需要本地后端在 `http://localhost:3000` 提供用户查询、创建、资料更新和删除接口。页码和每页条数保存在 URL 查询参数中；列表数据按参数分别缓存，60 秒内返回同一页直接复用缓存，离开后最多保留 10 分钟。创建、编辑和删除成功后会主动使用户列表缓存失效并刷新。资料编辑只提交变化字段；个人简介目前在创建和编辑抽屉中预留，禁用且不提交，等待后端字段与接口支持。
请求分三层，各管一件事：

- `app/plugins/api.ts`：唯一创建 HTTP 客户端的地方，只做 baseURL、公共请求头、错误归一化，产物是 `$api`。它不认识任何业务 URL。
- `layers/12-teams/app/composables/useUsers.ts`：`users` 资源的统一入口。内部同时包含列表查询（`key`、`placeholderData`、`staleTime`、`gcTime`）与三个写操作（成功提示、`['users', ...]` 缓存失效），并对外暴露 `users` / `total` / `isInitialLoading` / `loading` / `isEmpty` / `error` / `saving` / `saveError` / `deleting` / `deleteError` 等派生状态。
- `layers/12-teams/app/types/user.ts`：领域类型。放在独立文件是为了避免 `utils/user-form.ts` 反向依赖 composable 形成循环引用。

没有单列 `api/users.ts` 领域层：目前每个接口只有一个调用点，抽出去只是把 URL 从 A 文件搬到 B 文件，并未消除重复。**约定：同一接口出现第二个调用点时（详情页、hover 预取、服务端 loader）再抽。** 同样地，查询与写操作合并在一个 composable，是因为它们共享"写成功必须让列表失效"这段私有逻辑；当 `users` 之外出现第二个资源，或动作继续膨胀时再拆。

原有的 `useApi()`（把 `get/post/patch/remove` 原样转发一层）已移除：它不携带任何领域信息，调用方仍要手写 URL 与类型。

加载与错误体验：首次加载（无缓存、无 SSR 数据）显示骨架屏；翻页与刷新保留旧数据，只用表格 loading 态提示；列表失败显示错误卡片并提供「重试」；创建/编辑/删除失败的错误就地显示在对应抽屉或确认弹窗里。创建用户可多选管理员、普通用户、高级用户或访客角色，并填写可选资料；后端创建接口会在事务中保存角色关联和资料。

## 权限预留

`app/composables/usePermission.ts` 提供 `hasPermission`、`setPermissionContext` 和 `clearPermissionContext`，`app/plugins/permission.ts` 注册 `v-permission` 指令。权限要求可写成单个权限码、权限码数组（全部满足），或 `{ all: [...], any: [...] }`。例如：

```vue
<script setup lang="ts">
const { hasPermission } = usePermission()
const canEditProfile = computed(() => hasPermission('user.profile:edit'))
</script>

<template>
  <UButton v-permission="'user:delete'" label="删除" />
  <UButton :disabled="!canEditProfile" label="编辑资料" />
</template>
```

未来登录接口返回身份与权限码后，再调用 `setPermissionContext({ roleIds: [1], permissions: [...] })`。角色 ID 依次为超管 1、管理员 2、普通用户 3、高级用户 4、访客 5；目前只实现超管拥有全部权限，其余角色仅使用明确返回的权限码，未擅自推断权限映射。当前没有登录会话，默认不授予权限，因此暂未把指令接到现有用户操作按钮。该封装只控制前端展示和交互，接口授权仍需由后端校验。

## 迁移来源与取舍

来源为本地 `dao-monorepo-temp` 的 **main 分支快照 `4ecd2e27169bcdeb2179fbc34d5c7022fcbe8c49`**。本次 GitHub API 未能读取远端内容，未确认是否与远端当前 main 完全一致；没有使用本地 dev 分支的额外修改。

复用了后台壳、品牌/导航配置、Dashboard、认证分栏布局、登录表单、文档布局，以及 Projects / Team / Settings 三个 Layers。源项目没有注册页实现，本项目补齐了同风格注册表单。

未迁移编辑器、上传、PDF、简历、Comps/Demos 及 Alova 请求封装，也未引入旧 monorepo 的业务包。帮助页保留基础说明，更新记录改为本次实际迁移内容；侧栏初始关闭移动端抽屉，设置二级导航在小屏也可访问。系统字体和本地图标用于避免构建依赖远程字体服务。

后续接入真实鉴权时，再单独确定后端鉴权接口、会话及路由守卫；当前表单提交处理在 `app/pages/login.vue` 和 `app/pages/register.vue`。

## 界面迁移验证

初次界面迁移阶段已完成以下验证：

- 冻结锁文件安装、ESLint、类型检查、2 项表单边界测试及生产构建均通过。
- 另复制到仓库外的临时目录，独立安装、lint、类型检查、测试和构建均通过。
- 12 个基础路由正常响应；`/settings` 正常跳转默认子页。
- Playwright 检查桌面 1440×1000、移动端 390×844：登录/注册表单、确认密码错误提示、侧栏折叠、移动菜单跳转后关闭、Settings 二级导航、深浅主题。
- 浏览器验证期间无控制台错误或警告。

学习仓库父目录已有依赖时，本地嵌套构建可能出现依赖解析的 Node `DEP0155` 弃用提示，构建可完成；仓库外的独立构建不受父目录依赖影响。

## 端口与 pnpm 版本

开发端口集中配置在 `nuxt.config.ts` 的 `devServer.port: 3050`；`pnpm dev` 直接使用该配置，`pnpm preview` 同样使用 3050。

项目锁定 pnpm **12.16.1**（2026-10-30 核实的最新 12.x 稳定版），并使用该版本重新生成锁文件。已验证 `pnpm install --frozen-lockfile`、lint、类型检查、测试和构建通过，首页及登录页在 3050 端口均返回 HTTP 200。
