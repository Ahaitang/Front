/**
 * 用户 Store
 * 会话级别存储（使用 sessionStorage）
 */
import { defineStore } from 'pinia'
import { doctorApi } from '@/utils/api'

interface UserInfo {
  id?: number
  username: string
  level?: number  // 权限等级：0=超级管理员，1=管理员，2=普通医生
}

interface UserState {
  token: string
  userInfo: UserInfo | null
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    userInfo: null,
    isLoggedIn: false
  }),

  getters: {
    username: (state) => state.userInfo?.username || '',
    level: (state) => state.userInfo?.level ?? 2,  // 默认权限等级为2
    isSuperAdmin: (state) => state.userInfo?.level === 0,
    isAdmin: (state) => state.userInfo?.level === 0 || state.userInfo?.level === 1,
    canManageDoctors: (state) => state.userInfo?.level === 0 || state.userInfo?.level === 1
  },

  actions: {
    /**
     * 登录
     */
    async login(username: string, password: string) {
      try {
        const result = await doctorApi.login(username, password)
        this.token = result.token || `token_${Date.now()}`
        this.userInfo = {
          id: result.id,
          username: result.username || username,
          // 如果后端没有返回level，则默认为2
          // 如果返回了level，使用返回的值
          level: result.level !== undefined ? result.level : 2
        }
        this.isLoggedIn = true
        // 存储到 sessionStorage
        sessionStorage.setItem('token', this.token)
        sessionStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        return result
      } catch (error) {
        throw error
      }
    },

    /**
     * 登出
     */
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('userInfo')
    },

    /**
     * 初始化用户信息（从 sessionStorage 恢复）
     */
    initUser() {
      const token = sessionStorage.getItem('token')
      const userInfoStr = sessionStorage.getItem('userInfo')
      
      if (token && userInfoStr) {
        this.token = token
        this.userInfo = JSON.parse(userInfoStr)
        this.isLoggedIn = true
      }
    }
  },

  persist: {
    key: 'qmg-user',
    storage: sessionStorage, // 使用 sessionStorage 实现会话级别存储
    paths: ['token', 'userInfo', 'isLoggedIn']
  }
})
