import { defineComponent } from 'vue'
import { useChatStore } from '@/store/modules/chat'
import { useUserStore } from '@/store/modules/user'
import {
  DeleteOutlined,
  MessageOutlined,
  ShopOutlined,
  StarOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue'
import { Button, Popconfirm } from 'ant-design-vue'

export default defineComponent({
  name: 'ConversationList',
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const chatStore = useChatStore()
    const userStore = useUserStore()

    return () => (
      <div class="flex flex-col h-full">
        {/* Logo */}
        <div class="px-3 py-5 flex items-center gap-3">
          <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-lg">🤖</span>
          </div>
          {!props.collapsed && (
            <span class="text-xl font-bold text-gray-900 dark:text-white truncate">
              AI Chat
            </span>
          )}
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-4">
          {/* Function Menu - Only Skill Shop */}
          <div class="mb-6">
            {!props.collapsed && (
              <div class="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 px-2">
                通用功能
              </div>
            )}
            <div class="space-y-1">
              {!props.collapsed ? (
                <Button
                  block
                  size="large"
                  class="h-auto py-3.5 px-4 rounded-xl border-purple-200 dark:border-slate-500 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                >
                  <div class="flex items-center gap-3 w-full">
                    <ShopOutlined class="text-purple-500 dark:text-purple-400" />
                    <span class="font-medium text-gray-900 dark:text-white">技能商店</span>
                  </div>
                </Button>
              ) : (
                <div class="flex justify-center">
                  <Button
                    class="aspect-square border-purple-200 dark:border-slate-500 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex items-center justify-center p-0 rounded-lg"
                    icon={<ShopOutlined class="text-purple-500 dark:text-purple-400" />}
                  />
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div class="mb-6">
            {!props.collapsed && (
              <div class="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 px-2">
                历史对话
              </div>
            )}
            <div class="space-y-2">
              {chatStore.conversations.map((conv) => (
                <div
                  key={conv.id}
                  class={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer group transition-all duration-200 border shadow-sm',
                    props.collapsed && 'px-2 justify-center',
                    conv.id === chatStore.currentConversationId
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-400 dark:border-blue-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-500',
                  ]}
                  onClick={() => chatStore.SWITCH_CONVERSATION(conv.id)}
                >
                  <MessageOutlined class={[
                    'flex-shrink-0 text-sm',
                    conv.id === chatStore.currentConversationId
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400',
                  ]} />
                  {!props.collapsed && (
                    <>
                      <span class={[
                        'flex-1 truncate text-sm',
                        conv.id === chatStore.currentConversationId
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-700 dark:text-gray-200',
                      ]}>
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
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        {!props.collapsed && (
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
        )}

        {/* User Section */}
        <div class="px-4 pb-6 pt-2">
          <div class={[
            'flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors',
            props.collapsed && 'justify-center px-0',
          ]}>
            <div class={[
              'w-11 h-11 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-600 flex-shrink-0',
              props.collapsed && 'w-9 h-9',
            ]}>
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                alt="avatar"
                class="w-full h-full object-cover"
              />
            </div>
            {!props.collapsed && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    )
  },
})
