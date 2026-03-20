import { defineComponent, ref } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { useRouter } from 'vue-router'
import { Input, InputPassword, Button, Tabs, TabPane, message } from 'ant-design-vue'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const userStore = useUserStore()
    const router = useRouter()
    const activeTab = ref('login')
    const loading = ref(false)

    const loginForm = ref({ username: '', password: '' })
    const registerForm = ref({ username: '', password: '', email: '' })

    function mockLogin(username: string) {
      const token = 'mock-token-' + Date.now()
      userStore.SET_USERTOKEN({ token })
      userStore.SET_USERINFO({ userInfo: { username, avatar: '' } })
      message.success('登录成功')
      router.push('/chat')
    }

    async function handleLogin() {
      if (!loginForm.value.username || !loginForm.value.password) {
        message.warning('请填写用户名和密码')
        return
      }
      loading.value = true
      setTimeout(() => {
        mockLogin(loginForm.value.username)
        loading.value = false
      }, 500)
    }

    async function handleRegister() {
      if (!registerForm.value.username || !registerForm.value.password) {
        message.warning('请填写用户名和密码')
        return
      }
      loading.value = true
      setTimeout(() => {
        mockLogin(registerForm.value.username)
        loading.value = false
      }, 500)
    }

    return () => (
      <div class="flex items-center justify-center h-full bg-dark-bg">
        <div class="w-[400px] p-8 rounded-2xl bg-dark-sidebar border border-dark-border">
          <h1 class="text-2xl font-bold text-center text-dark-text mb-6">
            AI Chat
          </h1>

          <Tabs v-model:activeKey={activeTab.value} centered class="login-tabs">
            <TabPane key="login" tab="登录">
              <div class="flex flex-col gap-4">
                <Input
                  v-model:value={loginForm.value.username}
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  size="large"
                  onPressEnter={handleLogin}
                />
                <InputPassword
                  v-model:value={loginForm.value.password}
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                  onPressEnter={handleLogin}
                />
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading.value}
                  onClick={handleLogin}
                >
                  登录
                </Button>
              </div>
            </TabPane>

            <TabPane key="register" tab="注册">
              <div class="flex flex-col gap-4">
                <Input
                  v-model:value={registerForm.value.username}
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  size="large"
                />
                <Input
                  v-model:value={registerForm.value.email}
                  prefix={<MailOutlined />}
                  placeholder="邮箱（选填）"
                  size="large"
                />
                <InputPassword
                  v-model:value={registerForm.value.password}
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                  onPressEnter={handleRegister}
                />
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={loading.value}
                  onClick={handleRegister}
                >
                  注册
                </Button>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    )
  },
})
