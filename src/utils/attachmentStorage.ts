import localforage from 'localforage'

// 初始化 localforage 实例
const attachmentStore = localforage.createInstance({
  name: 'ai-chat',
  storeName: 'attachments',
  description: 'Stores chat attachments',
})

// 附件数据结构
interface StoredAttachment {
  data: ArrayBuffer // 原始二进制数据
  type: string // MIME 类型
  name: string // 文件名
  size: number // 文件大小
}

/**
 * 保存附件到 IndexedDB
 * @param id 附件 ID
 * @param file 文件对象
 */
export async function saveAttachment(id: string, file: File): Promise<void> {
  const data = await file.arrayBuffer()
  const stored: StoredAttachment = {
    data,
    type: file.type,
    name: file.name,
    size: file.size,
  }
  await attachmentStore.setItem(id, stored)
}

/**
 * 从 IndexedDB 获取附件
 * @param id 附件 ID
 */
export async function getAttachment(id: string): Promise<Blob | null> {
  const stored = await attachmentStore.getItem<StoredAttachment>(id)
  if (!stored) return null
  return new Blob([stored.data], { type: stored.type })
}

/**
 * 从 IndexedDB 获取附件并创建 Object URL
 * @param id 附件 ID
 */
export async function getAttachmentUrl(id: string): Promise<string | null> {
  const blob = await getAttachment(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

/**
 * 从 IndexedDB 获取附件并创建 data URL
 * @param id 附件 ID
 */
export async function getAttachmentDataUrl(id: string): Promise<string | null> {
  const blob = await getAttachment(id)
  if (!blob) return null
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * 从 IndexedDB 删除附件
 * @param id 附件 ID
 */
export async function removeAttachment(id: string): Promise<void> {
  await attachmentStore.removeItem(id)
}

/**
 * 清理所有附件（用于清空会话等场景）
 */
export async function clearAllAttachments(): Promise<void> {
  await attachmentStore.clear()
}

/**
 * 获取所有存储的附件 ID 列表
 */
export async function getAllAttachmentIds(): Promise<string[]> {
  return await attachmentStore.keys()
}

/**
 * 批量删除附件
 * @param ids 附件 ID 列表
 */
export async function removeAttachments(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => removeAttachment(id)))
}

/**
 * 检查附件是否存在
 * @param id 附件 ID
 */
export async function hasAttachment(id: string): Promise<boolean> {
  const keys = await attachmentStore.keys()
  return keys.includes(id)
}
