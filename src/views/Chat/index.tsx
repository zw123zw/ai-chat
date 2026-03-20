import { defineComponent, ref, onMounted, watch } from 'vue'
import { useChatStore } from '@/store/modules/chat'
import { useAppStore } from '@/store/modules/app'
import ChatInput from '@/components/ChatInput'
import ChatMessage from '@/components/ChatMessage'
import { RedoOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons-vue'
import { Button, Empty } from 'ant-design-vue'
import type { ChatAttachment } from '@/types/chat'

export default defineComponent({
  name: 'ChatPage',
  setup() {
    const chatStore = useChatStore()
    const appStore = useAppStore()
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

    onMounted(scrollToBottom)

    watch(() => chatStore.currentConversationId, scrollToBottom)

    return () => (
      <div class="flex flex-col h-full">
        {/* Header */}
        <div class="flex items-center px-6 py-3 border-b border-dark-border pl-14">
          <h2 class="text-lg font-medium text-dark-text">
            {chatStore.currentConversation?.title || '新对话'}
          </h2>
        </div>

        {/* Messages area */}
        <div
          ref={messagesRef}
          class="flex-1 overflow-y-auto px-4 py-6"
          onScroll={handleScroll}
        >
          {chatStore.currentMessages.length === 0 ? (
            <div class="flex items-center justify-center h-full">
              <Empty
                description="开始一段新的对话吧"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
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
                    class="text-dark-muted hover:text-dark-text"
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
          <div class="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
            <Button
              shape="circle"
              size="large"
              icon={<VerticalAlignBottomOutlined />}
              onClick={scrollToBottom}
              class={[
                'shadow-lg',
                appStore.theme === 'dark'
                  ? 'bg-dark-sidebar hover:bg-dark-input text-dark-text'
                  : 'bg-white hover:bg-gray-50'
              ]}
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
