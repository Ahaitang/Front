// 疾病发作记录相关 API
import { get, post, put, del } from './request'

// 获取发作记录列表
export const getEpisodeList = (params = {}) => {
  return get('/neuroimmune/episodes', params)
}

// 获取患者的所有发作记录
export const getEpisodesByPatient = (patientId) => {
  return get(`/neuroimmune/episodes/patient/${patientId}`)
}

// 获取发作记录详情
export const getEpisodeById = (id) => {
  return get(`/neuroimmune/episodes/${id}`)
}

// 新增发作记录
export const createEpisode = (data) => {
  return post('/neuroimmune/episodes', data)
}

// 更新发作记录
export const updateEpisode = (id, data) => {
  return put(`/neuroimmune/episodes/${id}`, data)
}

// 删除发作记录
export const deleteEpisode = (id) => {
  return del(`/neuroimmune/episodes/${id}`)
}

// 获取患者发作次数
export const getEpisodeCount = (patientId) => {
  return get(`/neuroimmune/episodes/count/${patientId}`)
}

export default {
  getEpisodeList,
  getEpisodesByPatient,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getEpisodeCount
}