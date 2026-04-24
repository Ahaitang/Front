// 病历记录相关 API
import { get, post, put, del } from './request'

// 获取病历列表
export const getMedicalRecordList = (params = {}) => {
  return get('/neuroimmune/records', params)
}

// 按患者ID获取病历列表
export const getMedicalRecords = (params = {}) => {
  return get('/neuroimmune/records', params)
}

// 获取病历详情
export const getMedicalRecordById = (id) => {
  return get(`/neuroimmune/records/${id}`)
}

// 新增病历
export const createMedicalRecord = (data) => {
  return post('/neuroimmune/records', data)
}

// 上传病历（别名）
export const uploadMedicalRecord = (data) => {
  return post('/neuroimmune/records', data)
}

// 更新病历
export const updateMedicalRecord = (id, data) => {
  return put(`/neuroimmune/records/${id}`, data)
}

// 删除病历
export const deleteMedicalRecord = (id) => {
  return del(`/neuroimmune/records/${id}`)
}

export default {
  getMedicalRecordList,
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  uploadMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord
}