// 病历记录相关 API
import { get, post, put, del } from './request'

// 获取病历列表
export const getMedicalRecordList = (params = {}) => {
  return get('/records', params)
}

// 获取病历详情
export const getMedicalRecordById = (id) => {
  return get(`/records/${id}`)
}

// 新增病历
export const createMedicalRecord = (data) => {
  return post('/records', data)
}

// 更新病历
export const updateMedicalRecord = (id, data) => {
  return put(`/records/${id}`, data)
}

// 删除病历
export const deleteMedicalRecord = (id) => {
  return del(`/records/${id}`)
}

export default {
  getMedicalRecordList,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord
}