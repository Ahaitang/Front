// API 配置
const envBaseUrl = process.env.VUE_APP_API_BASE_URL
const BASE_URL = envBaseUrl || 'http://localhost:8080/api/v1'
export default {
  BASE_URL
}
