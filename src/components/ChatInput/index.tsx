import { defineComponent, ref, computed, onUnmounted } from "vue";
import { Button, Textarea, Upload, Modal, Tooltip } from "ant-design-vue";
import {
  PictureOutlined,
  FileTextOutlined,
  SendOutlined,
  PauseCircleOutlined,
  CloseOutlined,
  FileOutlined,
  FolderOutlined,
  CodeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  EyeOutlined,
} from "@ant-design/icons-vue";
import type { ChatAttachment } from "@/types/chat";
import { nanoid } from "@/utils/id";
import { saveAttachment, removeAttachment as removeAttachmentFromStorage } from "@/utils/attachmentStorage";

// 文本/代码文件扩展名列表
const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".rst", ".csv", ".tsv", ".json", ".jsonl",
  ".xml", ".html", ".htm", ".css", ".scss", ".sass", ".less", ".styl",
  ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte",
  ".py", ".pyw", ".ipynb", ".r", ".rkt", ".rs", ".go",
  ".java", ".kt", ".kts", ".scala", ".groovy", ".gradle",
  ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx",
  ".cs", ".fs", ".fsx", ".vb",
  ".php", ".phtml", ".php3", ".php4", ".php5", ".phps",
  ".rb", ".rake", ".erb", ".jbuilder",
  ".swift", ".m", ".mm",
  ".go", ".mod", ".sum",
  ".sql", ".ps1", ".bat", ".cmd", ".sh", ".bash", ".zsh", ".fish",
  ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".config",
  ".log", ".env", ".env.local", ".env.development", ".env.production",
  ".gitignore", ".dockerignore",
  ".proto", ".thrift", ".avsc",
  ".graphql", ".gql",
  ".vim", ".vimrc",
  ".tex", ".latex", ".bib",
]);

// 判断是否是文本/代码文件
function isTextFile(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // 无扩展名的文件也假设是文本
  if (!filename.includes('.')) return true;
  return false;
}

// 获取文件图标
function getFileIcon(type: string, name: string) {
  if (type.startsWith("image/")) return <PictureOutlined />;
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.pdf')) return <FilePdfOutlined />;
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return <FileWordOutlined />;
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.csv')) return <FileExcelOutlined />;
  if (isTextFile(name)) return <CodeOutlined />;
  return <FileOutlined />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default defineComponent({
  name: "ChatInput",
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["send", "stop"],
  setup(props, { emit }) {
    const inputValue = ref("");
    const attachments = ref<ChatAttachment[]>([]);
    const previewImageVisible = ref(false);
    const previewImageUrl = ref("");
    const previewFileVisible = ref(false);
    const previewFileContent = ref("");
    const previewFileName = ref("");

    onUnmounted(() => {
      // 组件卸载时清理 blob URL
      attachments.value.forEach((a) => {
        if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
      });
    });

    const currentLength = computed(() => inputValue.value.length);

    const canSend = computed(() => {
      return (!!inputValue.value.trim() || attachments.value.length > 0) && !props.loading;
    });

    function handleSend() {
      if (!canSend.value) return;

      const content = inputValue.value.trim();
      // 发送附件时，图片保留 data URL 用于预览（历史消息预览）
      const attachmentsToClear = attachments.value.length > 0
        ? attachments.value.map(a => {
            if (a.type.startsWith("image/")) {
              return { ...a };
            }
            // 非图片文件：url 只用于当前会话预览，发送时保留 id 用于从 IndexedDB 读取
            return { ...a, url: undefined };
          })
        : undefined;

      inputValue.value = "";
      // 清理 blob URL
      attachments.value.forEach((a) => {
        if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
      });
      attachments.value = [];

      setTimeout(() => {
        emit("send", {
          content,
          attachments: attachmentsToClear,
        });
      }, 0);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }

    async function processFile(file: File, relativePath?: string) {
      const isDir = (file as any).webkitRelativePath || relativePath || file.name;
      const pathParts = isDir.split('/');
      const name = pathParts[pathParts.length - 1];
      const actualRelativePath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : undefined;

      const attachment: ChatAttachment = {
        id: nanoid(),
        name,
        size: file.size,
        type: file.type,
        relativePath: actualRelativePath,
        uploadStatus: "pending",
        sendAsText: isTextFile(name),
        contentLoaded: false,
      };

      try {
        // 保存文件到 IndexedDB
        await saveAttachment(attachment.id, file);

        // 图片需要 data URL 用于预览
        if (file.type.startsWith("image/")) {
          attachment.url = await readFileAsDataUrl(file);
        } else {
          // 其他文件用 blob URL 用于预览（当前会话有效）
          attachment.url = URL.createObjectURL(file);
        }

        // 文本文件同时读取 content
        if (isTextFile(name)) {
          try {
            const text = await readFileAsText(file);
            attachment.content = text;
            attachment.contentLoaded = true;
          } catch {
            // 读取失败也没关系，仍然作为附件处理
            attachment.sendAsText = false;
          }
        }

        attachment.uploadStatus = "success";
      } catch {
        attachment.uploadStatus = "error";
        attachment.errorMessage = "文件读取失败";
      }

      if (attachment.sendAsText) {
        try {
          const text = await readFileAsText(file);
          attachment.content = text;
          attachment.contentLoaded = true;
        } catch {
          // 读取失败也没关系，仍然作为附件处理
          attachment.sendAsText = false;
        }
      }

      return attachment;
    }

    async function handleBeforeUpload(file: File) {
      const attachment = await processFile(file);
      if (attachment) {
        attachments.value = [...attachments.value, attachment];
      }
      return false;
    }

    async function handleDirectoryChange(info: any) {
      const files = info.fileList as any[];
      if (!files || files.length === 0) return;

      const fileObjects = files.map(f => f.originFileObj).filter(Boolean) as File[];

      const newAttachments: ChatAttachment[] = [];
      for (const file of fileObjects) {
        const attachment = await processFile(file);
        if (attachment) {
          newAttachments.push(attachment);
        }
      }

      if (newAttachments.length > 0) {
        attachments.value = [...attachments.value, ...newAttachments];
      }
    }

    function removeAttachment(id: string) {
      const idx = attachments.value.findIndex((a) => a.id === id);
      if (idx !== -1) {
        const attachment = attachments.value[idx];
        // 清理 blob URL
        if (attachment.url?.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.url);
        }
        // 从 IndexedDB 删除
        removeAttachmentFromStorage(id).catch(console.error);
        attachments.value = attachments.value.filter((a) => a.id !== id);
      }
    }

    function previewImage(url: string) {
      previewImageUrl.value = url;
      previewImageVisible.value = true;
    }

    function previewFile(attachment: ChatAttachment) {
      if (attachment.content) {
      previewFileName.value = attachment.relativePath
        ? `${attachment.relativePath}/${attachment.name}`
        : attachment.name;
      previewFileContent.value = attachment.content;
      previewFileVisible.value = true;
    }
    }

    function toggleSendAsText(attachment: ChatAttachment) {
      attachment.sendAsText = !attachment.sendAsText;
      attachments.value = [...attachments.value];
    }

    function renderAttachments() {
      if (attachments.value.length === 0) return null;

      return (
        <div class="chat-input-attachments">
          {attachments.value.map((attachment) => (
            <div key={attachment.id} class="chat-input-attachment-item">
              {attachment.type.startsWith("image/") && attachment.url ? (
                <div class="chat-input-attachment-image-wrapper">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    class="chat-input-attachment-image"
                    onClick={() => previewImage(attachment.url!)}
                  />
                  <button
                    class="chat-input-attachment-remove"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <CloseOutlined />
                  </button>
                  {attachment.relativePath && (
                    <div class="chat-input-attachment-path">{attachment.relativePath}</div>
                  )}
                </div>
              ) : (
                <div class="chat-input-attachment-file">
                  <span class="chat-input-attachment-file-icon">
                    {getFileIcon(attachment.type, attachment.name)}
                  </span>
                  <div class="chat-input-attachment-file-info">
                    <span class="chat-input-attachment-file-name">{attachment.name}</span>
                    <span class="chat-input-attachment-file-meta">
                      {attachment.relativePath && <span class="chat-input-attachment-path-small">{attachment.relativePath}/</span>}
                      <span>{formatSize(attachment.size)}</span>
                    </span>
                  </div>
                  <div class="chat-input-attachment-actions">
                    {attachment.contentLoaded && (
                      <Tooltip title={attachment.sendAsText ? "不作为文本发送" : "作为文本发送"}>
                        <button
                          class={["chat-input-attachment-action", attachment.sendAsText && "active"]}
                          onClick={(e) => { e.stopPropagation(); toggleSendAsText(attachment); }}
                        >
                          <CodeOutlined />
                        </button>
                      </Tooltip>
                    )}
                    {attachment.content && (
                      <Tooltip title="预览内容">
                        <button
                          class="chat-input-attachment-action"
                          onClick={(e) => { e.stopPropagation(); previewFile(attachment); }}
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                    )}
                    <button
                      class="chat-input-attachment-remove-small"
                      onClick={(e) => { e.stopPropagation(); removeAttachment(attachment.id); }}
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                </div>
              )}
              {attachment.uploadStatus === "error" && (
                <div class="chat-input-attachment-error">{attachment.errorMessage}</div>
              )}
            </div>
          ))}
          <Modal
            open={previewImageVisible.value}
            footer={null}
            onCancel={() => (previewImageVisible.value = false)}
            width="auto"
            centered
            class="image-preview-modal"
          >
            <img src={previewImageUrl.value} style={{ maxWidth: "90vw", maxHeight: "90vh" }} />
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
      );
    }

    return () => (
      <div class="px-4 pb-6 pt-2 bg-gray-50 dark:bg-slate-900">
        <div class="max-w-5xl mx-auto">
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* 已上传附件列表 */}
            {renderAttachments()}

            {/* 输入框 */}
            <Textarea
              v-model:value={inputValue.value}
              placeholder="请输入内容..."
              autoSize={{ minRows: 2, maxRows: 8 }}
              onKeydown={handleKeyDown}
              bordered={false}
              class="new-chat-textarea"
              disabled={props.loading}
            />

            {/* 工具栏 */}
            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <div class="flex items-center gap-2">
                <Upload
                  beforeUpload={handleBeforeUpload}
                  showUploadList={false}
                  multiple
                  accept="image/*"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<PictureOutlined />}
                    class="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span class="text-sm">上传图片</span>
                  </Button>
                </Upload>
                <Upload
                  beforeUpload={handleBeforeUpload}
                  showUploadList={false}
                  multiple
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<FileTextOutlined />}
                    class="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span class="text-sm">上传文件</span>
                  </Button>
                </Upload>
                <Upload
                  directory
                  showUploadList={false}
                  onChange={handleDirectoryChange}
                  // @ts-ignore - webkitdirectory 是 HTML 属性
                  {...{ webkitdirectory: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<FolderOutlined />}
                    class="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span class="text-sm">上传文件夹</span>
                  </Button>
                </Upload>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-400 dark:text-gray-500">
                  {currentLength.value}
                </span>
                {props.loading ? (
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="large"
                    icon={<PauseCircleOutlined />}
                    onClick={() => emit("stop")}
                    class="w-10 h-10 flex items-center justify-center"
                  />
                ) : (
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!canSend.value}
                    class={[
                      "w-10 h-10 flex items-center justify-center transition-all duration-200",
                      canSend.value
                        ? "bg-blue-600 hover:bg-blue-700 border-0"
                        : "bg-blue-200 dark:bg-blue-900/50 border-0 cursor-not-allowed",
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
