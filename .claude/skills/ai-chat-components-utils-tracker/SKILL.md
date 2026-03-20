---
name: ai-chat-components-utils-tracker
description: Update SKILL files after src/components or src/utils changes
version: 1.1.0
---

# Components & Utils Tracker

在 `src/components/` 或 `src/utils/` 目录下的文件**完成新增或修改后**，使用此技能更新相关的 SKILL 文件。

## 监控目录

- `src/components/` - 组件文件
- `src/utils/` - 工具函数文件

## 当前组件清单

当前 `src/components/` 包含：
- `ChatInput/index.tsx` - 聊天输入组件
- `ChatMessage/index.tsx` - 聊天消息组件
- `CodeBlock/index.ts` - 代码块组件
- `ConversationList/index.tsx` - 会话列表组件

## 当前工具函数清单

当前 `src/utils/` 包含：
- `chatSSE.ts` - SSE 流式通信
- `clipboard.ts` - 剪贴板操作
- `crypto.ts` - 加密工具
- `downloadBlob.ts` - Blob 下载
- `downloadUrl.ts` - URL 下载
- `id.ts` - ID 生成（nanoid）
- `markdown.ts` - Markdown 渲染
- `mockReply.ts` - 模拟回复
- `screenshot.ts` - 截图功能
- `storage.ts` - 本地存储
- `useTypewriter.ts` - 打字机效果

## 更新流程

**在代码修改完成后**，按以下步骤更新 SKILL：

1. **检查变化**
   - 识别新增/修改的文件
   - 分析文件内容和用途

2. **更新或创建 SKILL**
   - 如果是新功能模块，创建新的 `ai-chat-{module-name}/SKILL.md`
   - 如果是修改现有功能，更新对应的 SKILL 文件

3. **SKILL 内容结构**
   - Frontmatter: name, description, version
   - 功能说明
   - 使用示例
   - API 参考（如适用）

## 示例：新增组件

完成新增 `src/components/MyComponent/index.tsx` 后：

1. 创建 `.claude/skills/ai-chat-my-component/SKILL.md`
2. 内容包括：
   - 组件用途说明
   - Props 接口
   - 使用示例
   - 相关代码片段
