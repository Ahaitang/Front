# QMG Admin - 重症肌无力定量评分管理系统

基于 Vite + Vue3 + TypeScript + Element Plus 构建的管理后台系统。

## 技术栈

- **Vite** - 下一代前端构建工具
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - JavaScript 的超集
- **Element Plus** - 基于 Vue 3 的组件库
- **Vue Router** - Vue.js 官方路由管理器
- **Pinia** - Vue 的状态管理库
- **Pinia Plugin Persistedstate** - Pinia 持久化插件（会话级别存储）
- **Axios** - 基于 Promise 的 HTTP 客户端

## 功能特性

- ✅ 用户登录/登出
- ✅ 会话级别存储（使用 sessionStorage）
- ✅ 患者管理（增删改查）
- ✅ 问卷记录管理（查询、删除、详情查看）
- ✅ 医生管理
- ✅ 数据统计仪表盘
- ✅ 响应式布局

## 项目结构

```
qmg-admin/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 公共组件
│   ├── layouts/         # 布局组件
│   │   └── MainLayout.vue
│   ├── router/          # 路由配置
│   │   └── index.ts
│   ├── stores/          # Pinia 状态管理
│   │   ├── index.ts     # Pinia 实例配置
│   │   └── user.ts      # 用户状态（会话级别存储）
│   ├── utils/           # 工具函数
│   │   └── api.ts       # API 请求封装
│   ├── views/           # 页面组件
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── Patients.vue
│   │   ├── Questionnaires.vue
│   │   └── Doctors.vue
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   └── style.css        # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

## 开发

```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

开发服务器将在 `http://localhost:3000` 启动。

## 构建

```bash
npm run build
# 或
pnpm build
# 或
yarn build
```

## 预览构建结果

```bash
npm run preview
# 或
pnpm preview
# 或
yarn preview
```

## 数据持久化

项目使用 `pinia-plugin-persistedstate` 实现状态持久化，配置为会话级别存储（sessionStorage）：

- 用户登录信息在浏览器会话期间保持
- 关闭浏览器标签页后，登录状态自动清除
- 刷新页面时，登录状态自动恢复

## API 配置

API 基础地址配置在 `src/utils/api.ts` 中：

```typescript
const BASE_URL = '/api'
```

开发环境通过 Vite 代理转发到后端服务器（`http://localhost:8080`），配置在 `vite.config.ts` 中。

## 路由说明

- `/login` - 登录页面
- `/dashboard` - 仪表盘（需要登录）
- `/patients` - 患者管理（需要登录）
- `/questionnaires` - 问卷记录管理（需要登录）
- `/doctors` - 医生管理（需要登录）

## 状态管理

### User Store (`stores/user.ts`)

管理用户登录状态和信息：

- `token` - 用户令牌
- `userInfo` - 用户信息
- `isLoggedIn` - 登录状态
- `login()` - 登录方法
- `logout()` - 登出方法
- `initUser()` - 初始化用户信息（从 sessionStorage 恢复）

## 注意事项

1. 所有 API 请求使用 POST 方法
2. 后端 API 返回格式：`{ code: 1, msg: '...', data: ... }`
3. 会话级别存储意味着关闭浏览器标签页后需要重新登录
4. 确保后端服务运行在 `http://localhost:8080`

## License

MIT
