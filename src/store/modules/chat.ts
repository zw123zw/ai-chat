import { defineStore } from "pinia";
import { nanoid } from "@/utils/id";
import { chatSSE, type AbortFn } from "@/utils/chatSSE";
import { useAppStore } from "@/store/modules/app";
import type { ChatMessage, Conversation, ChatAttachment } from "@/types/chat";
import { getAllAttachmentIds, removeAttachments, clearAllAttachments } from "@/utils/attachmentStorage";

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  generating: boolean;
  streamingContent: string;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => {
    return {
      conversations: [],
      currentConversationId: null,
      generating: false,
      streamingContent: "",
    };
  },
  getters: {
    currentConversation(): Conversation | null {
      return (
        this.conversations.find((c) => c.id === this.currentConversationId) ||
        null
      );
    },
    currentMessages(): ChatMessage[] {
      return this.currentConversation?.messages || [];
    },
  },
  actions: {
    CREATE_CONVERSATION(title = "新对话"): string {
      const id = nanoid();
      const conversation: Conversation = {
        id,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.conversations = [conversation, ...this.conversations];
      this.currentConversationId = id;
      return id;
    },
    SWITCH_CONVERSATION(id: string) {
      // 切换会话时，停止当前 SSE
      this.STOP_GENERATING();
      this.currentConversationId = id;
    },
    DELETE_CONVERSATION(id: string) {
      // 删除前停止当前 SSE
      this.STOP_GENERATING();
      // 收集要删除的会话中的所有附件 ID
      const conversation = this.conversations.find((c) => c.id === id);
      if (conversation) {
        const attachmentIds: string[] = [];
        conversation.messages.forEach((msg) => {
          if (msg.attachments) {
            msg.attachments.forEach((a) => attachmentIds.push(a.id));
          }
        });
        // 从 IndexedDB 删除附件
        if (attachmentIds.length > 0) {
          removeAttachments(attachmentIds).catch(console.error);
        }
      }
      this.conversations = this.conversations.filter((c) => c.id !== id);
      if (this.currentConversationId === id) {
        this.currentConversationId = this.conversations[0]?.id || null;
      }
    },
    CLEAR_ALL_CONVERSATIONS() {
      this.conversations = [];
      this.currentConversationId = null;
      // 清空所有附件
      clearAllAttachments().catch(console.error);
    },
    RENAME_CONVERSATION(id: string, title: string) {
      this.conversations = this.conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
      );
    },
    ADD_MESSAGE(msg: ChatMessage) {
      if (!this.currentConversationId) {
        this.CREATE_CONVERSATION();
      }
      this.conversations = this.conversations.map((c) =>
        c.id === this.currentConversationId
          ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
          : c,
      );
    },
    UPDATE_LAST_ASSISTANT_MESSAGE(content: string, loading = false) {
      this.conversations = this.conversations.map((c) => {
        if (c.id !== this.currentConversationId) return c;
        const messages = [...c.messages];
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx].role === "assistant") {
          messages[lastIdx] = { ...messages[lastIdx], content, loading };
        }
        return { ...c, messages, updatedAt: Date.now() };
      });
    },
    SEND_MESSAGE(content: string, attachments?: ChatAttachment[]) {
      if (
        (!content.trim() && (!attachments || attachments.length === 0)) ||
        this.generating
      )
        return;

      if (!this.currentConversationId) {
        this.CREATE_CONVERSATION(content.slice(0, 20) || "文件对话");
      }

      // 用户消息
      this.ADD_MESSAGE({
        id: nanoid(),
        role: "user",
        content,
        timestamp: Date.now(),
        attachments: attachments?.length ? attachments : undefined,
      });

      // AI 占位消息
      this.ADD_MESSAGE({
        id: nanoid(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        loading: true,
      });

      this.generating = true;
      this.streamingContent = "";

      // 获取当前 Agent 配置
      const appStore = useAppStore();
      const agent = appStore.agents.find(
        (a) => a.id === appStore.currentAgentId,
      );
      if (!agent) {
        this.streamingContent = "❌ 请先选择模型";
        this.UPDATE_LAST_ASSISTANT_MESSAGE(this.streamingContent);
        this.generating = false;
        return;
      }

      // 构建消息列表（排除 loading 占位消息，包含 attachments）
      const messages = this.currentMessages
        .filter((m) => !m.loading)
        .map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        }));

      // 调用 SSE 服务（接收累积的完整文本）
      const abort = chatSSE(
        messages,
        // 每次接收完整累积文本
        (fullText) => {
          this.streamingContent = fullText;
        },
        () => {
          // 完成时更新最后一条消息
          this.UPDATE_LAST_ASSISTANT_MESSAGE(this.streamingContent);
          this.streamingContent = "";
          this.generating = false;
          (this as any)._abort = null;
        },
        {
          baseUrl: agent.baseUrl,
          apiKey: agent.apiKey,
          model: agent.model,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          topP: agent.topP,
          presencePenalty: agent.presencePenalty,
          frequencyPenalty: agent.frequencyPenalty,
          headers: {},
        },
      );

      (this as any)._abort = abort;
    },
    STOP_GENERATING() {
      const abort = (this as any)._abort as AbortFn | null;
      if (abort) {
        abort();
      }
      if (this.streamingContent) {
        this.UPDATE_LAST_ASSISTANT_MESSAGE(this.streamingContent);
        this.streamingContent = "";
      }
      (this as any)._abort = null;
      this.generating = false;
    },
    REGENERATE_LAST_MESSAGE() {
      if (!this.currentConversation) return;
      const messages = this.currentConversation.messages;
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (!lastUserMsg) return;

      // 移除最后一条 assistant 消息
      this.conversations = this.conversations.map((c) => {
        if (c.id !== this.currentConversationId) return c;
        const filtered = c.messages.filter(
          (m) =>
            !(
              m.role === "assistant" &&
              m.id === messages[messages.length - 1]?.id
            ),
        );
        return { ...c, messages: filtered };
      });

      this.SEND_MESSAGE(lastUserMsg.content);
    },
    /**
     * 清理孤立的附件（IndexedDB 中存在但消息中不再引用的附件）
     */
    async CLEANUP_ORPHANED_ATTACHMENTS() {
      try {
        // 收集所有消息中引用的附件 ID
        const referencedAttachmentIds = new Set<string>();
        this.conversations.forEach((conv) => {
          conv.messages.forEach((msg) => {
            if (msg.attachments) {
              msg.attachments.forEach((a) => referencedAttachmentIds.add(a.id));
            }
          });
        });

        // 获取所有存储的附件 ID
        const storedIds = await getAllAttachmentIds();

        // 找出孤立的附件并删除
        const orphanedIds = storedIds.filter((id) => !referencedAttachmentIds.has(id));
        if (orphanedIds.length > 0) {
          console.log(`Cleaning up ${orphanedIds.length} orphaned attachments`);
          await removeAttachments(orphanedIds);
        }
      } catch (err) {
        console.error('Failed to cleanup orphaned attachments:', err);
      }
    },
  },
  persist: {
    key: "chatStore",
    paths: ["conversations", "currentConversationId"],
    storage: window.localStorage,
  },
});
