---
name: ai-chat-router-component-resolver
description: Resolve page components from router config by path or name
version: 1.0.0
---

# Router Component Resolver

根据路由名称或路径，从 `src/router/` 中递归查找并查看对应的页面组件。

## 路由配置文件

主路由配置：`src/router/index.ts`

## 当前路由表

| path | name | component | requiresAuth |
|------|------|-----------|--------------|
| `/login` | Login | `@/views/Login/index` | ❌ |
| `/` | - | redirect to `/chat` | ❌ |
| `/chat` | Chat | `@/layouts/MainLayout` | ✅ |

## 查找规则

### 按名称查找

当用户提及路由名称（如 "Login"、"Chat"）时：

1. 在 `src/router/index.ts` 中查找匹配的 `name` 字段
2. 获取对应的 `component` 路径
3. 读取并显示该组件文件

### 按路径查找

当用户提及 URL 路径（如 "/login"、"/chat"）时：

1. 在 `src/router/index.ts` 中查找匹配的 `path` 字段
2. 获取对应的 `component` 路径
3. 读取并显示该组件文件

### 递归查找子路由

如果路由配置中有 `children` 子路由：

1. 递归遍历 `children` 数组
2. 按同样规则匹配子路由的 `name` 或 `path`
3. 解析子路由的 `component`

## 组件路径解析

路由配置中的 `component` 格式：

```typescript
// 懒加载（动态导入）
component: () => import('@/views/Login/index')

// 转换为文件路径
// @/views/Login/index → src/views/Login/index.tsx
```

**解析规则**：
- `@/` 前缀替换为 `src/`
- 自动添加 `.tsx` 或 `.vue` 扩展名

## 使用示例

### 示例 1：查看 Login 页面

**用户**："查看 Login 页面"

**执行**：
1. 查找 `name: 'Login'` 或 `path: '/login'`
2. 获取 component: `@/views/Login/index`
3. 读取文件：`src/views/Login/index.tsx`

### 示例 2：查看 Chat 页面

**用户**："查看 /chat 路由对应的组件"

**执行**：
1. 查找 `path: '/chat'`
2. 获取 component: `@/layouts/MainLayout`
3. 读取文件：`src/layouts/MainLayout.tsx`

### 示例 3：子路由查找

如果路由配置有子路由：

```typescript
{
  path: '/admin',
  children: [
    { path: 'users', name: 'UserList', component: () => import('@/views/admin/Users') }
  ]
}
```

**用户**："查看 UserList 组件"

**执行**：
1. 递归查找 `name: 'UserList'`
2. 获取 component: `@/views/admin/Users`
3. 读取文件：`src/views/admin/Users.tsx`
