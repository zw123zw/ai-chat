import { copyText } from '@/utils/clipboard'
import { COPY_ICON, CHECK_ICON } from '@/utils/markdown'

/**
 * 为容器绑定代码复制按钮的事件委托
 * 只需调用一次，自动处理所有 .code-copy-btn 的点击
 * @returns 清理函数
 */
export function delegateCodeCopy(container: HTMLElement): () => void {
  const handler = async (e: Event) => {
    const btn = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLButtonElement | null
    if (!btn) return

    const encoded = btn.dataset.code
    if (!encoded) return

    // 解码 base64 源代码
    const code = decodeURIComponent(escape(atob(encoded)))
    const ok = await copyText(code)

    if (ok) {
      btn.innerHTML = `${CHECK_ICON}<span>已复制</span>`
      setTimeout(() => {
        btn.innerHTML = `${COPY_ICON}<span>复制</span>`
      }, 2000)
    }
  }

  container.addEventListener('click', handler)

  return () => {
    container.removeEventListener('click', handler)
  }
}
