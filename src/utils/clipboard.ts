import useClipboard from 'vue-clipboard3'
import { message } from 'ant-design-vue'

const { toClipboard } = useClipboard()

/**
 * 复制文本到剪贴板（带成功/失败提示）
 */
export async function copyText(text: string, tip = '已复制'): Promise<boolean> {
  try {
    await toClipboard(text)
    message.success(tip)
    return true
  } catch {
    message.error('复制失败')
    return false
  }
}

/**
 * 复制文本到剪贴板（静默模式，不弹提示）
 */
export async function copyTextSilent(text: string): Promise<boolean> {
  try {
    await toClipboard(text)
    return true
  } catch {
    return false
  }
}
