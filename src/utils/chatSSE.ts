import { fetchEventSource } from "@microsoft/fetch-event-source";
import { message } from "ant-design-vue";
import type { SSEMessage } from "@/types/chat";

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

function convertToSSEMessage(msg: {
  role: string;
  content: string;
  attachments?: any[];
}): SSEMessage {
  const result: SSEMessage = {
    role: msg.role,
    content: [],
  };

  if (msg.content) {
    result.content.push({
      type: "text",
      text: msg.content,
    });
  }

  if (msg.attachments && msg.attachments.length > 0) {
    msg.attachments.forEach((a: any) => {
      if (a.url && a.type?.startsWith("image/")) {
        result.content.push({
          type: "image_url",
          image_url: {
            url: a.url,
          },
        });
      }
    });
  }

  if (result.content.length === 1 && result.content[0].type === "text") {
    return {
      role: msg.role,
      content: (result.content[0] as any).text,
    };
  }

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

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      timeout: 30000,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
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
  messages: Array<{ role: string; content: string; attachments?: any[] }>,
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
  let retryTimeout: NodeJS.Timeout | null = null; // 新增：重试定时器

  const url = buildUrl(restOptions.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${restOptions.apiKey}`,
    ...(restOptions.headers || {}),
  };

  const sseMessages = messages.map(convertToSSEMessage);

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

  const finish = (success: boolean = false) => {
    if (isDone) return;
    isDone = true;
    // 新增：清除未执行的重试定时器，阻止后续重试
    if (retryTimeout) clearTimeout(retryTimeout);
    onDone(success);
  };

  const executeSSE = () => {
    if (aborted || hasTriggeredFallback || isDone) return; // 新增：isDone 判断

    currentController = new AbortController();
    const signal = currentController.signal;

    fetchEventSource(url, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify(baseBody),
      retryDelay: retryDelay,
      // 禁用 fetchEventSource 内部重试
      shouldRetry: (err) => {
        // 网络错误不重试
        const isNetworkError =
          err?.message?.includes("Failed to fetch") ||
          err?.message?.includes("NetworkError") ||
          err?.message?.includes("fetch failed") ||
          err?.message?.includes("ERR_NETWORK") ||
          err?.message?.includes("ECONNREFUSED") ||
          err?.message?.includes("ETIMEDOUT") ||
          err?.message?.includes("getaddrinfo") ||
          err?.message?.includes("ENOTFOUND");
        return !isNetworkError && false;
      },
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
      onerror: (err: unknown) => {
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
      onopen: (response) => {
        if (response.status !== 200) {
          // 新增：非200状态码直接触发重试，不再让内部逻辑处理
          currentController?.abort();
          handleRetry(new Error(`SSE 连接失败，状态码：${response.status}`));
          return;
        }
        retryCount = 0;
      },
    }).catch((err) => {
      if (aborted || isDone) return;

      const error = err as Error;
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

    // 对于网络错误（Failed to fetch、网络连接错误），直接失败不重试
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
    // 优化1：确保错误信息有默认值，且去掉多余换行（避免前端过滤）
    const errorDetail = error.message || "网络异常/服务器无响应";
    const errorMsg = `AI 回复失败：${errorDetail}`;
    console.error("SSE 最终失败", errorMsg, error);
    message.error(errorMsg);
    // 如果累加文本为空，直接显示错误信息；否则拼接
    const finalText = accumulatedText || errorMsg;
    onUpdate(finalText);
    finish(false);
  };

  executeSSE();

  return () => {
    if (aborted) return;

    aborted = true;
    // 新增：清除重试定时器
    if (retryTimeout) clearTimeout(retryTimeout);
    currentController?.abort();
    finish(false);
    console.log("SSE 请求已手动中断");
  };
};
