import { defineStore } from 'pinia'

interface UserStore {
  userInfo: any
  token: string
}

export const useUserStore = defineStore('user', {
  state: (): UserStore => {
    return {
      userInfo: {},
      token: '',
    }
  },
  actions: {
    SET_USERTOKEN(state: Record<string, any>) {
      this.token = state.token
    },
    SET_USERINFO(state: Record<string, any>) {
      this.userInfo = state.userInfo || {}
    },
    DELETE_USERINFO() {
      this.userInfo = null
      this.token = ''
    },
  },
  persist: {
    key: 'userInfo',
    paths: ['userInfo', 'token'],
    storage: window.localStorage,
  },
})
