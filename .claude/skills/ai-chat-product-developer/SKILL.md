---
name: ai-chat-product-developer
description: Product development: read requirements, create/edit features
version: 1.1.0
---

# Product Developer

产品开发技能：从多渠道读取需求，自动区分新增/编辑功能，创建路由和页面。

## 需求读取方式

### 混合输入支持

**支持多种方式同时提供需求**：
- 文字描述 + 图片
- 文字描述 + 文件
- 文字描述 + 链接
- 图片 + 文件
- 多种方式组合

**示例**：
```
用户: "帮我做一个用户管理页面，参考这张设计图 [图片]，详细需求见文档 [文件]"
我: [同时读取文字、图片、文件，综合分析需求]
```

---

### 1. 从描述读取

直接从用户的文字描述中分析需求。

### 2. 从图片读取

用户提供图片时：
- 分析图片内容（UI设计、流程图、架构图等）
- 提取功能需求

### 3. 从文件读取

用户提供文件时：
- 读取文件内容
- 解析需求文档、PRD、设计稿等

### 4. 从链接读取

用户提供链接时：
- 尝试访问链接获取内容
- **需要登录时**：询问用户提供 token 或认证信息
- 支持通过 Authorization header 传递 token

**示例流程**：
```
用户: "参考这个链接 https://example.com/docs
我: "需要登录认证，请提供 token 或其他认证方式
用户: "token: xxx-xxx-xxx"
我: [使用 token 读取链接内容]
```

## 需求分析流程

### 第一步：确认需求清晰度

收到需求后，首先检查是否明确：

**需要确认的信息：
- [ ] 功能名称
- [ ] 功能描述
- [ ] 是新增功能还是编辑现有功能
- [ ] 路由路径（新增时需要）
- [ ] UI设计/交互细节
- [ ] 数据结构（如适用）

**需求不明确时**：询问用户确认，不要猜测。

---

### 第二步：区分新增 vs 编辑

| 判断标准：
- **新增功能**：
  - 描述中包含"新增"、"创建"、"新页面"、"新功能"等关键词
  - 描述的功能在现有路由表中不存在

- **编辑功能**：
  - 描述中包含"修改"、"编辑"、"更新"、"优化"等关键词
  - 描述的功能在现有路由表中已存在

---

## 优先使用 Ant Design Vue

**新增和编辑功能都优先使用 Ant Design Vue 组件和图标**。

### 常用 Ant Design Vue 组件

| 组件 | 用途 |
|------|------|
| `Button` | 按钮 |
| `Input` / `Input.TextArea` / `Input.Password` | 输入框 |
| `Form` / `Form.Item` | 表单 |
| `Table` | 表格 |
| `Modal` | 对话框 |
| `Popconfirm` | 确认气泡 |
| `Dropdown` | 下拉菜单 |
| `Select` | 选择器 |
| `DatePicker` / `RangePicker` | 日期选择 |
| `Upload` | 文件上传 |
| `Message` | 全局提示 |
| `Spin` | 加载中 |
| `Pagination` | 分页 |

### 常用 Ant Design Icons Vue 图标

| 图标 | 用途 |
|------|------|
| `PlusOutlined` | 添加、新建 |
| `EditOutlined` | 编辑 |
| `DeleteOutlined` | 删除 |
| `SearchOutlined` | 搜索 |
| `UserOutlined` | 用户 |
| `SettingOutlined` | 设置 |
| `SaveOutlined` | 保存 |
| `CloseOutlined` | 关闭 |
| `CheckOutlined` | 确认 |
| `ArrowUpOutlined` / `ArrowDownOutlined` | 上下箭头 |

### 导入示例

```typescript
import { Button, Form, Input, Modal, Table, message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
```

---

## 新增功能流程

### 1. 确认功能名称和路由

**步骤**：
1. 确定功能名称（PascalCase，如 `UserProfile`）
2. 确定路由路径（kebab-case，如 `/user-profile`）
3. 确认使用现有技能
   - 检查 `ai-chat-chat-components` 中的组件
   - 检查 `ai-chat-storage-helpers` 中的工具
   - 检查 `ai-chat-patterns` 中的模式

### 2. 创建路由

在 `src/router/index.ts` 中添加路由：

```typescript
{
  path: '/your-path',
  name: 'YourPageName',
  component: () => import('@/views/YourPageName/index'),
  meta: { requiresAuth: true }, // 根据需要设置
}
```

### 3. 创建页面组件

在 `src/views/` 下创建文件夹和文件：

```
src/views/YourPageName/
└── index.tsx
```

**页面组件模板**（使用 Ant Design Vue）：
```typescript
import { defineComponent, ref } from 'vue'
import { Button, Form, Input, Table, Modal, message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'YourPageName',
  setup() {
    return () => (
      <div>
        <Button type="primary" icon={<PlusOutlined />}>
          新增
        </Button>
      </div>
    )
  },
})
```

### 4. 使用公共组件和工具

优先使用：
- **UI 组件**：Ant Design Vue 组件（见上文）
- **项目组件**：`ChatInput`、`ChatMessage` 等
- **工具**：`storage`、`clipboard`、`markdown` 等
- **模式**：Pinia store 模式、Vue 组件模式

---

## 编辑功能流程

### 1. 查找对应组件

使用 `ai-chat-router-component-resolver` 技能：
- 根据功能名称或路径查找路由
- 获取对应的组件文件路径

### 2. 读取现有代码

读取目标组件文件，分析现有结构。

### 3. 执行编辑

根据需求修改组件：
- **优先使用 Ant Design Vue** 组件和图标
- 保持现有代码风格一致
- 使用 UPPER_SNAKE_CASE 命名 Pinia actions
- 使用不可变更新模式

---

## 现有路由参考

| path | name | component |
|------|------|-----------|
| `/login` | Login | `@/views/Login/index` |
| `/chat` | Chat | `@/layouts/MainLayout` |

## 确认清单

### 新增前确认：
- [ ] 功能名称确定
- [ ] 路由路径确定
- [ ] 需要的 Ant Design Vue 组件已确认
- [ ] 需要的公共组件已确认
- [ ] 需要的工具方法已确认
- [ ] 路由已添加到 `src/router/index.ts`
- [ ] 页面文件已创建在 `src/views/`

### 编辑前确认：
- [ ] 目标组件已找到
- [ ] 修改范围已确认
- [ ] 修改方案已确认（如需要，先问用户）
- [ ] 优先使用 Ant Design Vue 组件

## 需求不明确时的询问模板

```
为了准确实现需求，需要确认以下信息：

1. 这是**新增功能**还是**编辑现有功能**？
2. 功能名称是什么？
3. 路由路径希望是什么？
4. 请描述具体功能细节？
```
