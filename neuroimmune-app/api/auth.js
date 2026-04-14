// 认证相关 API
import { post, get } from './request'

// 统一登录接口
export const login = (data) => {
  return post('/neuroimmune/login', data)
}

// 管理员登录
export const adminLogin = (data) => {
  return login({ ...data, role: 'admin' })
}

// 医生登录
export const doctorLogin = (data) => {
  return login({ ...data, role: 'doctor' })
}

// 患者登录
export const patientLogin = (data) => {
  return login({ ...data, role: 'patient' })
}

// 获取管理员信息
export const getAdminInfo = (id) => {
  return get('/neuroimmune/admin/info', { id })
}

// 修改管理员密码
export const updateAdminPassword = (id, password) => {
  return post(`/admin/${id}/password`, { password })
}

// 修改患者密码
export const updatePatientPassword = (id, password) => {
  return post(`/patients/${id}/password`, { password })
}

// 修改医生密码
export const updateDoctorPassword = (id, password) => {
  return post(`/doctors/${id}/password`, { password })
}

export default {
  login,
  adminLogin,
  doctorLogin,
  patientLogin,
  getAdminInfo,
  updateAdminPassword,
  updatePatientPassword,
  updateDoctorPassword
}