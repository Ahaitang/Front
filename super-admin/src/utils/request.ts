import axios from 'axios'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: '/api/v1/super-admin',
  timeout: 10000
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('super_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('super_admin_token')
      localStorage.removeItem('super_admin_username')
      localStorage.removeItem('super_admin_name')
      window.location.href = '/login'
    }
    ElMessage.error(err.response?.data?.message || '请求失败')
    return Promise.reject(err)
  }
)

export default instance