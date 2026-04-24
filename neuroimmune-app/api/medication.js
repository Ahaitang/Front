// 用药记录相关 API
import { get, post, put, del } from './request'

// 获取用药列表
export const getMedicationList = (params = {}) => {
  return get('/neuroimmune/medications', params)
}

// 获取用药详情
export const getMedicationById = (id) => {
  return get(`/neuroimmune/medications/${id}`)
}

// 新增用药
export const createMedication = (data) => {
  return post('/neuroimmune/medications', data)
}

// 更新用药
export const updateMedication = (id, data) => {
  return put(`/neuroimmune/medications/${id}`, data)
}

// 删除用药
export const deleteMedication = (id) => {
  return del(`/neuroimmune/medications/${id}`)
}

export default {
  getMedicationList,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication
}