---
name: ai-chat-markdown-typewriter
description: Markdown rendering and typewriter effect
version: 1.0.0
---

# Markdown & Typewriter

Markdown 渲染和打字机效果工具。

---

## Markdown

**文件**: `src/utils/markdown.ts`

### renderMarkdown()

Markdown 渲染 + DOMPurify 安全过滤。

```typescript
function renderMarkdown(text: string): string
```

**特性**:
- 代码语法高亮（highlight.js）
- 代码块带复制按钮
- 自动链接处理
- 文件链接自动添加 download 属性
- 外部链接自动 `target="_blank"`
- DOMPurify 防 XSS

### Constants

```typescript
const COPY_ICON: string   // SVG 复制图标
const CHECK_ICON: string  // SVG 勾选图标
```

### ContentBlock & splitContentBlocks()

将文本拆分为纯文本块和媒体块。

```typescript
interface ContentBlock {
  type: 'text' | 'image' | 'file'
  content: string
}

function splitContentBlocks(text: string): ContentBlock[]
```

---

## Typewriter

**文件**: `src/utils/useTypewriter.ts`

### useTypewriter()

支持 Markdown 渲染的打字机 composable。

```typescript
interface TypewriterOptions {
  speed?: number           // 默认 120ms/字
  cursorChar?: string      // 默认 '▍'
  onComplete?: () => void
}

interface TypewriterReturn {
  isFinished: Ref<boolean>
  setText: (text: string) => void
  finish: () => void
  stop: () => void
  renderedHTML: Ref<string>
}

function useTypewriter(options?: TypewriterOptions): TypewriterReturn
```

### 使用示例

```typescript
const { setText, finish, renderedHTML } = useTypewriter({
  speed: 120,
  cursorChar: '▍',
  onComplete: () => console.log('完成!'),
})

// 开始打字
setText('Hello **world**!')

// 立即完成
finish()

// 渲染
<div innerHTML={renderedHTML.value}></div>
```
