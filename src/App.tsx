import { defineComponent, computed } from 'vue'
import { RouterView } from 'vue-router'
import { ConfigProvider, theme } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { useAppStore } from './store/modules/app'

export default defineComponent({
  name: 'App',
  setup() {
    const appStore = useAppStore()

    const antdTheme = computed(() => ({
      algorithm: appStore.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 8,
      },
    }))

    return () => (
      <ConfigProvider theme={antdTheme.value} locale={zhCN}>
        <RouterView />
      </ConfigProvider>
    )
  },
})
