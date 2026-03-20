---
name: ai-chat-git-precommit-ts-check
description: TypeScript type checking before git commits
version: 2.0.0
---

# Git Pre-Commit TypeScript Check

Git 提交前进行 TypeScript 类型检查。

## lint vs build 的区别

| 命令 | 操作 | 速度 | 用途 |
|------|------|------|------|
| `yarn lint` | 仅类型检查 | ⚡ 快 | **提交前检查** |
| `yarn build` | 类型检查 + 构建打包 | 🐢 慢 | **发布前构建** |

## 脚本说明

`package.json` 中的脚本：

```json
{
  "scripts": {
    "lint": "vue-tsc -b --noEmit",      // 仅类型检查，不生成文件
    "build": "vue-tsc -b && vite build"  // 类型检查通过后才构建
  }
}
```

**关键点**：
- `lint`: `--noEmit` 表示只检查不输出，速度快
- `build`: 先类型检查，检查通过后才执行 `vite build` 打包

## 手动运行 TypeScript 检查

### 提交前快速检查（推荐）

```bash
yarn lint
# 或
npm run lint
```

### 完整构建（发布前使用）

```bash
yarn build
```

## 检查内容

TypeScript 配置 (`tsconfig.json`) 启用了严格模式：

- `strict: true` - 启用所有严格类型检查
- `noUnusedLocals: true` - 禁止未使用的局部变量
- `noUnusedParameters: true` - 禁止未使用的参数
- `noFallthroughCasesInSwitch: true` - 禁止 switch 语句穿透
- `forceConsistentCasingInFileNames: true` - 强制文件名大小写一致

## 提交流程

1. **完成代码修改**
2. **运行快速类型检查**
   ```bash
   yarn lint
   ```
3. **修复所有类型错误**
4. **确认检查通过**
5. **执行 git commit**

## 可选：配置 Git Hook

如需自动化检查，可以设置 Git Hook（如 husky + lint-staged）：

```bash
# 安装 husky
yarn add -D husky

# 启用 husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "yarn lint"
```
