import { defineComponent } from 'vue'
import { useChatStore } from '@/store/modules/chat'
import { useUserStore } from '@/store/modules/user'
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { Button, Popconfirm } from 'ant-design-vue'

export default defineComponent({
  name: 'ConversationList',
  setup() {
    const chatStore = useChatStore()
    const userStore = useUserStore()

    function handleLogout() {
      userStore.DELETE_USERINFO()
      window.location.href = '/login'
    }

    return () => (
      <div class="flex flex-col h-full">
        {/* New chat button */}
        <div class="p-3">
          <Button
            block
            icon={<PlusOutlined />}
            onClick={() => chatStore.CREATE_CONVERSATION()}
            class="bg-transparent border border-dark-border text-dark-text hover:border-primary hover:bg-dark-input/30"
          >
            新建对话
          </Button>
        </div>

        {/* Conversation list */}
        <div class="flex-1 overflow-y-auto px-2">
          {chatStore.conversations.map((conv) => (
            <div
              key={conv.id}
              class={[
                'flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer mb-1 group transition-colors',
                conv.id === chatStore.currentConversationId
                  ? 'bg-dark-input text-dark-text'
                  : 'text-dark-muted hover:bg-dark-input/50',
              ]}
              onClick={() => chatStore.SWITCH_CONVERSATION(conv.id)}
            >
              <MessageOutlined class="flex-shrink-0 text-sm" />
              <span class="flex-1 truncate text-sm">{conv.title}</span>
              <Popconfirm
                title="确定删除该对话？"
                onConfirm={(e?: MouseEvent) => {
                  e?.stopPropagation()
                  chatStore.DELETE_CONVERSATION(conv.id)
                }}
                onCancel={(e?: MouseEvent) => e?.stopPropagation()}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  class="opacity-0 group-hover:opacity-100 text-dark-muted hover:text-red-400"
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                />
              </Popconfirm>
            </div>
          ))}
        </div>

        {/* User section */}
        <div class="p-3 border-t border-dark-border">
          <div class="flex items-center justify-between">
            <span class="text-sm text-dark-muted truncate">
              {userStore.userInfo?.username || '用户'}
            </span>
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              class="text-dark-muted hover:text-red-400"
            />
          </div>
        </div>
      </div>
    )
  },
})
