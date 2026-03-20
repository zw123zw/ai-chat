import { defineComponent, ref, onMounted, watch } from 'vue'
import { useChatStore } from '@/store/modules/chat'
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
} from '@ant-design/icons-vue'
import { Button, Select } from 'ant-design-vue'
import type { ChatAttachment } from '@/types/chat'

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
    const messagesRef = ref<HTMLElement>()
    const showScrollButton = ref(false)

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

    onMounted(scrollToBottom)

    watch(() => chatStore.currentConversationId, scrollToBottom)

    return () => (
      <div class="flex flex-col h-full">
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div />
          <div class="flex items-center gap-3">
            <Select
              defaultValue="gpt-4"
              style={{ width: 120 }}
              class="model-select-header"
              v-slots={{
                suffixIcon: () => <DownOutlined />,
              }}
              options={[
                { value: 'gpt-4', label: 'GPT 4.0' },
                { value: 'gpt-3.5', label: 'GPT 3.5' },
              ]}
            />
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
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q.title)}
                    class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div class={`w-9 h-9 ${q.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                      {q.icon}
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {q.title}
                    </p>
                  </button>
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
      </div>
    )
  },
})
