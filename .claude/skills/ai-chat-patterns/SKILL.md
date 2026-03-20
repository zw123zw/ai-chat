---
name: ai-chat-patterns
description: Coding patterns extracted from ai-chat repository
version: 1.0.0
source: local-git-analysis
analyzed_commits: 2
---

# AI Chat Patterns

## Commit Conventions

This project uses Chinese commit messages:
- `项目搭建` - Project setup
- `增加git忽略文件` - Add gitignore file

## Tech Stack

- **Framework**: Vue 3 + TypeScript + JSX
- **Build Tool**: Vite
- **State Management**: Pinia with `pinia-plugin-persistedstate`
- **UI**: Ant Design Vue
- **Styling**: Less + Tailwind CSS
- **Markdown**: markdown-it + highlight.js + dompurify
- **HTTP**: Axios + @microsoft/fetch-event-source (for SSE)

## Code Architecture

```
src/
├── api/                    # API layer
│   ├── index.ts           # Axios instance with interceptors
│   └── auth.ts            # Auth endpoints
├── assets/styles/         # Styles
│   ├── global.less        # Global styles
│   ├── variables.less     # CSS variables
│   └── theme/             # Light/dark themes
├── components/            # Reusable components (folder per component)
│   ├── ChatInput/index.tsx
│   ├── ChatMessage/index.tsx
│   ├── CodeBlock/index.ts
│   └── ConversationList/index.tsx
├── layouts/               # Layout components
│   └── MainLayout.tsx
├── router/                # Vue Router
│   └── index.ts
├── store/                 # Pinia store modules
│   ├── index.ts
│   └── modules/
│       ├── app.ts
│       ├── chat.ts        # Chat state management
│       └── user.ts
├── types/                 # TypeScript type definitions
│   ├── agent.ts
│   ├── auth.ts
│   └── chat.ts
├── utils/                 # Utility functions
│   ├── chatSSE.ts         # SSE streaming handler
│   ├── clipboard.ts
│   ├── crypto.ts
│   ├── downloadBlob.ts
│   ├── id.ts              # nanoid wrapper
│   ├── markdown.ts        # Markdown rendering
│   ├── mockReply.ts
│   ├── screenshot.ts
│   ├── storage.ts
│   └── useTypewriter.ts   # Typewriter effect composable
├── views/                 # Page components
│   ├── Chat/index.tsx
│   └── Login/index.tsx
├── App.tsx
└── main.ts
```

## Workflows

### Pinia Store Pattern

Stores use `defineStore` with:
- **State interface** defined separately
- **UPPER_SNAKE_CASE** for action names
- Immutability via spread operators for updates

Example from `src/store/modules/chat.ts`:

```typescript
interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  generating: boolean;
  streamingContent: string;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({...}),
  getters: {...},
  actions: {
    CREATE_CONVERSATION(title = "新对话"): string {...},
    SWITCH_CONVERSATION(id: string) {...},
    // ... more actions
  },
  persist: {
    key: "chatStore",
    paths: ["conversations", "currentConversationId"],
    storage: window.localStorage,
  },
});
```

### Vue Component Pattern (JSX)

Components use Vue 3 JSX with `defineComponent`:

```typescript
export default defineComponent({
  name: 'ComponentName',
  props: {...},
  setup(props) {
    const someRef = ref()
    const someComputed = computed(() => ...)

    function handleSomething() {...}

    onMounted(() => {...})
    onUnmounted(() => {...})

    return () => (
      <div>JSX content</div>
    )
  }
})
```

### API Layer Pattern

Axios instance in `src/api/index.ts`:
- Base URL from `import.meta.env.VITE_API_BASE_URL`
- Request interceptor adds `Authorization: Bearer ${token}`
- Response interceptor handles 401 (logout + redirect to login)
- Returns `response.data` directly

### SSE Streaming Pattern

Uses `@microsoft/fetch-event-source` for SSE communication, exposed via `chatSSE()` utility that returns an abort function.

### Type Definitions

Centralized in `src/types/` directory with clear interfaces:
- `ChatMessage`, `Conversation` in `chat.ts`
- Separate files per domain

## Styling Patterns

- **Less** for component/theme styles
- **Tailwind CSS** for utility classes
- **CSS variables** for theming (light/dark)
- Theme files in `assets/styles/theme/`

## Component Organization

- **Folder-based**: Each component in its own folder with `index.tsx`
- **Colocation**: No separate `__tests__` folders (yet)
- **Icons**: From `@ant-design/icons-vue`

## State Persistence

Pinia stores use `pinia-plugin-persistedstate` to persist specific paths to localStorage.

## Utilities

- `useTypewriter()` - Composable for typewriter effect
- `chatSSE()` - SSE connection handler
- `renderMarkdown()` - Markdown to HTML with syntax highlighting
- `nanoid()` - ID generation
