import { defineComponent } from 'vue'
import { useChatStore } from '@/store/modules/chat'
import { useUserStore } from '@/store/modules/user'
import {
  DeleteOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  CodeOutlined,
  StarOutlined,
  MoreOutlined,
  MenuOutlined,
} from '@ant-design/icons-vue'
import { Button, Popconfirm } from 'ant-design-vue'

const menuItems = [
  { key: 'chat', label: 'AI 对话', icon: <MessageOutlined /> },
  { key: 'video', label: 'AI 生成视频', icon: <VideoCameraOutlined /> },
  { key: 'image', label: 'AI 生成图片', icon: <PictureOutlined /> },
  { key: 'code', label: 'AI 生成代码', icon: <CodeOutlined /> },
]

export default defineComponent({
  name: 'ConversationList',
  setup() {
    const chatStore = useChatStore()
    const userStore = useUserStore()

    return () => (
      <div class="flex flex-col h-full bg-white dark:bg-slate-800">
        {/* Logo */}
        <div class="px-5 py-5 flex items-center gap-3">
          <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">🤖</span>
          </div>
          <span class="text-xl font-bold text-gray-900 dark:text-white">AI Chat</span>
          <Button
            type="text"
            size="small"
            class="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MenuOutlined />
          </Button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-4">
          {/* Function Menu */}
          <div class="mb-6">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 px-2">
              通用功能
            </div>
            <div class="space-y-1">
              {menuItems.map((item, idx) => (
                <button
                  key={item.key}
                  class={[
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200',
                    idx === 0
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50',
                  ]}
                >
                  <span class={idx === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                    {item.icon}
                  </span>
                  <span class="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* History Section */}
          <div class="mb-6">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 px-2">
              历史对话
            </div>
            <div class="space-y-2">
              {chatStore.conversations.map((conv) => (
                <div
                  key={conv.id}
                  class={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer group transition-all duration-200',
                    conv.id === chatStore.currentConversationId
                      ? 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50',
                  ]}
                  onClick={() => chatStore.SWITCH_CONVERSATION(conv.id)}
                >
                  <MessageOutlined class="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400" />
                  <span class="flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                    {conv.title}
                  </span>
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
                      class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div class="px-4 pb-4">
          <div
            class="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-700 dark:to-indigo-900/50 border border-blue-100 dark:border-slate-600"
          >
            <div class="flex items-start gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm">
                <StarOutlined class="text-blue-500 dark:text-blue-400 text-lg" />
              </div>
              <div class="flex-1">
                <div class="font-semibold text-gray-900 dark:text-white">升级会员</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  会员可解锁更多高阶功能与趣味玩法
                </div>
              </div>
            </div>
            <Button
              type="primary"
              block
              class="bg-blue-600 hover:bg-blue-700 border-0 h-9 font-medium rounded-lg"
            >
              立即升级
            </Button>
          </div>
        </div>

        {/* User Section */}
        <div class="px-4 pb-6 pt-2">
          <div class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
            <div class="w-11 h-11 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-600">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                alt="avatar"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-gray-900 dark:text-white truncate">
                {userStore.userInfo?.username || 'MOMO'}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userStore.userInfo?.email || 'momo@MODAO.com'}
              </div>
            </div>
            <Button
              type="text"
              size="small"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreOutlined />
            </Button>
          </div>
        </div>
      </div>
    )
  },
})
