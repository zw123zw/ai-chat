---
name: ai-chat-chat-sse
description: SSE streaming communication for AI chat
version: 1.0.0
---

# Chat SSE

AI 聊天 SSE 流式通信工具。

**文件**: `src/utils/chatSSE.ts`

## API

### ChatSSEOptions

配置选项：

```typescript
interface ChatSSEOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  headers?: Record<string, string>;
  retryDelay?: number;           // 默认 5000ms
  maxRetries?: number;            // 默认 3
  enableFetchFallback?: boolean;  // 默认 true
}
```

### Types

```typescript
type OnUpdateCallback = (fullText: string) => void;
type OnDoneCallback = (success: boolean) => void;
type AbortFn = () => void;
```

### chatSSE()

主函数：

```typescript
function chatSSE(
  messages: Array<{ role: string; content: string; attachments?: any[] }>,
  onUpdate: OnUpdateCallback,    // 每次接收累积的完整文本
  onDone: OnDoneCallback,        // 完成回调
  options: ChatSSEOptions,
): AbortFn;
```

**返回**: 可用于中断请求的函数

## 功能特性

1. **自动 URL 构建** - 自动补全 `/v1/chat/completions`
2. **SSE 流式解析** - 解析 OpenAI 兼容的 SSE 格式
3. **智能重试** - 非网络错误自动重试
4. **Fetch 降级** - SSE 失败时自动尝试普通请求
5. **多模态支持** - 支持图片附件
6. **手动中断** - 返回 abort 函数

## 使用示例

```typescript
const abort = chatSSE(
  [
    { role: 'user', content: '你好' }
  ],
  (fullText) => {
    console.log('当前内容:', fullText);
  },
  (success) => {
    console.log('完成:', success);
  },
  {
    baseUrl: 'https://api.example.com',
    apiKey: 'xxx',
    model: 'gpt-4',
    temperature: 0.7,
  }
);

// 如需中断
// abort();
```
