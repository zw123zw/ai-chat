import { fetchEventSource } from "@microsoft/fetch-event-source";
import { message } from "ant-design-vue";
import type { SSEMessage, ChatAttachment } from "@/types/chat";

/** SSE 请求配置 */
export interface ChatSSEOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  headers?: Record<string, string>;
  retryDelay?: number;
  maxRetries?: number;
  enableFetchFallback?: boolean;
}

export type OnUpdateCallback = (fullText: string) => void;
export type OnDoneCallback = (success: boolean) => void;
export type AbortFn = () => void;

function parseDeltaContent(data: string): string {
  if (!data || data.trim() === "") return "";

  try {
    const json = JSON.parse(data);
    return json?.choices?.[0]?.delta?.content ?? json?.data ?? "";
  } catch (error) {
    console.warn("解析 SSE 数据失败", error, "原始数据：", data);
    return "";
  }
}

function buildUrl(baseUrl: string): string {
  if (!baseUrl) throw new Error("baseUrl 不能为空");

  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.includes("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

// 将文件内容格式化为 Markdown 代码块
function formatFileContent(attachment: ChatAttachment): string {
  const filename = attachment.relativePath
    ? `${attachment.relativePath}/${attachment.name}`
    : attachment.name;

  // 从文件名获取语言类型
  let lang = "";
  if (filename.includes('.')) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.') + 1);
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'rb': 'ruby',
      'php': 'php',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'fs': 'fsharp',
      'swift': 'swift',
      'kt': 'kotlin',
      'kts': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'ps1': 'powershell',
      'cmd': 'batch',
      'bat': 'batch',
      'sql': 'sql',
      'html': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'md': 'markdown',
      'markdown': 'markdown',
    };
    lang = langMap[ext] || '';
  }

  return `\`\`\`${lang}\n${filename}\n${attachment.content}\n\`\`\`\n\n`;
}

// 构建增强的消息内容（包含文件内容）
function buildMessageWithFiles(
  baseContent: string,
  attachments?: ChatAttachment[]
): string {
  if (!attachments || attachments.length === 0) {
    return baseContent;
  }

  // 筛选需要作为文本发送的文件
  const textAttachments = attachments.filter(a =>
    a.sendAsText && a.content && a.contentLoaded
  );

  if (textAttachments.length === 0) {
    return baseContent;
  }

  let result = "";

  // 添加文件内容
  result += "以下是上传的文件内容：\n\n";
  for (const a of textAttachments) {
    result += formatFileContent(a);
  }

  // 添加用户的原始问题
  if (baseContent.trim()) {
    result += baseContent;
  } else {
    result += "请根据上面的文件内容进行回复。";
  }

  return result;
}

function convertToSSEMessage(
  msg: {
    role: string;
    content: string;
    attachments?: ChatAttachment[];
  },
  isLastUserMessage: boolean
): SSEMessage {
  // 如果不是最后一条用户消息，只发送纯文本
  if (!isLastUserMessage) {
    return {
      role: msg.role,
      content: msg.content || "",
    };
  }

  // 构建增强的内容（包含文件）
  const enhancedContent = buildMessageWithFiles(msg.content, msg.attachments);

  // 处理图片附件
  const hasImageAttachments = msg.attachments?.some(
    a => a.url && a.type?.startsWith("image/") && !a.url.startsWith("blob:")
  );

  if (!hasImageAttachments) {
    return {
      role: msg.role,
      content: enhancedContent,
    };
  }

  // 有图片附件，使用多模态格式
  const result: SSEMessage = {
    role: msg.role,
    content: [],
  };

  // 添加文本内容
  (result.content as any[]).push({
    type: "text",
    text: enhancedContent,
  });

  // 添加图片
  msg.attachments?.forEach((a: ChatAttachment) => {
    if (a.url && a.type?.startsWith("image/") && !a.url.startsWith("blob:")) {
      (result.content as any[]).push({
        type: "image_url",
        image_url: {
          url: a.url,
        },
      });
    }
  });

  return result;
}

async function fetchChatFallback(
  url: string,
  body: any,
  headers: Record<string, string>,
  onUpdate: OnUpdateCallback,
  onDone: OnDoneCallback,
  accumulatedText: string,
): Promise<void> {
  try {
    message.info("SSE 连接失败，正在尝试普通请求模式");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("API 错误响应:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const fullText = accumulatedText + content;

    onUpdate(fullText);
    onDone(true);
  } catch (error) {
    const errorMsg =
      "普通请求失败：" + ((error as Error)?.message || "网络异常");
    console.error(errorMsg, error);

    onUpdate(accumulatedText + `\n\n【错误】${errorMsg}`);
    onDone(false);
    message.error(errorMsg);
    throw error;
  }
}

export const chatSSE = (
  messages: Array<{ role: string; content: string; attachments?: ChatAttachment[] }>,
  onUpdate: OnUpdateCallback,
  onDone: OnDoneCallback,
  options: ChatSSEOptions,
): AbortFn => {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    enableFetchFallback = true,
    ...restOptions
  } = options;

  // 状态管理（新增：重试超时器，用于清除未执行的重试）
  let aborted = false;
  let currentController: AbortController | null = null;
  let isDone = false;
  let retryCount = 0;
  let accumulatedText = "";
  let hasTriggeredFallback = false;
  let retryTimeout: NodeJS.Timeout | null = null;

  const url = buildUrl(restOptions.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${restOptions.apiKey}`,
    ...(restOptions.headers || {}),
  };

  // 找到最后一条用户消息的索引
  const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
  const actualLastUserMsgIndex = lastUserMsgIndex >= 0 ? messages.length - 1 - lastUserMsgIndex : -1;

  // 转换消息：只有最后一条用户消息才处理附件和文件内容
  const sseMessages = messages.map((msg, index) =>
    convertToSSEMessage(msg, index === actualLastUserMsgIndex)
  );

  const baseBody: Record<string, unknown> = {
    model: restOptions.model,
    messages: sseMessages,
    stream: true,
    temperature: restOptions.temperature ?? 0.7,
    max_tokens: restOptions.maxTokens ?? 2000,
  };
  if (restOptions.topP !== undefined) baseBody.top_p = restOptions.topP;
  if (restOptions.presencePenalty !== undefined)
    baseBody.presence_penalty = restOptions.presencePenalty;
  if (restOptions.frequencyPenalty !== undefined)
    baseBody.frequency_penalty = restOptions.frequencyPenalty;

  // 打印调试信息
  console.log("📤 发送请求到:", url);
  console.log("📤 请求 body:", JSON.stringify(baseBody, null, 2));

  const finish = (success: boolean = false) => {
    if (isDone) return;
    isDone = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    onDone(success);
  };

  const executeSSE = () => {
    if (aborted || hasTriggeredFallback || isDone) return;

    currentController = new AbortController();
    const signal = currentController.signal;

    fetchEventSource(url, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify(baseBody),
      onmessage: (event) => {
        if (aborted || isDone) return;

        const data = event.data.trim();
        if (["[DONE]", "[FINISH]", "done"].includes(data)) {
          finish(true);
          return;
        }

        const content = parseDeltaContent(data);
        if (content) {
          accumulatedText += content;
          onUpdate(accumulatedText);
        }
      },
      onerror: (err) => {
        if (aborted || isDone) return;

        const error = err as Error;
        console.error(`SSE 错误 (${retryCount + 1}/${maxRetries})`, error);

        const isContentTypeError =
          error.message?.includes("Content-Type") ||
          error.message?.includes("text/event-stream");

        if (
          enableFetchFallback &&
          !hasTriggeredFallback &&
          isContentTypeError
        ) {
          hasTriggeredFallback = true;
          currentController?.abort();
          const fallbackBody = { ...baseBody, stream: false };
          fetchChatFallback(
            url,
            fallbackBody,
            headers,
            onUpdate,
            finish,
            accumulatedText,
          ).catch(() => {});
          return;
        }

        currentController?.abort();
        handleRetry(error);
      },
      onclose: () => {
        if (!aborted && !isDone && accumulatedText) {
          finish(true);
        }
      },
      onopen: async (response) => {
        if (response.status !== 200) {
          let errorDetail = "";
          try {
            errorDetail = await response.text();
            console.error("API 错误响应详情:", errorDetail);
          } catch {
            errorDetail = response.statusText;
          }
          currentController?.abort();
          handleRetry(new Error(`SSE 连接失败，状态码：${response.status}，详情：${errorDetail}`));
          return;
        }
        retryCount = 0;
      },
    }).catch((err) => {
      if (aborted || isDone) return;

      const error = err as Error;
      console.error("fetchEventSource catch:", error);
      if (enableFetchFallback && !hasTriggeredFallback) {
        hasTriggeredFallback = true;
        const fallbackBody = { ...baseBody, stream: false };
        fetchChatFallback(
          url,
          fallbackBody,
          headers,
          onUpdate,
          finish,
          accumulatedText,
        ).catch(() => {});
        return;
      }

      handleFinalError(error);
    });
  };

  const handleRetry = (error: Error) => {
    if (aborted || isDone) return;

    const isNetworkError =
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError") ||
      error.message?.includes("fetch failed") ||
      error.message?.includes("ERR_NETWORK") ||
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("ETIMEDOUT");

    if (isNetworkError) {
      handleFinalError(error);
      return;
    }

    retryCount++;
    if (retryCount >= maxRetries) {
      handleFinalError(error);
      return;
    }

    const retryMsg = `SSE 请求失败，${retryDelay / 1000}秒后重试(${retryCount}/${maxRetries})`;
    console.warn(retryMsg, error);
    message.warning(retryMsg);

    if (retryTimeout) clearTimeout(retryTimeout);
    retryTimeout = setTimeout(() => {
      if (!aborted) {
        executeSSE();
      }
    }, retryDelay);
  };

  const handleFinalError = (error: Error) => {
    const errorDetail = error.message || "网络异常/服务器无响应";
    const errorMsg = `AI 回复失败：${errorDetail}`;
    console.error("SSE 最终失败", errorMsg, error);
    message.error(errorMsg);
    const finalText = accumulatedText || errorMsg;
    onUpdate(finalText);
    finish(false);
  };

  executeSSE();

  return () => {
    if (aborted) return;

    aborted = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    currentController?.abort();
    finish(false);
    console.log("SSE 请求已手动中断");
  };
};
