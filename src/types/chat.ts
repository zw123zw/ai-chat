export interface ChatAttachment {
  /** 唯一标识 */
  id: string
  name: string
  size: number
  type: string
  /** base64 data URL 或 blob URL（图片预览用） */
  url?: string
  /** 上传状态 */
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  /** 上传进度 0-100 */
  uploadProgress?: number
  /** 错误信息 */
  errorMessage?: string
  /** 是否是文件夹 */
  isDirectory?: boolean
  /** 文件夹路径（相对路径） */
  relativePath?: string
  /** 文件内容（文本文件） */
  content?: string
  /** 文件内容是否已读取 */
  contentLoaded?: boolean
  /** 是否作为文本内容发送 */
  sendAsText?: boolean
  /** 子文件（文件夹用） */
  children?: ChatAttachment[]
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
