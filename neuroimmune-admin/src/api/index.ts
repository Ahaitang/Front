import { request } from '@/utils/request'
import type { PageRequest, PageResult } from '@/utils/types'

// 登录
export const login = (data: { username: string; password: string; role?: string }) => {
  return request.post('/neuroimmune/login', data)
}

// 仪表盘统计
export interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  pendingFollowUps: number
  totalMedications: number
}

export const getDashboardStats = () => {
  return request.get<DashboardStats>('/neuroimmune/dashboard/stats')
}

// 患者相关
export const getPatientList = (params: PageRequest) => {
  return request.get<PageResult<Patient>>('/neuroimmune/patients', params)
}

export const getPatientById = (id: string | number) => {
  return request.get<Patient>(`/neuroimmune/patients/${id}`)
}

export const savePatient = (data: Partial<Patient>) => {
  if (data.id) {
    return request.put(`/neuroimmune/patients/${data.id}`, data)
  }
  return request.post('/neuroimmune/patients', data)
}

export const deletePatient = (id: string | number) => {
  return request.delete(`/neuroimmune/patients/${id}`)
}

export const updatePatientPassword = (id: string | number, password: string) => {
  return request.put(`/neuroimmune/patients/${id}/password`, { password })
}

// 患者绑定医生
export const bindPatientDoctor = (patientId: number, doctorId: number, bindMethod?: string, remark?: string) => {
  const params = new URLSearchParams()
  params.append('patientId', patientId.toString())
  params.append('doctorId', doctorId.toString())
  if (bindMethod) params.append('bindMethod', bindMethod)
  if (remark) params.append('remark', remark)
  return request.post(`/neuroimmune/relation/bind?${params.toString()}`)
}

export const unbindPatientDoctor = (patientId: number, doctorId: number) => {
  const params = new URLSearchParams()
  params.append('patientId', patientId.toString())
  params.append('doctorId', doctorId.toString())
  return request.post(`/neuroimmune/relation/unbind-by-ids?${params.toString()}`)
}

// 医生相关
export const getDoctorList = (params: PageRequest) => {
  return request.get<PageResult<Doctor>>('/neuroimmune/doctors', params)
}

export const getAllDoctors = () => {
  return request.get<Doctor[]>('/neuroimmune/doctors/all')
}

export const getDoctorById = (id: string | number) => {
  return request.get<Doctor>(`/neuroimmune/doctors/${id}`)
}

export const saveDoctor = (data: Partial<Doctor>) => {
  if (data.id) {
    return request.put(`/neuroimmune/doctors/${data.id}`, data)
  }
  return request.post('/neuroimmune/doctors', data)
}

export const deleteDoctor = (id: string | number) => {
  return request.delete(`/neuroimmune/doctors/${id}`)
}

export const updateDoctorPassword = (id: string | number, password: string) => {
  return request.put(`/neuroimmune/doctors/${id}/password`, { password })
}

export const updateDoctorProfile = (id: string | number, data: Partial<Doctor>) => {
  return request.put(`/neuroimmune/doctors/${id}`, data)
}

// 管理员相关
export const getAdminList = (params: PageRequest) => {
  return request.get<PageResult<Doctor>>('/neuroimmune/doctors/admins', params)
}

export const updateDoctorRole = (id: string | number, role: string, level?: number) => {
  const params = new URLSearchParams()
  params.append('role', role)
  if (level !== undefined) {
    params.append('level', level.toString())
  }
  return request.put(`/neuroimmune/doctors/${id}/role?${params.toString()}`)
}

// 获取医生角色列表
export const getDoctorRoles = (id: string | number) => {
  return request.get<string[]>(`/neuroimmune/doctors/${id}/roles`)
}

// 更新医生角色列表（多选）和管理等级
export const updateDoctorRoles = (id: string | number, roles: string[], level?: number) => {
  return request.put(`/neuroimmune/doctors/${id}/roles`, { roles, level })
}

export const updateAdminPassword = (id: string | number, password: string) => {
  return request.put(`/neuroimmune/admin/${id}/password`, { password })
}

// 随访相关
export const getFollowUpList = (params: PageRequest) => {
  return request.get<PageResult<FollowUp>>('/neuroimmune/followups', params)
}

export const getFollowUpById = (id: string | number) => {
  return request.get<FollowUp>(`/neuroimmune/followups/${id}`)
}

export const saveFollowUp = (data: Partial<FollowUp>) => {
  if (data.id) {
    return request.put(`/neuroimmune/followups/${data.id}`, data)
  }
  return request.post('/neuroimmune/followups', data)
}

export const updateFollowUpStatus = (id: string | number, status: number) => {
  return request.put(`/neuroimmune/followups/${id}/status?status=${status}`)
}

export const cancelFollowUp = (id: string | number) => {
  return request.put(`/neuroimmune/followups/${id}/cancel`)
}

// 用药相关
export const getMedicationList = (params: PageRequest) => {
  return request.get<PageResult<Medication>>('/neuroimmune/medications', params)
}

export const getMedicationById = (id: string | number) => {
  return request.get<Medication>(`/neuroimmune/medications/${id}`)
}

export const saveMedication = (data: Partial<Medication>) => {
  if (data.id) {
    return request.put(`/neuroimmune/medications/${data.id}`, data)
  }
  return request.post('/neuroimmune/medications', data)
}

export const updateMedicationStatus = (id: string | number, status: number) => {
  return request.put(`/neuroimmune/medications/${id}/status?status=${status}`)
}

export const cancelMedication = (id: string | number) => {
  return request.put(`/neuroimmune/medications/${id}/cancel`)
}

// 病历相关
export const getRecordList = (params: PageRequest) => {
  return request.get<PageResult<MedicalRecord>>('/neuroimmune/records', params)
}

export const getRecordById = (id: string | number) => {
  return request.get<MedicalRecord>(`/neuroimmune/records/${id}`)
}

export const saveRecord = (data: Partial<MedicalRecord>) => {
  if (data.id) {
    return request.put(`/neuroimmune/records/${data.id}`, data)
  }
  return request.post('/neuroimmune/records', data)
}

export const updateRecordStatus = (id: string | number, status: number) => {
  return request.put(`/neuroimmune/records/${id}/status?status=${status}`)
}

export const cancelRecord = (id: string | number) => {
  return request.put(`/neuroimmune/records/${id}/cancel`)
}

// 文件上传
export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/v1/neuroimmune/file/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`
    }
  })
  const result = await response.json()
  if (result.code === 200 && result.data) {
    return result.data
  }
  throw new Error(result.message || '上传失败')
}

// OCR识别 - 解析病历图片
export const ocrParseMedical = (images: string[]) => {
  return request.post<{ success: boolean; content: string; errorMsg?: string }>('/ocr/parse-medical', { images })
}

// 类型定义
export interface Patient {
  id: number
  name: string
  gender: string
  birthDate?: string     // 出生日期
  age?: number           // 计算字段，仅用于显示
  phone: string
  password?: string
  avatar?: string
  idCard?: string
  hasFollowUp: boolean
  isRealAuth: boolean
  doctorId?: number      // 通过 relation 表获取
  doctorName?: string    // 通过 relation 表获取
  diseaseType?: string
  createTime?: string    // 仅显示，不参与保存
  updateTime?: string    // 仅显示，不参与保存
}

export interface Doctor {
  id: number
  name: string
  title: string
  department: string
  hospital: string
  phone: string
  password?: string
  avatar?: string
  patientCount: number
  createTime: string
  roles?: string[]    // 角色数组
  role?: string        // 兼容旧数据：角色字符串（doctor/admin/doctor,admin）
  level?: number       // 管理等级，1最高，null表示普通医生
}

export interface FollowUp {
  id: number
  patientId: number
  patientName: string
  patientGender: string
  patientAge: number
  doctorId: number
  doctorName: string
  date: string
  project: string
  type: string
  status: number  // 0-进行中, 1-完成, 2-取消
  content?: string
  createTime: string
}

export interface Medication {
  id: number
  patientId: number
  patientName: string
  doctorId: number
  doctorName: string
  medicationName: string
  date: string
  dosageValue?: number   // 剂量数值
  dosageUnit?: string    // 剂量单位
  frequency: string
  route: string
  duration?: string
  notes?: string
  status: number  // 0-进行中, 1-完成, 2-取消
  createTime: string
}

export interface MedicalRecord {
  id: number
  patientId: number
  patientName: string
  type: string
  diagnosis: string
  hospital: string
  department: string
  doctorName: string
  date: string
  content: string
  attachments?: string
  status: number  // 0-进行中, 1-完成, 2-取消
  createTime: string
}

// 通用字典 API
export const getCommonDictByType = (dictType: string) => {
  return request.get<CommonDict[]>(`/neuroimmune/dict/common/type/${dictType}`)
}

export const getCommonDictAll = () => {
  return request.get<CommonDict[]>('/neuroimmune/dict/common')
}

export const saveCommonDict = (data: Partial<CommonDict>) => {
  if (data.id) {
    return request.put(`/neuroimmune/dict/common/${data.id}`, data)
  }
  return request.post('/neuroimmune/dict/common', data)
}

export const deleteCommonDict = (id: number) => {
  return request.delete(`/neuroimmune/dict/common/${id}`)
}

export const toggleCommonDictActive = (id: number, active: boolean) => {
  return request.put(`/neuroimmune/dict/common/${id}/active?active=${active}`)
}

// 通用字典类型定义
export interface CommonDict {
  id: number
  dictType: string    // 字典类型：department/title/recordType/followUpType/gender/status
  code?: string       // 编码
  name: string        // 名称
  description?: string
  sortOrder?: number
  isActive: number    // 1-启用，0-禁用
  createTime: string
  updateTime: string
}

// 字典类型常量
export const DICT_TYPES = {
  DEPARTMENT: 'department',
  TITLE: 'title',
  RECORD_TYPE: 'recordType',
  FOLLOW_UP_TYPE: 'followUpType',
  GENDER: 'gender',
  STATUS: 'status',
  FREQUENCY: 'frequency',
  ROUTE: 'route',
  MEDICATION: 'medication',
  MEDICATION_UNIT: 'medicationUnit',
  DISEASE: 'disease',
  ROLE: 'role'
} as const