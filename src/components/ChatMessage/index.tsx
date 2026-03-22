import { defineComponent, ref, watch, onMounted, onUnmounted, computed, type PropType } from 'vue'
import type { ChatMessage as ChatMessageType, ChatAttachment } from '@/types/chat'
import { renderMarkdown } from '@/utils/markdown'
import { useTypewriter } from '@/utils/useTypewriter'
import { useChatStore } from '@/store/modules/chat'
import { delegateCodeCopy } from '@/components/CodeBlock'
import {
  UserOutlined,
  RobotOutlined,
  FileOutlined,
  PictureOutlined,
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
  EyeOutlined,
  CodeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
} from '@ant-design/icons-vue'
import { Spin, Tooltip, Modal } from 'ant-design-vue'
import { copyTextSilent } from '@/utils/clipboard'

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(type: string, name: string) {
  if (type.startsWith('image/')) return <PictureOutlined />
  const lowerName = name.toLowerCase()
  if (lowerName.endsWith('.pdf')) return <FilePdfOutlined />
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileWordOutlined />
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.csv')) return <FileExcelOutlined />
  if (name.includes('.')) {
    const ext = name.toLowerCase().substring(name.lastIndexOf('.'))
    const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.go', '.rs',
                     '.json', '.yaml', '.yml', '.xml', '.html', '.css', '.scss', '.md', '.sql',
                     '.sh', '.bat', '.ps1', '.rb', '.php', '.c', '.cpp', '.h', '.cs', '.fs',
                     '.swift', '.kt', '.scala', '.groovy', '.r', '.m', '.mm', '.tex']
    if (codeExts.includes(ext)) return <CodeOutlined />
  }
  return <FileOutlined />
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : ''
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

function downloadAttachment(attachment: ChatAttachment) {
  if (!attachment.url) return

  let url = attachment.url
  let revokeUrl = false

  // 如果是 data URL，转换为 blob URL 以便下载
  if (url.startsWith('data:')) {
    const blob = dataURLtoBlob(url)
    url = URL.createObjectURL(blob)
    revokeUrl = true
  }

  const a = document.createElement('a')
  a.href = url
  a.download = attachment.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  if (revokeUrl) {
    URL.revokeObjectURL(url)
  }
}

export default defineComponent({
  name: 'ChatMessage',
  props: {
    message: {
      type: Object as PropType<ChatMessageType>,
      required: true,
    },
  },
  setup(props) {
    const chatStore = useChatStore()
    const bubbleRef = ref<HTMLElement | null>(null)
    const copied = ref(false)
    const showMarkdown = ref(false)
    const hasStartedTyping = ref(false)
    const previewImageVisible = ref(false)
    const previewImageUrl = ref('')
    const previewFileVisible = ref(false)
    const previewFileContent = ref('')
    const previewFileName = ref('')
    let cleanupCopy: (() => void) | null = null

    async function handleCopyMsg() {
      if (copied.value) return
      const text = props.message.content
      if (!text) return
      const ok = await copyTextSilent(text)
      if (ok) {
        copied.value = true
        setTimeout(() => { copied.value = false }, 2000)
      }
    }

    // 判断是否是持久化消息
    const isPersistedMsg = computed(() =>
      props.message.role === 'assistant' && !!props.message.content && !props.message.loading
    )

    // 判断是否正在生成的最后一条消息
    const isLastStreamingMessage = computed(() =>
      props.message.role === 'assistant' &&
      props.message.loading &&
      props.message.id === chatStore.currentConversation?.messages[chatStore.currentConversation.messages.length - 1]?.id
    )

    // 显示的文本内容
    const displayContent = computed(() =>
      isLastStreamingMessage.value ? chatStore.streamingContent : props.message.content
    )

    // 创建打字机实例（不需要 containerRef，直接返回渲染的 HTML）
    const { setText, stop, renderedHTML } = useTypewriter({
      speed: 120,
      cursorChar: '▍',
      onComplete: () => {
        showMarkdown.value = true
      },
    })

    // 监听显示内容变化
    watch(
      displayContent,
      (content) => {
        if (props.message.role !== 'assistant' || !content) return

        if (isPersistedMsg.value) {
          // 持久化消息：直接显示 Markdown
          showMarkdown.value = true
          return
        }

        if (isLastStreamingMessage.value) {
          // 正在生成
          if (!hasStartedTyping.value && content.length > 0) {
            // 首次有内容，启动打字效果
            showMarkdown.value = false
            setText(content)
            hasStartedTyping.value = true
          }
          // 后续流式更新会自动追赶到目标长度
        }
      },
      { immediate: true },
    )

    // 事件委托
    onMounted(() => {
      if (bubbleRef.value) {
        cleanupCopy = delegateCodeCopy(bubbleRef.value)
      }
    })

    onUnmounted(() => {
      stop()
      cleanupCopy?.()
    })

    function previewFile(attachment: ChatAttachment) {
      if (attachment.content) {
        previewFileName.value = attachment.relativePath
          ? `${attachment.relativePath}/${attachment.name}`
          : attachment.name
        previewFileContent.value = attachment.content
        previewFileVisible.value = true
      }
    }

    function renderAttachments(attachments: ChatAttachment[]) {
      const images = attachments.filter((a) => a.url && a.type.startsWith('image/'))
      const files = attachments.filter((a) => !a.type.startsWith('image/') || !a.url)

      return (
        <div class="msg-attachments">
          {images.length > 0 && (
            <div class="msg-attach-images">
              {images.map((a, i) => (
                <div key={i} class="msg-attach-image-wrapper" onClick={() => {
                  previewImageUrl.value = a.url!
                  previewImageVisible.value = true
                }}>
                  <img src={a.url} alt={a.name} class="msg-attach-img" />
                  <div class="msg-attach-image-overlay">
                    <PictureOutlined />
                    <span>点击预览</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div class="msg-attach-files">
              {files.map((a, i) => (
                <div key={i} class="msg-attach-file">
                  {a.relativePath && (
                    <span class="msg-attach-file-path">{a.relativePath}/</span>
                  )}
                  <span class="msg-attach-file-icon">{getFileIcon(a.type, a.name)}</span>
                  <div class="msg-attach-file-info">
                    <span class="msg-attach-file-name">{a.name}</span>
                    <span class="msg-attach-file-size">
                      {a.sendAsText && <CodeOutlined class="msg-attach-file-code-icon" />}
                      {formatSize(a.size)}
                    </span>
                  </div>
                  {a.content && (
                    <Tooltip title="预览内容">
                      <span class="msg-attach-file-preview" onClick={(e) => {
                        e.stopPropagation()
                        previewFile(a)
                      }}>
                        <EyeOutlined />
                      </span>
                    </Tooltip>
                  )}
                  <span class="msg-attach-file-download" onClick={() => downloadAttachment(a)}>
                    <DownloadOutlined />
                  </span>
                </div>
              ))}
            </div>
          )}
          <Modal
            open={previewImageVisible.value}
            footer={null}
            onCancel={() => (previewImageVisible.value = false)}
            width="auto"
            centered
            class="image-preview-modal"
          >
            <img src={previewImageUrl.value} style={{ maxWidth: '90vw', maxHeight: '90vh' }} />
          </Modal>
          <Modal
            open={previewFileVisible.value}
            title={previewFileName.value}
            footer={null}
            onCancel={() => (previewFileVisible.value = false)}
            width={800}
            centered
            class="file-preview-modal"
          >
            <pre class="file-preview-content">{previewFileContent.value}</pre>
          </Modal>
        </div>
      )
    }

    function renderContent() {
      const { role, loading, attachments } = props.message
      const content = displayContent.value

      if (loading && !content) {
        return <Spin size="small" />
      }

      if (role === 'user') {
        return (
          <>
          {attachments?.length ? renderAttachments(attachments) : null}
          {content ? <div class="whitespace-pre-wrap">{content}</div> : null}
          </>
        )
      }

      // 持久化消息：显示 Markdown
      if (isPersistedMsg.value && content) {
        return <div class="markdown-body" innerHTML={renderMarkdown(content)} />
      }

      // 打字完成：显示 Markdown
      if (showMarkdown.value && content) {
        return <div class="markdown-body" innerHTML={renderMarkdown(content)} />
      }

      // 正在打字：显示打字机渲染的 HTML（包含 Markdown、光标）
      return <div class="markdown-body" innerHTML={renderedHTML.value} />
    }

    return () => {
      const isUser = props.message.role === 'user'
      const { loading } = props.message
      const content = displayContent.value
      const showCopy = !loading && !!content

      return (
        <div class={['group flex gap-3 items-start', isUser ? 'flex-row-reverse' : 'flex-row']}>
          <div
            class={[
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
              isUser ? 'bg-primary' : 'bg-emerald-600',
            ]}
          >
            {isUser ? <UserOutlined /> : <RobotOutlined />}
          </div>
          <div class="max-w-[80%]">
            <div
              ref={bubbleRef}
              class={[
                'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                isUser
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-dark-input text-dark-text rounded-tl-sm',
              ]}
            >
              {renderContent()}
            </div>
            {showCopy && (
              <div class="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip title={copied.value ? '已复制' : '复制'}>
                  <button
                    class={['msg-copy-btn', copied.value && 'msg-copy-btn-copied']}
                    onClick={handleCopyMsg}
                  >
                    {copied.value ? <CheckOutlined /> : <CopyOutlined />}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )
    }
  },
})
