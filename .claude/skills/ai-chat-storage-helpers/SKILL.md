---
name: ai-chat-storage-helpers
description: Storage, download, screenshot, ID, and mock utilities
version: 1.1.0
---

# Storage Helpers

存储、下载、截图、ID 生成和模拟数据工具。

---

## Storage

**文件**: `src/utils/storage.ts`

localStorage 封装，自动 JSON 序列化。

```typescript
export const storage = {
  get<T = string>(key: string): T | null
  set(key: string, value: unknown): void
  remove(key: string): void
  clear(): void
} as const
```

**示例**:
```typescript
storage.set('user', { name: 'foo' })
const user = storage.get<User>('user')
storage.remove('user')
```

---

## downloadUrl

**文件**: `src/utils/downloadUrl.ts`

根据 URL 下载文件。

```typescript
async function downloadUrl(
  url: string,
  filename?: string
): Promise<void>
```

- 通过 fetch GET 请求获取文件
- 支持从 `Content-Disposition` 响应头提取文件名
- 支持从 URL 路径提取文件名
- 支持 IE (msSaveBlob) 和现代浏览器
- 自动处理 URL 编码的文件名

**示例**:
```typescript
// 指定文件名
await downloadUrl('https://example.com/file.pdf', 'report.pdf')

// 自动从响应头或 URL 获取文件名
await downloadUrl('https://example.com/file.pdf')
```

---

## downloadBlob

**文件**: `src/utils/downloadBlob.ts`

下载 Blob 数据为文件。

```typescript
function downloadBlob(data: any, filename: string): void
```

- 支持 IE (msSaveBlob) 和现代浏览器
- 自动处理 URL 编码的文件名

---

## Screenshot

**文件**: `src/utils/screenshot.ts`

DOM 截图工具（基于 html2canvas）。

### captureAndDownload()

截图并下载为 PNG。

```typescript
async function captureAndDownload(
  element: HTMLElement,
  filename = 'screenshot.png',
  options?: Partial<Html2CanvasOptions>,
): Promise<void>
```

### captureToBase64()

截图返回 Base64。

```typescript
async function captureToBase64(
  element: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<string>
```

### captureToBlob()

截图返回 Blob。

```typescript
async function captureToBlob(
  element: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<Blob>
```

### captureToClipboard()

截图并复制到剪贴板。

```typescript
async function captureToClipboard(
  element: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<void>
```

---

## nanoid

**文件**: `src/utils/id.ts`

生成唯一 ID。

```typescript
function nanoid(size = 21): string
```

使用 `crypto.getRandomValues()` 生成，字符集：`A-Za-z0-9`

---

## Mock Reply

**文件**: `src/utils/mockReply.ts`

获取随机模拟 AI 回复。

```typescript
function getRandomReply(): string
```

包含多种类型的模拟回复：
- 纯文本
- 带代码块
- 带图片
- 带文件链接
- 混合内容
- 带表格
