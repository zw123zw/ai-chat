import { createApp } from 'vue'
import { ConfigProvider } from 'ant-design-vue'
import App from './App'
import router from './router'
import pinia from './store'
import { useAppStore } from './store/modules/app'
import 'reset-css/less/reset.less'
import 'highlight.js/styles/github-dark.css'
import './assets/styles/global.less'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ConfigProvider)

// 初始化主题
const appStore = useAppStore()
appStore.INIT_THEME()

app.mount('#app')
