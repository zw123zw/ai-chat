import { ref, onUnmounted, type Ref } from 'vue'
import { renderMarkdown } from './markdown'

/** 打字机配置项 */
export interface TypewriterOptions {
  /** 打字速度（ms/字），默认 120 */
  speed?: number
  /** 光标字符，默认 '▍' */
  cursorChar?: string
  /** 打字完成回调 */
  onComplete?: () => void
}

/** 打字机返回结果 */
export interface TypewriterReturn {
  /** 是否完成打字 */
  isFinished: Ref<boolean>
  /** 设置要打字的完整文本 */
  setText: (text: string) => void
  /** 立即完成打字 */
  finish: () => void
  /** 停止打字机 */
  stop: () => void
  /** 渲染的 HTML 内容 */
  renderedHTML: Ref<string>
}

/**
 * 支持 Markdown 渲染的打字机
 * 使用 setTimeout 实现流式打字，同时渲染 Markdown
 *
 * @example
 * const { setText, finish, renderedHTML } = useTypewriter({
 *   speed: 120,
 *   cursorChar: '▍',
 * })
 *
 * // 设置文本开始打字
 * setText('```js\nconsole.log("Hello")\n```')
 *
 * // 组件中
 * <div innerHTML={renderedHTML.value}></div>
 */
export const useTypewriter = (options: TypewriterOptions = {}): TypewriterReturn => {
  const config = {
    speed: 120,
    cursorChar: '▍',
    ...options,
  }

  const isFinished = ref(false)
  const displayedText = ref('')
  const renderedHTML = ref('')
  let targetText = ''
  let currentIndex = 0
  let timer: number | null = null

  /**
   * 更新渲染内容
   */
  const updateRender = () => {
    const html = renderMarkdown(displayedText.value)
    // 在打字时添加光标
    renderedHTML.value = !isFinished.value ? html + `<span class="typed-cursor">${config.cursorChar}</span>` : html
  }

  /**
   * 打字循环
   */
  const typeLoop = () => {
    if (currentIndex >= targetText.length) {
      // 打字完成
      isFinished.value = true
      updateRender()
      timer = null
      config.onComplete?.()
      return
    }

    // 追加字符（支持一次追加多个字符以追赶进度）
    const diff = targetText.length - currentIndex
    const step = Math.max(1, Math.min(diff, 2)) // 每次最多追加2个字符

    displayedText.value = targetText.slice(0, currentIndex + step)
    currentIndex += step

    updateRender()

    timer = window.setTimeout(typeLoop, config.speed)
  }

  /**
   * 设置目标文本
   */
  const setText = (text: string): void => {
    targetText = text

    if (timer === null) {
      // 当前没有在打字，开始打字
      currentIndex = 0
      displayedText.value = ''
      isFinished.value = false
      typeLoop()
    }
    // 如果正在打字，targetText 已更新，typeLoop 会继续追加到目标长度
  }

  /**
   * 立即完成打字
   */
  const finish = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    displayedText.value = targetText
    currentIndex = targetText.length
    isFinished.value = true
    updateRender()
    config.onComplete?.()
  }

  /**
   * 停止打字机
   */
  const stop = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  // 组件卸载清理
  onUnmounted(() => {
    stop()
  })

  return {
    isFinished,
    setText,
    finish,
    stop,
    renderedHTML,
  }
}
