// 仪表盘相关 API
import { get } from './request'

// 获取统计数据
export const getStats = () => {
  return get('/neuroimmune/dashboard/stats')
}

export default {
  getStats
}