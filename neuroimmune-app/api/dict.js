// 通用字典 API
import { get, post, put, del } from './request'

// 根据字典类型获取列表
export const getDictByType = (dictType) => {
  return get(`/neuroimmune/dict/common/type/${dictType}`)
}

// 获取所有字典
export const getAllDicts = () => {
  return get('/neuroimmune/dict/common')
}

// 获取单个字典项
export const getDictById = (id) => {
  return get(`/neuroimmune/dict/common/${id}`)
}

// 新增或更新字典项
export const saveDict = (data) => {
  return post('/neuroimmune/dict/common', data)
}

// 更新字典项
export const updateDict = (id, data) => {
  return put(`/neuroimmune/dict/common/${id}`, data)
}

// 删除字典项
export const deleteDict = (id) => {
  return del(`/neuroimmune/dict/common/${id}`)
}

// 启用/禁用字典项
export const toggleDictActive = (id, active) => {
  return put(`/neuroimmune/dict/common/${id}/active?active=${active}`)
}

export default {
  getDictByType,
  getAllDicts,
  getDictById,
  saveDict,
  updateDict,
  deleteDict,
  toggleDictActive
}