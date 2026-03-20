import { defineStore } from 'pinia'
import type { Agent } from '@/types/agent'

type Theme = 'dark' | 'light'

type AppState = {
  sidebarCollapsed: boolean
  theme: Theme
  agents: Agent[]
  currentAgentId: string
}

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      sidebarCollapsed: false,
      theme: 'dark',
      agents: [],
      currentAgentId: '',
    }
  },
  actions: {
    /** 初始化主题（应用启动时调用） */
    INIT_THEME() {
      applyTheme(this.theme)
    },
    /** 切换主题 */
    TOGGLE_THEME() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      applyTheme(this.theme)
    },
    /** 添加 Agent */
    ADD_AGENT(agent: Omit<Agent, 'id' | 'createdAt'>) {
      const newAgent: Agent = {
        ...agent,
        id: Date.now().toString(),
        createdAt: Date.now(),
      }
      this.agents.push(newAgent)
      this.currentAgentId = newAgent.id
      return newAgent
    },
    /** 删除 Agent */
    DELETE_AGENT(id: string) {
      const index = this.agents.findIndex((a) => a.id === id)
      if (index > -1) {
        this.agents.splice(index, 1)
        if (this.currentAgentId === id) {
          this.currentAgentId = this.agents[0]?.id || ''
        }
      }
    },
    /** 更新 Agent */
    UPDATE_AGENT(id: string, data: Omit<Agent, 'id' | 'createdAt'>) {
      const index = this.agents.findIndex((a) => a.id === id)
      if (index > -1) {
        this.agents[index] = { ...this.agents[index], ...data }
      }
    },
    /** 切换当前 Agent */
    SET_CURRENT_AGENT(id: string) {
      this.currentAgentId = id
    },
    TOGGLE_SIDEBAR() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
  },
  persist: true,
})
