import { defineComponent, ref, computed, onUnmounted } from "vue";
import {
  Dropdown,
  Button,
  Textarea,
  Upload,
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
} from "ant-design-vue";
import {
  ArrowUpOutlined,
  PauseCircleOutlined,
  PaperClipOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  BankOutlined,
} from "@ant-design/icons-vue";
import type { ChatAttachment } from "@/types/chat";
import { useAppStore } from "@/store/modules/app";

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
    const appStore = useAppStore();
    const inputValue = ref("");
    const attachments = ref<ChatAttachment[]>([]);
    const showAddAgentModal = ref(false);
    const editingAgentId = ref<string | null>(null);
    const agentForm = ref({
      apiKey: "",
      baseUrl: "",
      website: "",
      model: "",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
    });

    const currentAgent = computed(() =>
      appStore.agents.find((a) => a.id === appStore.currentAgentId),
    );

    onUnmounted(() => {
      attachments.value.forEach((a) => {
        if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
      });
    });

    const canSend = computed(() => {
      return !!inputValue.value.trim() || attachments.value.length > 0;
    });

    function handleSend() {
      if (!canSend.value) return;
      if (!appStore.currentAgentId) {
        message.warning("请选择模型");
        return;
      }

      const content = inputValue.value.trim();
      const attachmentsToClear =
        attachments.value.length > 0 ? [...attachments.value] : undefined;

      // 先清空输入框和附件
      inputValue.value = "";

      attachments.value.forEach((a) => {
        if (a.url?.startsWith("blob:")) URL.revokeObjectURL(a.url);
      });
      attachments.value = [];

      setTimeout(() => {
        // 再发送消息
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

    function removeAttachment(idx: number) {
      attachments.value = attachments.value.filter((_, i) => i !== idx);
    }

    function formatSize(bytes: number): string {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    function handleSelectAgent(id: string) {
      appStore.SET_CURRENT_AGENT(id);
    }

    function handleDeleteAgent(id: string, e: Event) {
      e.stopPropagation();
      Modal.confirm({
        title: "确认删除",
        content: "确定要删除该模型吗？",
        okText: "删除",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk() {
          appStore.DELETE_AGENT(id);
          message.success("模型已删除");
        },
      });
    }

    function handleEditAgent(id: string, e: Event) {
      e.stopPropagation();
      const agent = appStore.agents.find((a) => a.id === id);
      if (!agent) return;
      editingAgentId.value = id;
      agentForm.value = {
        apiKey: agent.apiKey,
        baseUrl: agent.baseUrl,
        website: agent.website || "",
        model: agent.model,
        temperature: agent.temperature ?? 0.7,
        maxTokens: agent.maxTokens ?? 4096,
        topP: agent.topP ?? 1,
        presencePenalty: agent.presencePenalty ?? 0,
        frequencyPenalty: agent.frequencyPenalty ?? 0,
      };
      showAddAgentModal.value = true;
    }

    function handleAgentModalOk() {
      if (
        !agentForm.value.apiKey ||
        !agentForm.value.baseUrl ||
        !agentForm.value.model
      ) {
        message.warning("请填写完整信息");
        return;
      }
      if (editingAgentId.value) {
        appStore.UPDATE_AGENT(editingAgentId.value, {
          apiKey: agentForm.value.apiKey,
          baseUrl: agentForm.value.baseUrl,
          website: agentForm.value.website,
          model: agentForm.value.model,
          temperature: agentForm.value.temperature,
          maxTokens: agentForm.value.maxTokens,
          topP: agentForm.value.topP,
          presencePenalty: agentForm.value.presencePenalty,
          frequencyPenalty: agentForm.value.frequencyPenalty,
        });
        message.success("模型已更新");
      } else {
        appStore.ADD_AGENT({
          apiKey: agentForm.value.apiKey,
          baseUrl: agentForm.value.baseUrl,
          website: agentForm.value.website,
          model: agentForm.value.model,
          temperature: agentForm.value.temperature,
          maxTokens: agentForm.value.maxTokens,
          topP: agentForm.value.topP,
          presencePenalty: agentForm.value.presencePenalty,
          frequencyPenalty: agentForm.value.frequencyPenalty,
        });
        message.success("模型已添加");
      }
      showAddAgentModal.value = false;
      editingAgentId.value = null;
      agentForm.value = {
        apiKey: "",
        baseUrl: "",
        website: "",
        model: "",
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
      };
    }

    function handleAgentModalCancel() {
      showAddAgentModal.value = false;
      editingAgentId.value = null;
      agentForm.value = {
        apiKey: "",
        baseUrl: "",
        website: "",
        model: "",
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
      };
    }

    return () => (
      <>
        <div class="px-4 pb-6 pt-2 bg-dark-bg">
          <div class="max-w-3xl mx-auto">
            <div class="chat-input-card">
              {/* 附件预览 */}
              {attachments.value.length > 0 && (
                <div class="flex flex-wrap gap-2 px-3 pt-3">
                  {attachments.value.map((a, idx) => (
                    <div key={idx} class="attachment-preview">
                      {a.url ? (
                        <img
                          src={a.url}
                          alt={a.name}
                          class="attachment-thumb"
                        />
                      ) : (
                        <div class="attachment-file">
                          <PaperClipOutlined style={{ fontSize: "18px" }} />
                        </div>
                      )}
                      <span class="attachment-name" title={a.name}>
                        {a.name}
                        <span class="text-xs text-dark-muted ml-1">
                          ({formatSize(a.size)})
                        </span>
                      </span>
                      <button
                        class="attachment-remove"
                        onClick={() => removeAttachment(idx)}
                      >
                        <CloseOutlined style={{ fontSize: "10px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 输入框 */}
              <Textarea
                v-model:value={inputValue.value}
                placeholder='发消息或输入"/"选择技能'
                autoSize={{ minRows: 1, maxRows: 6 }}
                onKeydown={handleKeyDown}
                bordered={false}
                class="chat-textarea"
                disabled={props.loading}
              />

              {/* 工具栏 */}
              <div class="chat-toolbar">
                <Dropdown
                  trigger={["hover"]}
                  overlayClassName="attach-dropdown"
                  v-slots={{
                    overlay: () => (
                      <div class="attach-menu">
                        <Upload
                          beforeUpload={handleBeforeUpload}
                          showUploadList={false}
                          multiple
                        >
                          <div class="attach-menu-item">
                            <PaperClipOutlined />
                            <span>上传文件</span>
                          </div>
                        </Upload>
                        <Upload
                          beforeUpload={handleBeforeUpload}
                          showUploadList={false}
                          multiple
                          directory
                        >
                          <div class="attach-menu-item">
                            <FolderOpenOutlined />
                            <span>上传文件夹</span>
                          </div>
                        </Upload>
                        <Upload
                          beforeUpload={handleBeforeUpload}
                          showUploadList={false}
                          multiple
                          accept="image/*"
                        >
                          <div class="attach-menu-item">
                            <PictureOutlined />
                            <span>上传图片</span>
                          </div>
                        </Upload>
                      </div>
                    ),
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<PaperClipOutlined />}
                    class="toolbar-icon-btn"
                  />
                </Dropdown>

                <div class="toolbar-divider" />

                <Dropdown
                  trigger={["hover"]}
                  overlayClassName="model-dropdown"
                  v-slots={{
                    overlay: () => (
                      <div class="model-menu">
                        {appStore.agents.map((agent) => (
                          <div
                            key={agent.id}
                            class={[
                              "model-menu-item",
                              agent.id === appStore.currentAgentId &&
                                "model-menu-item-active",
                            ]}
                            onClick={() => handleSelectAgent(agent.id)}
                          >
                            <span
                              class="model-menu-item-label"
                              title={agent.model}
                            >
                              {agent.model}
                            </span>
                            <div class="model-menu-item-actions">
                              {agent.website && (
                                <a
                                  href={agent.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="model-menu-item-action"
                                  title="官网"
                                  onClick={(e: Event) => e.stopPropagation()}
                                >
                                  <BankOutlined style={{ fontSize: "12px" }} />
                                </a>
                              )}
                              <button
                                class="model-menu-item-action"
                                onClick={(e: Event) =>
                                  handleEditAgent(agent.id, e)
                                }
                                title="编辑模型"
                              >
                                <EditOutlined style={{ fontSize: "12px" }} />
                              </button>
                              <button
                                class="model-menu-item-action model-menu-item-action-danger"
                                onClick={(e: Event) =>
                                  handleDeleteAgent(agent.id, e)
                                }
                                title="删除模型"
                              >
                                <DeleteOutlined style={{ fontSize: "12px" }} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div class="model-menu-divider" />
                        <div
                          class="model-menu-item model-menu-item-add"
                          onClick={() => (showAddAgentModal.value = true)}
                        >
                          <PlusOutlined style={{ fontSize: "12px" }} />
                          <span>添加模型</span>
                        </div>
                      </div>
                    ),
                  }}
                >
                  <Button type="text" size="small" class="model-select-btn">
                    <span class="model-select-label">
                      {currentAgent.value?.model || "选择模型"}
                    </span>
                    <DownOutlined
                      style={{ fontSize: "10px", marginLeft: "4px" }}
                    />
                  </Button>
                </Dropdown>

                <div class="flex-1" />
                {props.loading ? (
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={() => emit("stop")}
                    class="send-btn send-btn-stop"
                  />
                ) : (
                  <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={handleSend}
                    disabled={!canSend.value}
                    class={["send-btn", canSend.value && "send-btn-active"]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={showAddAgentModal.value}
          title={editingAgentId.value ? "编辑模型" : "添加模型"}
          onOk={handleAgentModalOk}
          onCancel={handleAgentModalCancel}
          okText={editingAgentId.value ? "保存" : "添加"}
          cancelText="取消"
        >
          <Form layout="vertical" class="mt-4">
            <FormItem label="模型名称" required>
              <Input
                value={agentForm.value.model}
                onChange={(e: any) => (agentForm.value.model = e.target.value)}
                placeholder="请输入模型名称"
              />
            </FormItem>
            <FormItem label="API Key" required>
              <Input.Password
                value={agentForm.value.apiKey}
                onChange={(e: any) => (agentForm.value.apiKey = e.target.value)}
                placeholder="请输入 API Key"
              />
            </FormItem>
            <FormItem label="Base URL" required>
              <Input
                value={agentForm.value.baseUrl}
                onChange={(e: any) =>
                  (agentForm.value.baseUrl = e.target.value)
                }
                placeholder="如 https://open.bigmodel.cn/api/paas/v4/chat/completions"
              />
            </FormItem>
            <FormItem label="官网地址">
              <Input
                value={agentForm.value.website}
                onChange={(e: any) =>
                  (agentForm.value.website = e.target.value)
                }
                placeholder="如 https://open.bigmodel.cn"
              />
            </FormItem>
            <FormItem label="Temperature">
              <InputNumber
                value={agentForm.value.temperature}
                onChange={(v: any) => (agentForm.value.temperature = v)}
                min={0}
                max={2}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="采样温度 0~2"
              />
            </FormItem>
            <FormItem label="Max Tokens">
              <InputNumber
                value={agentForm.value.maxTokens}
                onChange={(v: any) => (agentForm.value.maxTokens = v)}
                min={1}
                max={128000}
                step={256}
                style={{ width: "100%" }}
                placeholder="最大输出 token 数"
              />
            </FormItem>
            <FormItem label="Top P">
              <InputNumber
                value={agentForm.value.topP}
                onChange={(v: any) => (agentForm.value.topP = v)}
                min={0}
                max={1}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="核采样 0~1"
              />
            </FormItem>
            <FormItem label="Presence Penalty">
              <InputNumber
                value={agentForm.value.presencePenalty}
                onChange={(v: any) => (agentForm.value.presencePenalty = v)}
                min={-2}
                max={2}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="存在惩罚 -2~2"
              />
            </FormItem>
            <FormItem label="Frequency Penalty">
              <InputNumber
                value={agentForm.value.frequencyPenalty}
                onChange={(v: any) => (agentForm.value.frequencyPenalty = v)}
                min={-2}
                max={2}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="频率惩罚 -2~2"
              />
            </FormItem>
          </Form>
        </Modal>
      </>
    );
  },
});
