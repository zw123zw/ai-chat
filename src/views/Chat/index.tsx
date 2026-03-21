import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '@/store/modules/chat'
import { useAppStore } from '@/store/modules/app'
import ChatInput from '@/components/ChatInput'
import ChatMessage from '@/components/ChatMessage'
import {
  RedoOutlined,
  VerticalAlignBottomOutlined,
  PlusOutlined,
  DownOutlined,
  BookOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { Button, Dropdown, Modal, Form, Input, InputNumber, message, Upload, Radio } from 'ant-design-vue'
import type { UploadProps } from 'ant-design-vue'
import type { ChatAttachment } from '@/types/chat'
import type { Agent } from '@/types/agent'

const quickQuestions = [
  {
    icon: <BookOutlined />,
    title: '请问如何成为一名优秀的产品经理？',
    color: 'bg-blue-500',
  },
  {
    icon: <AppstoreOutlined />,
    title: '用户调研应该怎么展开会更加专业全面',
    color: 'bg-pink-500',
  },
  {
    icon: <BarChartOutlined />,
    title: '请帮我分析这份数据，并得出用户行为结论',
    color: 'bg-amber-500',
  },
]

export default defineComponent({
  name: 'ChatPage',
  setup() {
    const chatStore = useChatStore()
    const appStore = useAppStore()
    const messagesRef = ref<HTMLElement>()
    const showScrollButton = ref(false)
    const showAddAgentModal = ref(false)
    const editingAgentId = ref<string | null>(null)
    const importMode = ref<'single' | 'batch'>('single')
    const batchImportText = ref('')
    const agentForm = ref({
      apiKey: '',
      baseUrl: '',
      website: '',
      model: '',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
    })

    const defaultAgentForm = {
      apiKey: '',
      baseUrl: '',
      website: '',
      model: '',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
    }

    const currentAgent = computed(() =>
      appStore.agents.find((a) => a.id === appStore.currentAgentId),
    )

    function handleSend(payload: { content: string; attachments?: ChatAttachment[] }) {
      chatStore.SEND_MESSAGE(payload.content, payload.attachments)
      scrollToBottom()
    }

    function scrollToBottom() {
      setTimeout(() => {
        if (messagesRef.value) {
          messagesRef.value.scrollTop = messagesRef.value.scrollHeight
        }
      }, 50)
    }

    function handleScroll() {
      if (messagesRef.value) {
        const { scrollTop, scrollHeight, clientHeight } = messagesRef.value
        showScrollButton.value = scrollHeight - scrollTop - clientHeight > 200
      }
    }

    function handleQuickQuestion(question: string) {
      chatStore.SEND_MESSAGE(question)
      scrollToBottom()
    }

    function handleSelectAgent(id: string) {
      appStore.SET_CURRENT_AGENT(id)
    }

    function handleDeleteAgent(id: string, e: Event) {
      e.stopPropagation()
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除该模型吗？',
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk() {
          appStore.DELETE_AGENT(id)
          message.success('模型已删除')
        },
      })
    }

    function handleEditAgent(id: string, e: Event) {
      e.stopPropagation()
      const agent = appStore.agents.find((a) => a.id === id)
      if (!agent) return
      editingAgentId.value = id
      importMode.value = 'single'
      agentForm.value = {
        apiKey: agent.apiKey,
        baseUrl: agent.baseUrl,
        website: agent.website || '',
        model: agent.model,
        temperature: agent.temperature ?? 0.7,
        maxTokens: agent.maxTokens ?? 4096,
        topP: agent.topP ?? 1,
        presencePenalty: agent.presencePenalty ?? 0,
        frequencyPenalty: agent.frequencyPenalty ?? 0,
      }
      showAddAgentModal.value = true
    }

    function handleAgentModalOk() {
      if (!editingAgentId.value && importMode.value === 'batch') {
        handleBatchImport()
        return
      }

      if (
        !agentForm.value.apiKey ||
        !agentForm.value.baseUrl ||
        !agentForm.value.model
      ) {
        message.warning('请填写完整信息')
        return
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
        })
        message.success('模型已更新')
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
        })
        message.success('模型已添加')
      }
      showAddAgentModal.value = false
      editingAgentId.value = null
      resetAgentForm()
    }

    function handleAgentModalCancel() {
      showAddAgentModal.value = false
      editingAgentId.value = null
      importMode.value = 'single'
      batchImportText.value = ''
      agentForm.value = { ...defaultAgentForm }
    }

    function resetAgentForm() {
      agentForm.value = { ...defaultAgentForm }
    }

    function parseAgentsFromText(text: string): Array<Omit<Agent, 'id' | 'createdAt'>> {
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        try {
          parsed = JSON.parse(text.trim())
        } catch (e2) {
          throw new Error('JSON 格式解析失败，请检查格式')
        }
      }

      const agents = Array.isArray(parsed) ? parsed : [parsed]

      return agents.map((item: any) => ({
        apiKey: item.apiKey || '',
        baseUrl: item.baseUrl || '',
        website: item.website || '',
        model: item.model || '',
        temperature: item.temperature ?? 0.7,
        maxTokens: item.maxTokens ?? 4096,
        topP: item.topP ?? 1,
        presencePenalty: item.presencePenalty ?? 0,
        frequencyPenalty: item.frequencyPenalty ?? 0,
      }))
    }

    function validateAgents(agents: Array<Omit<Agent, 'id' | 'createdAt'>>): boolean {
      if (agents.length === 0) {
        message.warning('没有可导入的模型数据')
        return false
      }

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i]
        if (!agent.apiKey || !agent.baseUrl || !agent.model) {
          message.warning(`第 ${i + 1} 个模型缺少必填字段（apiKey、baseUrl、model）`)
          return false
        }
      }

      return true
    }

    function handleBatchImport() {
      if (!batchImportText.value.trim()) {
        message.warning('请输入 JSON 数据')
        return
      }

      try {
        const agents = parseAgentsFromText(batchImportText.value)

        if (!validateAgents(agents)) {
          return
        }

        agents.forEach((agent) => {
          appStore.ADD_AGENT(agent)
        })

        message.success(`成功导入 ${agents.length} 个模型`)
        showAddAgentModal.value = false
        batchImportText.value = ''
        importMode.value = 'single'
      } catch (error) {
        message.error((error as Error).message || '导入失败')
      }
    }

    const handleFileUpload: UploadProps['beforeUpload'] = (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        batchImportText.value = content
        message.success('文件内容已加载')
      }
      reader.onerror = () => {
        message.error('文件读取失败')
      }
      reader.readAsText(file)
      return false
    }

    onMounted(scrollToBottom)

    watch(() => chatStore.currentConversationId, scrollToBottom)

    return () => (
      <div class="flex flex-col h-full">
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div />
          <div class="flex items-center gap-3">
            <Dropdown
              trigger={['hover']}
              overlayClassName="model-dropdown"
              v-slots={{
                overlay: () => (
                  <div class="model-menu">
                    {appStore.agents.map((agent) => (
                      <div
                        key={agent.id}
                        class={[
                          'model-menu-item',
                          agent.id === appStore.currentAgentId && 'model-menu-item-active',
                        ]}
                        onClick={() => handleSelectAgent(agent.id)}
                      >
                        <span class="model-menu-item-label" title={agent.model}>
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
                              <BankOutlined style={{ fontSize: '12px' }} />
                            </a>
                          )}
                          <Button
                            type="text"
                            size="small"
                            class="model-menu-item-action p-0"
                            onClick={(e: Event) => handleEditAgent(agent.id, e)}
                            title="编辑模型"
                          >
                            <EditOutlined style={{ fontSize: '12px' }} />
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            class="model-menu-item-action model-menu-item-action-danger p-0"
                            onClick={(e: Event) => handleDeleteAgent(agent.id, e)}
                            title="删除模型"
                          >
                            <DeleteOutlined style={{ fontSize: '12px' }} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div class="model-menu-divider" />
                    <div
                      class="model-menu-item model-menu-item-add"
                      onClick={() => {
                        editingAgentId.value = null
                        importMode.value = 'single'
                        resetAgentForm()
                        showAddAgentModal.value = true
                      }}
                    >
                      <PlusOutlined style={{ fontSize: '12px' }} />
                      <span>添加模型</span>
                    </div>
                  </div>
                ),
              }}
            >
              <Button>
                <span>
                  {currentAgent.value?.model || '选择模型'}
                </span>
                <DownOutlined style={{ fontSize: '10px', marginLeft: '4px' }} />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => chatStore.CREATE_CONVERSATION()}
              class="bg-blue-600 hover:bg-blue-700 border-0 h-9 font-medium rounded-lg"
            >
              新建对话
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={messagesRef}
          class="flex-1 overflow-y-auto px-4 py-8"
          onScroll={handleScroll}
        >
          {chatStore.currentMessages.length === 0 ? (
            <div class="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
              {/* Robot Avatar */}
              <div class="mb-8">
                <div class="w-40 h-40 flex items-center justify-center text-8xl">
                  🤖
                </div>
              </div>

              {/* Welcome Text */}
              <div class="text-center mb-10">
                <h2 class="text-xl text-gray-500 dark:text-gray-400 mb-2">你好，MOMO</h2>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                  今天需要我帮你做点什么吗？
                </h1>
              </div>

              {/* Quick Questions */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                {quickQuestions.map((q, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleQuickQuestion(q.title)}
                    class="p-4 h-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 text-left"
                    type="text"
                    block
                  >
                    <div class={`w-9 h-9 ${q.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                      {q.icon}
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors m-0">
                      {q.title}
                    </p>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div class="max-w-3xl mx-auto space-y-6">
              {chatStore.currentMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {!chatStore.generating && chatStore.currentMessages.length > 0 && (
                <div class="flex justify-center">
                  <Button
                    type="text"
                    size="small"
                    icon={<RedoOutlined />}
                    onClick={() => chatStore.REGENERATE_LAST_MESSAGE()}
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    重新生成
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton.value && (
          <div class="absolute bottom-44 left-1/2 -translate-x-1/2 z-10">
            <Button
              shape="circle"
              size="large"
              icon={<VerticalAlignBottomOutlined />}
              onClick={scrollToBottom}
              class="shadow-lg bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border-gray-200 dark:border-slate-600"
            />
          </div>
        )}

        {/* Input area */}
        <ChatInput
          onSend={handleSend}
          loading={chatStore.generating}
          onStop={() => chatStore.STOP_GENERATING()}
        />

        {/* Add/Edit Agent Modal */}
        <Modal
          open={showAddAgentModal.value}
          title={editingAgentId.value ? '编辑模型' : '添加模型'}
          onOk={handleAgentModalOk}
          onCancel={handleAgentModalCancel}
          okText={editingAgentId.value ? '保存' : (importMode.value === 'batch' ? '导入' : '添加')}
          cancelText="取消"
          width={600}
        >
          {editingAgentId.value ? (
            <Form layout="vertical" class="mt-4">
              <Form.Item label="模型名称" required>
                <Input
                  value={agentForm.value.model}
                  onChange={(e: any) => (agentForm.value.model = e.target.value)}
                  placeholder="请输入模型名称"
                />
              </Form.Item>
              <Form.Item label="API Key" required>
                <Input.Password
                  value={agentForm.value.apiKey}
                  onChange={(e: any) => (agentForm.value.apiKey = e.target.value)}
                  placeholder="请输入 API Key"
                />
              </Form.Item>
              <Form.Item label="Base URL" required>
                <Input
                  value={agentForm.value.baseUrl}
                  onChange={(e: any) => (agentForm.value.baseUrl = e.target.value)}
                  placeholder="如 https://open.bigmodel.cn/api/paas/v4/chat/completions"
                />
              </Form.Item>
              <Form.Item label="官网地址">
                <Input
                  value={agentForm.value.website}
                  onChange={(e: any) => (agentForm.value.website = e.target.value)}
                  placeholder="如 https://open.bigmodel.cn"
                />
              </Form.Item>
              <Form.Item label="Temperature">
                <InputNumber
                  value={agentForm.value.temperature}
                  onChange={(v: any) => (agentForm.value.temperature = v)}
                  min={0}
                  max={2}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="采样温度 0~2"
                />
              </Form.Item>
              <Form.Item label="Max Tokens">
                <InputNumber
                  value={agentForm.value.maxTokens}
                  onChange={(v: any) => (agentForm.value.maxTokens = v)}
                  min={1}
                  max={128000}
                  step={256}
                  style={{ width: '100%' }}
                  placeholder="最大输出 token 数"
                />
              </Form.Item>
              <Form.Item label="Top P">
                <InputNumber
                  value={agentForm.value.topP}
                  onChange={(v: any) => (agentForm.value.topP = v)}
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="核采样 0~1"
                />
              </Form.Item>
              <Form.Item label="Presence Penalty">
                <InputNumber
                  value={agentForm.value.presencePenalty}
                  onChange={(v: any) => (agentForm.value.presencePenalty = v)}
                  min={-2}
                  max={2}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="存在惩罚 -2~2"
                />
              </Form.Item>
              <Form.Item label="Frequency Penalty">
                <InputNumber
                  value={agentForm.value.frequencyPenalty}
                  onChange={(v: any) => (agentForm.value.frequencyPenalty = v)}
                  min={-2}
                  max={2}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="频率惩罚 -2~2"
                />
              </Form.Item>
            </Form>
          ) : (
            <div class="mt-4">
              <Radio.Group
                value={importMode.value}
                onChange={(e: any) => (importMode.value = e.target.value)}
                class="mb-4"
              >
                <Radio value="single">单个添加</Radio>
                <Radio value="batch">批量导入</Radio>
              </Radio.Group>

              {importMode.value === 'single' ? (
                <Form layout="vertical">
                  <Form.Item label="模型名称" required>
                    <Input
                      value={agentForm.value.model}
                      onChange={(e: any) => (agentForm.value.model = e.target.value)}
                      placeholder="请输入模型名称"
                    />
                  </Form.Item>
                  <Form.Item label="API Key" required>
                    <Input.Password
                      value={agentForm.value.apiKey}
                      onChange={(e: any) => (agentForm.value.apiKey = e.target.value)}
                      placeholder="请输入 API Key"
                    />
                  </Form.Item>
                  <Form.Item label="Base URL" required>
                    <Input
                      value={agentForm.value.baseUrl}
                      onChange={(e: any) => (agentForm.value.baseUrl = e.target.value)}
                      placeholder="如 https://open.bigmodel.cn/api/paas/v4/chat/completions"
                    />
                  </Form.Item>
                  <Form.Item label="官网地址">
                    <Input
                      value={agentForm.value.website}
                      onChange={(e: any) => (agentForm.value.website = e.target.value)}
                      placeholder="如 https://open.bigmodel.cn"
                    />
                  </Form.Item>
                  <Form.Item label="Temperature">
                    <InputNumber
                      value={agentForm.value.temperature}
                      onChange={(v: any) => (agentForm.value.temperature = v)}
                      min={0}
                      max={2}
                      step={0.1}
                      style={{ width: '100%' }}
                      placeholder="采样温度 0~2"
                    />
                  </Form.Item>
                  <Form.Item label="Max Tokens">
                    <InputNumber
                      value={agentForm.value.maxTokens}
                      onChange={(v: any) => (agentForm.value.maxTokens = v)}
                      min={1}
                      max={128000}
                      step={256}
                      style={{ width: '100%' }}
                      placeholder="最大输出 token 数"
                    />
                  </Form.Item>
                  <Form.Item label="Top P">
                    <InputNumber
                      value={agentForm.value.topP}
                      onChange={(v: any) => (agentForm.value.topP = v)}
                      min={0}
                      max={1}
                      step={0.1}
                      style={{ width: '100%' }}
                      placeholder="核采样 0~1"
                    />
                  </Form.Item>
                  <Form.Item label="Presence Penalty">
                    <InputNumber
                      value={agentForm.value.presencePenalty}
                      onChange={(v: any) => (agentForm.value.presencePenalty = v)}
                      min={-2}
                      max={2}
                      step={0.1}
                      style={{ width: '100%' }}
                      placeholder="存在惩罚 -2~2"
                    />
                  </Form.Item>
                  <Form.Item label="Frequency Penalty">
                    <InputNumber
                      value={agentForm.value.frequencyPenalty}
                      onChange={(v: any) => (agentForm.value.frequencyPenalty = v)}
                      min={-2}
                      max={2}
                      step={0.1}
                      style={{ width: '100%' }}
                      placeholder="频率惩罚 -2~2"
                    />
                  </Form.Item>
                </Form>
              ) : (
                <div>
                  <div class="mb-4">
                    <div class="flex gap-2 mb-3">
                      <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".json,.txt">
                        <Button icon={<UploadOutlined />}>
                          上传 JSON/TXT 文件
                        </Button>
                      </Upload>
                    </div>
                    <Input.TextArea
                      value={batchImportText.value}
                      onInput={(e: any) => (batchImportText.value = e.target.value)}
                      placeholder={`粘贴 JSON 数据，支持单个对象或数组格式：

单个模型示例：
{
  "apiKey": "your-api-key",
  "baseUrl": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  "model": "glm-4-flash",
  "website": "https://open.bigmodel.cn",
  "temperature": 0.7,
  "maxTokens": 4096,
  "topP": 1,
  "presencePenalty": 0,
  "frequencyPenalty": 0
}

批量导入数组格式：
[
  {...},
  {...}
]`}
                      rows={12}
                      class="font-mono text-sm"
                    />
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    <p class="mb-1">• 支持单个 JSON 对象或 JSON 数组格式</p>
                    <p class="mb-1">• 必填字段：apiKey、baseUrl、model</p>
                    <p>• 可选字段：website、temperature、maxTokens、topP、presencePenalty、frequencyPenalty</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    )
  },
})
