---
name: ai-chat-clipboard-crypto
description: Clipboard and encryption utilities
version: 1.0.0
---

# Clipboard & Crypto

剪贴板和加密工具函数。

---

## Clipboard

**文件**: `src/utils/clipboard.ts`

### copyText()

复制文本到剪贴板（带提示）。

```typescript
async function copyText(
  text: string,
  tip = '已复制'
): Promise<boolean>
```

- 成功显示 `message.success(tip)`
- 失败显示 `message.error('复制失败')`
- 返回是否成功

### copyTextSilent()

静默复制文本（不弹提示）。

```typescript
async function copyTextSilent(text: string): Promise<boolean>
```

- 只返回是否成功，不显示任何提示

---

## Crypto

**文件**: `src/utils/crypto.ts`

### rsaEncrypt()

RSA 加密文本。

```typescript
function rsaEncrypt(text: string): string
```

- 使用 `VITE_RSA_PUBLIC_KEY` 环境变量作为公钥
- 如果没有公钥，回退到 Base64 编码

### base64Encode() / base64Decode()

Base64 编码/解码。

```typescript
function base64Encode(text: string): string
function base64Decode(text: string): string
```
