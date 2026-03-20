---
name: ai-chat-skill-generator
description: Generate SKILL.md files following project conventions
version: 1.0.0
---

# Skill Generator

使用此技能生成新的 SKILL 文件。

## 目录结构约定

```
.claude/
└── skills/
    └── ai-chat-{skill-name}/
        └── SKILL.md
```

每个技能都在自己的文件夹中，文件夹名和技能名都以 `ai-chat-` 开头，主文件名为 `SKILL.md`。

## SKILL.md 格式

### Frontmatter

```markdown
---
name: ai-chat-{skill-name}
description: {Brief description}
version: 1.0.0
---
```

### 内容结构

1. 技能名称标题
2. 使用说明
3. 示例（如果适用）

## 使用流程

1. 确定技能名称（kebab-case，不带前缀）
2. 创建文件夹：`.claude/skills/ai-chat-{skill-name}/`
3. 创建文件：`.claude/skills/ai-chat-{skill-name}/SKILL.md`
4. 编写技能内容，name 字段使用 `ai-chat-{skill-name}`

## 示例

创建一个名为 "vue-component" 的技能：

```
.claude/
└── skills/
    └── ai-chat-vue-component/
        └── SKILL.md
```

SKILL.md 内容：

```markdown
---
name: ai-chat-vue-component
description: Vue 3 component patterns for this project
version: 1.0.0
---

# Vue Component

使用 defineComponent + JSX 创建组件...
```
