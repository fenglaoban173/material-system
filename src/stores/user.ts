import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  userName: string
  avatar: string
  email: string
  role: string
  permissions: string[]
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.userName || 'Admin')
  const avatar = computed(() => userInfo.value?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin')
  const hasPermission = computed(() => (permission: string) => {
    return userInfo.value?.permissions?.includes(permission) || false
  })

  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const login = async (credentials: { username: string; password: string }) => {
    loading.value = true
    try {
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockToken = 'mock_token_' + Date.now()
      setToken(mockToken)
      
      setUserInfo({
        id: 1,
        userName: credentials.username,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + credentials.username,
        email: credentials.username + '@example.com',
        role: 'admin',
        permissions: ['material:read', 'material:write', 'creative:manage', 'audit:read'],
      })
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    
    try {
      // Mock fetch - replace with actual API call
      setUserInfo({
        id: 1,
        userName: 'Admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['material:read', 'material:write', 'creative:manage', 'audit:read'],
      })
    } catch (error) {
      console.error('Fetch user info failed:', error)
    }
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    userName,
    avatar,
    hasPermission,
    setToken,
    setUserInfo,
    login,
    logout,
    fetchUserInfo,
  }
})
