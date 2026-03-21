import { defineComponent, onMounted, ref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import ConversationList from '@/components/ConversationList'
import ChatPage from '@/views/Chat'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import { Button } from 'ant-design-vue'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const appStore = useAppStore()
    const collapsed = ref(false)

    // Set light theme as default
    onMounted(() => {
      if (appStore.theme !== 'light') {
        appStore.TOGGLE_THEME()
      }
    })

    const toggleCollapse = () => {
      collapsed.value = !collapsed.value
    }

    return () => (
      <div class="flex h-full bg-gray-50 dark:bg-slate-900">
        {/* Sidebar */}
        <div class={[
          'h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col flex-shrink-0 transition-all duration-300',
          collapsed.value ? 'w-16' : 'w-72',
        ]}>
          <ConversationList collapsed={collapsed.value} />
        </div>

        {/* Toggle Button */}
        <div class="absolute top-5 left-0 z-20" style={{ marginLeft: collapsed.value ? '4rem' : '18rem' }}>
          <Button
            type="text"
            size="small"
            class="bg-white dark:bg-slate-700 rounded-none !hover:bg-transparent !hover:text-inherit"
            onClick={toggleCollapse}
            icon={collapsed.value ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          />
        </div>

        {/* Main content */}
        <div class="flex-1 flex flex-col min-w-0 relative bg-gray-50 dark:bg-slate-900">
          <ChatPage />
        </div>
      </div>
    )
  },
})
