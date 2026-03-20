import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import type Token from 'markdown-it/lib/token.mjs'
import type Renderer from 'markdown-it/lib/renderer.mjs'
import type { Options as MarkdownItOptions } from 'markdown-it'

// SVG 图标
const COPY_ICON = `<svg viewBox="64 64 896 896" width="14" height="14" fill="currentColor"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32z"/><path d="M704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM382 896h-0.2L232 746.2v-0.2h150V896zm274-64H232V264h424v632z"/></svg>`

const CHECK_ICON = `<svg viewBox="64 64 896 896" width="14" height="14" fill="currentColor"><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"/></svg>`

export { COPY_ICON, CHECK_ICON }

// 初始化 Markdown 解析器（代码高亮 + 完整代码块结构）
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight(str: string, lang: string): string {
    const langLabel = lang || 'code'
    // base64 编码源代码，避免 HTML 转义问题
    const encodedCode = btoa(unescape(encodeURIComponent(str)))
    let codeHtml: string

    if (lang && hljs.getLanguage(lang)) {
      try {
        codeHtml = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      } catch {
        codeHtml = md.utils.escapeHtml(str)
      }
    } else {
      codeHtml = md.utils.escapeHtml(str)
    }

    return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-block-lang">${langLabel}</span><button class="code-copy-btn" type="button" data-code="${encodedCode}">${COPY_ICON}<span>复制</span></button></div><pre class="hljs"><code class="language-${langLabel}">${codeHtml}</code></pre></div>`
  },
} as MarkdownItOptions)

// 文件链接自动添加 download 属性
const FILE_EXTENSIONS = ['.pdf', '.docx', '.zip', '.xlsx', '.pptx', '.csv', '.txt']

md.renderer.rules.link_open = function (
  tokens: Token[],
  idx: number,
  options: MarkdownItOptions,
  _env: unknown,
  self: Renderer,
): string {
  const token = tokens[idx]
  const href = token.attrGet('href')
  if (href) {
    if (FILE_EXTENSIONS.some((ext) => href.endsWith(ext))) {
      token.attrSet('download', '')
      token.attrSet('class', 'file-link')
    } else {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    }
  }
  return self.renderToken(tokens, idx, options)
}

/**
 * Markdown 渲染 + DOMPurify 安全过滤
 */
export const renderMarkdown = (text: string): string => {
  const raw = md.render(text)
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['img', 'pre', 'code', 'a', 'button', 'svg', 'path', 'span'],
    ADD_ATTR: [
      'class', 'loading', 'alt', 'src', 'href', 'download', 'target', 'rel',
      'type', 'data-code', 'viewBox', 'width', 'height', 'fill', 'd',
    ],
  })
}

/** 内容块类型 */
export interface ContentBlock {
  type: 'text' | 'image' | 'file'
  content: string
}

// 匹配 Markdown 图片: ![alt](url)
const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g
// 匹配文件链接: [name](url.pdf/docx/zip/xlsx/...)
const FILE_LINK_RE = /\[([^\]]+)\]\(([^)]+\.(?:pdf|docx|zip|xlsx|pptx|csv|txt))\)/g

/**
 * 将文本拆分为纯文本块和媒体块（图片/文件）
 */
export const splitContentBlocks = (text: string): ContentBlock[] => {
  interface MatchInfo {
    type: 'image' | 'file'
    start: number
    end: number
    content: string
  }

  const matches: MatchInfo[] = []

  let match: RegExpExecArray | null
  const imgRe = new RegExp(IMAGE_RE.source, 'g')
  while ((match = imgRe.exec(text)) !== null) {
    matches.push({
      type: 'image',
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
    })
  }

  const fileRe = new RegExp(FILE_LINK_RE.source, 'g')
  while ((match = fileRe.exec(text)) !== null) {
    const isImage = matches.some((m) => m.start === match!.index - 1)
    if (!isImage) {
      matches.push({
        type: 'file',
        start: match.index,
        end: match.index + match[0].length,
        content: match[0],
      })
    }
  }

  matches.sort((a, b) => a.start - b.start)

  if (matches.length === 0) {
    return [{ type: 'text', content: text }]
  }

  const blocks: ContentBlock[] = []
  let cursor = 0

  for (const m of matches) {
    if (m.start > cursor) {
      const textBefore = text.slice(cursor, m.start).trim()
      if (textBefore) {
        blocks.push({ type: 'text', content: textBefore })
      }
    }
    blocks.push({ type: m.type, content: m.content })
    cursor = m.end
  }

  if (cursor < text.length) {
    const remaining = text.slice(cursor).trim()
    if (remaining) {
      blocks.push({ type: 'text', content: remaining })
    }
  }

  return blocks
}
