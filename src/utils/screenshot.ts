import html2canvas from 'html2canvas'
import type { Options as Html2CanvasOptions } from 'html2canvas'

/**
 * 将 DOM 元素截图并下载为 PNG
 */
export async function captureAndDownload(
  element: HTMLElement,
  filename = 'screenshot.png',
  options?: Partial<Html2CanvasOptions>,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#1e1e2e',
    scale: 2,
    useCORS: true,
    allowTaint: false,
    ...options,
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * 将 DOM 元素截图并返回 Base64 字符串
 */
export async function captureToBase64(
  element: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#1e1e2e',
    scale: 2,
    useCORS: true,
    allowTaint: false,
    ...options,
  })
  return canvas.toDataURL('image/png')
}

/**
 * 将 DOM 元素截图并返回 Blob
 */
export async function captureToBlob(
  element: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#1e1e2e',
    scale: 2,
    useCORS: true,
    allowTaint: false,
    ...options,
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('截图生成失败'))
      }
    }, 'image/png')
  })
}

/**
 * 将 DOM 元素截图并复制到剪贴板
 */
export async function captureToClipboard(
  element: HTMLElement,
  options?: Partial<Html2CanvasOptions>,
): Promise<void> {
  const blob = await captureToBlob(element, options)
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ])
}
