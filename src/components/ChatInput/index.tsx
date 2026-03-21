import { defineComponent, ref, computed, onUnmounted } from "vue";
import { Button, Textarea, Upload } from "ant-design-vue";
import {
  PictureOutlined,
  FileTextOutlined,
  SendOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons-vue";
import type { ChatAttachment } from "@/types/chat";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
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

    onUnmounted(() => {
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
      const attachmentsToClear =
        attachments.value.length > 0 ? [...attachments.value] : undefined;

      inputValue.value = "";
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

    function handleBeforeUpload(file: File) {
      const attachment: ChatAttachment = {
        name: file.name,
        size: file.size,
        type: file.type,
      };
      if (file.type.startsWith("image/")) {
        readFileAsDataUrl(file).then((url) => {
          attachment.url = url;
          attachments.value = [...attachments.value, attachment];
        });
      } else {
        attachments.value = [...attachments.value, attachment];
      }
      return false;
    }

    return () => (
      <div class="px-4 pb-6 pt-2 bg-gray-50 dark:bg-slate-900">
        <div class="max-w-5xl mx-auto">
          <div class="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
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
                    <span class="text-sm">上传文档</span>
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
