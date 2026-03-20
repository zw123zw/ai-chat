import { defineComponent } from 'vue'
import { useAppStore } from '@/store/modules/app'
import ConversationList from '@/components/ConversationList'
import ChatPage from '@/views/Chat'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import { Button, Switch } from 'ant-design-vue'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const appStore = useAppStore()

    return () => (
      <div class="flex h-full bg-dark-bg">
        {/* Sidebar */}
        <div
          class="h-full bg-dark-sidebar border-r border-dark-border transition-all duration-300 flex flex-col"
          style={{ width: appStore.sidebarCollapsed ? '0px' : '280px', overflow: 'hidden' }}
        >
          <ConversationList />
        </div>

        {/* Main content */}
        <div class="flex-1 flex flex-col min-w-0 relative">
          {/* Sidebar toggle - top left */}
          <div class="absolute top-3 left-2 z-10">
            <Button
              type="text"
              icon={appStore.sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => appStore.TOGGLE_SIDEBAR()}
              class="text-dark-muted hover:text-dark-text"
            />
          </div>

          {/* Theme toggle - top right */}
          <div class="absolute top-3 right-4 z-10">
            <Switch
              checked={appStore.theme === 'dark'}
              onChange={() => appStore.TOGGLE_THEME()}
              checkedChildren="黑"
              unCheckedChildren="白"
              class="theme-switch"
            />
          </div>

          <ChatPage />
        </div>
      </div>
    )
  },
})
