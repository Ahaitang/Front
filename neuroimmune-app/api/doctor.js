// 医生相关 API
import { get, post, put, del } from './request'

// 获取医生列表
export const getDoctorList = (params = {}) => {
  return get('/neuroimmune/doctors', params)
}

// 获取所有医生
export const getAllDoctors = () => {
  return get('/neuroimmune/doctors/all')
}

// 获取医生详情
export const getDoctorById = (id) => {
  return get(`/neuroimmune/doctors/${id}`)
}

// 新增医生
export const createDoctor = (data) => {
  return post('/neuroimmune/doctors', data)
}

// 更新医生
export const updateDoctor = (id, data) => {
  return put(`/neuroimmune/doctors/${id}`, data)
}

// 删除医生
export const deleteDoctor = (id) => {
  return del(`/neuroimmune/doctors/${id}`)
}

export default {
  getDoctorList,
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
}