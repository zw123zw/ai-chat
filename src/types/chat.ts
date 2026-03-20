export interface ChatAttachment {
  name: string
  size: number
  type: string
  /** base64 data URL（图片） */
  url?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  loading?: boolean
  attachments?: ChatAttachment[]
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

/** OpenAI 多模态消息内容 */
export type MultimodalContent = string | Array<{
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}>

/** SSE 消息格式 */
export interface SSEMessage {
  role: string
  content: any
}

export interface ChatCompletionRequest {
  model: string
  messages: SSEMessage[]
  stream: boolean
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: { role?: string; content?: string }
    finish_reason: string | null
  }>
}
