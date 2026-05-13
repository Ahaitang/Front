// 认证相关 API
import { post, get, put } from './request'

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
export const updateAdminPassword = (id, password, oldPassword) => {
  return put(`/neuroimmune/admin/${id}/password`, { password, oldPassword })
}

// 修改患者密码
export const updatePatientPassword = (id, password, oldPassword) => {
  return put(`/neuroimmune/patients/${id}/password`, { password, oldPassword })
}

// 修改医生密码
export const updateDoctorPassword = (id, password, oldPassword) => {
  return put(`/neuroimmune/doctors/${id}/password`, { password, oldPassword })
}

// 患者注册
export const register = (data) => {
  return post('/neuroimmune/register', data)
}

// 检查手机号是否已注册
export const checkPhoneExists = (phone) => {
  return get('/neuroimmune/register/check-phone', { phone })
}

// 获取可绑定的医生列表
export const getDoctorListForRegister = () => {
  return get('/neuroimmune/relation/doctors')
}

// 获取患者当前绑定的医生
export const getPatientDoctor = (patientId) => {
  return get(`/neuroimmune/relation/patient/${patientId}/doctor`)
}

// 患者绑定医生
export const bindDoctor = (data) => {
  return post('/neuroimmune/relation/bind', data)
}

// 获取医生待确认患者列表
export const getPendingPatients = (doctorId) => {
  return get(`/neuroimmune/relation/doctor/${doctorId}/pending`)
}

// 获取医生已确认患者列表
export const getConfirmedPatients = (doctorId) => {
  return get(`/neuroimmune/relation/doctor/${doctorId}/confirmed`)
}

// 获取医生已拒绝患者列表
export const getRejectedPatients = (doctorId) => {
  return get(`/neuroimmune/relation/doctor/${doctorId}/rejected`)
}

// 确认绑定关系
export const confirmRelation = (relationId) => {
  return put(`/neuroimmune/relation/${relationId}/confirm`)
}

// 拒绝绑定关系
export const rejectRelation = (relationId) => {
  return put(`/neuroimmune/relation/${relationId}/reject`)
}

export default {
  login,
  adminLogin,
  doctorLogin,
  patientLogin,
  register,
  checkPhoneExists,
  getDoctorListForRegister,
  getPatientDoctor,
  bindDoctor,
  getPendingPatients,
  getConfirmedPatients,
  getRejectedPatients,
  confirmRelation,
  rejectRelation,
  getAdminInfo,
  updateAdminPassword,
  updatePatientPassword,
  updateDoctorPassword
}
