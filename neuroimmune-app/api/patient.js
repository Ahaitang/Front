// 患者相关 API
import { get, post, put, del } from './request'

// 获取患者列表
export const getPatientList = (params = {}) => {
  return get('/patients', params)
}

// 获取患者详情
export const getPatientById = (id) => {
  return get(`/patients/${id}`)
}

// 新增患者
export const createPatient = (data) => {
  return post('/patients', data)
}

// 更新患者
export const updatePatient = (id, data) => {
  return put(`/patients/${id}`, data)
}

// 删除患者
export const deletePatient = (id) => {
  return del(`/patients/${id}`)
}

// 获取医生的患者列表
export const getMyPatients = (params = {}) => {
  return get('/patients/my', params)
}

// 更新患者密码
export const updatePatientPassword = (id, password) => {
  return put(`/patients/${id}/password`, { password })
}

export default {
  getPatientList,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMyPatients,
  updatePatientPassword
}