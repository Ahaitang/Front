// 随访相关 API
import { get, post, put, del } from './request'

// 获取随访列表
export const getFollowUpList = (params = {}) => {
  return get('/neuroimmune/followups', params)
}

// 获取随访详情
export const getFollowUpById = (id) => {
  return get(`/neuroimmune/followups/${id}`)
}

// 新增随访
export const createFollowUp = (data) => {
  return post('/neuroimmune/followups', data)
}

// 更新随访
export const updateFollowUp = (id, data) => {
  return put(`/neuroimmune/followups/${id}`, data)
}

// 更新随访状态
export const updateFollowUpStatus = (id, status) => {
  return put(`/neuroimmune/followups/${id}/status?status=${status}`)
}

// 删除随访
export const deleteFollowUp = (id) => {
  return del(`/neuroimmune/followups/${id}`)
}

export default {
  getFollowUpList,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  updateFollowUpStatus,
  deleteFollowUp
}