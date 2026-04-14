// 日程相关 API
import { get } from './request'

// 获取日程安排（按日期）
export const getScheduleByDate = (date) => {
  return get('/neuroimmune/schedule/date', { date })
}

// 获取日程安排（按日期范围）
export const getScheduleByRange = (startDate, endDate) => {
  return get('/neuroimmune/schedule/range', { startDate, endDate })
}

// 获取今日日程
export const getTodaySchedule = () => {
  return get('/neuroimmune/schedule/today')
}

export default {
  getScheduleByDate,
  getScheduleByRange,
  getTodaySchedule
}