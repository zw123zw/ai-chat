import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index'),
  },
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/layouts/MainLayout'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  // 🔴 核心修改：将 createWebHistory() 改为 createWebHashHistory()
  // 适配 GitHub Pages/本地预览，避免路由匹配失败导致页面空白
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token
  
  // 🔴 小优化：添加 try/catch 避免首次挂载时 pinia 实例未初始化导致的报错
  try {
    if (to.meta.requiresAuth && !token) {
      next('/login')
    } else if (to.path === '/login' && token) {
      next('/chat')
    } else {
      next()
    }
  } catch (e) {
    console.warn('路由守卫执行异常:', e)
    next() // 异常时兜底放行，避免页面卡死
  }
})

export default router