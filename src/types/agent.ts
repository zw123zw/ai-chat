export interface Agent {
  id: string
  apiKey: string
  baseUrl: string
  website?: string
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
  createdAt: number
}
