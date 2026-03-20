/**
 * 根据 URL 下载文件
 * @param url 文件地址
 * @param filename 保存的文件名（可选，不提供则从 URL 或响应头获取）
 */
export async function downloadUrl(url: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
    })

    if (!response.ok) {
      throw new Error(`下载失败，状态码: ${response.status}`)
    }

    const blob = await response.blob()

    // 如果没有提供文件名，尝试从响应头获取
    let saveFilename = filename
    if (!saveFilename) {
      const contentDisposition = response.headers.get('Content-Disposition')
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          saveFilename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      // 还是没有的话，从 URL 中提取
      if (!saveFilename) {
        const urlPath = new URL(url).pathname
        saveFilename = urlPath.split('/').pop() || 'download'
      }
    }

    // 使用现有的 downloadBlob 逻辑
    if ((window.navigator as any).msSaveOrOpenBlob) {
      ;(navigator as any).msSaveBlob(blob, saveFilename)
    } else {
      const link = document.createElement('a')
      const body = document.querySelector('body')
      link.href = window.URL.createObjectURL(blob)
      link.download = saveFilename
      link.style.display = 'none'
      body?.appendChild(link)
      link.click()
      body?.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    }
  } catch (error) {
    console.error('下载文件失败:', error)
    throw error
  }
}
