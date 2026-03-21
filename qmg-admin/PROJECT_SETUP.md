# QMG Admin 项目设置完成

## ✅ 已完成的工作

### 1. 项目基础配置
- ✅ 更新 `package.json`，添加所有必要依赖：
  - Vue 3 + TypeScript
  - Element Plus + 图标库
  - Vue Router
  - Pinia + pinia-plugin-persistedstate
  - Axios
  - 自动导入插件（unplugin-auto-import, unplugin-vue-components）

### 2. Vite 配置
- ✅ 配置路径别名 `@` 指向 `src` 目录
- ✅ 配置 Element Plus 自动导入
- ✅ 配置开发服务器代理（API 转发到 `http://localhost:8080`）
- ✅ 配置端口为 3000

### 3. TypeScript 配置
- ✅ 更新 `tsconfig.app.json` 支持路径别名
- ✅ 创建类型声明文件（`env.d.ts`, `shims-vue.d.ts`）

### 4. 状态管理（Pinia）
- ✅ 创建 Pinia 实例配置（`stores/index.ts`）
- ✅ 配置 `pinia-plugin-persistedstate` 插件
- ✅ 创建用户 Store（`stores/user.ts`）
  - 会话级别存储（使用 sessionStorage）
  - 登录/登出功能
  - 自动恢复登录状态

### 5. 路由配置
- ✅ 创建 Vue Router 配置（`router/index.ts`）
- ✅ 配置路由守卫（登录验证）
- ✅ 定义所有页面路由：
  - `/login` - 登录页
  - `/dashboard` - 仪表盘
  - `/patients` - 患者管理
  - `/questionnaires` - 问卷记录
  - `/doctors` - 医生管理

### 6. API 工具类
- ✅ 创建基于 Axios 的 API 封装（`utils/api.ts`）
- ✅ 配置请求/响应拦截器
- ✅ 实现所有 API 方法：
  - 医生 API（登录、注册等）
  - 患者 API（增删改查）
  - 问卷记录 API（查询、删除等）

### 7. 页面组件
- ✅ 登录页面（`views/Login.vue`）
- ✅ 主布局组件（`layouts/MainLayout.vue`）
  - 侧边栏导航
  - 顶部导航栏
  - 用户信息下拉菜单
- ✅ 仪表盘（`views/Dashboard.vue`）
  - 数据统计卡片
  - 最近问卷记录列表
- ✅ 患者管理（`views/Patients.vue`）
  - 患者列表
  - 新增/编辑患者
  - 删除患者
- ✅ 问卷记录管理（`views/Questionnaires.vue`）
  - 搜索功能（患者姓名、日期范围）
  - 分页显示
  - 查看详情
  - 删除记录
- ✅ 医生管理（`views/Doctors.vue`）
  - 医生列表
  - 新增医生

### 8. 样式和 UI
- ✅ 更新全局样式（`style.css`）
- ✅ 所有页面使用 Element Plus 组件
- ✅ 响应式布局设计
- ✅ 现代化 UI 风格

### 9. 文档
- ✅ 创建 `README.md` 项目说明文档
- ✅ 创建 `PROJECT_SETUP.md` 项目设置文档

## 🎯 核心特性

### 会话级别存储
- 使用 `pinia-plugin-persistedstate` 配置为 `sessionStorage`
- 用户登录信息在浏览器会话期间保持
- 关闭标签页后自动清除，刷新页面自动恢复

### 自动导入
- Element Plus 组件自动导入，无需手动 import
- Vue、Vue Router、Pinia 的常用 API 自动导入
- 类型声明自动生成

### API 统一管理
- 所有 API 请求统一封装
- 自动处理错误提示
- 支持 token 自动注入

## 📦 下一步操作

1. **安装依赖**：
   ```bash
   cd qmg-admin/qmg-admin
   npm install
   # 或
   pnpm install
   ```

2. **启动开发服务器**：
   ```bash
   npm run dev
   ```

3. **确保后端服务运行**：
   - 后端 API 服务应运行在 `http://localhost:8080`
   - 或修改 `vite.config.ts` 中的代理配置

4. **访问应用**：
   - 打开浏览器访问 `http://localhost:3000`
   - 使用后端提供的账号密码登录

## 🔧 配置说明

### 修改 API 地址
编辑 `src/utils/api.ts`：
```typescript
const BASE_URL = '/api'  // 开发环境使用代理
// 生产环境可改为：const BASE_URL = 'https://your-api-domain.com/api'
```

### 修改存储方式
如需改为 localStorage（持久化存储），编辑 `src/stores/user.ts`：
```typescript
persist: {
  key: 'qmg-user',
  storage: localStorage,  // 改为 localStorage
  paths: ['token', 'userInfo', 'isLoggedIn']
}
```

## 📝 注意事项

1. 所有 API 请求使用 POST 方法
2. 后端返回格式：`{ code: 1, msg: '...', data: ... }`
3. 会话级别存储意味着关闭浏览器标签页后需要重新登录
4. 确保后端 CORS 配置允许前端域名访问

## 🎉 项目已就绪

所有代码已生成完成，可以直接开始使用！
