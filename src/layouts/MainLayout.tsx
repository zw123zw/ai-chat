import { defineComponent, onMounted } from 'vue'
import { useAppStore } from '@/store/modules/app'
import ConversationList from '@/components/ConversationList'
import ChatPage from '@/views/Chat'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const appStore = useAppStore()

    // Set light theme as default
    onMounted(() => {
      if (appStore.theme !== 'light') {
        appStore.TOGGLE_THEME()
      }
    })

    return () => (
      <div class="flex h-full bg-gray-50 dark:bg-slate-900">
        {/* Sidebar */}
        <div class="w-[290px] h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col flex-shrink-0">
          <ConversationList />
        </div>

        {/* Main content */}
        <div class="flex-1 flex flex-col min-w-0 relative bg-gray-50 dark:bg-slate-900">
          <ChatPage />
        </div>
      </div>
    )
  },
})
