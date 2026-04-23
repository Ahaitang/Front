import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { AxiosInstance, AxiosResponse } from 'axios'

const instance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    const role = localStorage.getItem('admin_role')
    const userStr = localStorage.getItem('admin_user')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加角色和用户ID到请求头
    if (role) {
      config.headers['X-User-Role'] = role
    }
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.id && Number.isFinite(user.id)) {
          config.headers['X-User-Id'] = String(user.id)
        }
      } catch (e) {
        console.warn('解析用户信息失败:', e)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const result = response.data
    // 后端返回格式: { code, message, data }
    // 如果是 Result 格式，提取 data 字段
    if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
      if (result.code === 200) {
        return result.data
      } else {
        // 业务错误
        ElMessage.error(result.message || '请求失败')
        return Promise.reject(new Error(result.message || '请求失败'))
      }
    }
    return result
  },
  (error) => {
    if (error.response?.status === 401) {
      // 401 未授权：清除所有认证相关数据并跳转到登录页
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_role')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      ElMessage.error('没有权限访问该资源')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误')
    } else {
      ElMessage.error(error.response?.data?.message || '请求失败')
    }
    return Promise.reject(error.response?.data || error)
  }
)

// 封装请求方法
export const request = {
  get<T>(url: string, params?: object): Promise<T> {
    return instance.get(url, { params })
  },

  post<T>(url: string, data?: object, config?: any): Promise<T> {
    return instance.post(url, data, config)
  },

  put<T>(url: string, data?: object): Promise<T> {
    return instance.put(url, data)
  },

  delete<T>(url: string): Promise<T> {
    return instance.delete(url)
  }
}

export default instance