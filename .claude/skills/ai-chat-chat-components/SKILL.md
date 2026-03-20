---
name: ai-chat-chat-components
description: Chat-related components: ChatInput, ChatMessage, ConversationList
version: 1.0.0
---

# Chat Components

聊天相关组件：ChatInput、ChatMessage、ConversationList

## ChatInput

聊天输入组件，支持文本输入、文件上传、模型选择。

**文件**: `src/components/ChatInput/index.tsx`

**Props**:
- `loading: boolean` - 是否正在加载中

**Emits**:
- `send` - 发送消息事件
- `stop` - 停止生成事件

**功能**:
- 多行文本输入（Textarea）
- 文件/文件夹/图片上传
- 模型选择、编辑、删除
- 支持 Enter 发送，Shift+Enter 换行

---

## ChatMessage

聊天消息组件，展示用户和 AI 消息。

**文件**: `src/components/ChatMessage/index.tsx`

**Props**:
- `message: ChatMessage` - 消息对象

**功能**:
- 用户/AI 消息气泡展示
- Markdown 渲染
- 打字机效果
- 代码块复制
- 附件展示（图片/文件）
- 消息复制功能

---

## ConversationList

会话列表组件，展示历史会话。

**文件**: `src/components/ConversationList/index.tsx`

**功能**:
- 新建对话按钮
- 会话列表展示
- 切换会话
- 删除会话（带确认）
- 用户信息展示和退出登录

---

## CodeBlock

代码块复制事件委托。

**文件**: `src/components/CodeBlock/index.ts`

**API**:
```typescript
function delegateCodeCopy(container: HTMLElement): () => void
```

为容器绑定 `.code-copy-btn` 的点击事件，自动处理 base64 编码的代码复制。
