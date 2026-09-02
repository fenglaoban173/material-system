import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user'

// Create axios instance
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    
    // Add token to headers
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    
    // Check if response has standard format
    if (data.code !== undefined) {
      if (data.code === 0 || data.code === 200) {
        return data
      } else {
        // Handle business errors
        Message.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message))
      }
    }
    
    return data
  },
  (error) => {
    const { response } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 400:
          Message.error(data?.message || '请求参数错误')
          break
        case 401:
          Message.error('登录已过期，请重新登录')
          const userStore = useUserStore()
          userStore.logout()
          window.location.href = '/#/login'
          break
        case 403:
          Message.error('没有权限执行此操作')
          break
        case 404:
          Message.error('请求的资源不存在')
          break
        case 429:
          Message.error('请求过于频繁，请稍后再试')
          break
        case 500:
        case 502:
        case 503:
        case 504:
          Message.error('服务器错误，请稍后重试')
          break
        default:
          Message.error(data?.message || '网络错误')
      }
    } else {
      Message.error('网络连接失败，请检查网络')
    }
    
    return Promise.reject(error)
  }
)

// Retry wrapper with exponential backoff
export const requestWithRetry = async <T>(
  config: AxiosRequestConfig,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await request(config)
      return response as T
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff: 0.5s, 1s, 2s
        const delay = Math.min(500 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

export default request
